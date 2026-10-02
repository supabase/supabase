CREATE OR REPLACE FUNCTION tenants_s3_credentials_update_notify_trigger ()
    RETURNS TRIGGER
AS $$
BEGIN
    PERFORM
        pg_notify('tenants_s3_credentials_update', '"' || NEW.tenant_id || ':' || NEW.access_key || '"');
    RETURN NULL;
END;
$$
    LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tenants_s3_credentials_delete_notify_trigger ()
    RETURNS TRIGGER
AS $$
BEGIN
    PERFORM
        pg_notify('tenants_s3_credentials_update', '"' || OLD.tenant_id || ':' || OLD.access_key || '"');
    RETURN NULL;
END;
$$
    LANGUAGE plpgsql;
