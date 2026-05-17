
-- ============== Tables ==============
CREATE TABLE public.homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid,
  class_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  instructions text,
  attachment_urls text[] DEFAULT '{}',
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date timestamptz NOT NULL,
  max_marks numeric,
  allow_late boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_homework_class_due ON public.homework(class_id, due_date);
CREATE INDEX idx_homework_teacher ON public.homework(teacher_id);
CREATE INDEX idx_homework_school ON public.homework(school_id);

CREATE TABLE public.homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid,
  homework_id uuid NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  submission_text text,
  attachment_urls text[] DEFAULT '{}',
  submitted_at timestamptz,
  is_late boolean NOT NULL DEFAULT false,
  marks_awarded numeric,
  feedback text,
  graded_by uuid,
  graded_at timestamptz,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','submitted','late','graded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(homework_id, student_id)
);

CREATE INDEX idx_homework_subs_homework ON public.homework_submissions(homework_id);
CREATE INDEX idx_homework_subs_student ON public.homework_submissions(student_id);

-- ============== updated_at triggers ==============
CREATE TRIGGER trg_homework_updated_at
  BEFORE UPDATE ON public.homework
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_homework_subs_updated_at
  BEFORE UPDATE ON public.homework_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== Late/status auto-set trigger ==============
CREATE OR REPLACE FUNCTION public.set_homework_submission_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_due timestamptz;
BEGIN
  IF NEW.marks_awarded IS NOT NULL THEN
    NEW.status := 'graded';
    IF NEW.graded_at IS NULL THEN NEW.graded_at := now(); END IF;
  ELSIF NEW.submitted_at IS NOT NULL THEN
    SELECT due_date INTO v_due FROM public.homework WHERE id = NEW.homework_id;
    IF v_due IS NOT NULL AND NEW.submitted_at > v_due THEN
      NEW.is_late := true;
      NEW.status := 'late';
    ELSE
      NEW.is_late := false;
      NEW.status := 'submitted';
    END IF;
  ELSE
    NEW.status := 'not_started';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_homework_subs_status
  BEFORE INSERT OR UPDATE ON public.homework_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_homework_submission_status();

-- ============== RLS ==============
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

-- Admins (school-scoped) + super admin
CREATE POLICY "Admins manage homework in their school"
ON public.homework FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));

-- Teachers manage their own homework
CREATE POLICY "Teachers manage their own homework"
ON public.homework FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM employees e WHERE e.id = homework.teacher_id AND e.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.id = homework.teacher_id AND e.user_id = auth.uid()));

-- Students/parents view published homework for their class
CREATE POLICY "Students and parents view published homework"
ON public.homework FOR SELECT TO authenticated
USING (
  status = 'published'
  AND EXISTS (SELECT 1 FROM students s WHERE s.class_id = homework.class_id AND s.user_id = auth.uid())
);

-- Submissions: admins
CREATE POLICY "Admins manage submissions in their school"
ON public.homework_submissions FOR ALL TO authenticated
USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())))
WITH CHECK (is_super_admin(auth.uid()) OR (has_role(auth.uid(),'admin'::app_role) AND school_id = get_user_school_id(auth.uid())));

-- Teachers: view + grade submissions on their own homework
CREATE POLICY "Teachers view submissions for own homework"
ON public.homework_submissions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM homework h JOIN employees e ON e.id = h.teacher_id
  WHERE h.id = homework_submissions.homework_id AND e.user_id = auth.uid()
));

CREATE POLICY "Teachers update submissions for own homework"
ON public.homework_submissions FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM homework h JOIN employees e ON e.id = h.teacher_id
  WHERE h.id = homework_submissions.homework_id AND e.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM homework h JOIN employees e ON e.id = h.teacher_id
  WHERE h.id = homework_submissions.homework_id AND e.user_id = auth.uid()
));

-- Students manage their own submissions (pre-grading)
CREATE POLICY "Students view own submissions"
ON public.homework_submissions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM students s WHERE s.id = homework_submissions.student_id AND s.user_id = auth.uid()));

CREATE POLICY "Students insert own submissions"
ON public.homework_submissions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM students s WHERE s.id = homework_submissions.student_id AND s.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM homework h WHERE h.id = homework_submissions.homework_id AND h.status = 'published')
);

CREATE POLICY "Students update own ungraded submissions"
ON public.homework_submissions FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM students s WHERE s.id = homework_submissions.student_id AND s.user_id = auth.uid())
  AND status <> 'graded'
)
WITH CHECK (
  EXISTS (SELECT 1 FROM students s WHERE s.id = homework_submissions.student_id AND s.user_id = auth.uid())
  AND marks_awarded IS NULL
);

-- ============== Storage policies (documents bucket) ==============
-- Teachers/admins upload+read homework attachments under: homework/<school_id>/...
CREATE POLICY "Staff manage homework attachments"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'homework'
  AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'teacher'::app_role))
)
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'homework'
  AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'teacher'::app_role))
);

-- Students/parents read homework attachments
CREATE POLICY "Students read homework attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'homework'
);

-- Students upload their own submission attachments to homework_submissions/<school_id>/<homework_id>/<user_id>/...
CREATE POLICY "Students upload own submission attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'homework_submissions'
  AND (storage.foldername(name))[4] = auth.uid()::text
);

CREATE POLICY "Students manage own submission attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'homework_submissions'
  AND (storage.foldername(name))[4] = auth.uid()::text
);

CREATE POLICY "Students delete own submission attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'homework_submissions'
  AND (storage.foldername(name))[4] = auth.uid()::text
);

CREATE POLICY "Staff read submission attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'homework_submissions'
  AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'teacher'::app_role))
);

CREATE POLICY "Students read own submission attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'homework_submissions'
  AND (storage.foldername(name))[4] = auth.uid()::text
);
