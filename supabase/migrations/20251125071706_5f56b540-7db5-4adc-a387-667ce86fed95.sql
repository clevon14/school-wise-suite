-- Fix function search paths for security
ALTER FUNCTION public.update_training_examples_updated_at() SET search_path = public;
ALTER FUNCTION public.anonymize_training_example(TEXT) SET search_path = public;