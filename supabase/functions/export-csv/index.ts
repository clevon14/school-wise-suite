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

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, test_id, class_id } = await req.json();

    let csvData = '';
    
    if (type === 'test_results' && test_id) {
      // Export test results
      const { data: results, error } = await supabaseClient
        .from('test_results')
        .select(`
          *,
          student:students(admission_number, first_name, last_name),
          test:tests(name, max_marks, pass_marks)
        `)
        .eq('test_id', test_id);

      if (error) throw error;

      csvData = 'Admission Number,Student Name,Marks Obtained,Is Absent,Status\n';
      results?.forEach((result: any) => {
        const studentName = `${result.student?.first_name} ${result.student?.last_name}`;
        const status = result.is_absent ? 'Absent' : 
                      (result.marks_obtained >= result.test?.pass_marks ? 'Pass' : 'Fail');
        csvData += `${result.student?.admission_number},"${studentName}",${result.marks_obtained || ''},${result.is_absent ? 'Yes' : 'No'},${status}\n`;
      });
    } else if (type === 'attendance' && class_id) {
      // Export attendance
      const { data: attendance, error } = await supabaseClient
        .from('attendance')
        .select(`
          *,
          student:students(admission_number, first_name, last_name, class:classes(name, section))
        `)
        .eq('student.class_id', class_id)
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;

      csvData = 'Date,Admission Number,Student Name,Status,Remarks\n';
      attendance?.forEach((record: any) => {
        const studentName = `${record.student?.first_name} ${record.student?.last_name}`;
        csvData += `${record.date},${record.student?.admission_number},"${studentName}",${record.status},"${record.remarks || ''}"\n`;
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid export type or missing parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the export
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'csv_export',
      resource_type: type,
      resource_id: test_id || class_id,
      details: { type },
    });

    return new Response(csvData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${type}_${Date.now()}.csv"`,
      },
    });

  } catch (error) {
    console.error('CSV export error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
