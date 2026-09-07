REVOKE ALL ON TABLE "public"."conversations" FROM "anon";

REVOKE ALL ON TABLE "public"."message_feedback" FROM "anon";

REVOKE ALL ON TABLE "public"."messages" FROM "anon";

DROP POLICY "own conversations" ON "public"."conversations";

DROP POLICY "own feedback" ON "public"."message_feedback";

DROP POLICY "own messages" ON "public"."messages";

ALTER TABLE "public"."oauth_states"
  DROP COLUMN "code_verifier";

CREATE TABLE "private"."conversation_runs" (
  "id"              uuid                     NOT NULL,
  "conversation_id" uuid                     NOT NULL,
  "user_id"         uuid                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "conversation_runs_pkey" PRIMARY KEY (id)
);

ALTER TABLE "private"."conversation_runs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "private"."request_limits" (
  "key"          text                     NOT NULL,
  "window_start" timestamp with time zone NOT NULL,
  "count"        integer                  NOT NULL,
  CONSTRAINT "request_limits_pkey" PRIMARY KEY (key)
);

ALTER TABLE "private"."request_limits"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "private"."tool_executions" (
  "conversation_id" uuid  NOT NULL,
  "tool_call_id"    text  NOT NULL,
  "tool_name"       text  NOT NULL,
  "input"           jsonb NOT NULL,
  "status"          text  NOT NULL,
  "output"          jsonb,
  CONSTRAINT "tool_executions_pkey" PRIMARY KEY (conversation_id, tool_call_id),
  CONSTRAINT "tool_executions_status_check" CHECK ((status = ANY (ARRAY['started'::text, 'completed'::text, 'failed'::text])))
);

ALTER TABLE "private"."tool_executions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."project_permissions" (
  "user_id"         uuid                     NOT NULL,
  "project_ref"     text                     NOT NULL,
  "org_slug"        text                     NOT NULL,
  "level"           text                     NOT NULL,
  "consent_version" integer                  NOT NULL,
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "project_permissions_level_check" CHECK ((level = ANY (ARRAY['disabled'::text, 'schema'::text, 'schema_and_log'::text, 'schema_and_log_and_data'::text]))),
  CONSTRAINT "project_permissions_pkey" PRIMARY KEY (user_id, project_ref)
);

ALTER TABLE "public"."project_permissions"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."conversations"
  ADD COLUMN "revision" bigint NOT NULL DEFAULT 0;

ALTER TABLE "public"."conversations"
  ADD COLUMN "active_request_id" uuid;

ALTER TABLE "public"."conversations"
  ADD COLUMN "active_since" timestamp WITH time zone;

ALTER TABLE "public"."oauth_states"
  ADD COLUMN "code_challenge" text;

ALTER TABLE "private"."conversation_runs"
  ADD CONSTRAINT "conversation_runs_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE "private"."conversation_runs"
  ADD CONSTRAINT "conversation_runs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "private"."tool_executions"
  ADD CONSTRAINT "tool_executions_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE "public"."project_permissions"
  ADD CONSTRAINT "project_permissions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX conversation_runs_user_id_created_at_idx ON private.conversation_runs USING btree (user_id, created_at DESC);

CREATE POLICY "own conversations" ON "public"."conversations"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND (deleted_at IS NULL)));

CREATE POLICY "own message_feedback" ON "public"."message_feedback"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = message_feedback.conversation_id) AND (c.user_id = ( SELECT auth.uid() AS uid)) AND (c.deleted_at IS NULL))))));

CREATE POLICY "own messages" ON "public"."messages"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND (c.user_id = ( SELECT auth.uid() AS uid)) AND (c.deleted_at IS NULL))))));

CREATE POLICY "own project permissions" ON "public"."project_permissions"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = ( SELECT auth.uid() AS uid)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "private"."conversation_runs" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "private"."request_limits" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "private"."tool_executions" TO "postgres";

REVOKE ALL ON TABLE "public"."conversations" FROM "authenticated";

GRANT SELECT ON TABLE "public"."conversations" TO "authenticated";

REVOKE ALL ON TABLE "public"."message_feedback" FROM "authenticated";

GRANT SELECT ON TABLE "public"."message_feedback" TO "authenticated";

REVOKE ALL ON TABLE "public"."messages" FROM "authenticated";

GRANT SELECT ON TABLE "public"."messages" TO "authenticated";

REVOKE ALL ON TABLE "public"."project_permissions" FROM "authenticated";

GRANT SELECT ON TABLE "public"."project_permissions" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_permissions" TO "postgres", "service_role";
