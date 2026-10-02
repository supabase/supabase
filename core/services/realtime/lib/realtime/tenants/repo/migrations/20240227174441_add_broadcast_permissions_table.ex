defmodule Realtime.Tenants.Migrations.AddBroadcastsPoliciesTable do
  @moduledoc false

  use Ecto.Migration

  def change do
    create table(:broadcasts) do
      add :channel_id, references(:channels, on_delete: :delete_all), null: false
      add :check, :boolean, default: false, null: false
      timestamps()
    end

    create unique_index(:broadcasts, :channel_id)

    execute("ALTER TABLE realtime.broadcasts ENABLE row level security")
    execute("GRANT SELECT ON realtime.broadcasts TO postgres, anon, authenticated, service_role")
    execute("GRANT UPDATE ON realtime.broadcasts TO postgres, anon, authenticated, service_role")
  end
end
