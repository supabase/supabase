defmodule Realtime.PromEx.Plugins.Channels do
  @moduledoc """
  Realtime channels monitoring plugin for PromEx
  """
  use PromEx.Plugin
  @impl true
  def event_metrics(_opts) do
    Event.build(:realtime, [
      counter(
        [:realtime, :channel, :error],
        event_name: [:realtime, :channel, :error],
        measurement: :count,
        tags: [:code, :tenant],
        description: "Count of errors in the Realtime channels initialization"
      )
    ])
  end
end
