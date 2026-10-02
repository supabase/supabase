-- postgres-migrations ignore
-- This trigger is used to create the hierarchy of prefixes
-- When writing directly in the prefixes table
CREATE OR REPLACE TRIGGER "prefixes_create_hierarchy"
    BEFORE INSERT ON "storage"."prefixes"
    FOR EACH ROW
    WHEN (pg_trigger_depth() < 1)
EXECUTE FUNCTION "storage"."prefixes_insert_trigger"();