-- Create training examples table for fine-tuning dataset builder
CREATE TABLE IF NOT EXISTS public.training_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.employees(id),
  prompt TEXT NOT NULL,
  completion TEXT NOT NULL,
  category TEXT, -- e.g., 'student_summary', 'class_overview', 'intervention'
  is_anonymized BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'exported'))
);

-- Create fine_tuning_config table for model settings
CREATE TABLE IF NOT EXISTS public.fine_tuning_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  use_fine_tuned_model BOOLEAN DEFAULT false,
  fine_tuned_model_id TEXT, -- e.g., 'ft:gpt-3.5-turbo:...'
  base_model TEXT DEFAULT 'google/gemini-2.5-flash',
  temperature NUMERIC DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 500,
  notes TEXT
);

-- Insert default config
INSERT INTO public.fine_tuning_config (use_fine_tuned_model, base_model)
VALUES (false, 'google/gemini-2.5-flash')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.training_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fine_tuning_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for training_examples
CREATE POLICY "Admins can manage training examples"
  ON public.training_examples
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS policies for fine_tuning_config
CREATE POLICY "Admins can view config"
  ON public.fine_tuning_config
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update config"
  ON public.fine_tuning_config
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_training_examples_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_examples_updated_at
  BEFORE UPDATE ON public.training_examples
  FOR EACH ROW
  EXECUTE FUNCTION public.update_training_examples_updated_at();

-- Function to anonymize training data
CREATE OR REPLACE FUNCTION public.anonymize_training_example(example_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
  student_rec RECORD;
  counter INTEGER := 1;
BEGIN
  result := example_text;
  
  -- Replace student names with ANON_STUDENT_X
  FOR student_rec IN 
    SELECT DISTINCT first_name || ' ' || last_name as full_name
    FROM public.students
    ORDER BY full_name
  LOOP
    result := REGEXP_REPLACE(result, student_rec.full_name, 'ANON_STUDENT_' || counter, 'gi');
    counter := counter + 1;
  END LOOP;
  
  -- Replace admission numbers
  result := REGEXP_REPLACE(result, '\b\d{4,6}\b', 'ANON_ID', 'g');
  
  -- Replace phone numbers
  result := REGEXP_REPLACE(result, '\b\d{10}\b', 'ANON_PHONE', 'g');
  
  -- Replace email addresses
  result := REGEXP_REPLACE(result, '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 'ANON_EMAIL', 'gi');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;