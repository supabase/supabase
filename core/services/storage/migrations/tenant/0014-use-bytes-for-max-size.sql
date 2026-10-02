
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buckets' AND column_name = 'max_file_size_kb') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buckets' AND column_name = 'file_size_limit') THEN
            ALTER TABLE storage.buckets RENAME COLUMN max_file_size_kb TO file_size_limit;
            ALTER TABLE storage.buckets ALTER COLUMN file_size_limit TYPE bigint;
        ELSE
            ALTER TABLE storage.buckets DROP COLUMN max_file_size_kb;
        END IF;
    END IF;
END$$;
