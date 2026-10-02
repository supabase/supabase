defmodule Realtime.Repo.Migrations.AddLimitsFieldsToTenants do
  use Ecto.Migration

  def change do
    alter table("tenants") do
      add(:max_bytes_per_second, :integer, default: 100_000, null: false)
      add(:max_channels_per_client, :integer, default: 100, null: false)
      add(:max_joins_per_second, :integer, default: 500, null: false)
    end
  end
end
