defmodule Realtime.Repo.Migrations.NewMaxEventsPerSecondDefault do
  use Ecto.Migration

  def change do
    alter table("tenants") do
      modify(:max_events_per_second, :integer, null: false, default: 1_000)
    end
  end
end
