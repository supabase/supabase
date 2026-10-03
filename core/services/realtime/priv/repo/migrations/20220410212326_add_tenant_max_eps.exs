defmodule Realtime.Repo.Migrations.AddTenantMaxEps do
  use Ecto.Migration

  def up do
    alter table("tenants") do
      add(:max_events_per_second, :integer, default: 10_000)
    end
  end

  def down do
    alter table("tenants") do
      remove(:max_events_per_second)
    end
  end
end
