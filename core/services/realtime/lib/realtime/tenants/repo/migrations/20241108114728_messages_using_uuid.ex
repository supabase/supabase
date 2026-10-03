defmodule Realtime.Tenants.Migrations.MessagesUsingUuid do
  @moduledoc false
  use Ecto.Migration

  def change do
    alter table(:messages) do
      remove(:id)
      remove(:uuid)
      add(:id, :uuid, null: false, default: fragment("gen_random_uuid()"))
    end

    execute("ALTER TABLE realtime.messages ADD PRIMARY KEY (id, inserted_at)")
    execute("DROP SEQUENCE IF EXISTS realtime.messages_id_seq")
  end
end
