defmodule Realtime.Repo.Migrations.AlterExtensionsTableColumnsToText do
  use Ecto.Migration

  def change do
    alter table(:extensions) do
      modify :type, :text
      modify :tenant_external_id, :text
    end
  end
end
