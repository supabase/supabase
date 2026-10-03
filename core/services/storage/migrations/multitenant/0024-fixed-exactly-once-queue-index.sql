DO $$
    DECLARE
        partition_queue_ids text[];
        i_partition_id text;
    BEGIN

        -- check if a schema with name pgboss_v10 exists
        IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'pgboss_v10') THEN
            RETURN;
        END IF;

        -- Create or replace function to archive exactly_once jobs
        CREATE OR REPLACE FUNCTION pgboss_v10.archive_exactly_once_job()
            RETURNS TRIGGER AS
        $trigger$
        BEGIN
            IF NEW.policy = 'exactly_once' AND NEW.state IN ('completed', 'failed', 'cancelled') THEN
                INSERT INTO pgboss_v10.archive (
                    id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff,
                    start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on,
                    keep_until, output, dead_letter, policy
                )
                VALUES (
                           NEW.id, NEW.name, NEW.priority, NEW.data, NEW.state, NEW.retry_limit, NEW.retry_count,
                           NEW.retry_delay, NEW.retry_backoff, NEW.start_after, NEW.started_on, NEW.singleton_key,
                           NEW.singleton_on, NEW.expire_in, NEW.created_on, NEW.completed_on, NEW.keep_until + INTERVAL '30 days',
                           NEW.output, NEW.dead_letter, NEW.policy
                       )
                ON CONFLICT DO NOTHING;

                DELETE FROM pgboss_v10.job WHERE id = NEW.id;
            END IF;
            RETURN NEW;
        END;
        $trigger$
        LANGUAGE plpgsql;

        CREATE OR REPLACE FUNCTION pgboss_v10.create_queue(queue_name text, options json)
            RETURNS VOID AS
        $f$
        DECLARE
            table_name varchar := 'j' || encode(sha224(queue_name::bytea), 'hex');
            queue_created_on timestamptz;
        BEGIN
            WITH q as (
                INSERT INTO pgboss_v10.queue (
                      name,
                      policy,
                      retry_limit,
                      retry_delay,
                      retry_backoff,
                      expire_seconds,
                      retention_minutes,
                      dead_letter,
                      partition_name
                    )
                    VALUES (
                       queue_name,
                       options->>'policy',
                       (options->>'retryLimit')::int,
                       (options->>'retryDelay')::int,
                       (options->>'retryBackoff')::bool,
                       (options->>'expireInSeconds')::int,
                       (options->>'retentionMinutes')::int,
                       options->>'deadLetter',
                       table_name
                    )
                    ON CONFLICT DO NOTHING
                    RETURNING created_on
            )
            SELECT created_on into queue_created_on from q;

            IF queue_created_on IS NULL THEN
                RETURN;
            END IF;

            EXECUTE format('CREATE TABLE pgboss_v10.%I (LIKE pgboss_v10.job INCLUDING DEFAULTS)', table_name);

            EXECUTE format('ALTER TABLE pgboss_v10.%1$I ADD PRIMARY KEY (name, id)', table_name);
            EXECUTE format('ALTER TABLE pgboss_v10.%1$I ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss_v10.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
            EXECUTE format('ALTER TABLE pgboss_v10.%1$I ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss_v10.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
            EXECUTE format('CREATE UNIQUE INDEX %1$s_i1 ON pgboss_v10.%1$I (name, COALESCE(singleton_key, '''')) WHERE state = ''created'' AND policy = ''short''', table_name);
            EXECUTE format('CREATE UNIQUE INDEX %1$s_i2 ON pgboss_v10.%1$I (name, COALESCE(singleton_key, '''')) WHERE state = ''active'' AND policy = ''singleton''', table_name);
            EXECUTE format('CREATE UNIQUE INDEX %1$s_i3 ON pgboss_v10.%1$I (name, state, COALESCE(singleton_key, '''')) WHERE state <= ''active'' AND policy = ''stately''', table_name);
            EXECUTE format('CREATE UNIQUE INDEX %1$s_i4 ON pgboss_v10.%1$I (name, singleton_on, COALESCE(singleton_key, '''')) WHERE state <> ''cancelled'' AND singleton_on IS NOT NULL', table_name);
            EXECUTE format('CREATE INDEX %1$s_i5 ON pgboss_v10.%1$I (name, start_after) INCLUDE (priority, created_on, id) WHERE state < ''active''', table_name);
            EXECUTE format('CREATE UNIQUE INDEX %1$s_i6 ON pgboss_v10.%1$I (name, COALESCE(singleton_key, '''')) WHERE state <= ''active'' AND policy = ''exactly_once''', table_name);

            EXECUTE format('ALTER TABLE pgboss_v10.%I ADD CONSTRAINT cjc CHECK (name=%L)', table_name, queue_name);
            EXECUTE format('ALTER TABLE pgboss_v10.job ATTACH PARTITION pgboss_v10.%I FOR VALUES IN (%L)', table_name, queue_name);

            -- create a function trigger to archive the job when it's exactly_once policy and the state is either completed, failed or cancelled

            EXECUTE format('CREATE TRIGGER archive_exactly_once_trigger_insert AFTER INSERT ON pgboss_v10.%I FOR EACH ROW EXECUTE FUNCTION pgboss_v10.archive_exactly_once_job()', table_name);
            EXECUTE format('CREATE TRIGGER archive_exactly_once_trigger_update AFTER UPDATE ON pgboss_v10.%I FOR EACH ROW EXECUTE FUNCTION pgboss_v10.archive_exactly_once_job()', table_name);
        END;
        $f$
        LANGUAGE plpgsql;



        -- Recreate function with correct index type
        SELECT array_agg(partition_name) from pgboss_v10.queue
        WHERE policy = 'exactly_once'
        INTO partition_queue_ids;

        IF array_length(partition_queue_ids, 1) = 0 THEN
            RETURN;
        END IF;

        FOR i_partition_id IN SELECT unnest(partition_queue_ids)
        LOOP
                EXECUTE format('DROP INDEX IF EXISTS pgboss_v10.%1$s_i6', i_partition_id);
                EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %1$s_i6 ON pgboss_v10.%1$I (name, COALESCE(singleton_key, '''')) WHERE state <= ''active'' AND policy = ''exactly_once''', i_partition_id);
                IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'archive_exactly_once_trigger_insert' AND tgrelid = ('pgboss_v10.' || i_partition_id)::regclass) THEN
                    EXECUTE format('CREATE TRIGGER archive_exactly_once_trigger_insert AFTER INSERT ON pgboss_v10.%I FOR EACH ROW EXECUTE FUNCTION pgboss_v10.archive_exactly_once_job()', i_partition_id);
                    EXECUTE format('CREATE TRIGGER archive_exactly_once_trigger_update AFTER UPDATE ON pgboss_v10.%I FOR EACH ROW EXECUTE FUNCTION pgboss_v10.archive_exactly_once_job()', i_partition_id);
                END IF;
        END LOOP;
    END;
$$;