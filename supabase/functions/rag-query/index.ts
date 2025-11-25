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

    const { 
      query, 
      scope = 'school',
      target_id = null,
      top_k = 5,
      messages = [] 
    } = await req.json();

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

    // Step 1: Fetch structured facts based on scope
    let structuredFacts: any = {};
    const fieldsReturned: string[] = [];

    if (scope === 'student' && target_id) {
      const { data: studentFacts, error: factsError } = await supabaseClient
        .rpc('get_student_facts', { 
          p_student_id: target_id,
          p_month_start: null,
          p_month_end: null
        });

      if (factsError) {
        console.error('Error fetching student facts:', factsError);
      } else {
        structuredFacts = studentFacts || {};
        if (structuredFacts.attendance) fieldsReturned.push('attendance');
        if (structuredFacts.tests) fieldsReturned.push('tests');
        if (structuredFacts.fees) fieldsReturned.push('fees');
        if (structuredFacts.name) fieldsReturned.push('profile');
      }
    } else if (scope === 'class' && target_id) {
      const { data: classFacts, error: factsError } = await supabaseClient
        .rpc('get_class_facts', { 
          p_class_id: target_id,
          p_month_start: null,
          p_month_end: null
        });

      if (factsError) {
        console.error('Error fetching class facts:', factsError);
      } else {
        structuredFacts = classFacts || {};
        fieldsReturned.push('class_summary');
      }
    }

    // Step 2: Generate embedding for query
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
        input: query,
        model: 'text-embedding-ada-002',
      }),
    });

    if (!embeddingResponse.ok) {
      console.error('Embedding API error:', embeddingResponse.status);
      throw new Error(`Embedding API error: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Step 3: Retrieve relevant documents from vector DB
    const { data: similarDocs, error: searchError } = await supabaseClient.rpc(
      'match_documents',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: top_k,
      }
    );

    if (searchError) {
      console.error('Search error:', searchError);
    }

    // Filter documents by metadata if scope is specified
    const filteredDocs = similarDocs?.filter((doc: any) => {
      if (scope === 'class' && target_id && doc.class_id !== target_id) return false;
      if (scope === 'student' && target_id) {
        // For student scope, include docs from their class
        const studentClass = structuredFacts.class || '';
        if (doc.class_id && !studentClass.includes(doc.class_id)) return false;
      }
      return true;
    }) || [];

    // Step 4: Build LLM prompt with labeled sections
    let contextPrompt = SYSTEM_PROMPT + '\n\n';

    // Add structured facts
    if (Object.keys(structuredFacts).length > 0) {
      contextPrompt += '=== STRUCTURED DATA ===\n\n';
      
      if (structuredFacts.name) {
        contextPrompt += `[PROFILE]\nStudent: ${structuredFacts.name}\n`;
        contextPrompt += `Admission Number: ${structuredFacts.admission_number}\n`;
        contextPrompt += `Class: ${structuredFacts.class}\n\n`;
      }

      if (structuredFacts.attendance) {
        contextPrompt += `[ATTENDANCE]\nPresent: ${structuredFacts.attendance.present_days} days\n`;
        contextPrompt += `Absent: ${structuredFacts.attendance.absent_days} days\n`;
        contextPrompt += `Percentage: ${structuredFacts.attendance.percentage}%\n\n`;
      }

      if (structuredFacts.tests && structuredFacts.tests.length > 0) {
        contextPrompt += `[TESTS]\nRecent test results:\n`;
        structuredFacts.tests.forEach((test: any, idx: number) => {
          contextPrompt += `${idx + 1}. ${test.test_name}: ${test.marks_obtained}/${test.max_marks} (${test.percentage}%) on ${test.date}\n`;
        });
        contextPrompt += '\n';
      }

      if (structuredFacts.fees) {
        contextPrompt += `[FEES]\nDue Amount: ₹${structuredFacts.fees.due_amount}\n`;
        contextPrompt += `Paid Amount: ₹${structuredFacts.fees.paid_amount}\n`;
        contextPrompt += `Pending Count: ${structuredFacts.fees.pending_count}\n\n`;
      }

      if (structuredFacts.class_name) {
        contextPrompt += `[CLASS SUMMARY]\nClass: ${structuredFacts.class_name}\n`;
        contextPrompt += `Total Students: ${structuredFacts.total_students}\n`;
        if (structuredFacts.attendance) {
          contextPrompt += `Average Attendance: ${structuredFacts.attendance.average_percentage}%\n`;
        }
        if (structuredFacts.performance) {
          contextPrompt += `Average Score: ${structuredFacts.performance.average_score_pct}%\n`;
        }
        if (structuredFacts.fees) {
          contextPrompt += `Fee Collection: ${structuredFacts.fees.collection_percentage}%\n`;
        }
        contextPrompt += `At-Risk Students: ${structuredFacts.at_risk_count}\n\n`;
      }

      if (structuredFacts.at_risk) {
        contextPrompt += `⚠️ ALERT: This student is flagged as at-risk.\n\n`;
      }
    }

    // Add retrieved documents
    if (filteredDocs.length > 0) {
      contextPrompt += '=== RELEVANT DOCUMENTS ===\n\n';
      filteredDocs.forEach((doc: any, idx: number) => {
        contextPrompt += `Document ${idx + 1}: ${doc.title}\n`;
        contextPrompt += `Type: ${doc.document_type}\n`;
        contextPrompt += `Content: ${doc.content.substring(0, 500)}...\n\n`;
      });
    } else {
      contextPrompt += '=== RELEVANT DOCUMENTS ===\nNo relevant documents found.\n\n';
    }

    contextPrompt += '=== USER QUERY ===\n';

    // Step 5: Call LLM with streaming
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: contextPrompt },
          ...messages,
          { role: 'user', content: query }
        ],
        stream: true,
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

    // Log the query with audit trail
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'ai_query',
      resource_type: 'rag',
      resource_id: target_id,
      details: { 
        query: query.substring(0, 200),
        scope,
        role: userRole,
        fields_returned: fieldsReturned,
        docs_retrieved: filteredDocs.length,
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
