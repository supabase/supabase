defmodule :"Elixir.Realtime.Repo.Migrations.Add-tenant-suspend-flag" do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      add :suspend, :boolean, default: false
    end
  end
end
