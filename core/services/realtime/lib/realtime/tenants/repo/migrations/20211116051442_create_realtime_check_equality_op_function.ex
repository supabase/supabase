defmodule Realtime.Tenants.Migrations.CreateRealtimeCheckEqualityOpFunction do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("create or replace function realtime.check_equality_op(
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
          else 'UNKNOWN OP'
        end
      );
      res boolean;
    begin
      execute format('select %L::'|| type_::text || ' ' || op_symbol || ' %L::'|| type_::text, val_1, val_2) into res;
      return res;
    end;
    $$;")
  end
end
