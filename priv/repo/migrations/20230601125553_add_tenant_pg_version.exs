defmodule Supavisor.Repo.Migrations.AddTenantDefaultPS do
  use Ecto.Migration

  def up do
    alter table("tenants", prefix: "_supavisor") do
      add(:default_parameter_status, :map, null: false)
    end
  end

  def down do
    alter table("tenants", prefix: "_supavisor") do
      remove(:default_parameter_status)
    end
  end
end
