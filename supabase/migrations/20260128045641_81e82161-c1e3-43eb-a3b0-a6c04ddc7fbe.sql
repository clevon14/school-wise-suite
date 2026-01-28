-- Fix: Change match_documents from SECURITY DEFINER to SECURITY INVOKER
-- This ensures RLS policies on the documents table are applied during vector search

CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector, 
  match_threshold double precision DEFAULT 0.7, 
  match_count integer DEFAULT 5
)
RETURNS TABLE(
  id uuid, 
  title text, 
  content text, 
  document_type text, 
  class_id uuid, 
  subject_id uuid, 
  metadata jsonb, 
  similarity double precision
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.title,
    documents.content,
    documents.document_type,
    documents.class_id,
    documents.subject_id,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;