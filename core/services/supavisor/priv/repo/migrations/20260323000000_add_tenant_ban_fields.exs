defmodule Supavisor.Repo.Migrations.AddTenantBanFields do
  use Ecto.Migration

  def change do
    alter table(:tenants, prefix: "_supavisor") do
      add(:banned_at, :utc_datetime, null: true)
      add(:ban_reason, :string, null: true)
      add(:banned_until, :utc_datetime, null: true)
    end
  end
end
