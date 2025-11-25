-- Fix security definer view: recreate student_summary with security_invoker
DROP VIEW IF EXISTS public.student_summary CASCADE;

CREATE VIEW public.student_summary 
WITH (security_invoker = true) AS
SELECT 
  s.id as student_id,
  s.first_name || ' ' || s.last_name as name,
  s.admission_number as admission_no,
  s.admission_number,
  s.first_name,
  s.last_name,
  s.class_id,
  c.name || COALESCE(' - ' || c.section, '') as class_name,
  c.section,
  s.village,
  -- Attendance percentage last 30 days
  ROUND((
    SELECT COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric / 
           NULLIF(COUNT(a.id), 0) * 100
    FROM attendance a
    WHERE a.student_id = s.id 
      AND a.date >= CURRENT_DATE - INTERVAL '30 days'
  ), 2) as attendance_pct_30d,
  -- Flag for low attendance (<75%)
  (
    SELECT COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric / 
           NULLIF(COUNT(a.id), 0) * 100 < 75
    FROM attendance a
    WHERE a.student_id = s.id 
      AND a.date >= CURRENT_DATE - INTERVAL '30 days'
  ) as low_attendance_flag,
  -- Test performance metrics
  ROUND(AVG(
    CASE 
      WHEN tr.marks_obtained IS NOT NULL AND t.max_marks > 0 
      THEN (tr.marks_obtained / t.max_marks * 100)
      ELSE NULL 
    END
  ), 2) as avg_test_score_pct,
  -- Flag for low grades (<60% average)
  (
    AVG(
      CASE 
        WHEN tr.marks_obtained IS NOT NULL AND t.max_marks > 0 
        THEN (tr.marks_obtained / t.max_marks * 100)
        ELSE NULL 
      END
    ) < 60
  ) as low_grade_flag,
  COUNT(DISTINCT t.id) as tests_taken,
  -- Fee information
  COALESCE(SUM(CASE WHEN fa.status = 'pending' THEN fa.amount ELSE 0 END), 0) as fees_due,
  COALESCE(SUM(CASE WHEN fa.status = 'paid' THEN fa.amount ELSE 0 END), 0) as fees_paid
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN attendance a ON s.id = a.student_id AND a.date >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN test_results tr ON s.id = tr.student_id
LEFT JOIN tests t ON tr.test_id = t.id AND t.test_date >= CURRENT_DATE - INTERVAL '90 days'
LEFT JOIN fee_assignments fa ON s.id = fa.student_id
WHERE s.status = 'active'
GROUP BY s.id, s.first_name, s.last_name, s.admission_number, s.class_id, c.name, c.section, s.village;