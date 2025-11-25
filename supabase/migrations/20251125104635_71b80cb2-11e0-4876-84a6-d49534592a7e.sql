-- Add comprehensive teacher/employee fields to employees table

-- Basic Information additions
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS designation TEXT,
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS mother_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_number TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT,
ADD COLUMN IF NOT EXISTS permanent_address TEXT,
ADD COLUMN IF NOT EXISTS qualification TEXT,
ADD COLUMN IF NOT EXISTS work_experience TEXT,
ADD COLUMN IF NOT EXISTS note TEXT,
ADD COLUMN IF NOT EXISTS pan_number TEXT;

-- Payroll information
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS epf_number TEXT,
ADD COLUMN IF NOT EXISTS basic_salary NUMERIC,
ADD COLUMN IF NOT EXISTS contract_type TEXT,
ADD COLUMN IF NOT EXISTS work_shift TEXT,
ADD COLUMN IF NOT EXISTS work_location TEXT;

-- Leave allocations
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS medical_leave INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS casual_leave INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS maternity_leave INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sick_leave INTEGER DEFAULT 0;

-- Bank account details
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS bank_account_title TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
ADD COLUMN IF NOT EXISTS bank_branch_name TEXT;

-- Document URLs
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS joining_letter_url TEXT,
ADD COLUMN IF NOT EXISTS resignation_letter_url TEXT,
ADD COLUMN IF NOT EXISTS other_documents_url TEXT;