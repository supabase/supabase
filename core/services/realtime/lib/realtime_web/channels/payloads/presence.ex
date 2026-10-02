defmodule RealtimeWeb.Channels.Payloads.Presence do
  @moduledoc """
  Validate presence field of the join payload.
  """
  use Ecto.Schema
  import Ecto.Changeset
  alias RealtimeWeb.Channels.Payloads.Join
  alias RealtimeWeb.Channels.Payloads.FlexibleBoolean

  embedded_schema do
    field :enabled, FlexibleBoolean, default: false
    field :key, :any, virtual: true
  end

  def changeset(presence, attrs) do
    cast(presence, attrs, [:enabled, :key], message: &Join.error_message/2)
  end
end
