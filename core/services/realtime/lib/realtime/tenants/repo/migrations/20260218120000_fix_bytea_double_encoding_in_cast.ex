defmodule Realtime.Tenants.Migrations.FixByteaDoubleEncodingInCast do
  @moduledoc false

  use Ecto.Migration

  def up do
    execute """
    create or replace function realtime.cast(val text, type_ regtype)
      returns jsonb
      immutable
      language plpgsql
    as $$
    declare
      res jsonb;
    begin
      if type_::text = 'bytea' then
        return to_jsonb(val);
      end if;
      execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
      return res;
    end
    $$;
    """
  end

  def down do
    execute """
    create or replace function realtime.cast(val text, type_ regtype)
      returns jsonb
      immutable
      language plpgsql
    as $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
      return res;
    end
    $$;
    """
  end
end
