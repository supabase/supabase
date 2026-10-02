defmodule Realtime.Tenants.Migrations.EnableRealtimeApplyRlsFunctionPostgrest9Compatibility do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("create or replace function realtime.apply_rls(wal jsonb, max_record_bytes int = 1024 * 1024)
      returns realtime.wal_rls
      language plpgsql
      volatile
    as $$
    declare
      -- Regclass of the table e.g. public.notes
      entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

      -- I, U, D, T: insert, update ...
      action realtime.action = (
        case wal ->> 'action'
          when 'I' then 'INSERT'
          when 'U' then 'UPDATE'
          when 'D' then 'DELETE'
          when 'T' then 'TRUNCATE'
          else 'ERROR'
        end
      );

      -- Is row level security enabled for the table
      is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

      -- Subscription vars
      user_id uuid;
      email varchar(255);
      user_has_access bool;
      is_visible_to_user boolean;
      visible_to_user_ids uuid[] = '{}';

      -- user subscriptions to the wal record's table
      subscriptions realtime.subscription[] =
        array_agg(sub)
        from
          realtime.subscription sub
        where
          sub.entity = entity_;

      -- structured info for wal's columns
      columns realtime.wal_column[] =
        array_agg(
          (
            x->>'name',
            x->>'type',
            realtime.cast((x->'value') #>> '{}', (x->>'type')::regtype),
            (pks ->> 'name') is not null,
            pg_catalog.has_column_privilege('authenticated', entity_, x->>'name', 'SELECT')
          )::realtime.wal_column
        )
        from
          jsonb_array_elements(wal -> 'columns') x
          left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

      -- previous identity values for update/delete
      old_columns realtime.wal_column[] =
        array_agg(
          (
            x->>'name',
            x->>'type',
            realtime.cast((x->'value') #>> '{}', (x->>'type')::regtype),
            (pks ->> 'name') is not null,
            pg_catalog.has_column_privilege('authenticated', entity_, x->>'name', 'SELECT')
          )::realtime.wal_column
        )
        from
          jsonb_array_elements(wal -> 'identity') x
          left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

      output jsonb;

      -- Error states
      error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;
      error_unauthorized boolean = not pg_catalog.has_any_column_privilege('authenticated', entity_, 'SELECT');

      errors text[] = case
        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
        else '{}'::text[]
      end;
    begin

      -- The 'authenticated' user does not have SELECT permission on any of the columns for the entity_
      if error_unauthorized is true then
        return (
          null,
          null,
          visible_to_user_ids,
          array['Error 401: Unauthorized']
        )::realtime.wal_rls;
      end if;

      -------------------------------
      -- Build Output JSONB Object --
      -------------------------------
      output = jsonb_build_object(
        'schema', wal ->> 'schema',
        'table', wal ->> 'table',
        'type', action,
        'commit_timestamp', (wal ->> 'timestamp')::text::timestamp with time zone,
        'columns', (
          select
            jsonb_agg(
              jsonb_build_object(
                'name', pa.attname,
                'type', pt.typname
              )
              order by pa.attnum asc
            )
            from
              pg_attribute pa
              join pg_type pt
                on pa.atttypid = pt.oid
            where
              attrelid = entity_
              and attnum > 0
              and pg_catalog.has_column_privilege('authenticated', entity_, pa.attname, 'SELECT')
        )
      )
      -- Add \"record\" key for insert and update
      || case
        when error_record_exceeds_max_size then jsonb_build_object('record', '{}'::jsonb)
        when action in ('INSERT', 'UPDATE') then
          jsonb_build_object(
            'record',
            (select jsonb_object_agg((c).name, (c).value) from unnest(columns) c where (c).is_selectable)
          )
        else '{}'::jsonb
      end
      -- Add \"old_record\" key for update and delete
      || case
        when error_record_exceeds_max_size then jsonb_build_object('old_record', '{}'::jsonb)
        when action in ('UPDATE', 'DELETE') then
          jsonb_build_object(
            'old_record',
            (select jsonb_object_agg((c).name, (c).value) from unnest(old_columns) c where (c).is_selectable)
          )
        else '{}'::jsonb
      end;

      if action in ('TRUNCATE', 'DELETE') then
        visible_to_user_ids = array_agg(s.user_id) from unnest(subscriptions) s;
      else
        -- If RLS is on and someone is subscribed to the table prep
        if is_rls_enabled and array_length(subscriptions, 1) > 0 then
          perform set_config('role', 'authenticated', true);
          if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
            deallocate walrus_rls_stmt;
          end if;
          execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);

        end if;

        -- For each subscribed user
        for user_id, email, is_visible_to_user in (
          select
            subs.user_id,
            subs.email,
            realtime.is_visible_through_filters(columns, subs.filters)
          from
            unnest(subscriptions) subs
        )
        loop
          if is_visible_to_user then
            -- If RLS is off, add to visible users
            if not is_rls_enabled then
              visible_to_user_ids = visible_to_user_ids || user_id;
            else
              -- Check if RLS allows the user to see the record
              perform
                set_config(
                  'request.jwt.claims',
                  jsonb_build_object(
                    'sub', user_id::text,
                    'email', email::text,
                    'role', 'authenticated'
                  )::text,
                  true
                );
              execute 'execute walrus_rls_stmt' into user_has_access;

              if user_has_access then
                visible_to_user_ids = visible_to_user_ids || user_id;
              end if;

              end if;
            end if;
        end loop;

        perform (
          set_config('role', null, true)
        );

    end if;

    return (
      output,
      is_rls_enabled,
      visible_to_user_ids,
      errors
    )::realtime.wal_rls;
  end;
  $$;")
  end
end
