-- only a publication from supabase realtime is expected
SELECT
    pubname AS publication_name,
    pubowner::regrole AS owner,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete,
    pubtruncate
FROM
    pg_publication;
