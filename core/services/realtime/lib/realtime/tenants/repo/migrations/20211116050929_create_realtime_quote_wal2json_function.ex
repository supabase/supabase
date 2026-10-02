defmodule Realtime.Tenants.Migrations.CreateRealtimeQuoteWal2jsonFunction do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("create or replace function realtime.quote_wal2json(entity regclass)
      returns text
      language sql
      immutable
      strict
    as $$
      select
        (
          select string_agg('\' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '\"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '\"'
            )
        )
        || '.'
        || (
          select string_agg('\' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '\"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '\"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;")
  end
end
