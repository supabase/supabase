defmodule Realtime.PromEx.Plugins.TenantGlobal do
  @moduledoc """
  Global aggregated variants of per-tenant metrics.

  Subscribes to the same telemetry events as the Tenant plugin but records
  metrics without the tenant tag, enabling cluster-wide aggregation.
  These live on the global endpoint (/metrics) for high-priority scraping.
  """

  use PromEx.Plugin
  alias Realtime.PromEx.Plugins.Tenant
  alias Realtime.Telemetry
  alias Realtime.UsersCounter

  @global_connections_event [:prom_ex, :plugin, :realtime, :connections, :global]

  @impl true
  def polling_metrics(opts) do
    poll_rate = Keyword.get(opts, :poll_rate, 5_000)

    [
      Polling.build(
        :realtime_global_connections,
        poll_rate,
        {__MODULE__, :execute_global_connection_metrics, []},
        [
          last_value(
            [:realtime, :connections, :global, :connected],
            event_name: @global_connections_event,
            description: "The node total count of connected clients across all tenants.",
            measurement: :connected
          ),
          last_value(
            [:realtime, :connections, :global, :connected_cluster],
            event_name: @global_connections_event,
            description: "The cluster total count of connected clients across all tenants.",
            measurement: :connected_cluster
          )
        ],
        detach_on_error: false
      )
    ]
  end

  @impl true
  def event_metrics(_opts) do
    [
      channel_global_events(),
      payload_global_size_metrics(),
      broadcast_fanout_global_metrics()
    ]
  end

  defp broadcast_fanout_global_metrics do
    Event.build(
      :realtime_global_broadcast_fanout_metrics,
      [
        counter(
          [:realtime, :broadcast, :global, :fanout, :node_delivery, :total],
          event_name: [:realtime, :broadcast, :fanout, :node_delivery],
          description:
            "Cross-cluster broadcast deliveries to this node across all tenants, split by whether the node held a connection for the tenant. hit=false means the send could have been avoided.",
          tags: [:hit]
        )
      ]
    )
  end

  def execute_global_connection_metrics do
    cluster_counts = UsersCounter.tenant_counts()
    local_tenant_counts = UsersCounter.local_tenant_counts()

    connected = local_tenant_counts |> Map.values() |> Enum.sum()
    connected_cluster = cluster_counts |> Map.values() |> Enum.sum()

    Telemetry.execute(
      @global_connections_event,
      %{connected: connected, connected_cluster: connected_cluster},
      %{}
    )
  end

  defp payload_global_size_metrics do
    Event.build(
      :realtime_global_payload_size_metrics,
      [
        distribution(
          [:realtime, :payload, :size],
          event_name: [:realtime, :tenants, :payload, :size],
          measurement: :size,
          description: "Global payload size across all tenants",
          tags: [:message_type],
          unit: :byte,
          reporter_options: [peep_bucket_calculator: Tenant.PayloadSize.Buckets]
        )
      ]
    )
  end

  defp channel_global_events do
    Event.build(
      :realtime_global_channel_event_metrics,
      [
        sum(
          [:realtime, :channel, :global, :events],
          event_name: [:realtime, :rate_counter, :channel, :events],
          measurement: :sum,
          description: "Global sum of messages sent on a Realtime Channel."
        ),
        sum(
          [:realtime, :channel, :global, :presence_events],
          event_name: [:realtime, :rate_counter, :channel, :presence_events],
          measurement: :sum,
          description: "Global sum of presence messages sent on a Realtime Channel."
        ),
        sum(
          [:realtime, :channel, :global, :db_events],
          event_name: [:realtime, :rate_counter, :channel, :db_events],
          measurement: :sum,
          description: "Global sum of db messages sent on a Realtime Channel."
        ),
        sum(
          [:realtime, :channel, :global, :joins],
          event_name: [:realtime, :rate_counter, :channel, :joins],
          measurement: :sum,
          description: "Global sum of Realtime Channel joins."
        ),
        sum(
          [:realtime, :channel, :global, :input_bytes],
          event_name: [:realtime, :channel, :input_bytes],
          description: "Global sum of input bytes sent on sockets.",
          measurement: :size
        ),
        sum(
          [:realtime, :channel, :global, :output_bytes],
          event_name: [:realtime, :channel, :output_bytes],
          description: "Global sum of output bytes sent on sockets.",
          measurement: :size
        ),
        counter(
          [:realtime, :channel, :global, :error],
          event_name: [:realtime, :channel, :error],
          measurement: :count,
          tags: [:code],
          description: "Global count of errors in Realtime channel initialization."
        )
      ]
    )
  end
end
