defmodule Realtime.Tenants.Migrations.EnableChannelsRls do
  @moduledoc false

  use Ecto.Migration

  def change do
    execute("ALTER TABLE realtime.channels ENABLE row level security")
  end
end
