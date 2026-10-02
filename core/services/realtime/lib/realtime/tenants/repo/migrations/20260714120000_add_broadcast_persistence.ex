defmodule Realtime.Tenants.Migrations.AddBroadcastPersistence do
  @moduledoc false
  use Ecto.Migration

  def up do
    execute("ALTER TABLE realtime.messages ADD COLUMN IF NOT EXISTS skip_broadcast boolean NOT NULL DEFAULT false")
  end

  def down do
    execute("ALTER TABLE realtime.messages DROP COLUMN IF EXISTS skip_broadcast")
  end
end
