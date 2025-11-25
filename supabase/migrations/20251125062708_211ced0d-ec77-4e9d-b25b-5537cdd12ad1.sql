-- Create class_fee_structure table for class-wise tuition fees
CREATE TABLE IF NOT EXISTS public.class_fee_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  tuition_fee NUMERIC NOT NULL,
  lab_fee NUMERIC DEFAULT 0,
  library_fee NUMERIC DEFAULT 0,
  sports_fee NUMERIC DEFAULT 0,
  other_fees NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(class_id, academic_year)
);

-- Add village field to students for bus fee calculation
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS village TEXT;

-- Add village field to bus_routes for village-based fees
ALTER TABLE public.bus_routes ADD COLUMN IF NOT EXISTS village TEXT;

-- Enable RLS on class_fee_structure
ALTER TABLE public.class_fee_structure ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_fee_structure
CREATE POLICY "Admins can manage class fee structure"
ON public.class_fee_structure
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view class fee structure"
ON public.class_fee_structure
FOR SELECT
USING (true);

-- Function to automatically assign fees to a student
CREATE OR REPLACE FUNCTION public.auto_assign_student_fees()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academic_year TEXT;
  v_fee_structure RECORD;
  v_bus_route RECORD;
  v_tuition_category_id UUID;
  v_bus_category_id UUID;
BEGIN
  -- Get current academic year
  v_academic_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::TEXT;
  
  -- Only proceed if student has a class
  IF NEW.class_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get or create Tuition Fee category
  SELECT id INTO v_tuition_category_id
  FROM fee_categories
  WHERE name = 'Tuition Fee' AND frequency = 'monthly'
  LIMIT 1;
  
  IF v_tuition_category_id IS NULL THEN
    INSERT INTO fee_categories (name, description, amount, frequency, academic_year, is_mandatory)
    VALUES ('Tuition Fee', 'Monthly tuition fee', 0, 'monthly', v_academic_year, true)
    RETURNING id INTO v_tuition_category_id;
  END IF;
  
  -- Get class fee structure
  SELECT * INTO v_fee_structure
  FROM class_fee_structure
  WHERE class_id = NEW.class_id
    AND academic_year = v_academic_year
  LIMIT 1;
  
  -- Insert tuition fee assignment if fee structure exists
  IF v_fee_structure IS NOT NULL THEN
    -- Delete existing tuition fee for this student for current month
    DELETE FROM fee_assignments
    WHERE student_id = NEW.id
      AND fee_category_id = v_tuition_category_id
      AND due_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND due_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
    
    -- Insert new tuition fee
    INSERT INTO fee_assignments (student_id, fee_category_id, amount, due_date, status)
    VALUES (
      NEW.id,
      v_tuition_category_id,
      v_fee_structure.tuition_fee + 
      COALESCE(v_fee_structure.lab_fee, 0) + 
      COALESCE(v_fee_structure.library_fee, 0) + 
      COALESCE(v_fee_structure.sports_fee, 0) + 
      COALESCE(v_fee_structure.other_fees, 0),
      DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month',
      'pending'
    );
  END IF;
  
  -- Handle bus fee if student has village
  IF NEW.village IS NOT NULL AND NEW.village != '' THEN
    -- Get or create Bus Fee category
    SELECT id INTO v_bus_category_id
    FROM fee_categories
    WHERE name = 'Bus Fee' AND frequency = 'monthly'
    LIMIT 1;
    
    IF v_bus_category_id IS NULL THEN
      INSERT INTO fee_categories (name, description, amount, frequency, academic_year, is_mandatory)
      VALUES ('Bus Fee', 'Monthly bus transportation fee', 0, 'monthly', v_academic_year, false)
      RETURNING id INTO v_bus_category_id;
    END IF;
    
    -- Get bus route for student's village
    SELECT * INTO v_bus_route
    FROM bus_routes
    WHERE village = NEW.village
    LIMIT 1;
    
    -- Insert bus fee if route exists
    IF v_bus_route IS NOT NULL THEN
      -- Delete existing bus fee for this student for current month
      DELETE FROM fee_assignments
      WHERE student_id = NEW.id
        AND fee_category_id = v_bus_category_id
        AND due_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND due_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
      
      -- Insert new bus fee
      INSERT INTO fee_assignments (student_id, fee_category_id, amount, due_date, status)
      VALUES (
        NEW.id,
        v_bus_category_id,
        v_bus_route.monthly_fee,
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month',
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto fee assignment on student insert
DROP TRIGGER IF EXISTS trigger_auto_assign_fees_on_insert ON public.students;
CREATE TRIGGER trigger_auto_assign_fees_on_insert
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_student_fees();

-- Create trigger for auto fee assignment on student update (when class or village changes)
DROP TRIGGER IF EXISTS trigger_auto_assign_fees_on_update ON public.students;
CREATE TRIGGER trigger_auto_assign_fees_on_update
  AFTER UPDATE OF class_id, village ON public.students
  FOR EACH ROW
  WHEN (OLD.class_id IS DISTINCT FROM NEW.class_id OR OLD.village IS DISTINCT FROM NEW.village)
  EXECUTE FUNCTION public.auto_assign_student_fees();

-- Create trigger for updated_at on class_fee_structure
DROP TRIGGER IF EXISTS update_class_fee_structure_updated_at ON public.class_fee_structure;
CREATE TRIGGER update_class_fee_structure_updated_at
  BEFORE UPDATE ON public.class_fee_structure
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for monthly fee summary per student
CREATE OR REPLACE VIEW public.student_monthly_fee_summary AS
SELECT 
  s.id as student_id,
  s.first_name,
  s.last_name,
  s.admission_number,
  c.name as class_name,
  c.section,
  s.village,
  COALESCE(SUM(fa.amount), 0) as total_monthly_fee,
  COALESCE(SUM(CASE WHEN fa.status = 'paid' THEN fa.amount ELSE 0 END), 0) as paid_amount,
  COALESCE(SUM(CASE WHEN fa.status != 'paid' THEN fa.amount ELSE 0 END), 0) as pending_amount,
  COUNT(fa.id) as total_fee_items,
  COUNT(CASE WHEN fa.status = 'paid' THEN 1 END) as paid_items
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN fee_assignments fa ON s.id = fa.student_id 
  AND fa.due_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND fa.due_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
WHERE s.status = 'active'
GROUP BY s.id, s.first_name, s.last_name, s.admission_number, c.name, c.section, s.village;

-- Create view for class-wise fee totals
CREATE OR REPLACE VIEW public.class_monthly_fee_summary AS
SELECT 
  c.id as class_id,
  c.name as class_name,
  c.section,
  COUNT(DISTINCT s.id) as total_students,
  COALESCE(SUM(fa.amount), 0) as total_monthly_fees,
  COALESCE(SUM(CASE WHEN fa.status = 'paid' THEN fa.amount ELSE 0 END), 0) as collected_amount,
  COALESCE(SUM(CASE WHEN fa.status != 'paid' THEN fa.amount ELSE 0 END), 0) as pending_amount,
  ROUND(COALESCE(SUM(CASE WHEN fa.status = 'paid' THEN fa.amount ELSE 0 END), 0) * 100.0 / 
    NULLIF(SUM(fa.amount), 0), 2) as collection_percentage
FROM classes c
LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
LEFT JOIN fee_assignments fa ON s.id = fa.student_id
  AND fa.due_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND fa.due_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY c.id, c.name, c.section
ORDER BY c.name, c.section;