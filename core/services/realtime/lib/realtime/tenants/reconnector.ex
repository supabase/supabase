defmodule Realtime.Tenants.Reconnector do
  @moduledoc """
  Periodically ensures every tenant with locally-connected websocket clients has a
  `Realtime.Tenants.Connect` process running.

  `Connect` is started with `restart: :temporary`, so its supervisor never restarts it after
  a crash. Without this module, a tenant whose `Connect` process dies (crash, node move,
  database connection drop) never gets it back unless a client triggers a new join/broadcast.

  Every `@check_interval_ms` this module walks the tenants with local members
  (`Realtime.UsersCounter.local_tenant_counts/0`) and starts a task to reconnect any tenant
  that is missing its `Connect` process.
  """

  use GenServer
  require Logger

  alias Realtime.UsersCounter
  alias Realtime.Tenants.Connect

  @check_interval_ms :timer.minutes(5)

  def start_link(opts), do: GenServer.start_link(__MODULE__, opts)

  @impl true
  def init(_opts) do
    Logger.info("Starting Reconnector")
    schedule_check()
    {:ok, %{}}
  end

  @impl true
  def handle_info(:check, state) do
    for {tenant_id, _count} <- UsersCounter.local_tenant_counts(), is_nil(Connect.whereis(tenant_id)) do
      Task.Supervisor.start_child(Realtime.TaskSupervisor, fn -> reconnect(tenant_id) end)
    end

    schedule_check()
    {:noreply, state}
  end

  def handle_info(_msg, state), do: {:noreply, state}

  defp schedule_check, do: Process.send_after(self(), :check, @check_interval_ms)

  defp reconnect(tenant_id) do
    case Connect.lookup_or_start_connection(tenant_id) do
      {:ok, _} ->
        :ok

      {:error, :rpc_error, reason} ->
        Logger.warning("Reconnector could not restart connection for #{tenant_id}: #{inspect(reason)}")

      {:error, reason} ->
        Logger.warning("Reconnector could not restart connection for #{tenant_id}: #{inspect(reason)}")
    end
  end
end
