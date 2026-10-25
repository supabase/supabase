CREATE TABLE "public"."page_nimbus" (
  "id"           bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "path"         text                     NOT NULL,
  "checksum"     text,
  "meta"         jsonb,
  "type"         text,
  "source"       text,
  "content"      text,
  "version"      uuid,
  "last_refresh" timestamp with time zone,
  CONSTRAINT "page_nimbus_path_key" UNIQUE (path),
  CONSTRAINT "page_nimbus_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."page_nimbus"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."page_nimbus"
  ADD COLUMN "fts_tokens" tsvector GENERATED ALWAYS AS (to_tsvector('english'::regconfig, content)) STORED;

ALTER TABLE "public"."page_nimbus"
  ADD COLUMN "title_tokens" tsvector GENERATED ALWAYS AS (to_tsvector('english'::regconfig, COALESCE((meta ->> 'title'::text), ''::text))) STORED;

CREATE INDEX fts_search_index_content_nimbus ON public.page_nimbus USING gin (fts_tokens);

CREATE INDEX fts_search_index_title_nimbus ON public.page_nimbus USING gin (title_tokens);

CREATE POLICY "anon can read page_nimbus" ON "public"."page_nimbus"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "authenticated can read page_nimbus" ON "public"."page_nimbus"
  FOR SELECT
  TO "authenticated"
  USING (true);

REVOKE ALL ON SEQUENCE "public"."page_nimbus_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."page_nimbus_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."page_nimbus_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."page_nimbus_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."page_nimbus_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."page_nimbus_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."page_nimbus_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."page_nimbus_id_seq" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."page_nimbus" TO "anon", "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."page_nimbus" TO "service_role";

REVOKE ALL ON TABLE "public"."page_nimbus" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."page_nimbus" TO "postgres";
