defmodule Realtime.PromEx.Plugins.Tenant do
  @moduledoc false

  use PromEx.Plugin
  alias Realtime.FeatureFlags
  alias Realtime.MetricsCleaner
  alias Realtime.Telemetry
  alias Realtime.Tenants
  alias Realtime.UsersCounter

  @impl true
  def polling_metrics(opts) do
    poll_rate = Keyword.get(opts, :poll_rate, 5_000)

    [
      concurrent_connections(poll_rate)
    ]
  end

  @impl true
  def event_metrics(_opts) do
    [
      channel_events(),
      payload_size_metrics(),
      replication_metrics(),
      subscription_metrics(),
      broadcast_fanout_metrics()
    ]
  end

  defp broadcast_fanout_metrics do
    Event.build(
      :realtime_tenant_broadcast_fanout_metrics,
      [
        counter(
          [:realtime, :broadcast, :fanout, :node_delivery, :total],
          event_name: [:realtime, :broadcast, :fanout, :node_delivery],
          description:
            "Cross-cluster broadcast deliveries to this node for the tenant, split by whether the node held a connection for the tenant. hit=false means the send could have been avoided.",
          tags: [:tenant, :hit],
          keep: &__MODULE__.track_fanout_metric?/1
        )
      ]
    )
  end

  @doc false
  def track_fanout_metric?(%{tenant: tenant_id}) when is_binary(tenant_id) do
    FeatureFlags.enabled?("track_fanout_metric", tenant_id)
  end

  def track_fanout_metric?(_), do: false

  defmodule PayloadSize.Buckets do
    @moduledoc false
    use Peep.Buckets.Custom,
      buckets: [250, 500, 1000, 3000, 5000, 10_000, 25_000, 100_000, 500_000, 1_000_000, 3_000_000]
  end

  defp payload_size_metrics do
    Event.build(
      :realtime_tenant_payload_size_metrics,
      [
        distribution(
          [:realtime, :tenants, :payload, :size],
          event_name: [:realtime, :tenants, :payload, :size],
          measurement: :size,
          description: "Tenant payload size",
          tags: [:tenant, :message_type],
          unit: :byte,
          reporter_options: [peep_bucket_calculator: PayloadSize.Buckets]
        )
      ]
    )
  end

  defp concurrent_connections(poll_rate) do
    Polling.build(
      :realtime_concurrent_connections,
      poll_rate,
      {__MODULE__, :execute_tenant_metrics, []},
      [
        last_value(
          [:realtime, :connections, :connected],
          event_name: [:realtime, :connections],
          description: "The node total count of connected clients for a tenant.",
          measurement: :connected,
          tags: [:tenant]
        ),
        last_value(
          [:realtime, :connections, :connected_cluster],
          event_name: [:realtime, :connections],
          description: "The cluster total count of connected clients for a tenant.",
          measurement: :connected_cluster,
          tags: [:tenant]
        )
      ],
      detach_on_error: false
    )
  end

  def execute_tenant_metrics do
    cluster_counts = UsersCounter.tenant_counts()
    local_tenant_counts = UsersCounter.local_tenant_counts()

    for {t, count} <- local_tenant_counts do
      execute_connections(t, count, cluster_counts)
    end

    # These are `last_value` metrics, so a tenant that lost its last local websocket would keep
    # exporting its previous count until MetricsCleaner prunes the tenant tag. Report zero for them in
    # the meantime. A tenant that got a websocket back was already reported above.
    for t <- MetricsCleaner.recently_vacated_tenants(), not Map.has_key?(local_tenant_counts, t) do
      execute_connections(t, 0, cluster_counts)
    end
  end

  defp execute_connections(tenant_id, count, cluster_counts) do
    tenant = Tenants.Cache.get_tenant_by_external_id(tenant_id)

    if tenant != nil do
      Telemetry.execute(
        [:realtime, :connections],
        %{
          connected: count,
          connected_cluster: Map.get(cluster_counts, tenant_id, 0),
          limit: tenant.max_concurrent_users
        },
        %{tenant: tenant_id}
      )
    end
  end

  defmodule Replication.Buckets do
    @moduledoc false
    # Milliseconds. 100 is the default `poll_interval_ms`: past it the query outruns its own loop.
    # 15_000 is the Postgrex call timeout, so nothing lands meaningfully above it.
    use Peep.Buckets.Custom, buckets: [10, 25, 50, 100, 250, 500, 2500, 15_000]
  end

  defp replication_metrics do
    Event.build(
      :realtime_tenant_replication_event_metrics,
      [
        distribution(
          [:realtime, :replication, :poller, :query, :duration],
          event_name: [:realtime, :replication, :poller, :query, :stop],
          measurement: :duration,
          description: "Duration of the logical replication slot polling query for Realtime RLS.",
          tags: [:tenant],
          unit: {:microsecond, :millisecond},
          reporter_options: [peep_bucket_calculator: Replication.Buckets]
        ),
        counter(
          [:realtime, :replication, :poller, :stop, :total],
          event_name: [:realtime, :replication, :poller, :stop],
          description:
            "How many times the tenant's Postgres Changes poller terminated, split by reason. reason=max_retries_reached is the give-up: it is not restarted, so the tenant's subscriptions stop broadcasting until it reconnects.",
          tags: [:tenant, :reason],
          tag_values: &poller_stop_tags/1
        ),
        counter(
          [:realtime, :replication, :poller, :exception, :total],
          event_name: [:realtime, :replication, :poller, :exception],
          description: "How many times the tenant's Postgres Changes poller crashed (terminated abnormally).",
          tags: [:tenant]
        ),
        counter(
          [:realtime, :replication, :poller, :query, :exception, :total],
          event_name: [:realtime, :replication, :poller, :query, :exception],
          description:
            "How many of the tenant's polls failed reading changes from the replication slot, split by reason. reason=object_in_use means another backend held the slot. Sustained values come before its poller gives up.",
          tags: [:tenant, :reason],
          tag_values: &poller_query_exception_tags/1
        ),
        counter(
          [:realtime, :replication, :poller, :prepare, :exception, :total],
          event_name: [:realtime, :replication, :poller, :prepare, :exception],
          description: "How many of the tenant's attempts to prepare the replication slot for polling failed.",
          tags: [:tenant]
        ),
        sum(
          [:realtime, :replication, :poller, :changes, :dispatch],
          event_name: [:realtime, :replication, :poller, :changes, :dispatch],
          measurement: :count,
          description: "Number of Postgres Changes rows the poller broadcast to subscribers.",
          tags: [:tenant]
        ),
        sum(
          [:realtime, :replication, :poller, :changes, :skip],
          event_name: [:realtime, :replication, :poller, :changes, :skip],
          measurement: :count,
          description:
            "Number of Postgres Changes rows skipped without broadcasting, tagged by reason. reason=rate_limited means the tenant's db events-per-second limit was triggered.",
          tags: [:tenant, :reason]
        )
      ]
    )
  end

  defmodule Latency.Buckets do
    @moduledoc false
    use Peep.Buckets.Custom, buckets: [10, 25, 50, 100, 250, 500, 1000, 5000, 15_000]
  end

  defmodule BroadcastFromDatabase.Buckets do
    @moduledoc false
    use Peep.Buckets.Custom, buckets: [10, 25, 50, 100, 250, 500, 1000, 5000, 30_000]
  end

  defp channel_events do
    Event.build(
      :realtime_tenant_channel_event_metrics,
      [
        sum(
          [:realtime, :channel, :events],
          event_name: [:realtime, :rate_counter, :channel, :events],
          measurement: :sum,
          description: "Sum of messages sent on a Realtime Channel.",
          tags: [:tenant]
        ),
        sum(
          [:realtime, :channel, :presence_events],
          event_name: [:realtime, :rate_counter, :channel, :presence_events],
          measurement: :sum,
          description: "Sum of presence messages sent on a Realtime Channel.",
          tags: [:tenant]
        ),
        sum(
          [:realtime, :channel, :db_events],
          event_name: [:realtime, :rate_counter, :channel, :db_events],
          measurement: :sum,
          description: "Sum of db messages sent on a Realtime Channel.",
          tags: [:tenant]
        ),
        sum(
          [:realtime, :channel, :joins],
          event_name: [:realtime, :rate_counter, :channel, :joins],
          measurement: :sum,
          description: "Sum of Realtime Channel joins.",
          tags: [:tenant]
        ),
        sum(
          [:realtime, :channel, :input_bytes],
          event_name: [:realtime, :channel, :input_bytes],
          description: "Sum of input bytes sent on sockets.",
          measurement: :size,
          tags: [:tenant]
        ),
        sum(
          [:realtime, :channel, :output_bytes],
          event_name: [:realtime, :channel, :output_bytes],
          description: "Sum of output bytes sent on sockets.",
          measurement: :size,
          tags: [:tenant]
        ),
        distribution(
          [:realtime, :tenants, :read_authorization_check],
          event_name: [:realtime, :tenants, :read_authorization_check],
          measurement: :latency,
          unit: :millisecond,
          description: "Latency of read authorization checks.",
          tags: [:tenant],
          reporter_options: [peep_bucket_calculator: Latency.Buckets]
        ),
        distribution(
          [:realtime, :tenants, :write_authorization_check],
          event_name: [:realtime, :tenants, :write_authorization_check],
          measurement: :latency,
          unit: :millisecond,
          description: "Latency of write authorization checks.",
          tags: [:tenant],
          reporter_options: [peep_bucket_calculator: Latency.Buckets]
        ),
        distribution(
          [:realtime, :tenants, :broadcast_from_database, :latency_committed_at],
          event_name: [:realtime, :tenants, :broadcast_from_database],
          measurement: :latency_committed_at,
          unit: :millisecond,
          description: "Latency of database transaction start until reaches server to be broadcasted",
          tags: [:tenant],
          reporter_options: [peep_bucket_calculator: BroadcastFromDatabase.Buckets]
        ),
        distribution(
          [:realtime, :tenants, :broadcast_from_database, :latency_inserted_at],
          event_name: [:realtime, :tenants, :broadcast_from_database],
          measurement: :latency_inserted_at,
          unit: {:microsecond, :millisecond},
          description: "Latency of database inserted_at until reaches server to be broadcasted",
          tags: [:tenant],
          reporter_options: [peep_bucket_calculator: BroadcastFromDatabase.Buckets]
        ),
        distribution(
          [:realtime, :tenants, :replay],
          event_name: [:realtime, :tenants, :replay],
          measurement: :latency,
          unit: :millisecond,
          description: "Latency of broadcast replay",
          tags: [:tenant],
          reporter_options: [peep_bucket_calculator: Latency.Buckets]
        )
      ]
    )
  end

  defp subscription_metrics do
    Event.build(
      :realtime_tenant_subscription_event_metrics,
      [
        last_value(
          [:realtime, :subscriptions, :manager, :subscribers],
          event_name: [:realtime, :subscriptions, :manager, :subscribers],
          measurement: :count,
          description:
            "Number of Postgres Changes subscribers tracked for the tenant across the cluster. A drop to zero while clients are connected points at a pool that lost its subscriptions.",
          tags: [:tenant]
        ),
        sum(
          [:realtime, :subscriptions, :manager, :dead_pid],
          event_name: [:realtime, :subscriptions, :manager, :dead_pid],
          measurement: :quantity,
          description:
            "Number of not-alive subscriber pids the manager handled, tagged by reason. reason=phantom is a dead pid still holding a subscription that was reaped (subscription churn or leak); reason=not_found is a dead pid already gone from the pool (benign race).",
          tags: [:tenant, :reason]
        )
      ]
    )
  end

  defp poller_stop_tags(metadata) do
    reason =
      case metadata.reason do
        {:shutdown, :max_retries_reached} -> :max_retries_reached
        {:shutdown, _} -> :shutdown
        :shutdown -> :shutdown
        :normal -> :normal
        _ -> :other
      end

    %{tenant: metadata.tenant, reason: reason}
  end

  defp poller_query_exception_tags(metadata) do
    reason =
      case metadata.reason do
        :object_in_use -> :object_in_use
        %Postgrex.Error{postgres: %{code: code}} -> code
        _ -> :other
      end

    %{tenant: metadata.tenant, reason: reason}
  end
end
