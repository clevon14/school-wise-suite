-- Add parent/guardian detailed fields to students table

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS father_phone TEXT,
ADD COLUMN IF NOT EXISTS father_occupation TEXT,
ADD COLUMN IF NOT EXISTS father_photo_url TEXT,
ADD COLUMN IF NOT EXISTS mother_name TEXT,
ADD COLUMN IF NOT EXISTS mother_phone TEXT,
ADD COLUMN IF NOT EXISTS mother_occupation TEXT,
ADD COLUMN IF NOT EXISTS mother_photo_url TEXT,
ADD COLUMN IF NOT EXISTS guardian_is TEXT CHECK (guardian_is IN ('father', 'mother', 'other')),
ADD COLUMN IF NOT EXISTS guardian_relation TEXT,
ADD COLUMN IF NOT EXISTS guardian_occupation TEXT,
ADD COLUMN IF NOT EXISTS guardian_photo_url TEXT,
ADD COLUMN IF NOT EXISTS guardian_address TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.students.father_name IS 'Father full name';
COMMENT ON COLUMN public.students.father_phone IS 'Father phone number';
COMMENT ON COLUMN public.students.father_occupation IS 'Father occupation';
COMMENT ON COLUMN public.students.father_photo_url IS 'Father photo URL';
COMMENT ON COLUMN public.students.mother_name IS 'Mother full name';
COMMENT ON COLUMN public.students.mother_phone IS 'Mother phone number';
COMMENT ON COLUMN public.students.mother_occupation IS 'Mother occupation';
COMMENT ON COLUMN public.students.mother_photo_url IS 'Mother photo URL';
COMMENT ON COLUMN public.students.guardian_is IS 'Primary guardian (father, mother, or other)';
COMMENT ON COLUMN public.students.guardian_relation IS 'Guardian relation to student if other';
COMMENT ON COLUMN public.students.guardian_occupation IS 'Guardian occupation';
COMMENT ON COLUMN public.students.guardian_photo_url IS 'Guardian photo URL';
COMMENT ON COLUMN public.students.guardian_address IS 'Guardian address';