CREATE TABLE "public"."interfaces_feedback" (
  "id"           bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "feedback"     text                     NOT NULL,
  "delete_token" uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_agent"   text,
  "user_id"      text,
  "project_ref"  text,
  "metadata"     jsonb,
  CONSTRAINT "interfaces_feedback_delete_token_key" UNIQUE (delete_token),
  CONSTRAINT "interfaces_feedback_feedback_check" CHECK ((char_length(feedback) <= 1000)),
  CONSTRAINT "interfaces_feedback_metadata_check" CHECK ((pg_column_size(metadata) <= 8192)),
  CONSTRAINT "interfaces_feedback_pkey" PRIMARY KEY (id),
  CONSTRAINT "interfaces_feedback_project_ref_check" CHECK ((char_length(project_ref) <= 255)),
  CONSTRAINT "interfaces_feedback_user_agent_check" CHECK ((char_length(user_agent) <= 255)),
  CONSTRAINT "interfaces_feedback_user_id_check" CHECK ((char_length(user_id) <= 255))
);

ALTER TABLE "public"."interfaces_feedback"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Token holders can delete their own feedback" ON "public"."interfaces_feedback"
  FOR DELETE
  TO "anon"
  USING
    (((delete_token = (((current_setting('request.headers'::text, true))::json ->> 'x-feedback-token'::text))::uuid) AND ((project_ref IS NULL) OR (project_ref =
    ((current_setting('request.headers'::text, true))::json ->> 'x-feedback-project-ref'::text))) AND
    ((user_id IS NULL) OR (user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-feedback-user-id'::text)))));

CREATE POLICY "Token holders can read their own feedback" ON "public"."interfaces_feedback"
  FOR SELECT
  TO "anon"
  USING
    (((delete_token = (((current_setting('request.headers'::text, true))::json ->> 'x-feedback-token'::text))::uuid) AND ((project_ref IS NULL) OR (project_ref =
    ((current_setting('request.headers'::text, true))::json ->> 'x-feedback-project-ref'::text))) AND
    ((user_id IS NULL) OR (user_id = ((current_setting('request.headers'::text, true))::json ->> 'x-feedback-user-id'::text)))));

REVOKE ALL ON SEQUENCE "public"."interfaces_feedback_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."interfaces_feedback_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."interfaces_feedback_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."interfaces_feedback_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."interfaces_feedback_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."interfaces_feedback_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."interfaces_feedback_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."interfaces_feedback_id_seq" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."interfaces_feedback" TO "anon", "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."interfaces_feedback" TO "service_role";

COMMENT ON COLUMN "public"."interfaces_feedback"."delete_token" IS 'Server-generated capability token returned once by submit_interfaces_feedback(); presenting it via the x-feedback-token request header authorizes reading and deleting this row. Rows submitted with a project_ref and/or user_id additionally require the matching x-feedback-project-ref / x-feedback-user-id headers.';

COMMENT ON COLUMN "public"."interfaces_feedback"."feedback" IS 'The free-form feedback text as submitted by the user.';

COMMENT ON COLUMN "public"."interfaces_feedback"."project_ref" IS 'Optional reference of the Supabase project the feedback relates to.';

COMMENT ON COLUMN "public"."interfaces_feedback"."user_agent" IS 'User agent of the submitting interface, e.g. SupabaseCLI/2.3.4. Also identifies which interface the feedback came from.';

COMMENT ON COLUMN "public"."interfaces_feedback"."user_id" IS 'Optional identifier of the submitting user, as reported by the interface. Unverified; format is interface-defined.';

COMMENT ON TABLE "public"."interfaces_feedback" IS 'General customer feedback submitted from Supabase interfaces such as the CLI and MCP server. Rows are inserted via submit_interfaces_feedback().';

REVOKE ALL ("delete_token") ON TABLE "public"."interfaces_feedback" FROM "anon";

GRANT SELECT ("delete_token") ON TABLE "public"."interfaces_feedback" TO "anon";

REVOKE ALL ("feedback") ON TABLE "public"."interfaces_feedback" FROM "anon";

GRANT SELECT ("feedback") ON TABLE "public"."interfaces_feedback" TO "anon";

REVOKE ALL ON TABLE "public"."interfaces_feedback" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."interfaces_feedback" TO "postgres";
