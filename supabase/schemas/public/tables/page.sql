CREATE TABLE "public"."page" (
  "id"           bigint                   NOT NULL DEFAULT nextval('public.page_id_seq'::regclass),
  "path"         text                     NOT NULL,
  "checksum"     text,
  "meta"         jsonb,
  "type"         text,
  "source"       text,
  "version"      uuid,
  "last_refresh" timestamp with time zone,
  "content"      text,
  CONSTRAINT "page_path_key" UNIQUE (path),
  CONSTRAINT "page_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."page"
  ENABLE ROW LEVEL SECURITY;

ALTER SEQUENCE "public"."page_id_seq" OWNED BY "public"."page"."id";

ALTER TABLE "public"."page"
  ADD COLUMN "fts_tokens" tsvector GENERATED ALWAYS AS (to_tsvector('english'::regconfig, content)) STORED;

ALTER TABLE "public"."page"
  ADD COLUMN "title_tokens" tsvector GENERATED ALWAYS AS (to_tsvector('english'::regconfig, COALESCE((meta ->> 'title'::text), ''::text))) STORED;

CREATE INDEX fts_search_index_page ON public.page USING gin (fts_tokens);

CREATE INDEX fts_search_index_title ON public.page USING gin (title_tokens);

CREATE POLICY "Enable read access for anon and authenticated" ON "public"."page"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."page" TO "anon", "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."page" TO "service_role";

REVOKE ALL ON TABLE "public"."page" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."page" TO "postgres";
