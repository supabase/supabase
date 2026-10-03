defmodule Realtime.Tenants.Migrations.RemoveCheckColumns do
  @moduledoc false

  use Ecto.Migration

  def change do
    alter table(:channels) do
      remove :check
    end

    alter table(:broadcasts) do
      remove :check
    end

    alter table(:presences) do
      remove :check
    end
  end
end
