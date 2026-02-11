
-- Add more driver detail columns to buses table
ALTER TABLE public.buses
ADD COLUMN IF NOT EXISTS driver_license_number text,
ADD COLUMN IF NOT EXISTS driver_address text,
ADD COLUMN IF NOT EXISTS driver_date_of_birth date,
ADD COLUMN IF NOT EXISTS driver_aadhar text,
ADD COLUMN IF NOT EXISTS driver_salary numeric,
ADD COLUMN IF NOT EXISTS driver_bank_account text,
ADD COLUMN IF NOT EXISTS driver_ifsc text,
ADD COLUMN IF NOT EXISTS driver_bank_name text,
ADD COLUMN IF NOT EXISTS driver_bank_branch text,
ADD COLUMN IF NOT EXISTS conductor_license_number text,
ADD COLUMN IF NOT EXISTS conductor_address text,
ADD COLUMN IF NOT EXISTS conductor_date_of_birth date,
ADD COLUMN IF NOT EXISTS conductor_aadhar text,
ADD COLUMN IF NOT EXISTS conductor_salary numeric,
ADD COLUMN IF NOT EXISTS conductor_bank_account text,
ADD COLUMN IF NOT EXISTS conductor_ifsc text,
ADD COLUMN IF NOT EXISTS conductor_bank_name text,
ADD COLUMN IF NOT EXISTS conductor_bank_branch text;
