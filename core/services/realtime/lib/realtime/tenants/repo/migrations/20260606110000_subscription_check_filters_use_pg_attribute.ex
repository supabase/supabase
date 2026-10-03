defmodule Realtime.Tenants.Migrations.SubscriptionCheckFiltersUsePgAttribute do
  @moduledoc false

  use Ecto.Migration

  def change do
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
  end
end
