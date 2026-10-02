defmodule Realtime.Tenants.Migrations.AddListChangesSync do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute(~S"""
    -- A drop-in replacement for pg_logical_slot_get_changes, taking and forwarding the same
    -- plugin options, that holds back a change whose transaction has not settled yet. It works
    -- the cut out for itself, so it takes no upto_lsn.
    CREATE OR REPLACE FUNCTION realtime.settled_changes(
      slot_name name, max_changes int, VARIADIC opts text[])
    RETURNS TABLE(lsn pg_lsn, xid xid, data text)
    LANGUAGE plpgsql
    VOLATILE
    AS $$
    declare
      upto pg_lsn;
      total bigint;
      xids xid[];
      starts bigint[];
      snapshot pg_snapshot;
      running_xids xid[];
      xmax_age int;
      cut bigint;
    begin
      -- Each statement in a volatile function takes its own snapshot, which is what lets the
      -- check below see a writer that was still in flight when the peek ran. Under REPEATABLE
      -- READ the snapshot never advances, so a deferred change would never be released.
      if current_setting('transaction_isolation') <> 'read committed' then
        raise exception 'realtime.settled_changes requires READ COMMITTED';
      end if;

      -- The peek and the read below cover the same WAL, so the read cannot reach a commit the
      -- check never saw.
      upto := pg_current_wal_flush_lsn();

      -- One entry per transaction, in commit order: its xid and the position of its first
      -- change. The peek uses the caller's own options, so max_changes counts exactly what the
      -- read counts. A non-transactional logical message is emitted as soon as it is decoded,
      -- tagged with the xid of whatever transaction wrote it, so it does not mark where that
      -- transaction starts.
      select coalesce(sum(g.n), 0),
             array_agg(g.x order by g.first) filter (where g.first is not null),
             array_agg(g.first order by g.first) filter (where g.first is not null)
        into total, xids, starts
        from (
          select p.xid as x, count(*) as n,
                 min(p.ord) filter (where not case
                   when starts_with(p.data, '{"action":"M"') then (p.data::jsonb->>'transactional')::boolean is false
                   else false
                 end) as first
          from pg_logical_slot_peek_changes(slot_name, upto, max_changes, variadic opts)
               with ordinality as p(lsn, xid, data, ord)
          group by p.xid
        ) g;

      -- Nothing for the caller, but the slot still has to move past what the peek covered.
      if total = 0 then
        perform pg_replication_slot_advance(slot_name, upto);
        return;
      end if;

      if xids is not null then
        -- Taken after the peek is materialized, so a writer that was still in flight during
        -- decoding is guaranteed to show up here.
        snapshot := pg_current_snapshot();

        -- A commit record reaches the WAL before the writer leaves the proc array, so a change
        -- can be decoded while its row is invisible. apply_rls would resolve a policy against a
        -- row it cannot see and authorize it for nobody, while the read consumed it regardless.
        --
        -- xip lists transactions running when the snapshot was taken. It does not cover a writer
        -- whose xid sits at or beyond xmax, which never appears there, so the horizon is checked
        -- too. age() counts backwards from the current xid and so compares correctly across
        -- wraparound.
        select coalesce(array_agg(running.x::xid), array[]::xid[])
          into running_xids
          from pg_snapshot_xip(snapshot) running(x);
        xmax_age := age(pg_snapshot_xmax(snapshot)::xid);

        select min(u.s) into cut
          from unnest(xids, starts) as u(x, s)
          where u.x = any(running_xids) or age(u.x) <= xmax_age;
      end if;

      -- The read stops right after the commit that brings its count to upto_nchanges, so the
      -- count of changes in front of the first unsettled transaction stops it just before that
      -- transaction.
      if cut is null then
        return query
          select p.* from pg_logical_slot_get_changes(slot_name, upto, max_changes, variadic opts) p;
      elsif cut > 1 then
        return query
          select p.* from pg_logical_slot_get_changes(slot_name, upto, (cut - 1)::int, variadic opts) p;
      end if;
    end;
    $$;
    """)

    execute(~S"""
    CREATE FUNCTION realtime.list_changes_sync(publication name, slot_name name, max_changes int, max_record_bytes int)
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
            ) filter (WHERE ppt.tablename IS NOT NULL),
            ''
          ) AS w2j_add_tables
        FROM pg_publication pp
        LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
        WHERE pp.pubname = publication
        GROUP BY pp.pubname
        LIMIT 1
      ),
      -- MATERIALIZED ensures the slot is read exactly once.
      consumed AS MATERIALIZED (
        SELECT x.*, pub.w2j_add_tables
        FROM pub,
             realtime.settled_changes(
               slot_name, max_changes,
               'include-pk', 'true',
               'include-transaction', 'false',
               'include-timestamp', 'true',
               'include-type-oids', 'true',
               'format-version', '2',
               'actions', pub.w2j_actions,
               'add-tables', pub.w2j_add_tables
             ) x
      ),
      slot_count AS (
        SELECT count(*)::bigint AS cnt
        FROM consumed
        WHERE consumed.w2j_add_tables <> ''
      ),
      rls_filtered AS (
        SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
        FROM consumed,
             realtime.apply_rls(
               wal := consumed.data::jsonb,
               max_record_bytes := max_record_bytes
             ) xyz(wal, is_rls_enabled, subscription_ids, errors)
        WHERE consumed.w2j_add_tables <> ''
          AND xyz.subscription_ids[1] IS NOT NULL
      )
      SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
      FROM rls_filtered rf, slot_count sc

      UNION ALL

      SELECT null, null, null, null, sc.cnt
      FROM slot_count sc
      WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
    $$;
    """)

    execute("ALTER FUNCTION realtime.settled_changes(name, integer, text[]) OWNER TO supabase_realtime_admin")

    execute("ALTER FUNCTION realtime.list_changes_sync(name, name, integer, integer) OWNER TO supabase_realtime_admin")
  end
end
