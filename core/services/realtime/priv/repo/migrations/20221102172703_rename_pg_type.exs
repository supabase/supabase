defmodule Realtime.Repo.Migrations.RenamePgType do
  use Ecto.Migration

  def up do
    execute("update extensions set type = 'postgres_cdc_rls'")
  end

  def down do
    execute("update extensions set type = 'postgres'")
  end
end
