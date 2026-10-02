defmodule Supavisor.Repo.Migrations.AddFeatureFlagsToTenants do
  use Ecto.Migration

  def change do
    alter table(:tenants, prefix: "_supavisor") do
      add(:feature_flags, :map, default: %{})
    end
  end
end
