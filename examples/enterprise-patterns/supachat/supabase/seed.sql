--
-- generate one year of fake chat data
--
INSERT INTO chats (created_at)
    SELECT generate_series(
        '2022-01-01'::timestamptz,
        '2022-01-07 23:00:00'::timestamptz,
        interval '1 hour');

INSERT INTO chat_messages (created_at, chat_id, chat_created_at, message)
    SELECT
        mca,
        chats.id,
        chats.created_at,
        (SELECT ($$[0:3]={'hello','goodbye','How are you today','I am fine'}$$::text[])[trunc(random() * 4)::int])
    FROM chats
    CROSS JOIN LATERAL (
        SELECT generate_series(
            chats.created_at,
            chats.created_at + interval '1 day',
            interval '1 minute') AS mca) b;

CALL app.load_chats_partitions();
CALL app.load_chat_messages_partitions();
CALL app.update_chat_sequences();
--
-- Now schedule a job to create new partitions for "tomorrow" every night
--
SELECT cron.schedule('new-chat-partition', '0 0 * * *', 'CALL app.load_app_partitions(now()::date)');
--
--
-- After bulk loading data, tables should be vacuumed and analyzed.
-- This cannot be done inside a transaction block.
--
VACUUM ANALYZE app.chats, app.chat_messages;
