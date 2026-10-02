defmodule Realtime.Tenants.Migrations.CreateMessagesReplayIndex do
  @moduledoc false

  use Ecto.Migration

  def change do
    create_if_not_exists index(:messages, [{:desc, :inserted_at}, :topic],
                           where: "extension = 'broadcast' and private IS TRUE"
                         )
  end
end
