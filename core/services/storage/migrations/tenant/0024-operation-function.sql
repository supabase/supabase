CREATE OR REPLACE FUNCTION storage.operation()
    RETURNS text AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$ LANGUAGE plpgsql STABLE;