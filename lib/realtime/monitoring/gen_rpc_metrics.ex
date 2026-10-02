defmodule Realtime.GenRpcMetrics do
  @moduledoc """
  Gather stats for gen_rpc TCP sockets.

  A node can have more than one gen_rpc Erlang port open to a given peer (a
  client-side port and a server-side port, and gen_rpc may hold several). The
  raw `:inet.getstat/1` counters (`recv_oct`, `recv_cnt`, `send_oct`,
  `send_cnt`) are monotonic *per socket* but reset to 0 whenever a socket is
  replaced (reconnect, port restart). Summing them across the live set of
  sockets and exporting that sum would make the aggregate drop every time a
  single port is recycled, which downstream Prometheus reads as a counter reset
  followed by a spurious massive increment.

  To avoid that, this module keeps state as a `GenServer`: it remembers the last
  observed value of every socket and maintains a monotonic accumulator per peer
  node. On each poll it adds only the per-socket deltas, so the exported counters
  keep increasing across port restarts within the life of a connection. A socket
  seen for the first time contributes 0 (it only establishes a baseline); a
  socket whose value went backwards mid-connection (in-place reset) contributes
  its current value.

  When a peer node leaves the cluster its accumulator is dropped. If that node
  later reconnects it starts again from 0 — a genuine reset (all sockets to the
  peer are gone), which Prometheus recognises and handles via its counter-reset
  logic. Because the first poll after a reconnect only establishes baselines and
  reports 0, the exported counter always *drops* to 0 rather than resuming at the
  fresh sockets' current value, so Prometheus can never mistake the reset for a
  spurious increment.

  Instantaneous gauges (`send_pend`, `queue_size`, and the `recv_*`/`send_*`
  avg/max/dvi values) are still reported as the current sum across live sockets.
  """

  use GenServer

  require Record
  Record.defrecordp(:net_address, Record.extract(:net_address, from_lib: "kernel/include/net_address.hrl"))

  # Cumulative per-socket counters that must be accumulated across socket restarts.
  @counter_keys [:recv_oct, :recv_cnt, :send_oct, :send_cnt]
  @zero_counters %{recv_oct: 0, recv_cnt: 0, send_oct: 0, send_cnt: 0}

  @typep counters :: %{
           recv_oct: integer(),
           recv_cnt: integer(),
           send_oct: integer(),
           send_cnt: integer()
         }

  # last_seen: last raw counter value per live socket
  # totals: monotonic accumulator per peer node
  @typep state :: %{
           last_seen: %{port() => counters()},
           totals: %{node() => counters()}
         }

  def start_link(opts), do: GenServer.start_link(__MODULE__, opts, name: __MODULE__)

  @spec info() :: %{node() => %{inet_stats: %{:inet.stat_option() => integer}, queue_size: non_neg_integer()}}
  def info, do: GenServer.call(__MODULE__, :info)

  @impl true
  @spec init(term()) :: {:ok, state()}
  def init(_opts), do: {:ok, %{last_seen: %{}, totals: %{}}}

  @impl true
  def handle_call(:info, _from, state) do
    {result, state} = collect(state)
    {:reply, result, state}
  end

  @spec collect(state()) :: {map(), state()}
  defp collect(%{last_seen: last_seen, totals: totals} = state) do
    if :net_kernel.get_state()[:started] != :no do
      {:ok, nodes_info} = :net_kernel.nodes_info()
      # Ignore "hidden" nodes (remote shell)
      nodes_info = Enum.filter(nodes_info, fn {_k, v} -> v[:type] == :normal end)
      ports_by_node = ports_by_node(nodes_info)

      # `last_seen` and `totals` are both rebuilt from scratch every poll so
      # sockets and nodes that are no longer present are pruned
      # The old maps are only read to compute per-socket deltas and to carry forward each
      # still-connected node's accumulator.
      {result, new_totals, new_last_seen} =
        Enum.reduce(nodes_info, {%{}, %{}, %{}}, fn {node, _}, {result, new_totals, new_last_seen} ->
          ports = Map.get(ports_by_node, node, [])
          {entry, new_totals, new_last_seen} = info(node, ports, last_seen, totals, new_totals, new_last_seen)
          {Map.put(result, node, entry), new_totals, new_last_seen}
        end)

      {result, %{state | last_seen: new_last_seen, totals: new_totals}}
    else
      {%{}, state}
    end
  end

  defp info(node, ports, last_seen, totals, new_totals, new_last_seen) do
    port_stats =
      Enum.flat_map(ports, fn port ->
        case :inet.getstat(port) do
          {:ok, stats} -> [{port, Map.new(stats)}]
          _ -> []
        end
      end)

    if port_stats == [] do
      # No live sockets with readable stats, but the node is still connected, so
      # its accumulator is carried forward unchanged and the counters resume
      # where they left off once a socket reappears.
      case Map.get(totals, node) do
        nil -> {%{}, new_totals, new_last_seen}
        node_total -> {%{}, Map.put(new_totals, node, node_total), new_last_seen}
      end
    else
      node_total = Map.get(totals, node, @zero_counters)

      {node_total, new_last_seen} =
        Enum.reduce(port_stats, {node_total, new_last_seen}, fn {port, stats}, {node_total, new_last_seen} ->
          node_total = accumulate(node_total, Map.get(last_seen, port), stats)
          {node_total, Map.put(new_last_seen, port, Map.take(stats, @counter_keys))}
        end)

      # Instantaneous values (gauges) are reported as the current sum across
      # live sockets. The cumulative counters come from the accumulator.
      current = Enum.reduce(port_stats, %{}, fn {_port, stats}, acc -> merge_sum(acc, stats) end)
      inet_stats = Map.merge(current, node_total)

      entry = %{inet_stats: inet_stats, queue_size: queue_size(ports), connections: length(ports)}

      {entry, Map.put(new_totals, node, node_total), new_last_seen}
    end
  end

  # Adds the per-socket deltas onto the running node total so it never decreases
  # when a gen_rpc port is recycled.
  #
  # A socket seen for the first time (`previous == nil`) contributes 0: it only
  # establishes a baseline. This matters on reconnect as a node whose accumulator
  # was dropped comes back with all-new sockets, so the total stays at 0 for that
  # first poll and the exported counter cleanly drops to 0 (a reset Prometheus
  # understands) instead of resuming at the fresh sockets' current value, which
  # could exceed the pre-disconnect total and read as a spurious increment.
  #
  # A socket whose value went backwards mid-connection (in-place reset) still
  # contributes its current value, since we have no baseline to delta against and
  # the node total is being carried forward.
  @spec accumulate(counters(), counters() | nil, map()) :: counters()
  defp accumulate(node_total, previous, stats) do
    Enum.reduce(@counter_keys, node_total, fn key, node_total ->
      current = Map.get(stats, key, 0)

      delta =
        case previous do
          nil -> 0
          previous -> if current >= previous[key], do: current - previous[key], else: current
        end

      Map.update(node_total, key, delta, &(&1 + delta))
    end)
  end

  defp merge_sum(acc, stats), do: Map.merge(acc, stats, fn _k, v1, v2 -> v1 + v2 end)

  defp queue_size(ports) do
    Enum.reduce(ports, 0, fn port, acc ->
      case :erlang.port_info(port, :queue_size) do
        {:queue_size, queue_size} -> acc + queue_size
        _ -> acc
      end
    end)
  end

  defp ports_by_node(nodes_info) do
    gen_rpc_server_port = server_port()
    ip_address_node = ip_address_node(nodes_info)

    :erlang.ports()
    |> Stream.filter(fn port -> :erlang.port_info(port, :name) == {:name, ~c"tcp_inet"} end)
    |> Stream.map(&{:inet.peername(&1), :inet.sockname(&1), &1})
    |> Stream.filter(fn
      {{:ok, _peername}, {:ok, _sockname}, _port} -> true
      _ -> false
    end)
    |> Stream.map(fn {{:ok, {peername_ipaddress, peername_port}}, {:ok, {_, server_port}}, port} ->
      {ip_address_node[peername_ipaddress], peername_port, server_port, port}
    end)
    |> Stream.filter(fn
      {nil, _, _, _} ->
        false

      {node, peername_port, server_port, _port} ->
        {_, client_tcp_or_ssl_port} = :gen_rpc_helper.get_client_config_per_node(node)
        # Only keep Erlang ports that are either serving on the gen_rpc server tcp/ssl port or
        # connecting to other nodes using the expected client tcp/ssl port for that node
        peername_port == client_tcp_or_ssl_port or server_port == gen_rpc_server_port
    end)
    |> Enum.reduce(%{}, fn {node, _peername_port, _server_port, port}, acc ->
      update_in(acc, [Access.key(node, [])], fn ports -> [port | ports] end)
    end)
  end

  defp server_port do
    if Application.fetch_env!(:gen_rpc, :default_client_driver) == :tcp do
      Application.fetch_env!(:gen_rpc, :tcp_server_port)
    else
      Application.fetch_env!(:gen_rpc, :ssl_server_port)
    end
  end

  defp ip_address_node(nodes_info) do
    nodes_info
    |> Stream.map(fn {node, info} ->
      case info[:address] do
        net_address(address: {ip_address, _}) ->
          {ip_address, node}

        _ ->
          {nil, node}
      end
    end)
    |> Stream.filter(fn {ip_address, _node} -> ip_address != nil end)
    |> Map.new()
  end
end
