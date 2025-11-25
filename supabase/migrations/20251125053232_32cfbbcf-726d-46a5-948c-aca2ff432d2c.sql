-- Fix critical security issues: Restrict teacher access to only their assigned classes

-- 1. Fix Students Table: Teachers can only view students in their assigned classes
DROP POLICY IF EXISTS "Admins and teachers can view students" ON students;

CREATE POLICY "Admins can view all students"
ON students FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view students in their classes"
ON students FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM class_subjects cs
    INNER JOIN employees e ON e.id = cs.teacher_id AND e.user_id = auth.uid()
    WHERE cs.class_id = students.class_id
    AND has_role(auth.uid(), 'teacher'::app_role)
  )
);

-- 2. Fix Attendance Table: Teachers can only access attendance for their assigned classes
DROP POLICY IF EXISTS "Admins and teachers can manage attendance" ON attendance;
DROP POLICY IF EXISTS "Admins and teachers can view attendance" ON attendance;

-- Admin policies
CREATE POLICY "Admins can view all attendance"
ON attendance FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all attendance"
ON attendance FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Teacher policies - scoped to their classes
CREATE POLICY "Teachers view attendance for their classes"
ON attendance FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    INNER JOIN class_subjects cs ON cs.class_id = s.class_id
    INNER JOIN employees e ON e.id = cs.teacher_id AND e.user_id = auth.uid()
    WHERE attendance.student_id = s.id
    AND has_role(auth.uid(), 'teacher'::app_role)
  )
);

CREATE POLICY "Teachers mark attendance for their classes"
ON attendance FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s
    INNER JOIN class_subjects cs ON cs.class_id = s.class_id
    INNER JOIN employees e ON e.id = cs.teacher_id AND e.user_id = auth.uid()
    WHERE attendance.student_id = s.id
    AND has_role(auth.uid(), 'teacher'::app_role)
  )
);

CREATE POLICY "Teachers update attendance for their classes"
ON attendance FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    INNER JOIN class_subjects cs ON cs.class_id = s.class_id
    INNER JOIN employees e ON e.id = cs.teacher_id AND e.user_id = auth.uid()
    WHERE attendance.student_id = s.id
    AND has_role(auth.uid(), 'teacher'::app_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s
    INNER JOIN class_subjects cs ON cs.class_id = s.class_id
    INNER JOIN employees e ON e.id = cs.teacher_id AND e.user_id = auth.uid()
    WHERE attendance.student_id = s.id
    AND has_role(auth.uid(), 'teacher'::app_role)
  )
);

-- 3. Add parent role to enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typelem = 0) THEN
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'parent';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. Add automatic timestamp trigger for attendance
CREATE OR REPLACE FUNCTION set_marked_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.marked_by IS NULL THEN
    NEW.marked_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_attendance_marked_by ON attendance;
CREATE TRIGGER set_attendance_marked_by
  BEFORE INSERT ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION set_marked_by();