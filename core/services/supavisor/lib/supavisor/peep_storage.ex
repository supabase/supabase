defmodule Supavisor.PeepStorage do
  @moduledoc """
  Per-scheduler ETS tables with a shared tags table. Tags are stored once
  and assigned a compact integer ID. Per-scheduler metric tables use
  `{metric_id, tags_id}` as keys instead of `{metric_id, tags_map}`,
  reducing memory when the same tags appear across multiple schedulers.

  The storage is a 4-tuple:

      {tags_tid, metric_tids, reverse_tags_tid, cache_tid}

  - tags_tid: tags_map => integer_id (write path)
  - metric_tids: tuple of per-scheduler ETS tables keyed by {metric_id, tags_id}
  - reverse_tags_tid: integer_id => tags_map (export path)
  - cache_tid: integer_id => formatted_label_binary (prometheus label cache)
  """

  alias Telemetry.Metrics
  alias Peep.Storage

  require Peep.Persistent

  @behaviour Peep.Storage

  @compile :inline

  @impl true
  def new(_opts) do
    tags_tid =
      :ets.new(__MODULE__.Tags, [
        :public,
        :set,
        read_concurrency: true,
        write_concurrency: :auto
      ])

    n = :erlang.system_info(:schedulers_online)

    metric_tids =
      List.to_tuple(
        Enum.map(1..n, fn _ ->
          :ets.new(__MODULE__.Metrics, [
            :public,
            write_concurrency: true,
            decentralized_counters: true
          ])
        end)
      )

    reverse_tags_tid =
      :ets.new(__MODULE__.ReverseTags, [
        :public,
        :set,
        read_concurrency: true,
        write_concurrency: :auto
      ])

    cache_tid = :ets.new(__MODULE__.Cache, [:public, read_concurrency: true])

    {tags_tid, metric_tids, reverse_tags_tid, cache_tid}
  end

  @impl true
  def insert_metric(
        {tags_tid, metric_tids, reverse_tags_tid, _cache},
        id,
        %Metrics.Counter{},
        _value,
        tags
      ) do
    tags_id = get_or_create_tags_id(tags_tid, reverse_tags_tid, tags)
    tid = get_tid(metric_tids)
    key = {id, tags_id}
    :ets.update_counter(tid, key, {2, 1}, {key, 0})
  end

  def insert_metric(
        {tags_tid, metric_tids, reverse_tags_tid, _cache},
        id,
        %Metrics.Sum{},
        value,
        tags
      ) do
    tags_id = get_or_create_tags_id(tags_tid, reverse_tags_tid, tags)
    tid = get_tid(metric_tids)
    key = {id, tags_id}
    :ets.update_counter(tid, key, {2, value}, {key, 0})
  end

  def insert_metric(
        {tags_tid, metric_tids, reverse_tags_tid, _cache},
        id,
        %Metrics.LastValue{},
        value,
        tags
      ) do
    tags_id = get_or_create_tags_id(tags_tid, reverse_tags_tid, tags)
    tid = get_tid(metric_tids)
    key = {id, tags_id}
    :ets.insert(tid, {key, {System.monotonic_time(), value}})
  end

  def insert_metric(
        {tags_tid, metric_tids, reverse_tags_tid, _cache},
        id,
        %Metrics.Distribution{} = metric,
        value,
        tags
      ) do
    tags_id = get_or_create_tags_id(tags_tid, reverse_tags_tid, tags)
    tid = get_tid(metric_tids)
    key = {id, tags_id}

    atomics =
      case :ets.lookup(tid, key) do
        [{_key, ref}] ->
          ref

        [] ->
          new_atomics = Storage.Atomics.new(metric)

          case :ets.insert_new(tid, {key, new_atomics}) do
            true ->
              new_atomics

            false ->
              :ets.lookup_element(tid, key, 2)
          end
      end

    Storage.Atomics.insert(atomics, value)
  end

  defp get_or_create_tags_id(tags_tid, reverse_tags_tid, tags) do
    case :ets.lookup(tags_tid, tags) do
      [{_, id}] ->
        id

      [] ->
        id = System.unique_integer()

        case :ets.insert_new(tags_tid, {tags, id}) do
          true ->
            :ets.insert(reverse_tags_tid, {id, tags})
            id

          false ->
            get_or_create_tags_id(tags_tid, reverse_tags_tid, tags)
        end
    end
  end

  defp get_tid(metric_tids) do
    scheduler_id = :erlang.system_info(:scheduler_id)
    elem(metric_tids, scheduler_id - 1)
  end

  @impl true
  def storage_size({tags_tid, metric_tids, reverse_tags_tid, cache_tid}) do
    wordsize = :erlang.system_info(:wordsize)

    {metric_size, metric_memory} =
      metric_tids
      |> Tuple.to_list()
      |> Enum.reduce({0, 0}, fn tid, {size, memory} ->
        {size + :ets.info(tid, :size), memory + :ets.info(tid, :memory)}
      end)

    tags_size = :ets.info(tags_tid, :size)
    tags_memory = :ets.info(tags_tid, :memory)

    reverse_tags_size = :ets.info(reverse_tags_tid, :size)
    reverse_tags_memory = :ets.info(reverse_tags_tid, :memory)

    cache_size = :ets.info(cache_tid, :size)
    cache_memory = :ets.info(cache_tid, :memory)

    %{
      size: metric_size + tags_size + reverse_tags_size + cache_size,
      memory: (metric_memory + tags_memory + reverse_tags_memory + cache_memory) * wordsize
    }
  end

  @impl true
  def get_all_metrics(_state, _persistent) do
    raise "use get_all_metrics_with_tag_ids/2 instead"
  end

  @doc """
  Returns all metrics keyed by tag IDs instead of tag maps.

  Returns `{reverse_tags_tid, cache_tid, global_tags, metrics}` where metrics is:

      %{metric => %{tags_id => value}}

  Intended for use with `Supavisor.PeepStorage.PrometheusCached.export/1`.
  """
  def get_all_metrics_with_tag_ids(
        {_tags_tid, metric_tids, reverse_tags_tid, cache_tid},
        persistent
      ) do
    itm = Peep.Persistent.ids_to_metrics(persistent)
    global_tags = Peep.Persistent.persistent(persistent, :global_tags)
    boundaries_cache = precompute_boundaries(itm)
    acc = collect_metrics(Tuple.to_list(metric_tids), itm, boundaries_cache, %{})
    acc = remove_timestamps_from_last_values(acc)
    {reverse_tags_tid, cache_tid, global_tags, acc}
  end

  defp precompute_boundaries(itm) do
    Enum.reduce(itm, %{}, fn
      {id, %Metrics.Distribution{} = metric}, acc ->
        {module, config} = Peep.Buckets.config(metric)
        num_buckets = module.number_of_buckets(config)
        boundaries = for idx <- 0..(num_buckets - 1), do: module.upper_bound(idx, config)
        Map.put(acc, id, boundaries)

      _, acc ->
        acc
    end)
  end

  defp collect_metrics([], _itm, _bc, acc), do: acc

  defp collect_metrics([tid | rest], itm, bc, acc) do
    acc = fold_metrics(:ets.tab2list(tid), itm, bc, acc)
    collect_metrics(rest, itm, bc, acc)
  end

  defp fold_metrics([], _itm, _bc, acc), do: acc

  defp fold_metrics([entry | rest], itm, bc, acc) do
    acc = merge_entry(entry, itm, bc, acc)
    fold_metrics(rest, itm, bc, acc)
  end

  defp merge_entry({{id, tags_id}, value}, itm, bc, acc) do
    %{^id => metric} = itm
    merge_entry2(metric, id, tags_id, value, bc, acc)
  end

  defp merge_entry2(%Metrics.Counter{} = metric, _id, tags_id, value, _bc, acc) do
    path = [Access.key(metric, %{}), Access.key(tags_id, 0)]
    update_in(acc, path, &(&1 + value))
  end

  defp merge_entry2(%Metrics.Sum{} = metric, _id, tags_id, value, _bc, acc) do
    path = [Access.key(metric, %{}), Access.key(tags_id, 0)]
    update_in(acc, path, &(&1 + value))
  end

  defp merge_entry2(%Metrics.LastValue{} = metric, _id, tags_id, {_, _} = a, _bc, acc) do
    path = [
      Access.key(:last_values, %{}),
      Access.key(metric, %{}),
      Access.key(tags_id, a)
    ]

    update_in(acc, path, fn {_, _} = b -> max(a, b) end)
  end

  defp merge_entry2(%Metrics.Distribution{} = metric, id, tags_id, atomics, bc, acc) do
    {counts, sum, above_max} = Supavisor.PeepStorage.Atomics.counts(atomics)
    boundaries = Map.fetch!(bc, id)
    path = [Access.key(metric, %{}), Access.key(tags_id)]

    update_in(acc, path, fn
      nil ->
        {counts, sum, above_max, boundaries}

      {prev_counts, prev_sum, prev_above_max, _boundaries} ->
        merged = merge_counts(prev_counts, counts, [])
        {merged, prev_sum + sum, prev_above_max + above_max, boundaries}
    end)
  end

  defp merge_counts([], [], acc), do: Enum.reverse(acc)
  defp merge_counts([a | ra], [b | rb], acc), do: merge_counts(ra, rb, [a + b | acc])

  defp remove_timestamps_from_last_values(%{last_values: lvs} = metrics) do
    last_value_metrics =
      for {metric, tags_to_values} <- lvs,
          {tags_id, {_ts, value}} <- tags_to_values,
          reduce: %{} do
        acc ->
          put_in(acc, [Access.key(metric, %{}), Access.key(tags_id)], value)
      end

    metrics
    |> Map.delete(:last_values)
    |> Map.merge(last_value_metrics)
  end

  defp remove_timestamps_from_last_values(metrics), do: metrics

  @impl true
  def prune_tags(_state, _patterns) do
    raise "not yet implemented"
  end
end
