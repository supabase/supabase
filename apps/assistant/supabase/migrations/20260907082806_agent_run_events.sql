CREATE TABLE "private"."run_events" (
  "seq"             bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "conversation_id" uuid                     NOT NULL,
  "run_id"          uuid                     NOT NULL,
  "user_id"         uuid                     NOT NULL,
  "type"            text                     NOT NULL,
  "data"            jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "run_events_pkey" PRIMARY KEY (seq),
  CONSTRAINT "run_events_type_check"
    CHECK
    ((type = ANY (ARRAY['run.started'::text, 'run.completed'::text, 'run.failed'::text, 'run.cancelled'::text, 'run.waiting_for_approval'::text, 'run.interrupted'::text,
    'approval.requested'::text, 'approval.responded'::text, 'tool.started'::text, 'tool.completed'::text, 'tool.failed'::text])))
);

ALTER TABLE "private"."run_events"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "private"."conversation_runs"
  ADD COLUMN "status" text NOT NULL DEFAULT 'completed'::text;

ALTER TABLE "private"."conversation_runs"
  ADD COLUMN "finished_at" timestamp WITH time zone;

ALTER TABLE "private"."conversation_runs"
  ADD CONSTRAINT "conversation_runs_status_check"
    CHECK ((status = ANY (ARRAY['running'::text, 'waiting_for_approval'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])));

ALTER TABLE "private"."run_events"
  ADD CONSTRAINT "run_events_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

ALTER TABLE "private"."run_events"
  ADD CONSTRAINT "run_events_run_id_fkey" FOREIGN KEY (run_id) REFERENCES private.conversation_runs(id) ON DELETE CASCADE;

ALTER TABLE "private"."run_events"
  ADD CONSTRAINT "run_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX run_events_conversation_id_seq_idx ON private.run_events USING btree (conversation_id, seq);

CREATE INDEX run_events_run_id_idx ON private.run_events USING btree (run_id);

CREATE INDEX run_events_user_id_idx ON private.run_events USING btree (user_id);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "private"."run_events" TO "postgres";
