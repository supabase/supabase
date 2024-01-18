BEGIN;
  -- Create pg_net extension
  CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
  -- Create supabase_functions schema
  CREATE SCHEMA supabase_functions AUTHORIZATION supabase_admin;
  GRANT USAGE ON SCHEMA supabase_functions TO postgres, anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA supabase_functions GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA supabase_functions GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA supabase_functions GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
  -- supabase_functions.migrations definition
  CREATE TABLE supabase_functions.migrations (
    version text PRIMARY KEY,
    inserted_at timestamptz NOT NULL DEFAULT NOW()
  );
  -- Initial supabase_functions migration
  INSERT INTO supabase_functions.migrations (version) VALUES ('initial');
  -- supabase_functions.hooks definition
  CREATE TABLE supabase_functions.hooks (
    id bigserial PRIMARY KEY,
    hook_table_id integer NOT NULL,
    hook_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    request_id bigint
  );
  CREATE INDEX supabase_functions_hooks_request_id_idx ON supabase_functions.hooks USING btree (request_id);
  CREATE INDEX supabase_functions_hooks_h_table_id_h_name_idx ON supabase_functions.hooks USING btree (hook_table_id, hook_name);
  COMMENT ON TABLE supabase_functions.hooks IS 'Supabase Functions Hooks: Audit trail for triggered hooks.';
  CREATE OR REPLACE FUNCTION supabase_functions.http_request()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'supabase_functions','net'
    AS $function$
        DECLARE
          local_request_id bigint;
          payload jsonb;
          url text := TG_ARGV[0]::text;
          method text := TG_ARGV[1]::text;
          headers jsonb DEFAULT '{}'::jsonb;
          params jsonb DEFAULT '{}'::jsonb;
          timeout_ms integer DEFAULT 1000;
          retry_count integer DEFAULT 0;
          max_retries integer := COALESCE(TG_ARGV[5]::integer, 0);
          succeeded boolean := FALSE;
          retry_delays double precision[] := ARRAY[0, 0.250, 0.500, 1.000, 2.500, 5.000];
          status_code integer :=0;
        BEGIN
          IF url IS NULL OR url = 'null' THEN
            RAISE EXCEPTION 'url argument is missing';
          END IF;

          IF method IS NULL OR method = 'null' THEN
            RAISE EXCEPTION 'method argument is missing';
          END IF;

          IF TG_ARGV[2] IS NULL OR TG_ARGV[2] = 'null' THEN
            headers = '{"Content-Type": "application/json"}'::jsonb;
          ELSE
            headers = TG_ARGV[2]::jsonb;
          END IF;

          IF TG_ARGV[3] IS NULL OR TG_ARGV[3] = 'null' THEN
            params = '{}'::jsonb;
          ELSE
            params = TG_ARGV[3]::jsonb;
          END IF;

          IF TG_ARGV[4] IS NULL OR TG_ARGV[4] = 'null' THEN
            timeout_ms = 3000; -- 3 seconds
          ELSE
            timeout_ms = TG_ARGV[4]::integer;
          END IF;

          -- Retry loop
          WHILE NOT succeeded AND retry_count <= max_retries LOOP
            PERFORM pg_sleep(retry_delays[retry_count+1]);
            IF retry_delays[retry_count+1]>0 THEN
               RAISE WARNING 'Retrying HTTP request: {retry_attempt: %, url: "%", timeout_ms: %, retry_delay_ms: %}',
                 retry_count, url,timeout_ms,retry_delays[retry_count+1]*1000;
            END IF;
            retry_count := retry_count + 1;
            BEGIN
              CASE
                WHEN method = 'GET' THEN
                  SELECT http_get INTO local_request_id FROM net.http_get(
                    url,
                    params,
                    headers,
                    timeout_ms
                  );
                WHEN method = 'POST' THEN
                  payload = jsonb_build_object(
                    'old_record', OLD,
                    'record', NEW,
                    'type', TG_OP,
                    'table', TG_TABLE_NAME,
                    'schema', TG_TABLE_SCHEMA
                  );

                  SELECT http_post INTO local_request_id FROM net.http_post(
                    url,
                    payload,
                    params,
                    headers,
                    timeout_ms
                  );
                ELSE
                  RAISE EXCEPTION 'method argument % is invalid', method;
              END CASE;

              IF local_request_id IS NOT NULL THEN
                SELECT (response).status_code::integer
                  INTO status_code
                  FROM net._http_collect_response(local_request_id);
                IF status_code < 400 THEN
                  succeeded := TRUE;
                END IF;
              END IF;
              -- Exit loop on successful request
              EXIT WHEN succeeded;
            EXCEPTION
              WHEN OTHERS THEN
                IF retry_count > max_retries THEN
                  -- If retries exhausted, re-raise exception
                  RAISE EXCEPTION 'HTTP request failed after % retries. SQL Error: { %, % }',
                    max_retries, SQLERRM, SQLSTATE;
                END IF;
            END;
          END LOOP;
          INSERT INTO supabase_functions.hooks
            (hook_table_id, hook_name, request_id)
          VALUES
            (TG_RELID, TG_NAME, local_request_id);
          RETURN NEW;
        END
    $function$;
  -- Supabase super admin
  DO
  $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;
  END
  $$;
  GRANT ALL PRIVILEGES ON SCHEMA supabase_functions TO supabase_functions_admin;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA supabase_functions TO supabase_functions_admin;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA supabase_functions TO supabase_functions_admin;
  ALTER USER supabase_functions_admin SET search_path = "supabase_functions";
  ALTER table "supabase_functions".migrations OWNER TO supabase_functions_admin;
  ALTER table "supabase_functions".hooks OWNER TO supabase_functions_admin;
  ALTER function "supabase_functions".http_request() OWNER TO supabase_functions_admin;
  GRANT supabase_functions_admin TO postgres;
  -- Remove unused supabase_pg_net_admin role
  DO
  $$
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_pg_net_admin'
    )
    THEN
      REASSIGN OWNED BY supabase_pg_net_admin TO supabase_admin;
      DROP OWNED BY supabase_pg_net_admin;
      DROP ROLE supabase_pg_net_admin;
    END IF;
  END
  $$;
  -- pg_net grants when extension is already enabled
  DO
  $$
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM pg_extension
      WHERE extname = 'pg_net'
    )
    THEN
      GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END
  $$;
  -- Event trigger for pg_net
  CREATE OR REPLACE FUNCTION extensions.grant_pg_net_access()
  RETURNS event_trigger
  LANGUAGE plpgsql
  AS $$
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM pg_event_trigger_ddl_commands() AS ev
      JOIN pg_extension AS ext
      ON ev.objid = ext.oid
      WHERE ext.extname = 'pg_net'
    )
    THEN
      GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END;
  $$;
  COMMENT ON FUNCTION extensions.grant_pg_net_access IS 'Grants access to pg_net';
  DO
  $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_event_trigger
      WHERE evtname = 'issue_pg_net_access'
    ) THEN
      CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end WHEN TAG IN ('CREATE EXTENSION')
      EXECUTE PROCEDURE extensions.grant_pg_net_access();
    END IF;
  END
  $$;
  INSERT INTO supabase_functions.migrations (version) VALUES ('20210809183423_update_grants');
  ALTER function supabase_functions.http_request() SECURITY DEFINER;
  ALTER function supabase_functions.http_request() SET search_path = supabase_functions;
  REVOKE ALL ON FUNCTION supabase_functions.http_request() FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION supabase_functions.http_request() TO postgres, anon, authenticated, service_role;
  INSERT INTO supabase_functions.migrations (version) VALUES ('20240115163000_add_retry_to_http_request');

COMMIT;
