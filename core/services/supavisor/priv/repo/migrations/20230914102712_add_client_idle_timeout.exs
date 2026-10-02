defmodule Supavisor.Repo.Migrations.AddClientIdleTimeout do
  use Ecto.Migration

  def change do
    alter table("tenants", prefix: "_supavisor") do
      add(:client_idle_timeout, :integer, null: false, default: 0)
    end
  end
end
