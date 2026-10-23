CREATE TABLE "public"."troubleshooting_entries" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "github_url"   text                     NOT NULL,
  "date_created" timestamp with time zone NOT NULL DEFAULT now(),
  "date_updated" timestamp with time zone NOT NULL DEFAULT now(),
  "github_id"    text                     NOT NULL,
  "slug"         text,
  "checksum"     text,
  CONSTRAINT "troubleshooting_entries_pkey" PRIMARY KEY (id),
  CONSTRAINT "troubleshooting_entries_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."troubleshooting_entries"
  ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_troubleshooting_entry_date_updated_trigger
  BEFORE UPDATE ON public.troubleshooting_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_troubleshooting_entry_date_updated();

CREATE POLICY "anon_read_troubleshooting_entries" ON "public"."troubleshooting_entries"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "authenticated_read_troubleshooting_entries" ON "public"."troubleshooting_entries"
  FOR SELECT
  TO "authenticated"
  USING (true);

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."troubleshooting_entries" TO "anon", "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."troubleshooting_entries" TO "service_role";

REVOKE ALL ON TABLE "public"."troubleshooting_entries" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."troubleshooting_entries" TO "postgres";
