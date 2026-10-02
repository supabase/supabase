CREATE FUNCTION tenants_update_notify_trigger ()
    RETURNS TRIGGER
    AS $$
BEGIN
    PERFORM
        pg_notify('tenants_update', '"' || NEW.id || '"');
    RETURN NULL;
END;
$$
LANGUAGE plpgsql;
CREATE TRIGGER tenants_update_notify_trigger
    AFTER UPDATE ON tenants
    FOR EACH ROW
    EXECUTE PROCEDURE tenants_update_notify_trigger ();
