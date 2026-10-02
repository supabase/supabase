defmodule Realtime.MetricsCleaner do
  @moduledoc false

  use GenServer
  require Logger

  defstruct [:check_ref, :interval]

  def handle_forum_event([:forum, :users, :group, :vacant], _, %{group: tenant_id}, vacant_websockets) do
    :ets.insert(vacant_websockets, {tenant_id, DateTime.to_unix(DateTime.utc_now(), :second)})
  end

  def handle_forum_event([:forum, :users, :group, :occupied], _, %{group: tenant_id}, vacant_websockets) do
    :ets.delete(vacant_websockets, tenant_id)
  end

  def handle_syn_event([:syn, Realtime.Tenants.Connect, :unregistered], _, %{name: tenant_id}, disconnected_tenants) do
    :ets.insert(disconnected_tenants, {tenant_id, DateTime.to_unix(DateTime.utc_now(), :second)})
  end

  def handle_syn_event([:syn, Realtime.Tenants.Connect, :registered], _, %{name: tenant_id}, disconnected_tenants) do
    :ets.delete(disconnected_tenants, tenant_id)
  end

  def start_link(opts), do: GenServer.start_link(__MODULE__, opts)

  # 10 minutes
  @default_vacant_metric_threshold_in_seconds 600
  @vacant_websockets_table :vacant_websockets

  # Vacated tenants closer than this to the cleanup threshold are not reported by
  # `recently_vacated_tenants/2`. It must cover the time between reading the table and emitting the
  # metrics so a poll can't recreate a tenant tag that the cleaner has just pruned.
  @recently_vacated_margin_in_seconds 60

  @doc """
  Tenants that recently lost their last websocket on this node and still have metrics for this node.

  Returns an empty list when the MetricsCleaner is not running.
  """
  @spec recently_vacated_tenants(atom(), non_neg_integer()) :: [String.t()]
  def recently_vacated_tenants(
        table \\ @vacant_websockets_table,
        vacant_metric_threshold_in_seconds \\ @default_vacant_metric_threshold_in_seconds
      ) do
    case :ets.whereis(table) do
      :undefined ->
        []

      _tid ->
        cutoff =
          DateTime.utc_now()
          |> DateTime.add(-(vacant_metric_threshold_in_seconds - @recently_vacated_margin_in_seconds), :second)
          |> DateTime.to_unix(:second)

        :ets.select(table, [{{:"$1", :"$2"}, [{:>=, :"$2", cutoff}], [:"$1"]}])
    end
  end

  @impl true
  def init(opts) do
    interval =
      opts[:metrics_cleaner_schedule_timer_in_ms] ||
        Application.fetch_env!(:realtime, :metrics_cleaner_schedule_timer_in_ms)

    vacant_metric_threshold_in_seconds =
      opts[:vacant_metric_threshold_in_seconds] || @default_vacant_metric_threshold_in_seconds

    Logger.info("Starting MetricsCleaner")

    vacant_websockets =
      :ets.new(opts[:vacant_websockets_table] || @vacant_websockets_table, [
        :named_table,
        :set,
        :public,
        read_concurrency: false,
        write_concurrency: :auto
      ])

    disconnected_tenants =
      :ets.new(:disconnected_tenants, [:set, :public, read_concurrency: false, write_concurrency: :auto])

    :ok =
      :telemetry.attach_many(
        [self(), :vacant_websockets],
        [[:forum, :users, :group, :occupied], [:forum, :users, :group, :vacant]],
        &__MODULE__.handle_forum_event/4,
        vacant_websockets
      )

    :ok =
      :telemetry.attach_many(
        [self(), :disconnected_tenants],
        [[:syn, Realtime.Tenants.Connect, :registered], [:syn, Realtime.Tenants.Connect, :unregistered]],
        &__MODULE__.handle_syn_event/4,
        disconnected_tenants
      )

    {:ok,
     %{
       check_ref: check(interval),
       interval: interval,
       vacant_metric_threshold_in_seconds: vacant_metric_threshold_in_seconds,
       vacant_websockets: vacant_websockets,
       disconnected_tenants: disconnected_tenants
     }}
  end

  @impl true
  def terminate(_reason, _state) do
    :telemetry.detach([self(), :vacant_websockets])
    :telemetry.detach([self(), :disconnected_tenants])
    :ok
  end

  @impl true
  def handle_info(:check, %{interval: interval} = state) do
    Process.cancel_timer(state.check_ref)

    {exec_time, _} =
      :timer.tc(
        fn ->
          loop_and_cleanup_metrics_table(state.vacant_websockets, state.vacant_metric_threshold_in_seconds)
          loop_and_cleanup_metrics_table(state.disconnected_tenants, state.vacant_metric_threshold_in_seconds)
        end,
        :millisecond
      )

    if exec_time > :timer.seconds(5),
      do: Logger.warning("Metrics check took: #{exec_time} ms")

    {:noreply, %{state | check_ref: check(interval)}}
  end

  def handle_info(msg, state) do
    Logger.error("Unexpected message: #{inspect(msg)}")
    {:noreply, state}
  end

  defp check(interval), do: Process.send_after(self(), :check, interval)

  defp loop_and_cleanup_metrics_table(cleaner_table, vacant_metric_cleanup_threshold_in_seconds) do
    threshold =
      DateTime.utc_now()
      |> DateTime.add(-vacant_metric_cleanup_threshold_in_seconds, :second)
      |> DateTime.to_unix(:second)

    # We do this to have a consistent view of the table while we read and delete
    :ets.safe_fixtable(cleaner_table, true)

    try do
      # Look for tenant_ids that have been vacant for more than threshold
      vacant_tenant_ids =
        :ets.select(cleaner_table, [
          {{:"$1", :"$2"}, [{:<, :"$2", threshold}], [:"$1"]}
        ])

      vacant_tenant_ids
      |> Enum.map(fn tenant_id -> %{tenant: tenant_id} end)
      |> then(&Peep.prune_tags(Realtime.TenantPromEx.Metrics, &1))

      # Delete them from the table
      :ets.select_delete(cleaner_table, [
        {{:"$1", :"$2"}, [{:<, :"$2", threshold}], [true]}
      ])
    after
      :ets.safe_fixtable(cleaner_table, false)
    end
  end
end
