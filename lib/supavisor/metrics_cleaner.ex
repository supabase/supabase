defmodule Supavisor.MetricsCleaner do
  @moduledoc false

  use GenServer
  require Logger
  require Supavisor

  @interval :timer.minutes(30)
  @name __MODULE__
  @tenant_registry_table :syn_registry_by_name_tenants

  def start_link(args),
    do: GenServer.start_link(__MODULE__, args, name: @name)

  def clean do
    GenServer.cast(@name, :clean)
  end

  def init(_args) do
    Logger.info("Starting MetricsCleaner")

    :telemetry.attach(
      {__MODULE__, :report},
      [:supavisor, :metrics_cleaner, :stop],
      &__MODULE__.__report_long_cleanups__/4,
      []
    )

    {:ok, %{check_ref: check(), pending: MapSet.new()}}
  end

  @doc false
  def __report_long_cleanups__(_event_name, %{duration: duration}, _metadata, _config) do
    exec_time = :erlang.convert_time_unit(duration, :native, :millisecond)

    if exec_time > :timer.seconds(5),
      do: Logger.warning("Metrics check took: #{exec_time} ms")
  end

  def handle_continue(:clean, state) do
    Process.cancel_timer(state.check_ref)

    new_pending =
      :telemetry.span([:supavisor, :metrics_cleaner], %{}, fn ->
        {sweep_count, new_pending} = mark_and_sweep(state.pending)

        if sweep_count > 0 do
          Logger.info("Cleaned #{sweep_count} orphaned metrics")
        end

        {new_pending, %{orphaned_metrics: sweep_count}, %{}}
      end)

    {:noreply, %{state | check_ref: check(), pending: new_pending}}
  end

  def handle_cast(:clean, state) do
    {:noreply, state, {:continue, :clean}}
  end

  def handle_info(:check, state) do
    {:noreply, state, {:continue, :clean}}
  end

  def handle_info(msg, state) do
    Logger.error("Unexpected message: #{inspect(msg)}")
    {:noreply, state}
  end

  defp check, do: Process.send_after(self(), :check, @interval)

  defp mark_and_sweep(pending) do
    {_, {tags_tid, metric_tids, reverse_tags_tid, cache_tid}} =
      Peep.Persistent.storage(Supavisor.Monitoring.PromEx.Metrics)

    # Phase 1: Sweep — delete everything for tags_ids marked in the previous cycle.
    # By now, tags_tid entries were removed 1 cycle ago, so no new writes can use these ids.
    sweep_count = sweep(pending, metric_tids, reverse_tags_tid, cache_tid)

    # Phase 2: Mark — find orphaned tags_ids and remove them from tags_tid
    # to prevent new writes from reusing them. They'll be swept next cycle.
    new_pending = mark(metric_tids, tags_tid, reverse_tags_tid)

    {sweep_count, new_pending}
  end

  defp sweep(pending, metric_tids, reverse_tags_tid, cache_tid) do
    if MapSet.size(pending) == 0 do
      0
    else
      sweep_count =
        metric_tids
        |> Tuple.to_list()
        |> Enum.sum_by(&sweep_metric_table(&1, pending))

      Enum.each(pending, fn tags_id ->
        :ets.delete(reverse_tags_tid, tags_id)
        :ets.delete(cache_tid, tags_id)
      end)

      sweep_count
    end
  end

  defp sweep_metric_table(tid, pending) do
    :ets.foldl(
      fn {{_metric_id, tags_id} = key, _val}, acc ->
        if MapSet.member?(pending, tags_id) do
          :ets.delete(tid, key)
          acc + 1
        else
          acc
        end
      end,
      0,
      tid
    )
  end

  defp mark(metric_tids, tags_tid, reverse_tags_tid) do
    all_tags_ids =
      metric_tids
      |> Tuple.to_list()
      |> Enum.reduce(MapSet.new(), fn tid, acc ->
        :ets.foldl(
          fn {{_metric_id, tags_id}, _val}, inner_acc ->
            MapSet.put(inner_acc, tags_id)
          end,
          acc,
          tid
        )
      end)

    orphaned =
      Enum.reduce(all_tags_ids, MapSet.new(), fn tags_id, acc ->
        case resolve_tags(reverse_tags_tid, tags_id) do
          {:ok, tags} ->
            if tags[:tenant] && tenant_down?(tags) do
              MapSet.put(acc, tags_id)
            else
              acc
            end

          {:error, :not_found} ->
            MapSet.put(acc, tags_id)
        end
      end)

    # Delete from tags_tid to prevent new writes from reusing these ids.
    # reverse_tags_tid is left intact so exports still work until sweep.
    Enum.each(orphaned, fn tags_id ->
      case resolve_tags(reverse_tags_tid, tags_id) do
        {:ok, tags} -> :ets.delete(tags_tid, tags)
        {:error, _} -> :ok
      end
    end)

    orphaned
  end

  defp resolve_tags(reverse_tags_tid, tags_id) do
    case :ets.lookup(reverse_tags_tid, tags_id) do
      [{_, tags}] -> {:ok, tags}
      [] -> {:error, :not_found}
    end
  end

  defp tenant_down?(%{
         type: type,
         mode: mode,
         user: user,
         tenant: tenant,
         db_name: db,
         search_path: search_path
       }) do
    ids =
      for tls <- [false, true] do
        Supavisor.id(
          type: type,
          tenant: tenant,
          user: user,
          mode: mode,
          db: db,
          search_path: search_path,
          upstream_tls: tls
        )
      end

    Enum.all?(ids, fn id -> :ets.lookup(@tenant_registry_table, id) == [] end)
  end

  defp tenant_down?(%{tenant: tenant}) do
    Registry.lookup(Supavisor.Registry.TenantSups, tenant) == []
  end

  defp tenant_down?(_), do: false
end
