import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are SchoolCare Assistant. Always be accurate, concise (<=150 words), and helpful. Cite data sources with tags [ATTENDANCE], [TESTS], [FEES], [PROFILE]. Never invent numeric facts—if data is missing reply 'I don't have enough data' and indicate what to check. Mask PII unless the user role allows it. If student is at-risk, include one recommended action.`;

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

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

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user role for RBAC
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = userRoles?.role || 'parent';

    // Check rate limit (60 requests per minute)
    const { data: rateLimitOk } = await supabaseClient.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'rag-query',
      p_max_requests: 60,
      p_window_minutes: 1,
    });

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      query, 
      scope = 'school',
      target_id = null,
      history = [],
      use_fine_tuned = false
    } = await req.json();

    // Check fine-tuning config
    const { data: ftConfig } = await supabaseClient
      .from('fine_tuning_config')
      .select('*')
      .limit(1)
      .single();

    const shouldUseFT = use_fine_tuned || ftConfig?.use_fine_tuned_model;
    const modelToUse = shouldUseFT && ftConfig?.fine_tuned_model_id 
      ? ftConfig.fine_tuned_model_id 
      : (ftConfig?.base_model || 'google/gemini-2.5-flash');

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: query' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce RBAC - parents can only query their own student
    if (userRole === 'parent' && scope === 'student') {
      const { data: parentStudent } = await supabaseClient
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!parentStudent || (target_id && target_id !== parentStudent.id)) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Parents can only query their own student data' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 2: Get structured context from rag-context function
    const { data: contextData, error: contextError } = await supabaseClient.functions.invoke(
      'rag-context',
      {
        body: {
          query,
          scope,
          target_id,
        },
      }
    );

    if (contextError) {
      console.error('Error fetching context:', contextError);
    }

    const contextPrompt = contextData?.contextPrompt || SYSTEM_PROMPT;

    // Step 3: Call LLM with streaming
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: 'system', content: contextPrompt },
          ...history,
          { role: 'user', content: query }
        ],
        stream: true,
        temperature: ftConfig?.temperature || 0.7,
        max_tokens: ftConfig?.max_tokens || 500,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please contact administrator.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    // Check for suspicious patterns
    const isSuspicious = 
      (userRole === 'parent' && scope === 'class');

    const securityFlags: string[] = [];
    if (userRole === 'parent' && scope === 'class') securityFlags.push('unauthorized_scope_attempt');

    // Log the query with audit trail
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'ai_query',
      resource_type: 'rag',
      resource_id: target_id,
      is_suspicious: isSuspicious,
      security_flags: securityFlags.length > 0 ? securityFlags : null,
      details: { 
        query: query.substring(0, 200),
        scope,
        role: userRole,
      },
    });

    // Return streaming response
    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('RAG query error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
