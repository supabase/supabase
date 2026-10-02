CREATE TABLE IF NOT EXISTS tenants_jwks (
    id UUID PRIMARY KEY default gen_random_uuid(),
    tenant_id text REFERENCES tenants(id) ON DELETE CASCADE,
    kind varchar(50) NOT NULL,
    content text NOT NULL,
    active boolean NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tenants_jwks_tenant_id_idx ON tenants_jwks(tenant_id);
CREATE INDEX IF NOT EXISTS tenants_jwks_active_idx ON tenants_jwks(tenant_id, active);

-- Only one active 'storage-url-signing-key' per tenant
CREATE UNIQUE INDEX IF NOT EXISTS tenants_jwks_unique_active_signing_key_idx
ON tenants_jwks(tenant_id)
WHERE active = true AND kind = 'storage-url-signing-key';

CREATE OR REPLACE FUNCTION tenants_jwks_update_notify_trigger ()
    RETURNS TRIGGER
AS $$
BEGIN
    PERFORM
        pg_notify('tenants_jwks_update', '"' || NEW.tenant_id || '"');
    RETURN NULL;
END;
$$
    LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tenants_jwks_delete_notify_trigger ()
    RETURNS TRIGGER
AS $$
BEGIN
    PERFORM
        pg_notify('tenants_jwks_update', '"' || OLD.tenant_id || '"');
    RETURN NULL;
END;
$$
    LANGUAGE plpgsql;

CREATE TRIGGER tenants_jwks_insert_notify_trigger
    AFTER INSERT ON tenants_jwks
    FOR EACH ROW
EXECUTE PROCEDURE tenants_jwks_update_notify_trigger ();

CREATE TRIGGER tenants_jwks_update_notify_trigger
    AFTER UPDATE ON tenants_jwks
    FOR EACH ROW
EXECUTE PROCEDURE tenants_jwks_update_notify_trigger ();

CREATE TRIGGER tenants_jwks_delete_notify_trigger
    AFTER DELETE ON tenants_jwks
    FOR EACH ROW
EXECUTE PROCEDURE tenants_jwks_delete_notify_trigger ();
