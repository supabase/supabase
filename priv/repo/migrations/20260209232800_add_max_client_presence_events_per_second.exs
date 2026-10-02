defmodule Realtime.Repo.Migrations.AddMaxClientPresenceEventsPerSecond do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      add :max_client_presence_events_per_window, :integer, null: true
      add :client_presence_window_ms, :integer, null: true
    end
  end
end
