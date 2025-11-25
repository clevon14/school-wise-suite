-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true);

-- Add photo_url column to students table
ALTER TABLE public.students
ADD COLUMN photo_url text;

-- Add photo_url column to employees table
ALTER TABLE public.employees
ADD COLUMN photo_url text;

-- Storage policies for photos bucket
CREATE POLICY "Public can view photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "Admins can upload photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'photos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'photos' AND
  has_role(auth.uid(), 'admin'::app_role)
);