defmodule Realtime.Tenants.Migrations.CreateChannels do
  @moduledoc false

  use Ecto.Migration

  def change do
    create table(:channels, prefix: "realtime") do
      add(:name, :string, null: false)
      timestamps()
    end

    create unique_index(:channels, [:name], prefix: "realtime")
  end
end
