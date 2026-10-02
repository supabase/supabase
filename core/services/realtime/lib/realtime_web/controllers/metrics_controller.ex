defmodule RealtimeWeb.MetricsController do
  use RealtimeWeb, :controller
  require Logger
  alias Realtime.PromEx
  alias Realtime.TenantPromEx
  alias Realtime.GenRpc

  def index(conn, _) do
    serve_metrics(conn, [Node.self() | Node.list()], "cluster")
  end

  def region(conn, %{"region" => region}) do
    serve_metrics(conn, Realtime.Nodes.region_nodes(region), "region=#{region}")
  end

  defp serve_metrics(conn, nodes, label) do
    conn =
      conn
      |> put_resp_content_type("text/plain")
      |> send_chunked(200)

    {time, conn} = :timer.tc(fn -> collect_metrics(nodes, conn) end, :millisecond)
    Logger.info("Collected #{label} metrics in #{time} milliseconds")

    conn
  end

  defp collect_metrics(nodes, conn) do
    bump_max_heap_size()
    timeout = Application.fetch_env!(:realtime, :metrics_rpc_timeout)

    nodes
    |> Task.async_stream(
      fn node ->
        {node, GenRpc.call(node, __MODULE__, :get_metrics, [], timeout: timeout)}
      end,
      timeout: :infinity
    )
    |> Enum.reduce(conn, fn
      {:ok, {node, {:error, :rpc_error, reason}}}, acc_conn ->
        Logger.error("Cannot fetch metrics from the node #{inspect(node)} because #{inspect(reason)}")
        acc_conn

      {:ok, {_node, metrics}}, acc_conn ->
        case chunk(acc_conn, metrics) do
          {:ok, acc_conn} ->
            :erlang.garbage_collect()
            acc_conn

          {:error, reason} ->
            Logger.error("Cannot stream metrics chunk because #{inspect(reason)}")
            acc_conn
        end

      {:exit, reason}, acc_conn ->
        Logger.error("Metrics collection task exited: #{inspect(reason)}")
        acc_conn
    end)
  end

  def get_metrics do
    bump_max_heap_size()
    [PromEx.get_global_metrics(), TenantPromEx.get_metrics()]
  end

  defp bump_max_heap_size do
    system_max_heap_size = :erlang.system_info(:max_heap_size)[:size]

    if is_integer(system_max_heap_size) and system_max_heap_size > 0 do
      Process.flag(:max_heap_size, system_max_heap_size * 3)
    end
  end
end
