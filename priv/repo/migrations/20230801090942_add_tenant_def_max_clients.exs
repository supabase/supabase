defmodule Supavisor.Repo.Migrations.AddTenantDefMaxClients do
  use Ecto.Migration

  def change do
    alter table("tenants", prefix: "_supavisor") do
      add(:default_max_clients, :integer, null: false, default: 1000)
    end
  end
end
