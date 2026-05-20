
-- ============ attendance ============
DROP POLICY IF EXISTS "Admins can manage all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance;
CREATE POLICY "Admins manage attendance in their school" ON public.attendance
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));

-- ============ bus_routes ============
DROP POLICY IF EXISTS "Authenticated users can view bus routes" ON public.bus_routes;
DROP POLICY IF EXISTS "Admins can manage bus routes" ON public.bus_routes;
CREATE POLICY "View bus routes in same school" ON public.bus_routes
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR school_id = get_user_school_id(auth.uid()));
CREATE POLICY "Admins manage bus routes in their school" ON public.bus_routes
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));

-- ============ bus_stops ============
DROP POLICY IF EXISTS "Authenticated users can view bus stops" ON public.bus_stops;
DROP POLICY IF EXISTS "Admins can manage bus stops" ON public.bus_stops;
CREATE POLICY "View bus stops in same school" ON public.bus_stops
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.bus_routes br WHERE br.id = bus_stops.route_id
      AND br.school_id = get_user_school_id(auth.uid())
  ));
CREATE POLICY "Admins manage bus stops in their school" ON public.bus_stops
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.bus_routes br WHERE br.id = bus_stops.route_id AND br.school_id = get_user_school_id(auth.uid())
  )))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND EXISTS (
    SELECT 1 FROM public.bus_routes br WHERE br.id = bus_stops.route_id AND br.school_id = get_user_school_id(auth.uid())
  )));

-- ============ class_fee_structure ============
DROP POLICY IF EXISTS "Authenticated users can view class fee structure" ON public.class_fee_structure;
DROP POLICY IF EXISTS "Admins can manage class fee structure" ON public.class_fee_structure;
CREATE POLICY "View class fee structure in same school" ON public.class_fee_structure
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR school_id = get_user_school_id(auth.uid()));
CREATE POLICY "Admins manage class fee structure in their school" ON public.class_fee_structure
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));

-- ============ classes ============
DROP POLICY IF EXISTS "Admins can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can insert classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can update classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can delete classes" ON public.classes;
CREATE POLICY "Admins view classes in their school" ON public.classes
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));
CREATE POLICY "Admins insert classes in their school" ON public.classes
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));
CREATE POLICY "Admins update classes in their school" ON public.classes
  FOR UPDATE TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));
CREATE POLICY "Admins delete classes in their school" ON public.classes
  FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));

-- ============ employee_attendance ============
DROP POLICY IF EXISTS "Admins can manage employee attendance" ON public.employee_attendance;
DROP POLICY IF EXISTS "Admins can view employee attendance" ON public.employee_attendance;
CREATE POLICY "Admins manage employee attendance in their school" ON public.employee_attendance
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));

-- ============ exams ============
DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
DROP POLICY IF EXISTS "Teachers can view exams" ON public.exams;
CREATE POLICY "Admins manage exams in their school" ON public.exams
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));
CREATE POLICY "Teachers view exams in their school" ON public.exams
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR ((has_role(auth.uid(),'teacher'::app_role) OR has_role(auth.uid(),'admin'::app_role)) AND school_id = get_user_school_id(auth.uid())));

-- ============ exam_subjects ============
DROP POLICY IF EXISTS "Admins can manage exam subjects" ON public.exam_subjects;
DROP POLICY IF EXISTS "Teachers can view exam subjects" ON public.exam_subjects;
CREATE POLICY "Admins manage exam subjects in their school" ON public.exam_subjects
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));
CREATE POLICY "Teachers view exam subjects in their school" ON public.exam_subjects
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR ((has_role(auth.uid(),'teacher'::app_role) OR has_role(auth.uid(),'admin'::app_role)) AND school_id = get_user_school_id(auth.uid())));

-- ============ fee_assignments ============
DROP POLICY IF EXISTS "Admins can manage fee assignments" ON public.fee_assignments;
CREATE POLICY "Admins manage fee assignments in their school" ON public.fee_assignments
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));

-- ============ fee_categories ============
DROP POLICY IF EXISTS "Authenticated users can view fee categories" ON public.fee_categories;
DROP POLICY IF EXISTS "Admins can manage fee categories" ON public.fee_categories;
CREATE POLICY "View fee categories in same school" ON public.fee_categories
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR school_id = get_user_school_id(auth.uid()) OR school_id IS NULL);
CREATE POLICY "Admins manage fee categories in their school" ON public.fee_categories
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND (school_id = get_user_school_id(auth.uid()) OR school_id IS NULL)))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND (school_id = get_user_school_id(auth.uid()) OR school_id IS NULL)));

-- ============ leave_requests ============
DROP POLICY IF EXISTS "Admins can manage all leave requests" ON public.leave_requests;
CREATE POLICY "Admins manage leave requests in their school" ON public.leave_requests
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));

-- ============ marks ============
DROP POLICY IF EXISTS "Admins can manage marks" ON public.marks;
CREATE POLICY "Admins manage marks in their school" ON public.marks
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));

-- ============ notifications ============
DROP POLICY IF EXISTS "Users can view notifications for their role" ON public.notifications;
CREATE POLICY "Users view notifications for their role and school" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND (ur.role)::text = ANY (notifications.target_role)
      )
      AND (school_id IS NULL OR school_id = get_user_school_id(auth.uid()))
    )
  );

-- ============ payments ============
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
CREATE POLICY "Admins manage payments in their school" ON public.payments
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));

-- ============ promotion_history ============
DROP POLICY IF EXISTS "Teachers can view promotion history" ON public.promotion_history;
DROP POLICY IF EXISTS "Admins can manage promotion history" ON public.promotion_history;
CREATE POLICY "Admins manage promotion history in their school" ON public.promotion_history
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));
CREATE POLICY "Teachers view promotion history in their school" ON public.promotion_history
  FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'teacher'::app_role) AND school_id = get_user_school_id(auth.uid())));

-- ============ school_events ============
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='school_events') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can view school events" ON public.school_events';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view school events" ON public.school_events';
    EXECUTE 'CREATE POLICY "View school events in same school" ON public.school_events FOR SELECT TO authenticated USING (is_super_admin(auth.uid()) OR school_id = get_user_school_id(auth.uid()))';
  END IF;
END $$;

-- ============ timetable ============
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='timetable') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage timetable" ON public.timetable';
    EXECUTE 'CREATE POLICY "Admins manage timetable in their school" ON public.timetable FOR ALL TO authenticated USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),''admin''::app_role) AND school_id = get_user_school_id(auth.uid()))) WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),''admin''::app_role) AND school_id = get_user_school_id(auth.uid())))';
  END IF;
END $$;

-- ============ storage: documents homework prefix ============
DROP POLICY IF EXISTS "Staff manage homework attachments" ON storage.objects;
CREATE POLICY "Staff manage homework attachments in their school"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'homework'
    AND (
      is_super_admin(auth.uid())
      OR (storage.foldername(name))[2] = get_user_school_id(auth.uid())::text
    )
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'homework'
    AND (
      is_super_admin(auth.uid())
      OR (storage.foldername(name))[2] = get_user_school_id(auth.uid())::text
    )
  );
