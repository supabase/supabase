CREATE TABLE "content"."error" (
  "code"             text                     NOT NULL,
  "service"          uuid                     NOT NULL,
  "http_status_code" smallint,
  "message"          text,
  "created_at"       timestamp with time zone DEFAULT now(),
  "updated_at"       timestamp with time zone DEFAULT now(),
  "deleted_at"       timestamp with time zone,
  "metadata"         jsonb,
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT "constraint_content_error_metadata_schema" CHECK (public.jsonb_matches_schema('{
            "type": "object",
            "properties": {
                "references": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "href": {
                                "type": "string"
                            },
                            "description": {
                                "type": "string"
                            }
                        },
                        "required": ["href", "description"]
                    }
                }
            }
        }'::json, metadata)),
  CONSTRAINT "error_id_key" UNIQUE (id),
  CONSTRAINT "error_pkey" PRIMARY KEY (service, code),
  CONSTRAINT "error_service_fkey" FOREIGN KEY (service) REFERENCES content.service(id) ON DELETE RESTRICT
);

ALTER TABLE "content"."error"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_content_error_service_code_nondeleted_only ON content.error USING btree (service, code)
  WHERE (deleted_at IS NULL);

CREATE RULE soft_delete_content_error AS
    ON DELETE TO content.error DO INSTEAD  UPDATE content.error SET deleted_at = now()
  WHERE ((error.code = old.code) AND (error.service = old.service));

CREATE TRIGGER sync_updated_at_content_error
  BEFORE UPDATE ON content.error
  FOR EACH ROW
  EXECUTE FUNCTION utils.update_timestamp();

CREATE POLICY "content_error_anon_select_all" ON "content"."error"
  FOR SELECT
  TO "anon"
  USING ((deleted_at IS NULL));

CREATE POLICY "content_error_authenticated_select_all" ON "content"."error"
  FOR SELECT
  TO "authenticated"
  USING ((deleted_at IS NULL));

GRANT SELECT ("code") ON TABLE "content"."error" TO "anon";

GRANT SELECT ("deleted_at") ON TABLE "content"."error" TO "anon";

GRANT SELECT ("http_status_code") ON TABLE "content"."error" TO "anon";

GRANT SELECT ("id") ON TABLE "content"."error" TO "anon";

GRANT SELECT ("message") ON TABLE "content"."error" TO "anon";

GRANT SELECT ("service") ON TABLE "content"."error" TO "anon";

GRANT SELECT ("code") ON TABLE "content"."error" TO "authenticated";

GRANT SELECT ("deleted_at") ON TABLE "content"."error" TO "authenticated";

GRANT SELECT ("http_status_code") ON TABLE "content"."error" TO "authenticated";

GRANT SELECT ("id") ON TABLE "content"."error" TO "authenticated";

GRANT SELECT ("message") ON TABLE "content"."error" TO "authenticated";

GRANT SELECT ("service") ON TABLE "content"."error" TO "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "content"."error" TO "service_role";
