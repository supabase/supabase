CREATE TABLE "public"."feedback" (
  "id"           bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  "date_created" date   NOT NULL DEFAULT CURRENT_DATE,
  "page"         text   NOT NULL,
  "metadata"     jsonb,
  CONSTRAINT "feedback_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."feedback"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."feedback"
  ADD COLUMN "vote" public.feedback_vote NOT NULL;

CREATE POLICY "Anyone can insert feedback" ON "public"."feedback"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

REVOKE ALL ON SEQUENCE "public"."feedback_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."feedback_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."feedback_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."feedback_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."feedback_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."feedback_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."feedback_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."feedback_id_seq" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."feedback" TO "anon", "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."feedback" TO "service_role";

REVOKE ALL ON TABLE "public"."feedback" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."feedback" TO "postgres";
