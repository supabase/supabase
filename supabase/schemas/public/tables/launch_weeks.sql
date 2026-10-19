CREATE TABLE "public"."launch_weeks" (
  "id"         text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "start_date" timestamp with time zone,
  "end_date"   timestamp with time zone,
  CONSTRAINT "launch_weeks_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."launch_weeks"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON "public"."launch_weeks"
  FOR SELECT
  TO PUBLIC
  USING (true);

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."launch_weeks" TO "anon", "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."launch_weeks" TO "service_role";

REVOKE ALL ON TABLE "public"."launch_weeks" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."launch_weeks" TO "postgres";
