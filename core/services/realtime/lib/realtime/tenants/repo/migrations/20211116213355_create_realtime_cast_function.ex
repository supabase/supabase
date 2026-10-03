defmodule Realtime.Tenants.Migrations.CreateRealtimeCastFunction do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("create or replace function realtime.cast(val text, type_ regtype)
      returns jsonb
      immutable
      language plpgsql
    as $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;")
  end
end
