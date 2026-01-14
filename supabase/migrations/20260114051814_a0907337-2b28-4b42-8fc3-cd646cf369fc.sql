-- Add admin role for the existing user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('c0b3450c-fd9b-4919-a47e-f7e133f2b1d1', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;