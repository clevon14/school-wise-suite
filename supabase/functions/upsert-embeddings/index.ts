import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated and has proper role
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin or teacher
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRoles || (userRoles.role !== 'admin' && userRoles.role !== 'teacher')) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only admins and teachers can upload documents' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { doc_id, title, content, type: document_type, metadata = {} } = await req.json();

    if (!title || !content || !document_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, content, type (document_type)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get employee ID for the user
    const { data: employee } = await supabaseClient
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!employee) {
      return new Response(
        JSON.stringify({ error: 'Employee record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embedding using Lovable AI (OpenAI compatible)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: content,
        model: 'text-embedding-ada-002',
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('Embedding API error:', embeddingResponse.status, errorText);
      throw new Error(`Embedding API error: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    // Upsert document with embedding
    const documentData: any = {
      title,
      content,
      document_type,
      created_by: employee.id,
      embedding,
      metadata: {
        ...metadata,
        text_length: content.length,
        indexed_at: new Date().toISOString(),
      },
    };

    // Add optional fields if provided
    if (metadata.class_id) documentData.class_id = metadata.class_id;
    if (metadata.subject_id) documentData.subject_id = metadata.subject_id;

    let document;
    if (doc_id) {
      // Update existing document
      const { data, error: updateError } = await supabaseClient
        .from('documents')
        .update(documentData)
        .eq('id', doc_id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      document = data;
    } else {
      // Insert new document
      const { data, error: insertError } = await supabaseClient
        .from('documents')
        .insert(documentData)
        .select()
        .single();
      
      if (insertError) throw insertError;
      document = data;
    }

    // Log the action
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: doc_id ? 'document_updated' : 'document_created',
      resource_type: 'document',
      resource_id: document.id,
      details: { title, document_type, doc_id },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        document: {
          id: document.id,
          title: document.title,
          document_type: document.document_type,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Upsert embeddings error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
