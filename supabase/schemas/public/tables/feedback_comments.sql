CREATE TABLE "public"."feedback_comments" (
  "id"         bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "page"       text                     NOT NULL,
  "title"      text,
  "comment"    text                     NOT NULL,
  "user_id"    uuid,
  "metadata"   jsonb,
  CONSTRAINT "feedback_comments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."feedback_comments"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."feedback_comments"
  ADD COLUMN "vote" public.feedback_vote;

CREATE POLICY "Anyone can insert feedback comments" ON "public"."feedback_comments"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

REVOKE ALL ON SEQUENCE "public"."feedback_comments_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."feedback_comments_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."feedback_comments_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."feedback_comments_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."feedback_comments_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."feedback_comments_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."feedback_comments_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."feedback_comments_id_seq" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."feedback_comments" TO "anon", "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."feedback_comments" TO "service_role";

REVOKE ALL ON TABLE "public"."feedback_comments" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."feedback_comments" TO "postgres";
