-- Check and create OrioleDB if available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'orioledb') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'orioledb') THEN
            CREATE EXTENSION orioledb;
        END IF;
    END IF;
END $$;

-- Create all extensions
\ir extensions/test.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT no_plan();

\ir fixtures.sql
\ir database/test.sql
\ir storage/test.sql

SELECT * FROM finish();

ROLLBACK;
