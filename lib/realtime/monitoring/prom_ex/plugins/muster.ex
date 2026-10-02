defmodule Realtime.PromEx.Plugins.Muster do
  @moduledoc """
  Polls `Forum.Muster` lifecycle state for the node's local scope.
  """

  use PromEx.Plugin

  @states [:ready, :converging, :rebalancing]

  @event_status [:prom_ex, :plugin, :muster, :status]

  @impl true
  def polling_metrics(opts) do
    poll_rate = Keyword.get(opts, :poll_rate)

    [
      metrics(poll_rate)
    ]
  end

  defp metrics(poll_rate) do
    Polling.build(
      :realtime_muster_events,
      poll_rate,
      {__MODULE__, :execute_metrics, []},
      [
        last_value(
          [:muster, :node_status],
          event_name: @event_status,
          description: "1 for the node's current Muster lifecycle state (ready/converging/rebalancing), 0 otherwise.",
          measurement: :value,
          tags: [:state]
        )
      ],
      detach_on_error: false
    )
  end

  def execute_metrics do
    scope = Application.get_env(:realtime, :muster_scope)
    current = Forum.Muster.status(scope)

    for state <- @states do
      :telemetry.execute(
        @event_status,
        %{value: if(state == current, do: 1, else: 0)},
        %{state: state}
      )
    end
  end
end
