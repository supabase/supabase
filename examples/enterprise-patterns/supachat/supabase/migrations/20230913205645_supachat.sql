--
-- Create a fake "Large Table" problem, where one table holds many rows.
--

CREATE TABLE chats(
    id bigserial,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
    );

CREATE TABLE chat_messages(
    id bigserial,
    created_at timestamptz NOT NULL,
    chat_id bigint NOT NULL,
    chat_created_at timestamptz NOT NULL,
    message text NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (chat_id) REFERENCES chats(id)
    );

CREATE INDEX ON chats (created_at);
CREATE INDEX ON chat_messages (created_at);

--
-- below are the "new" partitioned tables, in their own schema to
-- avoid name conflicts with the "old" tables above.  Let's start a
-- new transaction to setup the new tables and migration procedures.
-- In order to avoid namespace pollution and name conflicts with the
-- old tables, lets put all the new partitioned tables in a new
-- schema.
--
CREATE SCHEMA app;
CREATE EXTENSION pg_cron;

CREATE TABLE app.chats(
    id bigserial,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id, created_at)  -- the partition column must be part of pk
    ) PARTITION BY RANGE (created_at);

CREATE INDEX "chats_created_at" ON app.chats (created_at);

CREATE TABLE app.chat_messages(
    id bigserial,
    created_at timestamptz NOT NULL,
    chat_id bigint NOT NULL,
    chat_created_at timestamptz NOT NULL,
    message text NOT NULL,
    PRIMARY KEY (id, created_at),
    FOREIGN KEY (chat_id, chat_created_at)   -- multicolumn fk to ensure
        REFERENCES app.chats(id, created_at)
    ) PARTITION BY RANGE (created_at);

CREATE INDEX "chat_messages_created_at" ON app.chat_messages (created_at);
--
-- need this index on the fk source to lookup messages by parent
--
CREATE INDEX "chat_messages_chat_id_chat_created_at"
    ON app.chat_messages (chat_id, chat_created_at);
--
-- Function creates a chats partition for the given day argument
--
CREATE OR REPLACE PROCEDURE app.create_chats_partition(partition_day date)
    LANGUAGE plpgsql AS
$$
BEGIN
    EXECUTE format(
    $i$
        CREATE TABLE IF NOT EXISTS app."chats_%1$s"
        (LIKE app.chats INCLUDING DEFAULTS INCLUDING CONSTRAINTS);
    $i$, partition_day);
END;
$$;
--
-- Function creates a chat_messages partition for the given day argument
--
CREATE OR REPLACE PROCEDURE app.create_chat_messages_partition(partition_day date)
    LANGUAGE plpgsql AS
$$
BEGIN
    EXECUTE format(
    $i$
        CREATE TABLE IF NOT EXISTS app."chat_messages_%1$s"
        (LIKE app.chat_messages INCLUDING DEFAULTS INCLUDING CONSTRAINTS);

        -- adding these check constraints means postgres can
        -- attach partitions without locking and having to scan them.
        ALTER TABLE app."chat_messages_%1$s" ADD CONSTRAINT
               "chat_messages_partition_by_range_check_%1$s"
           CHECK ( created_at >= DATE %1$L AND created_at < DATE %2$L );

    $i$, partition_day, (partition_day + interval '1 day')::date);
END;
$$;
--
-- Function copies one day's worth of chats rows from old "large"
-- table new partition.  Note that the copied data is ordered by
-- created_at, this improves block cache density.
--
CREATE OR REPLACE PROCEDURE app.copy_chats_partition(partition_day date)
    LANGUAGE plpgsql AS
$$
DECLARE
    num_copied bigint = 0;
BEGIN
    EXECUTE format(
    $i$
        INSERT INTO app."chats_%1$s" (id, created_at)
        SELECT id, created_at FROM chats
        WHERE created_at::date >= %1$L::date AND created_at::date < (%1$L::date + interval '1 day')
        ORDER BY created_at
    $i$, partition_day);
    GET DIAGNOSTICS num_copied = ROW_COUNT;
    RAISE NOTICE 'Copied % rows to %', num_copied, format('app."chats_%1$s"', partition_day);
END;
$$;
--
-- Function copies one day's worth of chat_messages rows from old
-- "large" table new partition.  Note that the data is ordered by
-- chat_id then created_at, this improves block cache density.
--
CREATE OR REPLACE PROCEDURE app.copy_chat_messages_partition(partition_day date)
    LANGUAGE plpgsql AS
$$
DECLARE
    num_copied bigint = 0;
BEGIN
    EXECUTE format(
    $i$
        INSERT INTO app."chat_messages_%1$s" (id, created_at, chat_id, chat_created_at, message)
        SELECT m.id, m.created_at, c.id, c.created_at, m.message FROM chat_messages m JOIN chats c on (c.id = m.chat_id)
        WHERE m.created_at::date >= %1$L::date AND m.created_at::date < (%1$L::date + interval '1 day')
        ORDER BY chat_id, m.created_at
    $i$, partition_day);
    GET DIAGNOSTICS num_copied = ROW_COUNT;
    RAISE NOTICE 'Copied % rows to %', num_copied, format('app."chat_messages_%1$s"', partition_day);
END;
$$;
--
-- Function indexes and attaches one day's worth of chats to parent table
--
CREATE OR REPLACE PROCEDURE app.index_and_attach_chats_partition(partition_day date)
    LANGUAGE plpgsql AS
$$
BEGIN
    EXECUTE format(
    $i$
        -- now that any bulk data is loaded, setup the new partition table's pks
        ALTER TABLE app."chats_%1$s" ADD PRIMARY KEY (id, created_at);

        -- adding these check constraints means postgres can
        -- attach partitions without locking and having to scan them.
        ALTER TABLE app."chats_%1$s" ADD CONSTRAINT
               "chats_partition_by_range_check_%1$s"
           CHECK ( created_at >= DATE %1$L AND created_at < DATE %2$L );

        -- add more partition indexes here if necessary
        CREATE INDEX "chats_%1$s_created_at"
            ON app."chats_%1$s"
            USING btree(created_at)
            WITH (fillfactor=100);

        -- by "attaching" the new tables and indexes *after* the pk,
        -- indexing and check constraints verify all rows,
        -- no scan checks or locks are necessary, attachment is very fast,
        -- and queries to parent are not blocked.
        ALTER TABLE app.chats
            ATTACH PARTITION app."chats_%1$s"
        FOR VALUES FROM (%1$L) TO (%2$L);

        -- You now also "attach" any indexes you made at this point
        ALTER INDEX app."chats_created_at"
            ATTACH PARTITION app."chats_%1$s_created_at";

        -- Droping the now unnecessary check constraints they were just needed
        -- to prevent the attachment from forcing a scan to do the same check
        ALTER TABLE app."chats_%1$s" DROP CONSTRAINT
            "chats_partition_by_range_check_%1$s";
    $i$,
    partition_day, (partition_day + interval '1 day')::date);
END;
$$;
--
-- Function indexes and attaches one day's worth of chat_messages to parent table
--
CREATE OR REPLACE PROCEDURE app.index_and_attach_chat_messages_partition(partition_day date)
    LANGUAGE plpgsql AS
$$
BEGIN
    EXECUTE format(
    $i$
        -- now that any bulk data is loaded, setup the new partition table's pks
        ALTER TABLE app."chat_messages_%1$s" ADD PRIMARY KEY (id, created_at);

        -- here's where you create per-partition indexes on the partitions
        CREATE INDEX "chat_messages_%1$s_created_at"
            ON app."chat_messages_%1$s"
            USING btree(created_at)
            WITH (fillfactor=100);

        CREATE INDEX "chat_messages_%1$s_chat_id_chat_created_at"
            ON app."chat_messages_%1$s"
            USING btree(chat_id, chat_created_at)
            WITH (fillfactor=100);

        -- add more partition indexes here if necessary

        -- by "attaching" the new tables and indexes *after* the pk,
        -- indexing and check constraints verify all rows,
        -- no scan checks or locks are necessary, attachment is very fast,
        -- and queries to parent are not blocked.
        ALTER TABLE app.chat_messages
            ATTACH PARTITION app."chat_messages_%1$s"
        FOR VALUES FROM (%1$L) TO (%2$L);

        -- You now also "attach" any indexes you made at this point
        ALTER INDEX app."chat_messages_created_at"
            ATTACH PARTITION app."chat_messages_%1$s_created_at";

        ALTER INDEX app."chat_messages_chat_id_chat_created_at"
            ATTACH PARTITION app."chat_messages_%1$s_chat_id_chat_created_at";

        -- Droping the now unnecessary check constraints they were just needed
        -- to prevent the attachment from forcing a scan to do the same check
        ALTER TABLE app."chat_messages_%1$s" DROP CONSTRAINT
            "chat_messages_partition_by_range_check_%1$s";
    $i$,
    partition_day, (partition_day + interval '1 day')::date);
END;
$$;
--
-- Wrapper functions to loop over all days in large table, creating
-- new partions, copying them, then indexing and attaching them.
--
CREATE OR REPLACE PROCEDURE app.load_chats_partition(i date)
    LANGUAGE plpgsql AS
$$
BEGIN
    CALL app.create_chats_partition(i);
    CALL app.copy_chats_partition(i);
    CALL app.index_and_attach_chats_partition(i);
    COMMIT;
END;
$$;
CREATE OR REPLACE PROCEDURE app.load_chats_partitions()
    LANGUAGE plpgsql AS
$$
DECLARE
    start_date date;
    end_date date;
    i date;
BEGIN
    SELECT min(created_at)::date INTO start_date FROM chats;
    SELECT max(created_at)::date INTO end_date FROM chats;
    FOR i IN SELECT * FROM generate_series(end_date, start_date, interval '-1 day') LOOP
        CALL app.load_chats_partition(i);
    END LOOP;
END;
$$;
--
-- Wrapper function loops over all days in large table, creating new
-- partions, copying them, then indexing and attaching them.
--
CREATE OR REPLACE PROCEDURE app.load_chat_messages_partition(i date)
    LANGUAGE plpgsql AS
$$
BEGIN
    CALL app.create_chat_messages_partition(i);
    CALL app.copy_chat_messages_partition(i);
    CALL app.index_and_attach_chat_messages_partition(i);
    COMMIT;
END;
$$;
CREATE OR REPLACE PROCEDURE app.load_chat_messages_partitions()
    LANGUAGE plpgsql AS
$$
DECLARE
    start_date date;
    end_date date;
    i date;
BEGIN
    SELECT min(created_at)::date INTO start_date FROM chat_messages;
    SELECT max(created_at)::date INTO end_date FROM chat_messages;
    FOR i IN SELECT * FROM generate_series(end_date, start_date, interval '-1 day') LOOP
        CALL app.load_chat_messages_partition(i);
    END LOOP;
END;
$$;
--
-- This procedure will be used by pg_cron to create both new
-- partitions for "today".
--
CREATE OR REPLACE PROCEDURE app.create_daily_partitions(today date = now()::date)
    LANGUAGE plpgsql AS
$$
BEGIN
    CALL app.create_chats_partition(today);
    CALL app.create_chat_messages_partition(today);
END;
$$;
--
-- This procedure will reset the sequence for partition tables after
-- old rows have been copied into them.
--
CREATE OR REPLACE PROCEDURE app.update_chat_sequences()
    LANGUAGE plpgsql AS
$$
BEGIN
    PERFORM setval('app.chats_id_seq', coalesce((SELECT max(id) FROM app.chats), 1));
    PERFORM setval('app.chat_messages_id_seq', coalesce((SELECT max(id) FROM app.chat_messages), 1));
END;
$$;
