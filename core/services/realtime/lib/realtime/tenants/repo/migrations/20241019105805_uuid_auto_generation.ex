defmodule Realtime.Tenants.Migrations.UuidAutoGeneration do
  @moduledoc false
  use Ecto.Migration

  def change do
    execute("UPDATE realtime.messages SET uuid = gen_random_uuid() WHERE uuid IS NULL")

    execute("""
    ALTER TABLE realtime.messages
      ALTER COLUMN uuid SET DEFAULT gen_random_uuid(),
      ALTER COLUMN uuid SET NOT NULL
    """)
  end
end
