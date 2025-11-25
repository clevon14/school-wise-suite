-- Update students status to include 'transferred' option
-- First, drop any existing check constraint on status
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'students_status_check'
    ) THEN
        ALTER TABLE public.students DROP CONSTRAINT students_status_check;
    END IF;
END $$;

-- Add a new check constraint that includes 'transferred'
ALTER TABLE public.students
ADD CONSTRAINT students_status_check 
CHECK (status IN ('active', 'inactive', 'transferred', 'graduated'));

-- Update the comment for the status column
COMMENT ON COLUMN public.students.status IS 'Student status: active, inactive, transferred, or graduated';