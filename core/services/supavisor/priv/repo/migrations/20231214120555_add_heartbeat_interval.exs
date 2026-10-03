defmodule Supavisor.Repo.Migrations.AddHeartbeatInterval do
  use Ecto.Migration

  def change do
    alter table("tenants", prefix: "_supavisor") do
      add(:client_heartbeat_interval, :integer, null: false, default: 60)
    end
  end
end
