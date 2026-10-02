defmodule Realtime.Tenants.Migrations.RevertPostgrestFilterOps do
  @moduledoc """
  Additive revert of `AddPostgrestFilterOps` (20260616120000). We never edit shipped migrations,
  so this restores the walrus functions to their pre-20260616120000 definitions, drops the
  `negate` attribute added to `realtime.user_defined_filter`, and drops the 5-arg
  `check_equality_op` overload.

  The new `equality_op` enum values (`like`, `ilike`, `is`, `match`, `imatch`, `isdistinct`)
  cannot be removed in Postgres, so they remain; the reverted client no longer emits them.

  `realtime.subscription` is ephemeral (clients re-create their subscriptions on reconnect), so it
  is truncated before the type is altered back to its 3-field shape.
  """

  use Ecto.Migration

  def change do
    # Subscriptions are ephemeral. Clearing the table first keeps the type arity change below safe.
    execute("truncate realtime.subscription;")

    # Restore the original 4-arg check_equality_op (20230128025114). Untouched by the filter ops
    # migration, but recreated explicitly so the function matches the pre-revert source.
    execute("""
    create or replace function realtime.check_equality_op(
        op realtime.equality_op,
        type_ regtype,
        val_1 text,
        val_2 text
    )
        returns bool
        immutable
        language plpgsql
    as $$
    /*
    Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
    */
    declare
        op_symbol text = (
            case
                when op = 'eq' then '='
                when op = 'neq' then '!='
                when op = 'lt' then '<'
                when op = 'lte' then '<='
                when op = 'gt' then '>'
                when op = 'gte' then '>='
                when op = 'in' then '= any'
                else 'UNKNOWN OP'
            end
        );
        res boolean;
    begin
        execute format(
            'select %L::'|| type_::text || ' ' || op_symbol
            || ' ( %L::'
            || (
                case
                    when op = 'in' then type_::text || '[]'
                    else type_::text end
            )
            || ')', val_1, val_2) into res;
        return res;
    end;
    $$;
    """)

    # Restore is_visible_through_filters (20220908172859): inner join, bool_and, 4-arg
    # check_equality_op, no negate.
    execute("""
    create or replace function realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[])
      returns bool
      language sql
      immutable
    as $$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $$;
    """)

    # Restore subscription_check_filters (20260606110000): pg_attribute based, no new operators,
    # filters ordered without negate.
    execute("""
    create or replace function realtime.subscription_check_filters()
        returns trigger
        language plpgsql
    as $$
    declare
        col_names text[] = coalesce(
                array_agg(a.attname order by a.attnum),
                '{}'::text[]
            )
            from
                pg_catalog.pg_attribute a
            where
                a.attrelid = new.entity
                and a.attnum > 0
                and not a.attisdropped
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    a.attrelid,
                    a.attnum,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;
        in_val jsonb;
        selected_col text;
    begin
        for filter in select * from unnest(new.filters) loop
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

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
                perform realtime.cast(filter.value, col_type);
            end if;
        end loop;

        if new.selected_columns is not null then
            for selected_col in select * from unnest(new.selected_columns) loop
                if not selected_col = any(col_names) then
                    raise exception 'invalid column for select %', selected_col;
                end if;
            end loop;
        end if;

        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        new.selected_columns = (
            select array_agg(c order by c)
            from unnest(new.selected_columns) c
        );

        return new;
    end;
    $$;
    """)

    # Restore apply_rls (20260527120000): uses is_visible_through_filters without negate.
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

    # Drop the negate-aware 5-arg overload added by the filter ops migration.
    execute("drop function if exists realtime.check_equality_op(realtime.equality_op, regtype, text, text, boolean);")

    execute("""
    do $$
    begin
        if exists (select 1 from pg_extension where extname = 'orioledb') then
            execute 'drop index if exists realtime.subscription_subscription_id_entity_filters_action_filter_selected_columns_key';
        end if;
    end $$;
    """)

    # Drop the `negate` attribute so realtime.user_defined_filter is back to 3 fields. Guard on
    # pg_attribute for idempotency. CASCADE because the type backs the `filters` column.
    execute("""
    do $$
    begin
        if exists (
            select 1
            from pg_type ty
            join pg_class c on c.oid = ty.typrelid
            join pg_attribute a on a.attrelid = c.oid
            join pg_namespace n on n.oid = ty.typnamespace
            where n.nspname = 'realtime'
              and ty.typname = 'user_defined_filter'
              and a.attname = 'negate'
              and not a.attisdropped
        ) then
            alter type realtime.user_defined_filter drop attribute negate cascade;
        end if;
    end $$;
    """)

    execute("""
    do $$
    begin
        if exists (select 1 from pg_extension where extname = 'orioledb') then
            execute 'create unique index if not exists subscription_subscription_id_entity_filters_action_filter_selected_columns_key on realtime.subscription (subscription_id, entity, filters, action_filter, coalesce(selected_columns, ''{}''))';
        end if;
    end $$;
    """)
  end
end
