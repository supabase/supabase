defmodule Realtime.PromEx.Plugins.Tenants do
  @moduledoc false

  use PromEx.Plugin

  alias PromEx.MetricTypes.Event
  alias Realtime.Tenants.Connect

  defmodule Buckets do
    @moduledoc false
    use Peep.Buckets.Custom, buckets: [10, 250, 5000, 15_000]
  end

  @event_connected [:prom_ex, :plugin, :realtime, :tenants, :connected]

  @impl true
  def event_metrics(_) do
    Event.build(:realtime, [
      distribution(
        [:realtime, :global, :rpc],
        event_name: [:realtime, :rpc],
        description: "Global Latency of rpc calls",
        measurement: :latency,
        unit: {:microsecond, :millisecond},
        tags: [:success, :mechanism],
        reporter_options: [peep_bucket_calculator: Buckets]
      )
    ])
  end

  @impl true
  def polling_metrics(opts) do
    poll_rate = Keyword.get(opts, :poll_rate)

    [
      Polling.build(
        :realtime_tenants_events,
        poll_rate,
        {__MODULE__, :execute_metrics, []},
        [
          last_value(
            [:realtime, :tenants, :connected],
            event_name: @event_connected,
            description: "The total count of connected tenants.",
            measurement: :connected
          )
        ],
        detach_on_error: false
      )
    ]
  end

  def execute_metrics do
    connected =
      if Enum.member?(:syn.node_scopes(), Connect),
        do: :syn.local_registry_count(Connect),
        else: -1

    execute_metrics(@event_connected, %{connected: connected})
  end

  defp execute_metrics(event, metrics) do
    :telemetry.execute(event, metrics, %{})
  end
end
