-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table for RAG (teacher notes, interventions, syllabus)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'note', 'intervention', 'syllabus', 'lesson_plan'
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX documents_embedding_idx ON public.documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Admins can manage all documents
CREATE POLICY "Admins can manage documents"
ON public.documents
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Teachers can manage documents they created
CREATE POLICY "Teachers can manage their documents"
ON public.documents
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND 
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.user_id = auth.uid() AND e.id = documents.created_by
  )
)
WITH CHECK (
  has_role(auth.uid(), 'teacher'::app_role) AND 
  EXISTS (
    SELECT 1 FROM employees e 
    WHERE e.user_id = auth.uid() AND e.id = documents.created_by
  )
);

-- Teachers can view documents for their classes
CREATE POLICY "Teachers can view class documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  EXISTS (
    SELECT 1 FROM employees e
    JOIN class_subjects cs ON cs.teacher_id = e.id
    WHERE e.user_id = auth.uid() AND cs.class_id = documents.class_id
  )
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on documents
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data: 3 classes
INSERT INTO public.classes (name, section, academic_year) VALUES
  ('Class 1', 'A', '2025-2026'),
  ('Class 2', 'B', '2025-2026'),
  ('Class 3', 'A', '2025-2026');

-- Seed data: 6 teachers (employees)
INSERT INTO public.employees (employee_number, first_name, last_name, email, role, department, hire_date) VALUES
  ('TCH001', 'John', 'Smith', 'john.smith@school.edu', 'teacher', 'Mathematics', CURRENT_DATE),
  ('TCH002', 'Sarah', 'Johnson', 'sarah.j@school.edu', 'teacher', 'Science', CURRENT_DATE),
  ('TCH003', 'Michael', 'Brown', 'michael.b@school.edu', 'teacher', 'English', CURRENT_DATE),
  ('TCH004', 'Emily', 'Davis', 'emily.d@school.edu', 'teacher', 'Social Studies', CURRENT_DATE),
  ('TCH005', 'David', 'Wilson', 'david.w@school.edu', 'teacher', 'Physical Education', CURRENT_DATE),
  ('TCH006', 'Lisa', 'Anderson', 'lisa.a@school.edu', 'teacher', 'Arts', CURRENT_DATE);

-- Seed data: 30 students (10 per class)
DO $$
DECLARE
  class_ids UUID[];
  class_id UUID;
  i INT;
BEGIN
  SELECT ARRAY_AGG(id) INTO class_ids FROM public.classes LIMIT 3;
  
  FOR i IN 1..30 LOOP
    class_id := class_ids[((i-1) / 10) + 1];
    
    INSERT INTO public.students (
      admission_number, 
      first_name, 
      last_name, 
      class_id,
      date_of_birth,
      gender,
      parent_name,
      parent_phone,
      parent_email,
      village
    ) VALUES (
      'STU' || LPAD(i::TEXT, 4, '0'),
      'Student' || i,
      'Last' || i,
      class_id,
      CURRENT_DATE - INTERVAL '8 years',
      CASE WHEN i % 2 = 0 THEN 'Male' ELSE 'Female' END,
      'Parent' || i,
      '+91' || (9000000000 + i)::TEXT,
      'parent' || i || '@email.com',
      CASE WHEN i % 3 = 0 THEN 'Village A' WHEN i % 3 = 1 THEN 'Village B' ELSE 'Village C' END
    );
  END LOOP;
END $$;

-- Seed data: 5 tests across classes
DO $$
DECLARE
  class_ids UUID[];
  subject_ids UUID[];
  teacher_id UUID;
BEGIN
  SELECT ARRAY_AGG(id) INTO class_ids FROM public.classes LIMIT 3;
  SELECT id INTO teacher_id FROM public.employees LIMIT 1;
  
  -- Create subjects first if they don't exist
  INSERT INTO public.subjects (name, code, description) VALUES
    ('Mathematics', 'MATH', 'Mathematics subject'),
    ('Science', 'SCI', 'Science subject'),
    ('English', 'ENG', 'English subject')
  ON CONFLICT DO NOTHING;
  
  SELECT ARRAY_AGG(id) INTO subject_ids FROM public.subjects LIMIT 3;
  
  -- Create 5 tests
  FOR i IN 1..5 LOOP
    INSERT INTO public.tests (
      name,
      class_id,
      subject_id,
      test_date,
      max_marks,
      pass_marks,
      academic_year,
      created_by
    ) VALUES (
      'Test ' || i,
      class_ids[((i-1) % 3) + 1],
      subject_ids[((i-1) % 3) + 1],
      CURRENT_DATE + (i || ' days')::INTERVAL,
      100,
      40,
      '2025-2026',
      teacher_id
    );
  END LOOP;
END $$;

-- Seed data: Sample fee assignments
DO $$
DECLARE
  student_ids UUID[];
  tuition_category_id UUID;
  bus_category_id UUID;
BEGIN
  SELECT ARRAY_AGG(id) INTO student_ids FROM public.students;
  
  -- Get or create fee categories
  SELECT id INTO tuition_category_id 
  FROM fee_categories 
  WHERE name = 'Tuition Fee' AND frequency = 'monthly' 
  LIMIT 1;
  
  IF tuition_category_id IS NULL THEN
    INSERT INTO fee_categories (name, amount, frequency, academic_year, description)
    VALUES ('Tuition Fee', 5000, 'monthly', '2025-2026', 'Monthly tuition fee')
    RETURNING id INTO tuition_category_id;
  END IF;
  
  SELECT id INTO bus_category_id 
  FROM fee_categories 
  WHERE name = 'Bus Fee' AND frequency = 'monthly' 
  LIMIT 1;
  
  IF bus_category_id IS NULL THEN
    INSERT INTO fee_categories (name, amount, frequency, academic_year, description)
    VALUES ('Bus Fee', 1500, 'monthly', '2025-2026', 'Monthly bus fee')
    RETURNING id INTO bus_category_id;
  END IF;
  
  -- Assign tuition fees to all students
  INSERT INTO fee_assignments (student_id, fee_category_id, amount, due_date, status)
  SELECT 
    id,
    tuition_category_id,
    5000,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month',
    'pending'
  FROM public.students;
  
  -- Assign bus fees to students with villages
  INSERT INTO fee_assignments (student_id, fee_category_id, amount, due_date, status)
  SELECT 
    id,
    bus_category_id,
    1500,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month',
    'pending'
  FROM public.students
  WHERE village IS NOT NULL;
END $$;