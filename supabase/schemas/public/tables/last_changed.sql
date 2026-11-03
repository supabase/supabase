CREATE TABLE "public"."last_changed" (
  "id"           bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "checksum"     text                     NOT NULL,
  "parent_page"  text                     NOT NULL,
  "heading"      text                     NOT NULL,
  "last_updated" timestamp with time zone NOT NULL DEFAULT now(),
  "last_checked" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "last_changed_parent_page_heading_key" UNIQUE (parent_page, heading),
  CONSTRAINT "last_changed_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."last_changed"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_last_changed_parent_page_btree ON public.last_changed USING btree (parent_page);

REVOKE ALL ON SEQUENCE "public"."last_changed_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."last_changed_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."last_changed_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."last_changed_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."last_changed_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."last_changed_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."last_changed_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."last_changed_id_seq" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."last_changed" TO "service_role";

COMMENT ON COLUMN "public"."last_changed"."checksum" IS 'Checksum of most recent section contents.';

COMMENT ON COLUMN "public"."last_changed"."last_checked" IS 'When the content was last checked. Used to identify and delete obsolete sections.';

COMMENT ON COLUMN "public"."last_changed"."last_updated" IS 'When the content was last edited.';

COMMENT ON COLUMN "public"."last_changed"."parent_page" IS 'Path of the page containing this section.';

COMMENT ON TABLE "public"."last_changed" IS 'Records when page sections from docs content were last edited.';

REVOKE ALL ON TABLE "public"."last_changed" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."last_changed" TO "postgres";

REVOKE ALL ON TABLE "public"."last_changed" FROM "anon", "authenticated";
