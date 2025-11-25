-- Create tests table
CREATE TABLE public.tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  max_marks INTEGER NOT NULL,
  pass_marks INTEGER NOT NULL,
  academic_year TEXT NOT NULL,
  created_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create test_results table
CREATE TABLE public.test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  marks_obtained NUMERIC,
  is_absent BOOLEAN DEFAULT false,
  remarks TEXT,
  entered_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(test_id, student_id)
);

-- Create indexes
CREATE INDEX idx_tests_class_subject ON public.tests(class_id, subject_id);
CREATE INDEX idx_tests_date ON public.tests(test_date);
CREATE INDEX idx_test_results_test ON public.test_results(test_id);
CREATE INDEX idx_test_results_student ON public.test_results(student_id);

-- Enable RLS
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tests
CREATE POLICY "Admins can manage tests"
  ON public.tests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can manage tests for their subjects"
  ON public.tests FOR ALL
  USING (
    has_role(auth.uid(), 'teacher'::app_role) AND
    EXISTS (
      SELECT 1 FROM employees e
      JOIN class_subjects cs ON cs.teacher_id = e.id
      WHERE e.user_id = auth.uid()
        AND cs.class_id = tests.class_id
        AND cs.subject_id = tests.subject_id
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'teacher'::app_role) AND
    EXISTS (
      SELECT 1 FROM employees e
      JOIN class_subjects cs ON cs.teacher_id = e.id
      WHERE e.user_id = auth.uid()
        AND cs.class_id = tests.class_id
        AND cs.subject_id = tests.subject_id
    )
  );

CREATE POLICY "Students can view their test results"
  ON public.tests FOR SELECT
  USING (
    has_role(auth.uid(), 'student'::app_role) AND
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.user_id = auth.uid() AND s.class_id = tests.class_id
    )
  );

-- RLS Policies for test_results
CREATE POLICY "Admins can manage test results"
  ON public.test_results FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can manage results for their tests"
  ON public.test_results FOR ALL
  USING (
    has_role(auth.uid(), 'teacher'::app_role) AND
    EXISTS (
      SELECT 1 FROM tests t
      JOIN employees e ON e.user_id = auth.uid()
      JOIN class_subjects cs ON cs.teacher_id = e.id
      WHERE t.id = test_results.test_id
        AND cs.class_id = t.class_id
        AND cs.subject_id = t.subject_id
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'teacher'::app_role) AND
    EXISTS (
      SELECT 1 FROM tests t
      JOIN employees e ON e.user_id = auth.uid()
      JOIN class_subjects cs ON cs.teacher_id = e.id
      WHERE t.id = test_results.test_id
        AND cs.class_id = t.class_id
        AND cs.subject_id = t.subject_id
    )
  );

CREATE POLICY "Students can view their own results"
  ON public.test_results FOR SELECT
  USING (
    has_role(auth.uid(), 'student'::app_role) AND
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.user_id = auth.uid() AND s.id = test_results.student_id
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_test_results_updated_at
  BEFORE UPDATE ON public.test_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for test statistics
CREATE OR REPLACE VIEW public.test_statistics AS
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