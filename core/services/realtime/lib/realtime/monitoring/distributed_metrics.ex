defmodule Realtime.DistributedMetrics do
  @moduledoc """
  Gather stats for each connected node
  """

  require Record
  Record.defrecordp(:net_address, Record.extract(:net_address, from_lib: "kernel/include/net_address.hrl"))
  @spec info() :: %{node => map}
  def info do
    # First check if Erlang distribution is started
    if :net_kernel.get_state()[:started] != :no do
      {:ok, nodes_info} = :net_kernel.nodes_info()
      # Ignore "hidden" nodes (remote shell)
      nodes_info = Enum.filter(nodes_info, fn {_k, v} -> v[:type] == :normal end)

      port_addresses =
        :erlang.ports()
        |> Stream.filter(fn port ->
          :erlang.port_info(port, :name) == {:name, ~c"tcp_inet"}
        end)
        |> Stream.map(&{:inet.peername(&1), &1})
        |> Stream.filter(fn
          {{:ok, _peername}, _port} -> true
          _ -> false
        end)
        |> Enum.map(fn {{:ok, peername}, port} -> {peername, port} end)
        |> Enum.into(%{})

      Map.new(nodes_info, &info(&1, port_addresses))
    else
      %{}
    end
  end

  defp info({node, info}, port_addresses) do
    dist_pid = info[:owner]
    state = info[:state]

    case info[:address] do
      net_address(address: address) when address != :undefined ->
        {node, info(node, port_addresses, dist_pid, state, address)}

      _ ->
        {node, %{pid: dist_pid, state: state}}
    end
  end

  defp info(node, port_addresses, dist_pid, state, address) do
    if dist_port = port_addresses[address] do
      %{
        inet_stats: inet_stats(dist_port),
        port: dist_port,
        pid: dist_pid,
        state: state
      }
    else
      %{pid: dist_pid, state: state}
    end
    |> Map.merge(%{
      queue_size: node_queue_size(node)
    })
  end

  defp inet_stats(port) do
    case :inet.getstat(port) do
      {:ok, stats} ->
        stats

      _ ->
        nil
    end
  end

  defp node_queue_size(node) do
    case :ets.lookup(:sys_dist, node) do
      [dist] ->
        conn_id = elem(dist, 2)

        with {:ok, _, _, queue_size} <- :erlang.dist_get_stat(conn_id) do
          {:ok, queue_size}
        else
          _ -> {:error, :not_found}
        end

      _ ->
        {:error, :not_found}
    end
  end
end
