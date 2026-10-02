defmodule Realtime.Operations do
  @moduledoc """
  Support operations for Realtime.
  """
  alias Realtime.Rpc

  @doc """
  Ensures connected users are connected to the closest region by killing and restart the connection process.
  """
  def rebalance do
    Enum.reduce(:syn.group_names(:users), 0, fn tenant, acc ->
      scope = Realtime.Syn.PostgresCdc.scope(tenant)

      case :syn.lookup(scope, tenant) do
        {pid, %{region: region}} ->
          platform_region = Realtime.Nodes.platform_region_translator(region)
          current_node = node(pid)

          case Realtime.Nodes.launch_node(platform_region, false, tenant) do
            ^current_node -> acc
            _ -> stop_user_tenant_process(tenant, platform_region, acc)
          end

        _ ->
          acc
      end
    end)
  end

  @doc """
  Kills all connections to a tenant database in all connected nodes
  """
  @spec kill_connections_to_tenant_id_in_all_nodes(String.t(), atom()) :: list()
  def kill_connections_to_tenant_id_in_all_nodes(tenant_id, reason \\ :normal) do
    [node() | Node.list()]
    |> Task.async_stream(
      fn node ->
        Rpc.enhanced_call(node, __MODULE__, :kill_connections_to_tenant_id, [tenant_id, reason])
      end,
      timeout: 5000
    )
    |> Enum.map(& &1)
  end

  @doc """
  Kills all connections to a tenant database in the current node
  """
  @spec kill_connections_to_tenant_id(String.t(), atom()) :: :ok
  def kill_connections_to_tenant_id(tenant_id, reason) do
    Logger.metadata(external_id: tenant_id, project: tenant_id)

    pids_to_kill =
      for pid <- Process.list(),
          info = Process.info(pid),
          dict = Keyword.get(info, :dictionary, []),
          match?({DBConnection.Connection, :init, 1}, dict[:"$initial_call"]),
          Keyword.get(dict, :"$logger_metadata$")[:external_id] == tenant_id,
          links = Keyword.get(info, :links) do
        links
        |> Enum.filter(fn pid ->
          is_pid(pid) &&
            pid |> Process.info() |> Keyword.get(:dictionary, []) |> Keyword.get(:"$initial_call") ==
              {:supervisor, DBConnection.ConnectionPool.Pool, 1}
        end)
      end

    Enum.each(pids_to_kill, &Process.exit(&1, reason))
  end

  @doc """
  Kills all Ecto.Migration.Runner processes that are linked only to Ecto.MigratorSupervisor
  """
  @spec dirty_terminate_runners :: list()
  def dirty_terminate_runners do
    Ecto.MigratorSupervisor
    |> DynamicSupervisor.which_children()
    |> Enum.reduce([], fn
      {_, pid, :worker, [Ecto.Migration.Runner]}, acc ->
        if length(Process.info(pid)[:links]) < 2 do
          [{pid, Agent.stop(pid, :normal, 5_000)} | acc]
        else
          acc
        end

      _, acc ->
        acc
    end)
  end

  defp stop_user_tenant_process(tenant, platform_region, acc) do
    Extensions.PostgresCdcRls.handle_stop(tenant, 5_000)
    # credo:disable-for-next-line
    IO.inspect({"Stopped", tenant, platform_region})
    Process.sleep(1_500)
    acc + 1
  catch
    kind, reason ->
      # credo:disable-for-next-line
      IO.inspect({"Failed to stop", tenant, kind, reason})
  end
end
