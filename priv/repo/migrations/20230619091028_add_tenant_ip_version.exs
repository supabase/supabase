defmodule Supavisor.Repo.Migrations.AddTenantIpVersion do
  use Ecto.Migration

  def up do
    alter table("tenants", prefix: "_supavisor") do
      add(:ip_version, :string, null: false, default: "auto")
    end

    create(
      constraint(
        "tenants",
        :ip_version_values,
        check: "ip_version IN ('auto', 'v4', 'v6')",
        prefix: "_supavisor"
      )
    )
  end

  def down do
    alter table("tenants", prefix: "_supavisor") do
      remove(:ip_version)
    end

    drop(constraint("tenants", "ip_version_values"))
  end
end
