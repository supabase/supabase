defmodule Realtime.Tenants.Migrations.UpdateRealtimeSubscriptionCheckFiltersFunctionSecurity do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("create or replace function realtime.subscription_check_filters()
      returns trigger
      language plpgsql
    as $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that 'authenticated' may access
    - values are coercable to the correct column type
    */
    declare
      col_names text[] = coalesce(
        array_agg(c.column_name order by c.ordinal_position),
        '{}'::text[]
      )
        from
          information_schema.columns c
        where
          (quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass = new.entity
          and pg_catalog.has_column_privilege('authenticated', new.entity, c.column_name, 'SELECT');
      filter realtime.user_defined_filter;
      col_type regtype;
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
        -- raises an exception if value is not coercable to type
        perform realtime.cast(filter.value, col_type);
      end loop;

      -- Apply consistent order to filters so the unique constraint on
      -- (user_id, entity, filters) can't be tricked by a different filter order
      new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value),
        '{}'
      ) from unnest(new.filters) f;

      return new;
    end;
    $$;")
  end
end
