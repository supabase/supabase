defmodule RealtimeWeb.Channels.Payloads.Broadcast do
  @moduledoc """
  Validate broadcast field of the join payload.
  """
  use Ecto.Schema
  import Ecto.Changeset
  alias RealtimeWeb.Channels.Payloads.Join
  alias RealtimeWeb.Channels.Payloads.FlexibleBoolean

  embedded_schema do
    field :ack, FlexibleBoolean, default: false
    field :self, FlexibleBoolean, default: false
    field :replication_ready, FlexibleBoolean, default: false
    embeds_one :replay, RealtimeWeb.Channels.Payloads.Broadcast.Replay
  end

  def changeset(broadcast, attrs) do
    broadcast
    |> cast(attrs, [:ack, :self, :replication_ready], message: &Join.error_message/2)
    |> cast_embed(:replay, invalid_message: "unable to parse, expected a map")
  end
end
