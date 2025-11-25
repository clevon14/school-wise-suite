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

    // Get user role for RBAC
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = userRoles?.role || 'parent';

    const { scope, id, filters = {} } = await req.json();

    if (!scope) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: scope' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let csvData = '';
    let filename = '';

    // Handle different export scopes
    if (scope === 'test' && id) {
      // Export test results with all details
      const { data: results, error } = await supabaseClient
        .from('test_results')
        .select(`
          *,
          student:students(
            first_name,
            last_name,
            admission_number,
            class:classes(name, section)
          ),
          test:tests(
            name,
            subject:subjects(name),
            test_date,
            max_marks,
            pass_marks
          )
        `)
        .eq('test_id', id)
        .order('student(admission_number)');

      if (error) throw error;

      csvData = 'Student Name,Admission No,Class,Test Name,Subject,Date,Max Marks,Marks Obtained,Percent,Grade,Remark,Present\n';
      results?.forEach((result: any) => {
        const studentName = result.student ? `${result.student.first_name} ${result.student.last_name}` : 'N/A';
        const admissionNo = result.student?.admission_number || 'N/A';
        const className = result.student?.class 
          ? `${result.student.class.name}${result.student.class.section ? ' - ' + result.student.class.section : ''}`
          : 'N/A';
        const testName = result.test?.name || 'N/A';
        const subject = result.test?.subject?.name || 'N/A';
        const date = result.test?.test_date || 'N/A';
        const maxMarks = result.test?.max_marks || 0;
        const marksObtained = result.marks_obtained || 0;
        const percent = maxMarks > 0 ? ((marksObtained / maxMarks) * 100).toFixed(2) : '0.00';
        const passMarks = result.test?.pass_marks || 0;
        const grade = marksObtained >= passMarks ? 'Pass' : 'Fail';
        const present = result.is_absent ? 'No' : 'Yes';
        const remark = result.remarks || '';

        csvData += `"${studentName}","${admissionNo}","${className}","${testName}","${subject}","${date}",${maxMarks},${marksObtained},${percent},"${grade}","${remark}","${present}"\n`;
      });

      filename = `test_${id}_${Date.now()}.csv`;

    } else if (scope === 'class' && id) {
      // Export class summary with student metrics
      const { data: students, error } = await supabaseClient
        .from('student_summary')
        .select('*')
        .eq('class_id', id);

      if (error) throw error;

      csvData = 'Student Name,Admission No,Attendance %,Avg Marks (Last 3),Tuition Due,Bus Due,Total Due,At Risk\n';
      students?.forEach((student: any) => {
        const studentName = `${student.first_name} ${student.last_name}`;
        const admissionNo = student.admission_number || 'N/A';
        const attendancePct = student.attendance_pct_30d || '0.00';
        const avgMarks = student.avg_test_score_pct || '0.00';
        
        // Get fee breakdown
        const tuitionDue = student.fees_due || 0;
        const busDue = 0; // Would need to query separately if needed
        const totalDue = tuitionDue;
        const atRisk = (student.low_attendance_flag || student.low_grade_flag) ? 'Yes' : 'No';

        csvData += `"${studentName}","${admissionNo}",${attendancePct},${avgMarks},${tuitionDue},${busDue},${totalDue},"${atRisk}"\n`;
      });

      filename = `class_${id}_${Date.now()}.csv`;

    } else if (scope === 'student' && id) {
      // Check RBAC - parents can only export their own student
      if (userRole === 'parent') {
        const { data: parentStudent } = await supabaseClient
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (!parentStudent || parentStudent.id !== id) {
          return new Response(
            JSON.stringify({ error: 'Forbidden: Parents can only export their own student data' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Get student details
      const { data: studentData } = await supabaseClient
        .rpc('get_student_facts', {
          p_student_id: id,
          p_month_start: filters.month_start || null,
          p_month_end: filters.month_end || null
        });

      // Get attendance records
      const { data: attendance } = await supabaseClient
        .from('attendance')
        .select('date, status, remarks')
        .eq('student_id', id)
        .order('date', { ascending: false })
        .limit(100);

      // Get test results
      const { data: testResults } = await supabaseClient
        .from('test_results')
        .select(`
          *,
          test:tests(name, subject:subjects(name), test_date, max_marks, pass_marks)
        `)
        .eq('student_id', id)
        .order('test(test_date)', { ascending: false });

      // Get fee assignments
      const { data: fees } = await supabaseClient
        .from('fee_assignments')
        .select(`
          *,
          fee_category:fee_categories(name)
        `)
        .eq('student_id', id)
        .order('due_date', { ascending: false });

      // Build comprehensive student report
      csvData = `Student Report\n`;
      csvData += `Name,${studentData?.name || 'N/A'}\n`;
      csvData += `Admission Number,${studentData?.admission_number || 'N/A'}\n`;
      csvData += `Class,${studentData?.class || 'N/A'}\n\n`;

      csvData += `Attendance Summary\n`;
      csvData += `Present Days,${studentData?.attendance?.present_days || 0}\n`;
      csvData += `Absent Days,${studentData?.attendance?.absent_days || 0}\n`;
      csvData += `Percentage,${studentData?.attendance?.percentage || 0}%\n\n`;

      csvData += `Date,Status,Remarks\n`;
      attendance?.forEach((record: any) => {
        csvData += `${record.date},"${record.status}","${record.remarks || ''}"\n`;
      });

      csvData += `\nTest Results\n`;
      csvData += `Test Name,Subject,Date,Marks Obtained,Max Marks,Percentage,Status\n`;
      testResults?.forEach((result: any) => {
        const percent = result.test?.max_marks > 0 
          ? ((result.marks_obtained / result.test.max_marks) * 100).toFixed(2)
          : '0.00';
        const status = result.is_absent ? 'Absent' : 
                      (result.marks_obtained >= result.test?.pass_marks ? 'Pass' : 'Fail');
        csvData += `"${result.test?.name}","${result.test?.subject?.name}","${result.test?.test_date}",${result.marks_obtained || 0},${result.test?.max_marks || 0},${percent},"${status}"\n`;
      });

      csvData += `\nFee Details\n`;
      csvData += `Fee Category,Amount,Due Date,Status\n`;
      fees?.forEach((fee: any) => {
        csvData += `"${fee.fee_category?.name}",${fee.amount},"${fee.due_date}","${fee.status}"\n`;
      });

      filename = `student_${id}_${Date.now()}.csv`;

    } else if (scope === 'month_summary' && filters.month && filters.year) {
      // Monthly summary across all students
      if (userRole !== 'admin' && userRole !== 'teacher') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Only admins and teachers can export monthly summaries' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const monthStart = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
      const monthEnd = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];

      const { data: students, error } = await supabaseClient
        .from('student_summary')
        .select('*');

      if (error) throw error;

      csvData = 'Student Name,Admission No,Class,Attendance %,Tests Taken,Avg Score %,Fees Due,Fees Paid,At Risk\n';
      students?.forEach((student: any) => {
        const studentName = `${student.first_name} ${student.last_name}`;
        const admissionNo = student.admission_number || 'N/A';
        const className = `${student.class_name || 'N/A'}${student.section ? ' - ' + student.section : ''}`;
        const attendancePct = student.attendance_pct_30d || '0.00';
        const testsTaken = student.tests_taken || 0;
        const avgScore = student.avg_test_score_pct || '0.00';
        const feesDue = student.fees_due || 0;
        const feesPaid = student.fees_paid || 0;
        const atRisk = (student.low_attendance_flag || student.low_grade_flag) ? 'Yes' : 'No';

        csvData += `"${studentName}","${admissionNo}","${className}",${attendancePct},${testsTaken},${avgScore},${feesDue},${feesPaid},"${atRisk}"\n`;
      });

      filename = `monthly_summary_${filters.year}_${filters.month}_${Date.now()}.csv`;

    } else if (scope === 'attendance' && filters.class_id) {
      // Export attendance for a class
      const { data: attendance, error } = await supabaseClient
        .from('attendance')
        .select(`
          *,
          student:students(
            first_name,
            last_name,
            admission_number,
            class:classes(name, section)
          )
        `)
        .eq('student.class_id', filters.class_id)
        .gte('date', filters.start_date || '2024-01-01')
        .lte('date', filters.end_date || new Date().toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      csvData = 'Date,Student Name,Admission No,Class,Status,Remarks\n';
      attendance?.forEach((record: any) => {
        const studentName = record.student ? `${record.student.first_name} ${record.student.last_name}` : 'N/A';
        const admissionNo = record.student?.admission_number || 'N/A';
        const className = record.student?.class 
          ? `${record.student.class.name}${record.student.class.section ? ' - ' + record.student.class.section : ''}`
          : 'N/A';
        csvData += `${record.date},"${studentName}","${admissionNo}","${className}","${record.status}","${record.remarks || ''}"\n`;
      });

      filename = `attendance_class_${filters.class_id}_${Date.now()}.csv`;

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid scope or missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the export
    await supabaseClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'csv_export',
      resource_type: scope,
      resource_id: id,
      details: { scope, filters, filename },
    });

    return new Response(csvData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
