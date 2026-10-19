CREATE TABLE "public"."meetups" (
  "id"           uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "launch_week"  text                     NOT NULL,
  "title"        text,
  "country"      text,
  "start_at"     timestamp with time zone,
  "link"         text,
  "display_info" text,
  "is_live"      boolean                  NOT NULL DEFAULT false,
  "is_published" boolean                  NOT NULL DEFAULT false,
  "timezone"     text,
  "city"         text,
  CONSTRAINT "meetups_launch_week_fkey" FOREIGN KEY (launch_week) REFERENCES public.launch_weeks(id),
  CONSTRAINT "meetups_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."meetups"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anybody to select all meetups" ON "public"."meetups"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."meetups" TO "anon", "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."meetups" TO "service_role";

COMMENT ON COLUMN "public"."meetups"."timezone" IS 'Needs to be in America/Los_Angeles format.';

REVOKE ALL ON TABLE "public"."meetups" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."meetups" TO "postgres";
