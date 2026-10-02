defmodule Realtime.Repo.Migrations.AddExtensionExternalIdIndex do
  use Ecto.Migration

  def change do
    create_if_not_exists index("extensions", [:tenant_external_id])
  end
end
