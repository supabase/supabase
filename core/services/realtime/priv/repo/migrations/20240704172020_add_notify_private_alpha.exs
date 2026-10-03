defmodule :"Elixir.Realtime.Repo.Migrations.Add-notify-private-alpha" do
  use Ecto.Migration

  def change do
    alter table(:tenants) do
      add :notify_private_alpha, :boolean, default: false
    end
  end
end
