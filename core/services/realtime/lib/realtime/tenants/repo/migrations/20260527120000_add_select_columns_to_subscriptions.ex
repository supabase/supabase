defmodule Realtime.Tenants.Migrations.AddSelectColumnsToSubscriptions do
  @moduledoc false
  use Ecto.Migration

  def up do
    execute("TRUNCATE TABLE realtime.subscription;")

    execute("""
    DROP INDEX IF EXISTS
      realtime.subscription_subscription_id_entity_filters_action_filter_key;
    """)

    execute("""
    ALTER TABLE realtime.subscription
    ADD COLUMN IF NOT EXISTS selected_columns text[] DEFAULT null;
    """)

    execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS
      subscription_subscription_id_entity_filters_action_filter_selected_columns_key
    ON realtime.subscription
      (subscription_id, entity, filters, action_filter, coalesce(selected_columns, '{}'));
    """)

    execute("""
    create or replace function realtime.subscription_check_filters()
        returns trigger
        language plpgsql
    as $$
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        table_col_names text[] = coalesce(
                array_agg(pa.attname),
                '{}'::text[]
            )
            from
                pg_attribute pa
            where
                pa.attrelid = new.entity
                and pa.attnum > 0;
        filter realtime.user_defined_filter;
        col_type regtype;
        in_val jsonb;
        selected_col text;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;
        end loop;

        -- Validate that selected_columns reference columns the role can SELECT
        if new.selected_columns is not null then
            for selected_col in select * from unnest(new.selected_columns) loop
                if not selected_col = any(col_names) then
                    raise exception 'invalid column for select %', selected_col;
                end if;
            end loop;
        end if;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        -- Normalize selected_columns order so ARRAY['a','b'] and ARRAY['b','a'] are
        -- treated as the same subscription group in apply_rls
        new.selected_columns = (
            select array_agg(c order by c)
            from unnest(new.selected_columns) c
        );

        return new;
    end;
    $$;
    """)

    execute("""
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
                subs.entity = entity_
                -- Filter by action early - only get subscriptions interested in this action
                -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
                and (subs.action_filter = '*' or subs.action_filter = action::text);

        -- Subscription vars
        working_role regrole;
        working_selected_columns text[];
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

        -- Loop record for iterating unique roles (outer loop)
        role_record record;
        -- Loop record for iterating unique selected_columns within a role (inner loop)
        cols_record record;
        -- Subscription ids visible at the role level (before fanning out by selected_columns)
        visible_role_sub_ids uuid[] = '{}';

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
                        coalesce(
                            (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                            (x->>'type')::regtype
                        )
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
                        coalesce(
                            (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                            (x->>'type')::regtype
                        )
                    ),
                    (pks ->> 'name') is not null,
                    true
                )::realtime.wal_column
            )
            from
                jsonb_array_elements(wal -> 'identity') x
                left join jsonb_array_elements(wal -> 'pk') pks
                    on (x ->> 'name') = (pks ->> 'name');

        for role_record in
            select claims_role
            from (select distinct claims_role from unnest(subscriptions)) t
            order by claims_role::text
        loop
            working_role := role_record.claims_role;

            -- Update `is_selectable` for columns and old_columns (once per role)
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
                -- Fan out 400 error per distinct selected_columns for this role
                for cols_record in
                    select selected_columns
                    from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                    order by coalesce(array_to_string(selected_columns, ','), '')
                loop
                    working_selected_columns := cols_record.selected_columns;
                    return next (
                        jsonb_build_object(
                            'schema', wal ->> 'schema',
                            'table', wal ->> 'table',
                            'type', action
                        ),
                        is_rls_enabled,
                        (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                        array['Error 400: Bad Request, no primary key']
                    )::realtime.wal_rls;
                end loop;

            -- The claims role does not have SELECT permission to the primary key of entity
            elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
                -- Fan out 401 error per distinct selected_columns for this role
                for cols_record in
                    select selected_columns
                    from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                    order by coalesce(array_to_string(selected_columns, ','), '')
                loop
                    working_selected_columns := cols_record.selected_columns;
                    return next (
                        jsonb_build_object(
                            'schema', wal ->> 'schema',
                            'table', wal ->> 'table',
                            'type', action
                        ),
                        is_rls_enabled,
                        (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                        array['Error 401: Unauthorized']
                    )::realtime.wal_rls;
                end loop;

            else
                -- Create the prepared statement (once per role)
                if is_rls_enabled and action <> 'DELETE' then
                    if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                        deallocate walrus_rls_stmt;
                    end if;
                    execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
                end if;

                -- Collect all visible subscription IDs for this role (filter check + RLS check)
                visible_role_sub_ids = '{}';

                for subscription_id, claims in (
                        select
                            subs.subscription_id,
                            subs.claims
                        from
                            unnest(subscriptions) subs
                        where
                            subs.entity = entity_
                            and subs.claims_role = working_role
                            and (
                                realtime.is_visible_through_filters(columns, subs.filters)
                                or (
                                  action = 'DELETE'
                                  and realtime.is_visible_through_filters(old_columns, subs.filters)
                                )
                            )
                ) loop

                    if not is_rls_enabled or action = 'DELETE' then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    else
                        -- Check if RLS allows the role to see the record
                        perform
                            -- Trim leading and trailing quotes from working_role because set_config
                            -- doesn't recognize the role as valid if they are included
                            set_config('role', trim(both '"' from working_role::text), true),
                            set_config('request.jwt.claims', claims::text, true);

                        execute 'execute walrus_rls_stmt' into subscription_has_access;

                        if subscription_has_access then
                            visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                        end if;
                    end if;
                end loop;

                perform set_config('role', null, true);

                -- Inner loop: per distinct selected_columns for this role
                for cols_record in
                    select selected_columns
                    from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                    order by coalesce(array_to_string(selected_columns, ','), '')
                loop
                    working_selected_columns := cols_record.selected_columns;

                    output = jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action,
                        'commit_timestamp', to_char(
                            ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                            'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
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
                                left join (
                                    select unnest(conkey) as pkey_attnum
                                    from pg_constraint
                                    where conrelid = entity_ and contype = 'p'
                                ) pk on pk.pkey_attnum = pa.attnum
                            where
                                attrelid = entity_
                                and attnum > 0
                                and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                                and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                        )
                    )
                    -- Add "record" key for insert and update
                    || case
                        when action in ('INSERT', 'UPDATE') then
                            jsonb_build_object(
                                'record',
                                (
                                    select
                                        jsonb_object_agg(
                                            -- if unchanged toast, get column name and value from old record
                                            coalesce((c).name, (oc).name),
                                            case
                                                when (c).name is null then (oc).value
                                                else (c).value
                                            end
                                        )
                                    from
                                        unnest(columns) c
                                        full outer join unnest(old_columns) oc
                                            on (c).name = (oc).name
                                    where
                                        coalesce((c).is_selectable, (oc).is_selectable)
                                        and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                        else '{}'::jsonb
                    end
                    -- Add "old_record" key for update and delete
                    || case
                        when action = 'UPDATE' then
                            jsonb_build_object(
                                    'old_record',
                                    (
                                        select jsonb_object_agg((c).name, (c).value)
                                        from unnest(old_columns) c
                                        where
                                            (c).is_selectable
                                            and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    )
                                )
                        when action = 'DELETE' then
                            jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                        and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                                )
                            )
                        else '{}'::jsonb
                    end;

                    -- Filter visible_role_sub_ids to those matching the current selected_columns group
                    visible_to_subscription_ids = coalesce(
                        (
                            select array_agg(s.subscription_id)
                            from unnest(subscriptions) s
                            where s.claims_role = working_role
                              and (s.selected_columns is not distinct from working_selected_columns)
                              and s.subscription_id = any(visible_role_sub_ids)
                        ),
                        '{}'::uuid[]
                    );

                    return next (
                        output,
                        is_rls_enabled,
                        visible_to_subscription_ids,
                        case
                            when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                            else '{}'
                        end
                    )::realtime.wal_rls;
                end loop;

            end if;
        end loop;

        perform set_config('role', null, true);
    end;
    $$;
    """)
  end
end
