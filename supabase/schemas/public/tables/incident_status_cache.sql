CREATE TABLE "public"."incident_status_cache" (
  "id"                       bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "incident_id"              text                     NOT NULL,
  "shortlink"                text                     NOT NULL,
  "updated_at"               timestamp with time zone NOT NULL DEFAULT now(),
  "affects_project_creation" boolean                  NOT NULL DEFAULT false,
  "affected_regions"         text[],
  CONSTRAINT "incident_status_cache_incident_id_key" UNIQUE (incident_id),
  CONSTRAINT "incident_status_cache_pkey" PRIMARY KEY (id),
  CONSTRAINT "incident_status_cache_shortlink_key" UNIQUE (shortlink)
);

ALTER TABLE "public"."incident_status_cache"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_incident_status_cache_incident_id ON public.incident_status_cache USING btree (incident_id);

CREATE INDEX idx_incident_status_cache_shortlink ON public.incident_status_cache USING btree (shortlink);

CREATE TRIGGER set_incident_status_cache_updated_at
  BEFORE UPDATE ON public.incident_status_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL ON SEQUENCE "public"."incident_status_cache_id_seq" FROM "anon";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."incident_status_cache_id_seq" TO "anon";

REVOKE ALL ON SEQUENCE "public"."incident_status_cache_id_seq" FROM "authenticated";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."incident_status_cache_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."incident_status_cache_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."incident_status_cache_id_seq" TO "postgres";

REVOKE ALL ON SEQUENCE "public"."incident_status_cache_id_seq" FROM "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."incident_status_cache_id_seq" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."incident_status_cache" TO "service_role";

REVOKE ALL ON TABLE "public"."incident_status_cache" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."incident_status_cache" TO "postgres";

REVOKE ALL ON TABLE "public"."incident_status_cache" FROM "anon", "authenticated";
