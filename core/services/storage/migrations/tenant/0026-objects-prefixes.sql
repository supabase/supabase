-- postgres-migrations ignore
-- Add level column to objects
ALTER TABLE storage.objects ADD COLUMN IF NOT EXISTS level INT NULL;

--- Index Functions
CREATE OR REPLACE FUNCTION "storage"."get_level"("name" text)
    RETURNS int
AS $func$
SELECT array_length(string_to_array("name", '/'), 1);
$func$ LANGUAGE SQL IMMUTABLE STRICT;

-- Table
CREATE TABLE IF NOT EXISTS "storage"."prefixes" (
    "bucket_id" text,
    "name" text COLLATE "C" NOT NULL,
    "level" int GENERATED ALWAYS AS ("storage"."get_level"("name")) STORED,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id"),
    PRIMARY KEY ("bucket_id", "level", "name")
);

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

-- Functions
CREATE OR REPLACE FUNCTION "storage"."get_prefix"("name" text)
    RETURNS text
AS $func$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$func$ LANGUAGE SQL IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION "storage"."get_prefixes"("name" text)
    RETURNS text[]
AS $func$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$func$ LANGUAGE plpgsql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION "storage"."add_prefixes"(
    "_bucket_id" TEXT,
    "_name" TEXT
)
RETURNS void
SECURITY DEFINER
AS $func$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$func$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION "storage"."delete_prefix" (
    "_bucket_id" TEXT,
    "_name" TEXT
) RETURNS boolean
SECURITY DEFINER
AS $func$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$func$ LANGUAGE plpgsql VOLATILE;

-- Triggers
CREATE OR REPLACE FUNCTION "storage"."prefixes_insert_trigger"()
    RETURNS trigger
AS $func$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION "storage"."objects_insert_prefix_trigger"()
    RETURNS trigger
AS $func$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$func$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION "storage"."delete_prefix_hierarchy_trigger"()
    RETURNS trigger
AS $func$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$func$ LANGUAGE plpgsql VOLATILE;

-- "storage"."prefixes"
CREATE OR REPLACE TRIGGER "prefixes_delete_hierarchy"
    AFTER DELETE ON "storage"."prefixes"
    FOR EACH ROW
EXECUTE FUNCTION "storage"."delete_prefix_hierarchy_trigger"();

-- "storage"."objects"
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

-- Permissions
DO $$
    DECLARE
        anon_role text = COALESCE(current_setting('storage.anon_role', true), 'anon');
        authenticated_role text = COALESCE(current_setting('storage.authenticated_role', true), 'authenticated');
        service_role text = COALESCE(current_setting('storage.service_role', true), 'service_role');
    BEGIN
        EXECUTE 'GRANT ALL ON TABLE storage.prefixes TO ' || service_role || ',' || authenticated_role || ', ' || anon_role;
END$$;
