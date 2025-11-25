-- Drop and recreate student_summary view with updated schema
DROP VIEW IF EXISTS student_summary CASCADE;

CREATE VIEW student_summary AS
SELECT 
  s.id as student_id,
  s.first_name || ' ' || s.last_name as name,
  s.admission_number as admission_no,
  s.class_id,
  c.name || COALESCE(' - ' || c.section, '') as class_name,
  c.section,
  s.village,
  s.first_name,
  s.last_name,
  s.admission_number,
  -- Attendance percentage (last 30 days)
  ROUND(
    100.0 * COUNT(CASE WHEN a.status = 'present' AND a.date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::numeric / 
    NULLIF(COUNT(CASE WHEN a.date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END), 0),
    2
  ) AS attendance_pct_30d,
  -- Low attendance flag
  (ROUND(
    100.0 * COUNT(CASE WHEN a.status = 'present' AND a.date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::numeric / 
    NULLIF(COUNT(CASE WHEN a.date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END), 0),
    2
  ) < 75) AS low_attendance_flag,
  -- Average test score percentage (all tests)
  ROUND(
    AVG(
      CASE 
        WHEN tr.marks_obtained IS NOT NULL AND t.max_marks > 0 
        THEN (tr.marks_obtained::numeric / t.max_marks * 100)
        ELSE NULL 
      END
    ),
    2
  ) AS avg_test_score_pct,
  -- Low grade flag
  (ROUND(
    AVG(
      CASE 
        WHEN tr.marks_obtained IS NOT NULL AND t.max_marks > 0 
        THEN (tr.marks_obtained::numeric / t.max_marks * 100)
        ELSE NULL 
      END
    ),
    2
  ) < 50) AS low_grade_flag,
  -- Tests taken count
  COUNT(DISTINCT tr.test_id) FILTER (WHERE tr.marks_obtained IS NOT NULL) AS tests_taken,
  -- Fees paid
  COALESCE(SUM(p.amount) FILTER (WHERE fa.status = 'paid'), 0) AS fees_paid,
  -- Fees due
  COALESCE(
    SUM(fa.amount) FILTER (WHERE fa.status = 'pending'),
    0
  ) AS fees_due
FROM students s
LEFT JOIN classes c ON c.id = s.class_id
LEFT JOIN attendance a ON a.student_id = s.id
LEFT JOIN test_results tr ON tr.student_id = s.id
LEFT JOIN tests t ON t.id = tr.test_id
LEFT JOIN fee_assignments fa ON fa.student_id = s.id
LEFT JOIN payments p ON p.fee_assignment_id = fa.id
WHERE s.status = 'active'
GROUP BY s.id, s.first_name, s.last_name, s.admission_number, s.class_id, c.name, c.section, s.village;

COMMENT ON VIEW student_summary IS 'Comprehensive student summary with attendance, test scores, and fee status';