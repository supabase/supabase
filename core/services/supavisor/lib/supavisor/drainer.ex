defmodule Supavisor.Drainer do
  @moduledoc """
  Drains every local pool before the client listeners are torn down.

  The client listeners are supervised by ranch, so stopping them kills the
  `Supavisor.ClientHandler` processes they supervise. Pools live earlier in the
  application supervisor, meaning they are terminated after the listeners: by
  the time a pool's `Supavisor.Terminator` runs, its clients are already gone
  and there is nothing left to drain.

  This process sits near the end of the application supervisor, just before
  `Supavisor.NodeMembership`, so it is terminated right after the node stops
  accepting new pools and well before the listeners. Its `terminate/2` stops
  every local tenant supervisor and only returns once they are done.
  """

  use GenServer, shutdown: :timer.seconds(30)

  require Logger

  @stop_timeout :timer.seconds(6)
  @max_concurrency 500

  def start_link(args), do: GenServer.start_link(__MODULE__, args, name: __MODULE__)

  @impl true
  def init(_args) do
    Process.flag(:trap_exit, true)
    {:ok, nil}
  end

  @impl true
  def terminate(_reason, _state) do
    sups = local_tenant_sups()

    Logger.info("Draining #{length(sups)} pools before shutdown")

    sups
    |> Task.async_stream(&stop/1,
      max_concurrency: @max_concurrency,
      timeout: :infinity,
      on_timeout: :kill_task
    )
    |> Stream.run()

    Logger.info("Finished draining pools")
  end

  # Stopping the tenant supervisor runs its Terminator, which drains the
  # clients before the pools underneath them are torn down.
  defp stop(pid) do
    Supervisor.stop(pid, :shutdown, @stop_timeout)
  catch
    :exit, {:noproc, _} -> :ok
    :exit, {{:normal, _}, _} -> :ok
    :exit, reason -> Logger.error("Failed to drain pool #{inspect(pid)}: #{inspect(reason)}")
  end

  defp local_tenant_sups do
    Registry.select(Supavisor.Registry.TenantSups, [{{:_, :"$1", :_}, [], [:"$1"]}])
  end
end
