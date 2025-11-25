-- Fix security issue: recreate view with SECURITY INVOKER
DROP VIEW IF EXISTS public.test_statistics;

CREATE OR REPLACE VIEW public.test_statistics 
WITH (security_invoker = true) AS
SELECT 
  t.id as test_id,
  t.name as test_name,
  t.class_id,
  t.subject_id,
  t.test_date,
  t.max_marks,
  t.pass_marks,
  COUNT(tr.id) as total_students,
  COUNT(tr.id) FILTER (WHERE NOT tr.is_absent) as present_count,
  COUNT(tr.id) FILTER (WHERE tr.is_absent) as absent_count,
  ROUND(AVG(tr.marks_obtained) FILTER (WHERE NOT tr.is_absent), 2) as avg_score,
  MAX(tr.marks_obtained) FILTER (WHERE NOT tr.is_absent) as highest_score,
  MIN(tr.marks_obtained) FILTER (WHERE NOT tr.is_absent) as lowest_score,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY tr.marks_obtained) FILTER (WHERE NOT tr.is_absent) as median_score,
  COUNT(tr.id) FILTER (WHERE NOT tr.is_absent AND tr.marks_obtained >= t.pass_marks) as pass_count,
  ROUND(
    100.0 * COUNT(tr.id) FILTER (WHERE NOT tr.is_absent AND tr.marks_obtained >= t.pass_marks) / 
    NULLIF(COUNT(tr.id) FILTER (WHERE NOT tr.is_absent), 0),
    2
  ) as pass_percentage
FROM public.tests t
LEFT JOIN public.test_results tr ON tr.test_id = t.id
GROUP BY t.id, t.name, t.class_id, t.subject_id, t.test_date, t.max_marks, t.pass_marks;