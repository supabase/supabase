defmodule Realtime.Tenants.Migrations.AddChannelsColumnForWriteCheck do
  @moduledoc false

  use Ecto.Migration

  def change do
    alter table(:channels, prefix: "realtime") do
      add :check, :boolean, default: false
    end
  end
end
