
-- 1. Fix get_student_facts: add authorization checks
CREATE OR REPLACE FUNCTION public.get_student_facts(p_student_id uuid, p_month_start date DEFAULT NULL::date, p_month_end date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_start_date date;
  v_end_date date;
  v_caller uuid;
BEGIN
  v_caller := auth.uid();
  
  -- Authorization: admin, teacher of student's class, or parent of student
  IF NOT (
    has_role(v_caller, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM students s
      JOIN class_subjects cs ON cs.class_id = s.class_id
      JOIN employees e ON e.id = cs.teacher_id
      WHERE s.id = p_student_id AND e.user_id = v_caller
    )
    OR EXISTS (
      SELECT 1 FROM students WHERE id = p_student_id AND user_id = v_caller
    )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

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
$function$;

-- 2. Fix get_class_facts: add authorization checks
CREATE OR REPLACE FUNCTION public.get_class_facts(p_class_id uuid, p_month_start date DEFAULT NULL::date, p_month_end date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_start_date date;
  v_end_date date;
  v_caller uuid;
BEGIN
  v_caller := auth.uid();
  
  -- Authorization: admin or teacher who teaches in this class
  IF NOT (
    has_role(v_caller, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM class_subjects cs
      JOIN employees e ON e.id = cs.teacher_id
      WHERE cs.class_id = p_class_id AND e.user_id = v_caller
    )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

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
$function$;

-- 3. Fix buses table: restrict SELECT to admins only, drop permissive policy
DROP POLICY IF EXISTS "Authenticated users can view buses" ON buses;
CREATE POLICY "Admins can view all bus data" ON buses FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix school_events: change public role to authenticated
DROP POLICY IF EXISTS "Authenticated users can view school events" ON school_events;
CREATE POLICY "Authenticated users can view school events" ON school_events FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage school events" ON school_events;
CREATE POLICY "Admins can manage school events" ON school_events FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
