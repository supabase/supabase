

CREATE TABLE IF NOT EXISTS tenants_s3_credentials (
    id UUID PRIMARY KEY default gen_random_uuid(),
    description text NOT NULL,
    tenant_id text REFERENCES tenants(id) ON DELETE CASCADE,
    access_key text NOT NULL,
    secret_key text NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tenants_s3_credentials_tenant_id_idx ON tenants_s3_credentials(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS tenants_s3_credentials_access_key_idx ON tenants_s3_credentials(tenant_id, access_key);


CREATE OR REPLACE FUNCTION tenants_s3_credentials_update_notify_trigger ()
    RETURNS TRIGGER
AS $$
BEGIN
    PERFORM
        pg_notify('tenants_s3_credentials_update', '"' || NEW.id || ':' || NEW.access_key || '"');
    RETURN NULL;
END;
$$
    LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tenants_s3_credentials_delete_notify_trigger ()
    RETURNS TRIGGER
AS $$
BEGIN
    PERFORM
        pg_notify('tenants_s3_credentials_update', '"' || OLD.id || ':' || OLD.access_key || '"');
    RETURN NULL;
END;
$$
    LANGUAGE plpgsql;

CREATE TRIGGER tenants_s3_credentials_update_notify_trigger
    AFTER UPDATE ON tenants_s3_credentials
    FOR EACH ROW
EXECUTE PROCEDURE tenants_s3_credentials_update_notify_trigger ();

CREATE TRIGGER tenants_s3_credentials_delete_notify_trigger
    AFTER DELETE ON tenants_s3_credentials
    FOR EACH ROW
EXECUTE PROCEDURE tenants_s3_credentials_delete_notify_trigger ();
