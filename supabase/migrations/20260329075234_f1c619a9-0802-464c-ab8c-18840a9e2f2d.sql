
-- Curriculum stages (Foundational, Preparatory, Middle, Secondary)
CREATE TABLE public.curriculum_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  classes text NOT NULL,
  icon text NOT NULL DEFAULT 'BookOpen',
  color text NOT NULL DEFAULT 'bg-primary/10 text-primary',
  sort_order integer NOT NULL DEFAULT 0,
  subjects jsonb NOT NULL DEFAULT '[]'::jsonb,
  learning_objectives text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Language policy combinations
CREATE TABLE public.curriculum_language_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combination text NOT NULL,
  first_language text NOT NULL,
  second_language text NOT NULL,
  third_language text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Pedagogical guidelines
CREATE TABLE public.curriculum_guidelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.curriculum_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_language_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_guidelines ENABLE ROW LEVEL SECURITY;

-- Admins can manage all curriculum tables
CREATE POLICY "Admins can manage curriculum stages" ON public.curriculum_stages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view curriculum stages" ON public.curriculum_stages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage language policy" ON public.curriculum_language_policy FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view language policy" ON public.curriculum_language_policy FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage guidelines" ON public.curriculum_guidelines FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view guidelines" ON public.curriculum_guidelines FOR SELECT TO authenticated USING (true);

-- Seed existing KCF 2007 data
INSERT INTO public.curriculum_stages (name, classes, icon, color, sort_order, subjects, learning_objectives) VALUES
('Foundational Stage', 'Class 1 – 3', 'BookOpen', 'bg-primary/10 text-primary', 1,
 '[{"category":"Languages","items":["First Language (Mother Tongue)","Second Language (English/Kannada)"]},{"category":"Mathematics","items":["Basic arithmetic and number sense"]},{"category":"EVS","items":["Integrated Science & Social Studies"]}]'::jsonb,
 ARRAY['Develop basic literacy and numeracy through play-based and activity-oriented methods','Build observation skills and curiosity about the natural and social environment','Encourage creative expression through art, craft, music and storytelling']),
('Preparatory Stage', 'Class 4 – 5', 'School', 'bg-accent/10 text-accent-foreground', 2,
 '[{"category":"Languages","items":["First Language","Second Language"]},{"category":"Mathematics","items":["Operations, fractions, measurements"]},{"category":"EVS","items":["Detailed study of surroundings & nature"]},{"category":"Others","items":["Physical Education"]}]'::jsonb,
 ARRAY['Strengthen reading comprehension and written expression in two languages','Develop problem-solving ability with arithmetic operations and measurement','Introduce systematic observation of surroundings, nature and community']),
('Middle / Higher Primary', 'Class 6 – 8', 'GraduationCap', 'bg-secondary/50 text-secondary-foreground', 3,
 '[{"category":"Languages","items":["First Language (Kannada/English/Urdu)","Second Language (English/Kannada)","Third Language (Hindi/Sanskrit)"]},{"category":"Core Subjects","items":["Mathematics – Algebra, Geometry, Data Handling","Science – Physics, Chemistry, Biology basics","Social Science – History, Civics, Geography"]},{"category":"Others","items":["Physical Education","Art Education","Value Education"]}]'::jsonb,
 ARRAY['Engage with abstract thinking through algebra, geometry, and data handling','Develop scientific temper: observation, intuition, hypothesizing and experimentation','Understand India''s constitutional values, history and geographical diversity','Acquire proficiency in the three-language formula']),
('Secondary (SSLC)', 'Class 9 – 10', 'Award', 'bg-destructive/10 text-destructive', 4,
 '[{"category":"Languages (3 papers)","items":["First Language – 100 marks","Second Language – 80 + 20 internal","Third Language – 80 + 20 internal"]},{"category":"Core Subjects (3 papers)","items":["Mathematics – AP, Triangles, Trigonometry","Science – Physics, Chemistry, Biology","Social Science – History, Pol. Science, Geography, Economics"]},{"category":"Vocational (NSQF)","items":["Information Technology","Retail","Automobile"]}]'::jsonb,
 ARRAY['Think and reason mathematically; visualize and work with abstractions','Relate science to life and understand technological applications','Develop critical perspectives on history, democracy, and economic systems','Prepare for board examinations with structured assessment patterns']);

INSERT INTO public.curriculum_language_policy (combination, first_language, second_language, third_language, sort_order) VALUES
('A', 'Kannada', 'English', 'Hindi / Sanskrit / Urdu / Tamil / Telugu / Marathi / Any modern Indian language', 1),
('B', 'English', 'Kannada', 'Hindi / Sanskrit / Urdu / Tamil / Telugu / Marathi / Any modern Indian language', 2),
('C', 'Urdu / Tamil / Telugu / Marathi / Any minority language', 'English', 'Kannada (compulsory as third language)', 3);

INSERT INTO public.curriculum_guidelines (title, description, sort_order) VALUES
('Child-Centred Pedagogy', 'Shift from rote memorization to constructive, discovery-based learning. The child constructs knowledge through interaction with the environment.', 1),
('Continuous & Comprehensive Evaluation (CCE)', 'Replace single-exam assessment with ongoing formative and summative evaluation covering scholastic and co-scholastic domains.', 2),
('Multilingualism as a Resource', 'Use the child''s home language as a bridge to learning. The three-language formula ensures linguistic diversity while promoting Kannada and English proficiency.', 3),
('Connecting Knowledge to Life', 'Curriculum must relate to the child''s lived experience. Local environment, culture, and occupations should be integrated into teaching materials.', 4),
('Inclusive Education', 'Address diverse needs including children with disabilities, first-generation learners, and marginalized communities. Ensure no child is excluded from quality education.', 5),
('Reducing Curricular Burden', 'Follow the ''Learning Without Burden'' principle. Focus on understanding over memorization, quality over quantity of content.', 6);
