-- Insert your <PROJECT-REF> and <SUPABASE_SECRET_KEY> below, then uncomment the trigger creation and run `supabase db push`
-- Alternatively, head to the Database Webhook settings https://supabase.com/dashboard/project/_/database/hooks
-- Select "Create a new Hook" > Table "public.embeddings" > check "INSERT" & "Update" > Supabase Edge Functions > Add apiKey header with secret key

-- CREATE TRIGGER "on_inserted_or_updated_embedding"
-- AFTER INSERT
-- OR
-- UPDATE OF content ON public.embeddings FOR EACH ROW
-- EXECUTE FUNCTION supabase_functions.http_request (
--   'https://<PROJECT-REF>.supabase.co/functions/v1/generate-embedding',
--   'POST',
--   '{"Content-type":"application/json","apikey":"<SUPABASE_SECRET_KEY>"}',
--   '{}',
--   '5000'
-- );

-- ------------------------
-- FOR LOCAL TESTING ONLY. REMOVE OR COMMENT OUT WHEN PUSHING TO HOSTED PROJECT!

-- CREATE TRIGGER "on_inserted_or_updated_embedding"
-- AFTER INSERT
-- OR
-- UPDATE OF content ON public.embeddings FOR EACH ROW
-- EXECUTE FUNCTION supabase_functions.http_request (
--   'http://kong:8000/functions/v1/generate-embedding',
--   'POST',
--   '{"Content-type":"application/json","apikey":"<SUPABASE_SECRET_KEY>"}',
--   '{}',
--   '5000'
-- );
