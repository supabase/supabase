defmodule Realtime.Repo.Migrations.SetCurrentMaxEventsPerSecond do
  use Ecto.Migration

  def change do
    execute(
      "update tenants set max_events_per_second = 1000",
      "update tenants set max_events_per_second = 10000"
    )
  end
end
