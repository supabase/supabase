defmodule Realtime.Tenants.Migrations.ListChangesWithSlotCount do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("DROP FUNCTION IF EXISTS realtime.list_changes(name, name, int, int)")

    execute("""
    CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes int, max_record_bytes int)
    RETURNS TABLE(
      wal jsonb,
      is_rls_enabled boolean,
      subscription_ids uuid[],
      errors text[],
      slot_changes_count bigint
    )
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      WITH pub AS (
        SELECT
          concat_ws(
            ',',
            CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
            CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
            CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
          ) AS w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (WHERE ppt.tablename IS NOT NULL AND ppt.tablename NOT LIKE '% %'),
            ''
          ) AS w2j_add_tables
        FROM pg_publication pp
        LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
        WHERE pp.pubname = publication
        GROUP BY pp.pubname
        LIMIT 1
      ),
      -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
      w2j AS MATERIALIZED (
        SELECT x.*, pub.w2j_add_tables
        FROM pub,
             pg_logical_slot_get_changes(
               slot_name, null, max_changes,
               'include-pk', 'true',
               'include-transaction', 'false',
               'include-timestamp', 'true',
               'include-type-oids', 'true',
               'format-version', '2',
               'actions', pub.w2j_actions,
               'add-tables', pub.w2j_add_tables
             ) x
      ),
      -- Count raw slot entries before apply_rls/subscription filter
      slot_count AS (
        SELECT count(*)::bigint AS cnt
        FROM w2j
        WHERE w2j.w2j_add_tables <> ''
      ),
      -- Apply RLS and filter as before
      rls_filtered AS (
        SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
        FROM w2j,
             realtime.apply_rls(
               wal := w2j.data::jsonb,
               max_record_bytes := max_record_bytes
             ) xyz(wal, is_rls_enabled, subscription_ids, errors)
        WHERE w2j.w2j_add_tables <> ''
          AND xyz.subscription_ids[1] IS NOT NULL
      )
      -- Real rows with slot count attached
      SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
      FROM rls_filtered rf, slot_count sc

      UNION ALL

      -- Sentinel row: always returned when no real rows exist so Elixir can
      -- always read slot_changes_count. Identified by wal IS NULL.
      SELECT null, null, null, null, sc.cnt
      FROM slot_count sc
      WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
    $$;
    """)
  end
end
