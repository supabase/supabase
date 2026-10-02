defmodule Realtime.Tenants.Migrations.AddPresencesPoliciesTable do
  @moduledoc false

  use Ecto.Migration

  def change do
    create table(:presences) do
      add :channel_id, references(:channels, on_delete: :delete_all), null: false
      add :check, :boolean, default: false, null: false
      timestamps()
    end

    create unique_index(:presences, :channel_id)

    execute("ALTER TABLE realtime.presences ENABLE row level security")
    execute("GRANT SELECT ON realtime.presences TO postgres, anon, authenticated, service_role")
    execute("GRANT UPDATE ON realtime.presences TO postgres, anon, authenticated, service_role")

    execute("""
    GRANT INSERT ON realtime.presences TO postgres, anon, authenticated, service_role
    """)

    execute("""
    GRANT USAGE ON SEQUENCE realtime.presences_id_seq TO postgres, anon, authenticated, service_role
    """)
  end
end
