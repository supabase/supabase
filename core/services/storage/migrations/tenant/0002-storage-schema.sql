
DO $$
BEGIN
    IF NOT EXISTS(SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        CREATE SCHEMA storage;
    END IF;
END$$;

DO $$
DECLARE
    install_roles text = COALESCE(current_setting('storage.install_roles', true), 'true');
    anon_role text = COALESCE(current_setting('storage.anon_role', true), 'anon');
    authenticated_role text = COALESCE(current_setting('storage.authenticated_role', true), 'authenticated');
    service_role text = COALESCE(current_setting('storage.service_role', true), 'service_role');
BEGIN
    IF install_roles != 'true' THEN
        RETURN;
    END IF;

  -- Install ROLES
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = anon_role) THEN
        EXECUTE 'CREATE ROLE ' || anon_role || ' NOLOGIN NOINHERIT';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = authenticated_role  ) THEN
        EXECUTE 'CREATE ROLE ' || authenticated_role || ' NOLOGIN NOINHERIT';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = service_role) THEN
        EXECUTE 'CREATE ROLE ' || service_role || ' NOLOGIN NOINHERIT bypassrls';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
        EXECUTE 'CREATE USER authenticator NOINHERIT';
    END IF;


  EXECUTE 'grant ' || anon_role || ' to authenticator';
  EXECUTE 'grant ' || authenticated_role || ' to authenticator';
  EXECUTE 'grant ' || service_role || ' to authenticator';
  grant postgres          to authenticator;

  EXECUTE 'grant usage on schema storage to postgres,' ||  anon_role || ',' || authenticated_role || ',' || service_role;

  EXECUTE 'alter default privileges in schema storage grant all on tables to postgres,' ||  anon_role || ',' || authenticated_role || ',' || service_role;
  EXECUTE 'alter default privileges in schema storage grant all on functions to postgres,' ||  anon_role || ',' || authenticated_role || ',' || service_role;
  EXECUTE 'alter default privileges in schema storage grant all on sequences to postgres,' ||  anon_role || ',' || authenticated_role || ',' || service_role;
END$$;


CREATE TABLE IF NOT EXISTS "storage"."migrations" (
  id integer PRIMARY KEY,
  name varchar(100) UNIQUE NOT NULL,
  hash varchar(40) NOT NULL, -- sha1 hex encoded hash of the file name and contents, to ensure it hasn't been altered since applying the migration
  executed_at timestamp DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS "storage"."buckets" (
    "id" text not NULL,
    "name" text NOT NULL,
    "owner" uuid,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "bname" ON "storage"."buckets" USING BTREE ("name");

CREATE TABLE IF NOT EXISTS "storage"."objects" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "bucket_id" text,
    "name" text,
    "owner" uuid,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "last_accessed_at" timestamptz DEFAULT now(),
    "metadata" jsonb,
    CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id"),
    PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "bucketid_objname" ON "storage"."objects" USING BTREE ("bucket_id","name");
CREATE INDEX IF NOT EXISTS name_prefix_search ON storage.objects(name text_pattern_ops);

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION storage.foldername(name text)
 RETURNS text[]
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$function$;

CREATE OR REPLACE FUNCTION storage.filename(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$function$;

CREATE OR REPLACE FUNCTION storage.extension(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$function$;

-- @todo can this query be optimised further?
CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits int DEFAULT 100, levels int DEFAULT 1, offsets int DEFAULT 0)
 RETURNS TABLE (
    name text,
    id uuid,
    updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    metadata jsonb
  )
 LANGUAGE plpgsql
AS $function$
BEGIN
	return query 
		with files_folders as (
			select ((string_to_array(objects.name, '/'))[levels]) as folder
			from objects
			where objects.name ilike prefix || '%'
			and bucket_id = bucketname
			GROUP by folder
			limit limits
			offset offsets
		) 
		select files_folders.folder as name, objects.id, objects.updated_at, objects.created_at, objects.last_accessed_at, objects.metadata from files_folders 
		left join objects
		on prefix || files_folders.folder = objects.name and objects.bucket_id=bucketname;
END
$function$;


DO $$
DECLARE
    install_roles text = COALESCE(current_setting('storage.install_roles', true), 'true');
    super_user text = COALESCE(current_setting('storage.super_user', true), 'supabase_storage_admin');
BEGIN
    IF install_roles != 'true' THEN
        RETURN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = super_user) THEN
        EXECUTE 'CREATE USER ' || super_user || ' NOINHERIT CREATEROLE LOGIN NOREPLICATION';
    END IF;

    -- Grant privileges to Super User
    EXECUTE 'GRANT ALL PRIVILEGES ON SCHEMA storage TO ' || super_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO ' || super_user;
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA storage TO ' || super_user;

    IF super_user != 'postgres' THEN
        EXECUTE 'ALTER USER ' || super_user || ' SET search_path = "storage"';
    END IF;

    EXECUTE 'ALTER table "storage".objects owner to ' || super_user;
    EXECUTE 'ALTER table "storage".buckets owner to ' || super_user;
    EXECUTE 'ALTER table "storage".migrations OWNER TO ' || super_user;
    EXECUTE 'ALTER function "storage".foldername(text) owner to ' || super_user;
    EXECUTE 'ALTER function "storage".filename(text) owner to ' || super_user;
    EXECUTE 'ALTER function "storage".extension(text) owner to ' || super_user;
    EXECUTE 'ALTER function "storage".search(text,text,int,int,int) owner to ' || super_user;
END$$;
