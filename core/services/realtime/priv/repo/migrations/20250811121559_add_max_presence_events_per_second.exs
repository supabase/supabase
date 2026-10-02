defmodule Realtime.Repo.Migrations.AddMaxPresenceEventsPerSecond do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      add :max_presence_events_per_second, :integer, default: 10000
      add :max_payload_size_in_kb, :integer, default: 3000
    end
  end
end
