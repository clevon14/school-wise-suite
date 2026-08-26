-- Security hardening for base schema tables
-- Enables RLS, adds GRANTs, and creates school-scoped policies

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id uuid)
RETURNS uuid AS $$
DECLARE
    _school_id uuid;
BEGIN
    SELECT school_id INTO _school_id FROM public.user_schools
    WHERE user_id = _user_id AND is_default = true LIMIT 1;
    IF _school_id IS NULL THEN
        SELECT school_id INTO _school_id FROM public.user_schools
        WHERE user_id = _user_id LIMIT 1;
    END IF;
    RETURN _school_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Fix search path on existing helper functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_marked_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.marked_by IS NULL THEN
    NEW.marked_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke public execute on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_school_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_marked_by() FROM PUBLIC, anon;

-- GRANTs and RLS for all base tables
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'schools', 'classes', 'subjects', 'employees', 'students', 'user_roles',
        'attendance', 'employee_attendance', 'class_subjects', 'timetable',
        'fee_categories', 'fee_assignments', 'payments', 'exams', 'exam_subjects',
        'marks', 'buses', 'bus_routes', 'bus_stops', 'student_transport',
        'notifications', 'notification_reads', 'profiles', 'class_fee_structure',
        'syllabus_topics', 'syllabus_progress', 'quizzes', 'quiz_questions',
        'quiz_attempts', 'quiz_answers', 'tests', 'test_results', 'documents',
        'audit_logs', 'promotion_history', 'school_events', 'leave_requests',
        'user_schools'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
        EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- Generic school-scoped admin policies (super_admin bypass)
CREATE POLICY "schools_admin" ON public.schools
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin());

CREATE POLICY "classes_school_scoped" ON public.classes
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "subjects_school_scoped" ON public.subjects
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "employees_school_scoped" ON public.employees
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()) OR user_id = auth.uid())
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "students_school_scoped" ON public.students
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()) OR user_id = auth.uid() OR parent_email = auth.email())
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "user_roles_self" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR user_id = auth.uid())
    WITH CHECK (public.is_super_admin());

CREATE POLICY "attendance_school_scoped" ON public.attendance
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "employee_attendance_school_scoped" ON public.employee_attendance
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()) OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "class_subjects_school_scoped" ON public.class_subjects
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR class_id IN (SELECT id FROM public.classes WHERE school_id = public.get_user_school_id(auth.uid())))
    WITH CHECK (public.is_super_admin() OR class_id IN (SELECT id FROM public.classes WHERE school_id = public.get_user_school_id(auth.uid())));

CREATE POLICY "timetable_school_scoped" ON public.timetable
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "fee_categories_school_scoped" ON public.fee_categories
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "fee_assignments_school_scoped" ON public.fee_assignments
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()) OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid() OR parent_email = auth.email()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "payments_school_scoped" ON public.payments
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "exams_school_scoped" ON public.exams
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "exam_subjects_school_scoped" ON public.exam_subjects
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR exam_id IN (SELECT id FROM public.exams WHERE school_id = public.get_user_school_id(auth.uid())))
    WITH CHECK (public.is_super_admin() OR exam_id IN (SELECT id FROM public.exams WHERE school_id = public.get_user_school_id(auth.uid())));

CREATE POLICY "marks_school_scoped" ON public.marks
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()) OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "buses_school_scoped" ON public.buses
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "bus_routes_school_scoped" ON public.bus_routes
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "bus_stops_school_scoped" ON public.bus_stops
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR route_id IN (SELECT id FROM public.bus_routes WHERE school_id = public.get_user_school_id(auth.uid())))
    WITH CHECK (public.is_super_admin() OR route_id IN (SELECT id FROM public.bus_routes WHERE school_id = public.get_user_school_id(auth.uid())));

CREATE POLICY "student_transport_school_scoped" ON public.student_transport
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR student_id IN (SELECT id FROM public.students WHERE school_id = public.get_user_school_id(auth.uid()) OR user_id = auth.uid() OR parent_email = auth.email()))
    WITH CHECK (public.is_super_admin() OR student_id IN (SELECT id FROM public.students WHERE school_id = public.get_user_school_id(auth.uid())));

CREATE POLICY "notifications_school_scoped" ON public.notifications
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR sent_by IN (SELECT id FROM public.employees WHERE school_id = public.get_user_school_id(auth.uid())))
    WITH CHECK (public.is_super_admin() OR sent_by IN (SELECT id FROM public.employees WHERE school_id = public.get_user_school_id(auth.uid())));

CREATE POLICY "notification_reads_self" ON public.notification_reads
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR user_id = auth.uid())
    WITH CHECK (public.is_super_admin() OR user_id = auth.uid());

CREATE POLICY "profiles_self" ON public.profiles
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR id = auth.uid())
    WITH CHECK (public.is_super_admin() OR id = auth.uid());

CREATE POLICY "class_fee_structure_school_scoped" ON public.class_fee_structure
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "syllabus_topics_school_scoped" ON public.syllabus_topics
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "syllabus_progress_school_scoped" ON public.syllabus_progress
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "quizzes_school_scoped" ON public.quizzes
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "quiz_questions_school_scoped" ON public.quiz_questions
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR quiz_id IN (SELECT id FROM public.quizzes WHERE school_id = public.get_user_school_id(auth.uid())))
    WITH CHECK (public.is_super_admin() OR quiz_id IN (SELECT id FROM public.quizzes WHERE school_id = public.get_user_school_id(auth.uid())));

CREATE POLICY "quiz_attempts_school_scoped" ON public.quiz_attempts
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR quiz_id IN (SELECT id FROM public.quizzes WHERE school_id = public.get_user_school_id(auth.uid())) OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR quiz_id IN (SELECT id FROM public.quizzes WHERE school_id = public.get_user_school_id(auth.uid())) OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "quiz_answers_school_scoped" ON public.quiz_answers
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR attempt_id IN (SELECT id FROM public.quiz_attempts WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE school_id = public.get_user_school_id(auth.uid()))))
    WITH CHECK (public.is_super_admin() OR attempt_id IN (SELECT id FROM public.quiz_attempts WHERE quiz_id IN (SELECT id FROM public.quizzes WHERE school_id = public.get_user_school_id(auth.uid()))));

CREATE POLICY "tests_school_scoped" ON public.tests
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR class_id IN (SELECT id FROM public.classes WHERE school_id = public.get_user_school_id(auth.uid())))
    WITH CHECK (public.is_super_admin() OR class_id IN (SELECT id FROM public.classes WHERE school_id = public.get_user_school_id(auth.uid())));

CREATE POLICY "test_results_school_scoped" ON public.test_results
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR test_id IN (SELECT id FROM public.tests WHERE class_id IN (SELECT id FROM public.classes WHERE school_id = public.get_user_school_id(auth.uid()))) OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR test_id IN (SELECT id FROM public.tests WHERE class_id IN (SELECT id FROM public.classes WHERE school_id = public.get_user_school_id(auth.uid()))));

CREATE POLICY "documents_school_scoped" ON public.documents
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()) OR owner_id = auth.uid())
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()) OR owner_id = auth.uid());

CREATE POLICY "audit_logs_insert_self" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR user_id = auth.uid());

CREATE POLICY "audit_logs_read_school_scoped" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_super_admin());

CREATE POLICY "promotion_history_school_scoped" ON public.promotion_history
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR student_id IN (SELECT id FROM public.students WHERE school_id = public.get_user_school_id(auth.uid()) OR user_id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR student_id IN (SELECT id FROM public.students WHERE school_id = public.get_user_school_id(auth.uid())));

CREATE POLICY "school_events_school_scoped" ON public.school_events
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "leave_requests_school_scoped" ON public.leave_requests
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()) OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR school_id = public.get_user_school_id(auth.uid()) OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "user_schools_self" ON public.user_schools
    FOR ALL TO authenticated
    USING (public.is_super_admin() OR user_id = auth.uid())
    WITH CHECK (public.is_super_admin() OR user_id = auth.uid());
