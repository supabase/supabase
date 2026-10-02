defmodule Realtime.Repo.Migrations.AddExternalIdUniqIndex do
  use Ecto.Migration

  def change do
    execute("alter table tenants add constraint uniq_external_id unique (external_id)")
  end
end
