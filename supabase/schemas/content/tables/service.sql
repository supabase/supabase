CREATE TABLE "content"."service" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "deleted_at" timestamp with time zone,
  CONSTRAINT "service_name_key" UNIQUE (name),
  CONSTRAINT "service_pkey" PRIMARY KEY (id)
);

ALTER TABLE "content"."service"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_content_service_id_nondeleted_only ON content.service USING btree (id)
  WHERE (deleted_at IS NULL);

CREATE INDEX idx_content_service_name_nondeleted_only ON content.service USING btree (name)
  WHERE (deleted_at IS NULL);

CREATE RULE soft_delete_content_service AS
    ON DELETE TO content.service DO INSTEAD  UPDATE content.service SET deleted_at = now()
  WHERE (service.id = old.id);

CREATE TRIGGER sync_updated_at_content_service
  BEFORE UPDATE ON content.service
  FOR EACH ROW
  EXECUTE FUNCTION utils.update_timestamp();

CREATE POLICY "content_service_anon_select_all" ON "content"."service"
  FOR SELECT
  TO "anon"
  USING ((deleted_at IS NULL));

CREATE POLICY "content_service_authenticated_select_all" ON "content"."service"
  FOR SELECT
  TO "authenticated"
  USING ((deleted_at IS NULL));

GRANT SELECT ("deleted_at") ON TABLE "content"."service" TO "anon";

GRANT SELECT ("id") ON TABLE "content"."service" TO "anon";

GRANT SELECT ("name") ON TABLE "content"."service" TO "anon";

GRANT SELECT ("deleted_at") ON TABLE "content"."service" TO "authenticated";

GRANT SELECT ("id") ON TABLE "content"."service" TO "authenticated";

GRANT SELECT ("name") ON TABLE "content"."service" TO "authenticated";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "content"."service" TO "service_role";
