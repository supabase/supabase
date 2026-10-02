defmodule Realtime.Tenants.Migrations.RealtimeSubscriptionLogged do
  @moduledoc false
  use Ecto.Migration

  # PG Updates doesn't allow us to use UNLOGGED tables due to the fact that Sequences on PG14 still need to be logged
  def change do
    execute("""
    -- Commented to have oriole compatability
    -- ALTER TABLE realtime.subscription SET LOGGED;
    """)
  end
end
