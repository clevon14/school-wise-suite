-- Create SQL views for structured data retrieval

-- Student summary view with attendance, test performance, and fees
CREATE OR REPLACE VIEW student_summary AS
SELECT 
  s.id as student_id,
  s.first_name,
  s.last_name,
  s.admission_number,
  s.class_id,
  c.name as class_name,
  c.section,
  s.village,
  -- Attendance percentage (last 30 days)
  ROUND(
    (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric / 
     NULLIF(COUNT(a.id), 0) * 100), 2
  ) as attendance_pct_30d,
  -- Average test score (last 3 tests)
  ROUND(
    AVG(CASE 
      WHEN tr.marks_obtained IS NOT NULL AND t.max_marks > 0 
      THEN (tr.marks_obtained::numeric / t.max_marks * 100)
      ELSE NULL 
    END), 2
  ) as avg_test_score_pct,
  -- Count of tests taken
  COUNT(DISTINCT CASE WHEN tr.marks_obtained IS NOT NULL THEN tr.id END) as tests_taken,
  -- Fee status
  COALESCE(SUM(CASE WHEN fa.status = 'pending' THEN fa.amount ELSE 0 END), 0) as fees_due,
  COALESCE(SUM(CASE WHEN fa.status = 'paid' THEN fa.amount ELSE 0 END), 0) as fees_paid,
  -- At-risk indicators
  CASE 
    WHEN ROUND(
      (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric / 
       NULLIF(COUNT(a.id), 0) * 100), 2
    ) < 75 THEN true
    ELSE false
  END as low_attendance_flag,
  CASE
    WHEN ROUND(
      AVG(CASE 
        WHEN tr.marks_obtained IS NOT NULL AND t.max_marks > 0 
        THEN (tr.marks_obtained::numeric / t.max_marks * 100)
        ELSE NULL 
      END), 2
    ) < 40 THEN true
    ELSE false
  END as low_grade_flag
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN attendance a ON s.id = a.student_id AND a.date >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN test_results tr ON s.id = tr.student_id
LEFT JOIN tests t ON tr.test_id = t.id AND t.test_date >= CURRENT_DATE - INTERVAL '90 days'
LEFT JOIN fee_assignments fa ON s.id = fa.student_id
GROUP BY s.id, s.first_name, s.last_name, s.admission_number, s.class_id, c.name, c.section, s.village;

-- Class summary view with aggregate metrics
CREATE OR REPLACE VIEW class_summary AS
SELECT
  c.id as class_id,
  c.name as class_name,
  c.section,
  c.academic_year,
  COUNT(DISTINCT s.id) as total_students,
  -- Average attendance (last 30 days)
  ROUND(
    AVG(
      (SELECT COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric / 
       NULLIF(COUNT(a.id), 0) * 100
       FROM attendance a 
       WHERE a.student_id = s.id AND a.date >= CURRENT_DATE - INTERVAL '30 days')
    ), 2
  ) as avg_attendance_pct,
  -- Average test score (last 90 days)
  ROUND(
    AVG(
      CASE 
        WHEN tr.marks_obtained IS NOT NULL AND t.max_marks > 0 
        THEN (tr.marks_obtained::numeric / t.max_marks * 100)
        ELSE NULL 
      END
    ), 2
  ) as avg_test_score_pct,
  -- Fee collection percentage
  ROUND(
    (SUM(CASE WHEN fa.status = 'paid' THEN fa.amount ELSE 0 END)::numeric /
     NULLIF(SUM(fa.amount), 0) * 100), 2
  ) as fee_collection_pct,
  -- At-risk student count
  COUNT(DISTINCT CASE 
    WHEN EXISTS (
      SELECT 1 FROM attendance a 
      WHERE a.student_id = s.id 
      AND a.date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY a.student_id
      HAVING COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric / 
             NULLIF(COUNT(a.id), 0) * 100 < 75
    ) THEN s.id
  END) as at_risk_count
FROM classes c
LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
LEFT JOIN test_results tr ON s.id = tr.student_id
LEFT JOIN tests t ON tr.test_id = t.id AND t.test_date >= CURRENT_DATE - INTERVAL '90 days'
LEFT JOIN fee_assignments fa ON s.id = fa.student_id
GROUP BY c.id, c.name, c.section, c.academic_year;

-- Function to get student structured facts
CREATE OR REPLACE FUNCTION get_student_facts(
  p_student_id uuid,
  p_month_start date DEFAULT NULL,
  p_month_end date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_start_date date;
  v_end_date date;
BEGIN
  v_start_date := COALESCE(p_month_start, CURRENT_DATE - INTERVAL '30 days');
  v_end_date := COALESCE(p_month_end, CURRENT_DATE);
  
  SELECT jsonb_build_object(
    'student_id', s.id,
    'name', s.first_name || ' ' || s.last_name,
    'admission_number', s.admission_number,
    'class', c.name || COALESCE(' - ' || c.section, ''),
    'attendance', jsonb_build_object(
      'present_days', COUNT(CASE WHEN a.status = 'present' THEN 1 END),
      'absent_days', COUNT(CASE WHEN a.status = 'absent' THEN 1 END),
      'percentage', ROUND(
        (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric / 
         NULLIF(COUNT(a.id), 0) * 100), 2
      )
    ),
    'tests', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'test_name', t.name,
          'marks_obtained', tr.marks_obtained,
          'max_marks', t.max_marks,
          'percentage', ROUND((tr.marks_obtained::numeric / t.max_marks * 100), 2),
          'date', t.test_date
        ) ORDER BY t.test_date DESC
      )
      FROM test_results tr
      JOIN tests t ON tr.test_id = t.id
      WHERE tr.student_id = s.id 
      AND t.test_date >= v_start_date
      LIMIT 3
    ),
    'fees', jsonb_build_object(
      'due_amount', COALESCE(SUM(CASE WHEN fa.status = 'pending' THEN fa.amount ELSE 0 END), 0),
      'paid_amount', COALESCE(SUM(CASE WHEN fa.status = 'paid' THEN fa.amount ELSE 0 END), 0),
      'pending_count', COUNT(CASE WHEN fa.status = 'pending' THEN 1 END)
    ),
    'at_risk', CASE 
      WHEN ROUND(
        (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::numeric / 
         NULLIF(COUNT(a.id), 0) * 100), 2
      ) < 75 THEN true
      ELSE false
    END
  ) INTO v_result
  FROM students s
  LEFT JOIN classes c ON s.class_id = c.id
  LEFT JOIN attendance a ON s.id = a.student_id AND a.date BETWEEN v_start_date AND v_end_date
  LEFT JOIN fee_assignments fa ON s.id = fa.student_id
  WHERE s.id = p_student_id
  GROUP BY s.id, s.first_name, s.last_name, s.admission_number, c.name, c.section;
  
  RETURN v_result;
END;
$$;

-- Function to get class structured facts
CREATE OR REPLACE FUNCTION get_class_facts(
  p_class_id uuid,
  p_month_start date DEFAULT NULL,
  p_month_end date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_start_date date;
  v_end_date date;
BEGIN
  v_start_date := COALESCE(p_month_start, CURRENT_DATE - INTERVAL '30 days');
  v_end_date := COALESCE(p_month_end, CURRENT_DATE);
  
  SELECT jsonb_build_object(
    'class_id', c.id,
    'class_name', c.name || COALESCE(' - ' || c.section, ''),
    'academic_year', c.academic_year,
    'total_students', COUNT(DISTINCT s.id),
    'attendance', jsonb_build_object(
      'average_percentage', ROUND(
        AVG(
          (SELECT COUNT(CASE WHEN a2.status = 'present' THEN 1 END)::numeric / 
           NULLIF(COUNT(a2.id), 0) * 100
           FROM attendance a2 
           WHERE a2.student_id = s.id AND a2.date BETWEEN v_start_date AND v_end_date)
        ), 2
      )
    ),
    'performance', jsonb_build_object(
      'average_score_pct', ROUND(
        AVG(
          CASE 
            WHEN tr.marks_obtained IS NOT NULL AND t.max_marks > 0 
            THEN (tr.marks_obtained::numeric / t.max_marks * 100)
            ELSE NULL 
          END
        ), 2
      ),
      'tests_conducted', COUNT(DISTINCT t.id)
    ),
    'fees', jsonb_build_object(
      'collection_percentage', ROUND(
        (SUM(CASE WHEN fa.status = 'paid' THEN fa.amount ELSE 0 END)::numeric /
         NULLIF(SUM(fa.amount), 0) * 100), 2
      ),
      'total_due', COALESCE(SUM(CASE WHEN fa.status = 'pending' THEN fa.amount ELSE 0 END), 0)
    ),
    'at_risk_count', COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM attendance a3
        WHERE a3.student_id = s.id 
        AND a3.date BETWEEN v_start_date AND v_end_date
        GROUP BY a3.student_id
        HAVING COUNT(CASE WHEN a3.status = 'present' THEN 1 END)::numeric / 
               NULLIF(COUNT(a3.id), 0) * 100 < 75
      ) THEN s.id
    END)
  ) INTO v_result
  FROM classes c
  LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
  LEFT JOIN test_results tr ON s.id = tr.student_id
  LEFT JOIN tests t ON tr.test_id = t.id AND t.test_date BETWEEN v_start_date AND v_end_date AND t.class_id = c.id
  LEFT JOIN fee_assignments fa ON s.id = fa.student_id
  WHERE c.id = p_class_id
  GROUP BY c.id, c.name, c.section, c.academic_year;
  
  RETURN v_result;
END;
$$;

-- Enable RLS on views
ALTER VIEW student_summary SET (security_invoker = true);
ALTER VIEW class_summary SET (security_invoker = true);