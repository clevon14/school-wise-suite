-- Create promotion history table
CREATE TABLE public.promotion_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  from_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  to_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  action TEXT NOT NULL DEFAULT 'promote', -- 'promote' or 'retain'
  academic_year TEXT NOT NULL,
  promoted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.promotion_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage promotion history" 
ON public.promotion_history 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view promotion history" 
ON public.promotion_history 
FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role));

-- Create index for faster queries
CREATE INDEX idx_promotion_history_student ON public.promotion_history(student_id);
CREATE INDEX idx_promotion_history_created ON public.promotion_history(created_at DESC);