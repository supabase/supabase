-- postgres-migrations ignore
DROP TRIGGER IF EXISTS objects_delete_cleanup ON storage.objects;
DROP TRIGGER IF EXISTS prefixes_delete_cleanup ON storage.prefixes;
DROP TRIGGER IF EXISTS objects_update_cleanup ON storage.objects;
DROP TRIGGER IF EXISTS objects_update_level_trigger ON storage.objects;

CREATE OR REPLACE TRIGGER "objects_insert_create_prefix"
    BEFORE INSERT ON "storage"."objects"
    FOR EACH ROW
    EXECUTE FUNCTION "storage"."objects_insert_prefix_trigger"();

CREATE OR REPLACE TRIGGER "objects_update_create_prefix"
    BEFORE UPDATE ON "storage"."objects"
    FOR EACH ROW
    WHEN (NEW.name != OLD.name)
    EXECUTE FUNCTION "storage"."objects_insert_prefix_trigger"();

CREATE OR REPLACE TRIGGER "objects_delete_delete_prefix"
    AFTER DELETE ON "storage"."objects"
    FOR EACH ROW
    EXECUTE FUNCTION "storage"."delete_prefix_hierarchy_trigger"();

CREATE OR REPLACE TRIGGER "objects_update_create_prefix"
    BEFORE UPDATE ON "storage"."objects"
    FOR EACH ROW
    WHEN (NEW.name != OLD.name OR NEW.bucket_id != OLD.bucket_id)
    EXECUTE FUNCTION "storage"."objects_update_prefix_trigger"();

-- "storage"."prefixes"
CREATE OR REPLACE TRIGGER "prefixes_delete_hierarchy"
    AFTER DELETE ON "storage"."prefixes"
    FOR EACH ROW
EXECUTE FUNCTION "storage"."delete_prefix_hierarchy_trigger"();