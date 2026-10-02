defmodule RealtimeWeb.Channels.Payloads.PostgresChange do
  @moduledoc """
  Validate postgres_changes field of the join payload.
  """
  use Ecto.Schema
  import Ecto.Changeset
  alias RealtimeWeb.Channels.Payloads.Join

  embedded_schema do
    field :event, :string
    field :schema, :string
    field :table, :string
    field :filter, :string
  end

  def changeset(postgres_change, attrs) do
    cast(postgres_change, attrs, [:event, :schema, :table, :filter], message: &Join.error_message/2)
  end
end
