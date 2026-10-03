-- postgres-migrations disable-transaction
-- postgres-migrations ignore
-- Backfill prefixes table records
-- We run this with 50k batch size to avoid long running transaction
DO $$
    DECLARE
        batch_size INTEGER := 10000;
        total_scanned INTEGER := 0;
        row_returned INTEGER := 0;
        last_name TEXT COLLATE "C" := NULL;
        last_bucket_id TEXT COLLATE "C" := NULL;
        delay INTEGER := 1;
        start_time TIMESTAMPTZ;
        end_time TIMESTAMPTZ;
        exec_duration INTERVAL;
    BEGIN
        LOOP
            start_time := clock_timestamp();  -- Start time of batch

            -- Fetch a batch of objects ordered by name COLLATE "C"
            WITH batch as (
                SELECT id, bucket_id, name, owner
                FROM storage.objects
                WHERE (last_name IS NULL OR ((name COLLATE "C", bucket_id) > (last_name, last_bucket_id)))
                ORDER BY name COLLATE "C", bucket_id
                LIMIT batch_size
            ),
            batch_count as (
                SELECT COUNT(*) as count FROM batch
            ),
            cursor as (
                 SELECT name as last_name, bucket_id as last_bucket FROM batch b
                 ORDER BY name COLLATE "C" DESC, bucket_id DESC LIMIT 1
            ),
            all_prefixes as (
                SELECT UNNEST(storage.get_prefixes(name)) as prefix, bucket_id
                FROM batch
            ),
            insert_prefixes as (
                INSERT INTO storage.prefixes (bucket_id, name)
                SELECT bucket_id, prefix FROM all_prefixes
                WHERE coalesce(prefix, '') != ''
                ON CONFLICT DO NOTHING
            )
            SELECT count, cursor.last_name, cursor.last_bucket FROM cursor, batch_count INTO row_returned, last_name, last_bucket_id;

            end_time := clock_timestamp();  -- End time after batch processing
            exec_duration := end_time - start_time;  -- Calculate elapsed time

            RAISE NOTICE 'Object Row returned: %', row_returned;
            RAISE NOTICE 'Last Object: %', last_name;
            RAISE NOTICE 'Execution time for this batch: %', exec_duration;
            RAISE NOTICE 'Delay: %', delay;
            RAISE NOTICE 'Batch size: %', batch_size;
            RAISE NOTICE '-------------------------------------------------';

            total_scanned := total_scanned + row_returned;

            IF row_returned IS NULL OR row_returned < batch_size THEN
                RAISE NOTICE 'Total Object scanned: %', coalesce(total_scanned, 0);
                COMMIT;
                EXIT;
            ELSE
                COMMIT;
                PERFORM pg_sleep(delay);
                -- Increase delay by 1 second for each iteration until 30
                -- then reset it back to 1
                SELECT CASE WHEN delay >= 10 THEN 1 ELSE delay + 1 END INTO delay;

                -- Update the batch size:
                -- If execution time > 3 seconds, reset batch_size to 20k.
                -- If the batch size is already 20k, decrease it by 1k until 5k.
                -- Otherwise, increase batch_size by 5000 up to a maximum of 50k.
                IF exec_duration > interval '3 seconds' THEN
                    IF batch_size <= 20000 THEN
                        batch_size := GREATEST(batch_size - 1000, 5000);
                    ELSE
                        batch_size := 20000;
                    END IF;
                ELSE
                    batch_size := LEAST(batch_size + 5000, 50000);
                END IF;
            END IF;
    END LOOP;
END;
$$;