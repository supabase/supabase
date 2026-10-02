defmodule Realtime.Tenants.Migrations.LoggedMessagesTable do
  @moduledoc false
  use Ecto.Migration

  def change do
    execute """
    -- Commented to have oriole compatability
    -- ALTER TABLE realtime.messages SET LOGGED;
    """
  end
end
