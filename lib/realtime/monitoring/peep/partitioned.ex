defmodule Realtime.Monitoring.Peep.Partitioned do
  @moduledoc """
  Peep.Storage implementation using a single ETS table with a configurable number of partitions
  """
  alias Peep.Storage
  alias Telemetry.Metrics

  @behaviour Peep.Storage

  @spec new(pos_integer) :: {:ets.tid(), pos_integer}
  @impl true
  def new(partitions) when is_integer(partitions) and partitions > 0 do
    opts = [
      :public,
      # Enabling read_concurrency makes switching between reads and writes
      # more expensive. The goal is to ruthlessly optimize writes, even at
      # the cost of read performance.
      read_concurrency: false,
      write_concurrency: true,
      decentralized_counters: true
    ]

    {:ets.new(__MODULE__, opts), partitions}
  end

  @impl true
  def storage_size({tid, _}) do
    %{
      size: :ets.info(tid, :size),
      memory: :ets.info(tid, :memory) * :erlang.system_info(:wordsize)
    }
  end

  @impl true
  def insert_metric({tid, partitions}, id, %Metrics.Counter{}, _value, %{} = tags) do
    key = {id, tags, :rand.uniform(partitions)}
    :ets.update_counter(tid, key, {2, 1}, {key, 0})
  end

  def insert_metric({tid, partitions}, id, %Metrics.Sum{}, value, %{} = tags) do
    key = {id, tags, :rand.uniform(partitions)}
    :ets.update_counter(tid, key, {2, value}, {key, 0})
  end

  def insert_metric({tid, _partitions}, id, %Metrics.LastValue{}, value, %{} = tags) do
    key = {id, tags}
    :ets.insert(tid, {key, value})
  end

  def insert_metric({tid, _partitions}, id, %Metrics.Distribution{} = metric, value, %{} = tags) do
    key = {id, tags}

    atomics =
      case :ets.lookup(tid, key) do
        [{_key, ref}] ->
          ref

        [] ->
          # Race condition: Multiple processes could be attempting
          # to write to this key. Thankfully, :ets.insert_new/2 will break ties,
          # and concurrent writers should agree on which :atomics object to
          # increment.
          new_atomics = Storage.Atomics.new(metric)

          case :ets.insert_new(tid, {key, new_atomics}) do
            true ->
              new_atomics

            false ->
              [{_key, atomics}] = :ets.lookup(tid, key)
              atomics
          end
      end

    Storage.Atomics.insert(atomics, value)
  end

  @impl true
  def get_all_metrics({tid, _partitions}, %Peep.Persistent{ids_to_metrics: itm}) do
    :ets.tab2list(tid)
    |> group_metrics(itm, %{})
  end

  @impl true
  def get_metric({tid, _partitions}, id, %Metrics.Counter{}, tags) do
    :ets.select(tid, [{{{id, :"$2", :_}, :"$1"}, [{:==, :"$2", tags}], [:"$1"]}])
    |> Enum.reduce(0, fn count, acc -> count + acc end)
  end

  def get_metric({tid, _partitions}, id, %Metrics.Sum{}, tags) do
    :ets.select(tid, [{{{id, :"$2", :_}, :"$1"}, [{:==, :"$2", tags}], [:"$1"]}])
    |> Enum.reduce(0, fn count, acc -> count + acc end)
  end

  def get_metric({tid, _partitions}, id, %Metrics.LastValue{}, tags) do
    case :ets.lookup(tid, {id, tags}) do
      [{_key, value}] -> value
      _ -> nil
    end
  end

  def get_metric({tid, _partitions}, id, %Metrics.Distribution{}, tags) do
    key = {id, tags}

    case :ets.lookup(tid, key) do
      [{_key, atomics}] -> Storage.Atomics.values(atomics)
      _ -> nil
    end
  end

  @impl true
  def prune_tags({tid, _partitions}, patterns) do
    match_spec =
      patterns
      |> Enum.flat_map(fn pattern ->
        counter_or_sum_key = {:_, pattern, :_}
        dist_or_last_value_key = {:_, pattern}

        [
          {
            {counter_or_sum_key, :_},
            [],
            [true]
          },
          {
            {dist_or_last_value_key, :_},
            [],
            [true]
          }
        ]
      end)

    :ets.select_delete(tid, match_spec)
    :ok
  end

  defp group_metrics([], _itm, acc) do
    acc
  end

  defp group_metrics([metric | rest], itm, acc) do
    acc2 = group_metric(metric, itm, acc)
    group_metrics(rest, itm, acc2)
  end

  defp group_metric({{id, tags, _}, value}, itm, acc) do
    %{^id => metric} = itm
    update_in(acc, [Access.key(metric, %{}), Access.key(tags, 0)], &(&1 + value))
  end

  defp group_metric({{id, tags}, %Storage.Atomics{} = atomics}, itm, acc) do
    %{^id => metric} = itm
    put_in(acc, [Access.key(metric, %{}), Access.key(tags)], Storage.Atomics.values(atomics))
  end

  defp group_metric({{id, tags}, value}, itm, acc) do
    %{^id => metric} = itm
    put_in(acc, [Access.key(metric, %{}), Access.key(tags)], value)
  end
end
