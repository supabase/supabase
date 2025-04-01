

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";

CREATE EXTENSION IF NOT EXISTS "pgsodium";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE OR REPLACE FUNCTION "public"."insert_random_logging_data"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    random_message text;
    random_level text;
BEGIN
    -- Generate a random message
    random_message := 'Random message ' || floor(random() * 1000)::text;
    
    -- Generate a random log level (for example: INFO, WARNING, ERROR)
    random_level := CASE floor(random() * 3)
        WHEN 0 THEN 'INFO'
        WHEN 1 THEN 'WARNING'
        ELSE 'ERROR'
    END;

    -- Insert the new record into logging_data
    INSERT INTO public.logging_data (log_message, log_level, created_at)
    VALUES (random_message, random_level, NOW());
END;
$$;

ALTER FUNCTION "public"."insert_random_logging_data"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."logging_data_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM realtime.broadcast_changes(
        'logs',   -- topic
        TG_OP,                       -- event
        TG_OP,                       -- operation
        TG_TABLE_NAME,               -- table
        TG_TABLE_SCHEMA,             -- schema
        NEW,                         -- new record
        OLD                          -- old record
    );
    RETURN NULL;
END;
$$;

ALTER FUNCTION "public"."logging_data_changes"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."todos_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM realtime.broadcast_changes(
	    'todos:' || COALESCE(NEW.channel, OLD.channel)::text,   -- topic
		   TG_OP,                          -- event
		   TG_OP,                          -- operation
		   TG_TABLE_NAME,                  -- table
		   TG_TABLE_SCHEMA,                -- schema
		   NEW,                            -- new record
		   OLD                             -- old record
		);
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."todos_changes"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."logging_data" (
    "id" bigint NOT NULL,
    "log_message" "text" NOT NULL,
    "log_level" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."logging_data" OWNER TO "postgres";

ALTER TABLE "public"."logging_data" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."logging_data_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."todos" (
    "id" bigint NOT NULL,
    "created_by" "uuid",
    "completed" boolean DEFAULT false NOT NULL,
    "text" "text" NOT NULL,
    "channel" "text" NOT NULL
);

ALTER TABLE "public"."todos" OWNER TO "postgres";

ALTER TABLE "public"."todos" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."todos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY "public"."logging_data"
    ADD CONSTRAINT "logging_data_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_pkey" PRIMARY KEY ("id");

CREATE INDEX "idx_created_by" ON "public"."todos" USING "btree" ("created_by");

CREATE OR REPLACE TRIGGER "broadcast_changes_for_logging_data_trigger" AFTER INSERT ON "public"."logging_data" FOR EACH ROW EXECUTE FUNCTION "public"."logging_data_changes"();

CREATE OR REPLACE TRIGGER "broadcast_changes_for_todos_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."todos" FOR EACH ROW EXECUTE FUNCTION "public"."todos_changes"();

ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE POLICY "Allow delete todos by channel" ON "public"."todos" FOR DELETE TO "authenticated" USING (("channel" = ( SELECT (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'instanceId'::"text"))));

CREATE POLICY "Allow insert todos by channel" ON "public"."todos" FOR INSERT TO "authenticated" WITH CHECK (("channel" = ( SELECT (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'instanceId'::"text"))));

CREATE POLICY "Allow read access for all users" ON "public"."logging_data" FOR SELECT TO "authenticated", "anon" USING (true);

CREATE POLICY "Allow select todos by channel" ON "public"."todos" FOR SELECT TO "authenticated" USING (("channel" = ( SELECT (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'instanceId'::"text"))));

CREATE POLICY "Allow update todos by channel" ON "public"."todos" FOR UPDATE TO "authenticated" USING (("channel" = ( SELECT (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'instanceId'::"text")))) WITH CHECK (("channel" = ( SELECT (("auth"."jwt"() -> 'user_metadata'::"text") ->> 'instanceId'::"text"))));

ALTER TABLE "public"."logging_data" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."todos" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."insert_random_logging_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_random_logging_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_random_logging_data"() TO "service_role";

GRANT ALL ON FUNCTION "public"."logging_data_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."logging_data_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."logging_data_changes"() TO "service_role";

GRANT ALL ON FUNCTION "public"."todos_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."todos_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."todos_changes"() TO "service_role";

GRANT ALL ON TABLE "public"."logging_data" TO "anon";
GRANT ALL ON TABLE "public"."logging_data" TO "authenticated";
GRANT ALL ON TABLE "public"."logging_data" TO "service_role";

GRANT ALL ON SEQUENCE "public"."logging_data_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."logging_data_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."logging_data_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."todos" TO "anon";
GRANT ALL ON TABLE "public"."todos" TO "authenticated";
GRANT ALL ON TABLE "public"."todos" TO "service_role";

GRANT ALL ON SEQUENCE "public"."todos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."todos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."todos_id_seq" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";