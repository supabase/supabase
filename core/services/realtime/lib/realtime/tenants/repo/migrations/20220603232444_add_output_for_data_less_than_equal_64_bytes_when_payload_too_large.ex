defmodule Realtime.Tenants.Migrations.AddOutputForDataLessThanEqual64BytesWhenPayloadTooLarge do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("
      create or replace function realtime.apply_rls(wal jsonb, max_record_bytes int = 1024 * 1024)
          returns setof realtime.wal_rls
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
                  else 'ERROR'
              end
          );
          -- Is row level security enabled for the table
          is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;
          subscriptions realtime.subscription[] = array_agg(subs)
              from
                  realtime.subscription subs
              where
                  subs.entity = entity_;
          -- Subscription vars
          roles regrole[] = array_agg(distinct us.claims_role)
              from
                  unnest(subscriptions) us;
          working_role regrole;
          claimed_role regrole;
          claims jsonb;
          subscription_id uuid;
          subscription_has_access bool;
          visible_to_subscription_ids uuid[] = '{}';
          -- structured info for wal's columns
          columns realtime.wal_column[];
          -- previous identity values for update/delete
          old_columns realtime.wal_column[];

          error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

          -- Primary jsonb output for record
          output jsonb;

      begin
          perform set_config('role', null, true);

          columns =
              array_agg(
                  (
                      x->>'name',
                      x->>'type',
                      x->>'typeoid',
                      realtime.cast(
                          (x->'value') #>> '{}',
                          (x->>'typeoid')::regtype
                      ),
                      (pks ->> 'name') is not null,
                      true
                  )::realtime.wal_column
              )
              from
                  jsonb_array_elements(wal -> 'columns') x
                  left join jsonb_array_elements(wal -> 'pk') pks
                      on (x ->> 'name') = (pks ->> 'name');

          old_columns =
              array_agg(
                  (
                      x->>'name',
                      x->>'type',
                      x->>'typeoid',
                      realtime.cast(
                          (x->'value') #>> '{}',
                          (x->>'typeoid')::regtype
                      ),
                      (pks ->> 'name') is not null,
                      true
                  )::realtime.wal_column
              )
              from
                  jsonb_array_elements(wal -> 'identity') x
                  left join jsonb_array_elements(wal -> 'pk') pks
                      on (x ->> 'name') = (pks ->> 'name');

          for working_role in select * from unnest(roles) loop

              -- Update `is_selectable` for columns and old_columns
              columns =
                  array_agg(
                      (
                          c.name,
                          c.type_name,
                          c.type_oid,
                          c.value,
                          c.is_pkey,
                          pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                      )::realtime.wal_column
                  )
                  from
                      unnest(columns) c;

              old_columns =
                      array_agg(
                          (
                              c.name,
                              c.type_name,
                              c.type_oid,
                              c.value,
                              c.is_pkey,
                              pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                          )::realtime.wal_column
                      )
                      from
                          unnest(old_columns) c;

              if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
                  return next (
                      jsonb_build_object(
                          'schema', wal ->> 'schema',
                          'table', wal ->> 'table',
                          'type', action
                      ),
                      is_rls_enabled,
                      -- subscriptions is already filtered by entity
                      (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
                      array['Error 400: Bad Request, no primary key']
                  )::realtime.wal_rls;

              -- The claims role does not have SELECT permission to the primary key of entity
              elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
                  return next (
                      jsonb_build_object(
                          'schema', wal ->> 'schema',
                          'table', wal ->> 'table',
                          'type', action
                      ),
                      is_rls_enabled,
                      (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
                      array['Error 401: Unauthorized']
                  )::realtime.wal_rls;

              else
                  output = jsonb_build_object(
                      'schema', wal ->> 'schema',
                      'table', wal ->> 'table',
                      'type', action,
                      'commit_timestamp', to_char(
                          (wal ->> 'timestamp')::timestamptz,
                          'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"'
                      ),
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
                              and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                      )
                  )
                  -- Add \"record\" key for insert and update
                  || case
                      when action in ('INSERT', 'UPDATE') then
                          case
                              when error_record_exceeds_max_size then
                                  jsonb_build_object(
                                      'record',
                                      (
                                          select jsonb_object_agg((c).name, (c).value)
                                          from unnest(columns) c
                                          where (c).is_selectable and (octet_length((c).value::text) <= 64)
                                      )
                                  )
                              else
                                  jsonb_build_object(
                                      'record',
                                      (select jsonb_object_agg((c).name, (c).value) from unnest(columns) c where (c).is_selectable)
                                  )
                          end
                      else '{}'::jsonb
                  end
                  -- Add \"old_record\" key for update and delete
                  || case
                      when action in ('UPDATE', 'DELETE') then
                          case
                              when error_record_exceeds_max_size then
                                  jsonb_build_object(
                                      'old_record',
                                      (
                                          select jsonb_object_agg((c).name, (c).value)
                                          from unnest(old_columns) c
                                          where (c).is_selectable and (octet_length((c).value::text) <= 64)
                                      )
                                  )
                              else
                                  jsonb_build_object(
                                      'old_record',
                                      (select jsonb_object_agg((c).name, (c).value) from unnest(old_columns) c where (c).is_selectable)
                                  )
                          end
                      else '{}'::jsonb
                  end;

                  -- Create the prepared statement
                  if is_rls_enabled and action <> 'DELETE' then
                      if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                          deallocate walrus_rls_stmt;
                      end if;
                      execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
                  end if;

                  visible_to_subscription_ids = '{}';

                  for subscription_id, claims in (
                          select
                              subs.subscription_id,
                              subs.claims
                          from
                              unnest(subscriptions) subs
                          where
                              subs.entity = entity_
                              and subs.claims_role = working_role
                              and realtime.is_visible_through_filters(columns, subs.filters)
                  ) loop

                      if not is_rls_enabled or action = 'DELETE' then
                          visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                      else
                          -- Check if RLS allows the role to see the record
                          perform
                              set_config('role', working_role::text, true),
                              set_config('request.jwt.claims', claims::text, true);

                          execute 'execute walrus_rls_stmt' into subscription_has_access;

                          if subscription_has_access then
                              visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                          end if;
                      end if;
                  end loop;

                  perform set_config('role', null, true);

                  return next (
                      output,
                      is_rls_enabled,
                      visible_to_subscription_ids,
                      case
                          when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                          else '{}'
                      end
                  )::realtime.wal_rls;

              end if;
          end loop;

          perform set_config('role', null, true);
      end;
      $$;
    ")
  end
end
