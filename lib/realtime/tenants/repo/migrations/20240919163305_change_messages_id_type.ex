defmodule Realtime.Tenants.Migrations.ChangeMessagesIdType do
  @moduledoc false
  use Ecto.Migration

  def change do
    alter table(:messages) do
      add_if_not_exists :uuid, :uuid
    end
  end
end
