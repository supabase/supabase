-- postgres-migrations ignore
DO $$
BEGIN
    IF EXISTS(
        SELECT id FROM storage.migrations
          WHERE name = 'fix-prefix-race-conditions-optimized'
          AND executed_at >= now() - interval '1 minutes'
    ) THEN
        RETURN;
    END IF;

    -- Update all object levels based on their names that are incorrect
    UPDATE storage.objects SET level = storage.get_level(name)
    WHERE level != storage.get_level(name);
END$$;