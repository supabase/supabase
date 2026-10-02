defmodule Realtime.Tenants.Migrations.SetRequiredGrants do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("""
    GRANT USAGE ON SCHEMA realtime TO postgres, anon, authenticated, service_role
    """)

    execute("""
    GRANT SELECT ON ALL TABLES IN SCHEMA realtime TO postgres, anon, authenticated, service_role
    """)

    execute("""
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA realtime TO postgres, anon, authenticated, service_role
    """)

    execute("""
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA realtime TO postgres, anon, authenticated, service_role
    """)
  end
end
