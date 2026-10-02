CREATE FUNCTION tenants_delete_notify_trigger ()
    RETURNS TRIGGER
AS $$
BEGIN
    PERFORM
        pg_notify('tenants_update', '"' || OLD.id || '"');
    RETURN NULL;
END;
$$
    LANGUAGE plpgsql;
CREATE TRIGGER tenants_delete_notify_trigger
    AFTER DELETE ON tenants
    FOR EACH ROW
EXECUTE PROCEDURE tenants_delete_notify_trigger ();