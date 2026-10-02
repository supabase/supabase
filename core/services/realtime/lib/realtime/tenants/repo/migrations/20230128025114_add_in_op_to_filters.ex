defmodule Realtime.Tenants.Migrations.AddInOpToFilters do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("alter type realtime.equality_op add value 'in';")

    execute("
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
    ")

    execute("
      create or replace function realtime.subscription_check_filters()
          returns trigger
          language plpgsql
      as $$
      /*
      Validates that the user defined filters for a subscription:
      - refer to valid columns that the claimed role may access
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
                  format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                  and pg_catalog.has_column_privilege(
                      (new.claims ->> 'role'),
                      format('%I.%I', c.table_schema, c.table_name)::regclass,
                      c.column_name,
                      'SELECT'
                  );
          filter realtime.user_defined_filter;
          col_type regtype;

          in_val jsonb;
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

              -- Set maximum number of entries for in filter
              if filter.op = 'in'::realtime.equality_op then
                  in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                  if coalesce(jsonb_array_length(in_val), 0) > 100 then
                      raise exception 'too many values for `in` filter. Maximum 100';
                  end if;
              end if;

              -- raises an exception if value is not coercable to type
              perform realtime.cast(filter.value, col_type);
          end loop;

          -- Apply consistent order to filters so the unique constraint on
          -- (subscription_id, entity, filters) can't be tricked by a different filter order
          new.filters = coalesce(
              array_agg(f order by f.column_name, f.op, f.value),
              '{}'
          ) from unnest(new.filters) f;

          return new;
      end;
      $$;
    ")
  end
end
