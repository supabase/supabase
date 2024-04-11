create function generate_embedding() returns trigger as $$
begin
    perform pg_notify('generate-embedding', to_json(NEW)::text);
    return null;
end;
$$ language plpgsql;

CREATE OR REPLACE TRIGGER "Generate embedding"
AFTER INSERT
OR
UPDATE OF content ON public.embeddings FOR EACH ROW
EXECUTE FUNCTION generate_embedding();
