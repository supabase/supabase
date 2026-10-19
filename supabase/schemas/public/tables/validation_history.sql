CREATE TABLE "public"."validation_history" (
  "id"         bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "tag"        text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "validation_history_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."validation_history"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX validation_history_tag_created_at_idx ON public.validation_history USING btree (TAG, created_at DESC);

REVOKE ALL ON SEQUENCE "public"."validation_history_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."validation_history_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."validation_history_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."validation_history_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."validation_history_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."validation_history_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."validation_history_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."validation_history_id_seq" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."validation_history" TO "anon", "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."validation_history" TO "service_role";

REVOKE ALL ON TABLE "public"."validation_history" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."validation_history" TO "postgres";
