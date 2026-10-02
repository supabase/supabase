defmodule Realtime.Monitoring.Peep.PartitionedTables do
  @moduledoc """
  Peep.Storage implementation using N ETS tables with optional tag-based routing.

  Each metric write is routed to a specific table based on a `:routing_tag` option.
  If the routing tag is present in the metric's tags, `:erlang.phash2/2` is used to
  select the table. Otherwise, the first table is used.

  This reduces lock contention by routing different tag values (e.g. different tenants)
  to different ETS tables, without partitioning metrics within a table.

  ## Options

    * `:tables` - number of ETS tables to create (default: `1`)
    * `:routing_tag` - atom key used to select the target table (default: `nil`)

  ## Example

      {Realtime.Monitoring.Peep.PartitionedTables, [tables: 4, routing_tag: :tenant_id]}
  """

  alias Peep.Storage
  alias Telemetry.Metrics

  @behaviour Peep.Storage

  @typep tids() :: tuple()
  @typep state() :: {tids(), atom() | nil}

  @spec new(keyword()) :: state()
  @impl true
  def new(opts) do
    n_tables = Keyword.get(opts, :tables, 1)
    routing_tag = Keyword.get(opts, :routing_tag, nil)

    ets_opts = [
      :public,
      read_concurrency: false,
      write_concurrency: true,
      decentralized_counters: true
    ]

    tids = List.to_tuple(Enum.map(1..n_tables, fn _ -> :ets.new(__MODULE__, ets_opts) end))
    {tids, routing_tag}
  end

  @impl true
  def storage_size({tids, _routing_tag}) do
    {size, memory} =
      tids
      |> Tuple.to_list()
      |> Enum.reduce({0, 0}, fn tid, {size, memory} ->
        {size + :ets.info(tid, :size), memory + :ets.info(tid, :memory)}
      end)

    %{
      size: size,
      memory: memory * :erlang.system_info(:wordsize)
    }
  end

  @impl true
  def insert_metric({tids, routing_tag}, id, %Metrics.Counter{}, _value, %{} = tags) do
    tid = get_tid(tids, routing_tag, tags)
    key = {id, tags}
    :ets.update_counter(tid, key, {2, 1}, {key, 0})
  end

  def insert_metric({tids, routing_tag}, id, %Metrics.Sum{}, value, %{} = tags) do
    tid = get_tid(tids, routing_tag, tags)
    key = {id, tags}
    :ets.update_counter(tid, key, {2, value}, {key, 0})
  end

  def insert_metric({tids, routing_tag}, id, %Metrics.LastValue{}, value, %{} = tags) do
    tid = get_tid(tids, routing_tag, tags)
    key = {id, tags}
    :ets.insert(tid, {key, value})
  end

  def insert_metric({tids, routing_tag}, id, %Metrics.Distribution{} = metric, value, %{} = tags) do
    tid = get_tid(tids, routing_tag, tags)
    key = {id, tags}

    atomics =
      case :ets.lookup(tid, key) do
        [{_key, ref}] ->
          ref

        [] ->
          # Race condition: Multiple processes could be attempting to write to this key.
          # :ets.insert_new/2 breaks ties so concurrent writers agree on which
          # :atomics object to increment.
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
  def get_all_metrics({tids, _routing_tag}, %Peep.Persistent{ids_to_metrics: itm}) do
    tids
    |> Tuple.to_list()
    |> Enum.flat_map(&:ets.tab2list/1)
    |> Enum.reduce(%{}, fn {{id, tags}, value}, acc ->
      %{^id => metric} = itm
      put_in(acc, [Access.key(metric, %{}), tags], to_value(value))
    end)
  end

  @impl true
  def get_metric({tids, routing_tag}, id, %Metrics.Distribution{}, tags) do
    tid = get_tid(tids, routing_tag, tags)
    key = {id, tags}

    case :ets.lookup(tid, key) do
      [] -> nil
      [{_key, atomics}] -> Storage.Atomics.values(atomics)
    end
  end

  def get_metric({tids, routing_tag}, id, metric, tags) do
    tid = get_tid(tids, routing_tag, tags)
    key = {id, tags}

    case :ets.lookup(tid, key) do
      [] -> empty_value(metric)
      [{_, value}] -> value
    end
  end

  defp empty_value(%Metrics.Counter{}), do: 0
  defp empty_value(%Metrics.Sum{}), do: 0
  defp empty_value(%Metrics.LastValue{}), do: nil

  @impl true
  def prune_tags({tids, routing_tag}, patterns) do
    patterns
    |> Enum.group_by(&get_tid(tids, routing_tag, &1))
    |> Enum.each(fn {tid, grouped} ->
      match_spec = Enum.map(grouped, fn pattern -> {{{:_, pattern}, :_}, [], [true]} end)
      :ets.select_delete(tid, match_spec)
    end)

    :ok
  end

  defp get_tid(tids, nil, _tags), do: elem(tids, 0)

  defp get_tid(tids, routing_tag, tags) do
    case Map.fetch(tags, routing_tag) do
      {:ok, value} -> elem(tids, :erlang.phash2(value, tuple_size(tids)))
      :error -> elem(tids, 0)
    end
  end

  defp to_value(%Storage.Atomics{} = atomics), do: Storage.Atomics.values(atomics)
  defp to_value(value), do: value
end
