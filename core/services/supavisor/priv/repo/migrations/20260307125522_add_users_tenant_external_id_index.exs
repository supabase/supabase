defmodule Supavisor.Repo.Migrations.AddUsersTenantExternalIdIndex do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    create_if_not_exists index(:users, [:tenant_external_id],
                           prefix: "_supavisor",
                           concurrently: true
                         )
  end
end
