CREATE TABLE "public"."page_section" (
  "id"          bigint              NOT NULL DEFAULT nextval('public.page_section_id_seq'::regclass),
  "page_id"     bigint              NOT NULL,
  "content"     text,
  "token_count" integer,
  "embedding"   public.vector(1536),
  "slug"        text,
  "heading"     text,
  "rag_ignore"  boolean             DEFAULT false,
  CONSTRAINT "page_section_page_id_fkey" FOREIGN KEY (page_id) REFERENCES public.page(id) ON DELETE CASCADE,
  CONSTRAINT "page_section_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."page_section"
  ENABLE ROW LEVEL SECURITY;

ALTER SEQUENCE "public"."page_section_id_seq" OWNED BY "public"."page_section"."id";

CREATE POLICY "Enable read access for anon and authenticated" ON "public"."page_section"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."page_section" TO "anon", "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."page_section" TO "service_role";

REVOKE ALL ON TABLE "public"."page_section" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."page_section" TO "postgres";
