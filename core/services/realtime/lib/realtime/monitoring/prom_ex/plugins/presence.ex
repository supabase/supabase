defmodule Realtime.PromEx.Plugins.Presence do
  @moduledoc """
  Inter-node Presence traffic, measured on the receiving node.
  """

  use PromEx.Plugin

  @event_replication_received [:realtime, :presence, :replication, :received]

  @impl true
  def event_metrics(_opts) do
    Event.build(:realtime_presence_event_metrics, [
      sum(
        [:realtime, :presence, :replication, :received, :bytes],
        event_name: @event_replication_received,
        measurement: :size,
        unit: :byte,
        description: "Bytes (:erlang.external_size/1) of Presence state replication received from other nodes",
        tags: [:implementation]
      )
    ])
  end
end
