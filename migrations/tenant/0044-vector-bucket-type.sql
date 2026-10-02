DO $$
    DECLARE
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_enum
                     JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
            WHERE pg_type.typname = 'buckettype'
              AND enumlabel = 'VECTOR'
        ) THEN
            ALTER TYPE storage.BucketType ADD VALUE 'VECTOR';
        END IF;
END$$;