-- Add missing columns to students table for comprehensive student admission form

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS roll_number TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS religion TEXT,
ADD COLUMN IF NOT EXISTS caste TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS house TEXT,
ADD COLUMN IF NOT EXISTS height TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS measurement_date DATE,
ADD COLUMN IF NOT EXISTS medical_history TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.students.roll_number IS 'Student roll number';
COMMENT ON COLUMN public.students.category IS 'Student category (General, OBC, SC, ST, etc.)';
COMMENT ON COLUMN public.students.religion IS 'Student religion';
COMMENT ON COLUMN public.students.caste IS 'Student caste';
COMMENT ON COLUMN public.students.blood_group IS 'Student blood group';
COMMENT ON COLUMN public.students.house IS 'Student house for school activities';
COMMENT ON COLUMN public.students.height IS 'Student height';
COMMENT ON COLUMN public.students.weight IS 'Student weight';
COMMENT ON COLUMN public.students.measurement_date IS 'Date when height/weight was measured';
COMMENT ON COLUMN public.students.medical_history IS 'Student medical history details';