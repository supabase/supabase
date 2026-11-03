CREATE TABLE "public"."page_section_nimbus" (
  "id"          bigint              GENERATED ALWAYS AS IDENTITY NOT NULL,
  "page_id"     bigint              NOT NULL,
  "content"     text,
  "token_count" integer,
  "embedding"   public.vector(1536),
  "slug"        text,
  "heading"     text,
  "rag_ignore"  boolean             DEFAULT false,
  CONSTRAINT "page_section_nimbus_page_id_fkey" FOREIGN KEY (page_id) REFERENCES public.page_nimbus(id) ON DELETE CASCADE,
  CONSTRAINT "page_section_nimbus_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."page_section_nimbus"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read page_section_nimbus" ON "public"."page_section_nimbus"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "authenticated can read page_section_nimbus" ON "public"."page_section_nimbus"
  FOR SELECT
  TO "authenticated"
  USING (true);

REVOKE ALL ON SEQUENCE "public"."page_section_nimbus_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."page_section_nimbus_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."page_section_nimbus_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."page_section_nimbus_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."page_section_nimbus_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."page_section_nimbus_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."page_section_nimbus_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."page_section_nimbus_id_seq" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."page_section_nimbus" TO "anon", "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."page_section_nimbus" TO "service_role";

REVOKE ALL ON TABLE "public"."page_section_nimbus" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."page_section_nimbus" TO "postgres";
