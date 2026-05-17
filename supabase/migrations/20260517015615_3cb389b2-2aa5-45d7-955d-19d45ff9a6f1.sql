
-- 1. Employees: scope admin access to their own school (super admin bypass)
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;

CREATE POLICY "Admins can view employees in their school"
ON public.employees FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR (has_role(auth.uid(), 'admin'::app_role) AND school_id = public.get_user_school_id(auth.uid()))
);

CREATE POLICY "Admins can manage employees in their school"
ON public.employees FOR ALL
USING (
  public.is_super_admin(auth.uid())
  OR (has_role(auth.uid(), 'admin'::app_role) AND school_id = public.get_user_school_id(auth.uid()))
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (has_role(auth.uid(), 'admin'::app_role) AND school_id = public.get_user_school_id(auth.uid()))
);

-- 2. Buses: scope to school
DROP POLICY IF EXISTS "Admins can manage buses" ON public.buses;
DROP POLICY IF EXISTS "Admins can view all bus data" ON public.buses;

CREATE POLICY "Admins can view buses in their school"
ON public.buses FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR (has_role(auth.uid(), 'admin'::app_role) AND school_id = public.get_user_school_id(auth.uid()))
);

CREATE POLICY "Admins can manage buses in their school"
ON public.buses FOR ALL
USING (
  public.is_super_admin(auth.uid())
  OR (has_role(auth.uid(), 'admin'::app_role) AND school_id = public.get_user_school_id(auth.uid()))
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (has_role(auth.uid(), 'admin'::app_role) AND school_id = public.get_user_school_id(auth.uid()))
);

-- 3. Students: scope admin SELECT/manage to their school; add parent SELECT for own child
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;

CREATE POLICY "Admins can view students in their school"
ON public.students FOR SELECT
USING (
  public.is_super_admin(auth.uid())
  OR (has_role(auth.uid(), 'admin'::app_role) AND school_id = public.get_user_school_id(auth.uid()))
);

CREATE POLICY "Admins can manage students in their school"
ON public.students FOR ALL
USING (
  public.is_super_admin(auth.uid())
  OR (has_role(auth.uid(), 'admin'::app_role) AND school_id = public.get_user_school_id(auth.uid()))
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (has_role(auth.uid(), 'admin'::app_role) AND school_id = public.get_user_school_id(auth.uid()))
);

CREATE POLICY "Parents can view their own child"
ON public.students FOR SELECT
USING (user_id = auth.uid());

-- 4. Audit logs: let any authenticated user insert their own log entry
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;

CREATE POLICY "Users can insert their own audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 5. Documents bucket: require file path to include the employee's user_id
DROP POLICY IF EXISTS "Employees can view own documents" ON storage.objects;

CREATE POLICY "Employees can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'teachers'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
