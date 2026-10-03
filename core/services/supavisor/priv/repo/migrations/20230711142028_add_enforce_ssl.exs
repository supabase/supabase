defmodule Supavisor.Repo.Migrations.AddEnforceSsl do
  use Ecto.Migration

  def up do
    alter table("tenants", prefix: "_supavisor") do
      add(:enforce_ssl, :boolean, null: false, default: false)
    end
  end

  def down do
    alter table("tenants", prefix: "_supavisor") do
      remove(:enforce_ssl)
    end
  end
end
