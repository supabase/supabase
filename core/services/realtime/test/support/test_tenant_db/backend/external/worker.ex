defmodule TestTenantDb.Backend.External.Worker do
  @moduledoc false
  # Poolboy worker for the External backend: claims one pre-configured
  # external-tenant-DB port from TestTenantDb.Backend.External for the rest
  # of its lifetime in the pool. Unlike the Docker worker, there's no
  # container to start or wait on — the port is already a live server.
  use GenServer

  import WaitForIt

  alias TestTenantDb.Backend.External

  def start_link(args \\ [], opts \\ []) do
    GenServer.start_link(__MODULE__, args, opts)
  end

  def port(pid), do: GenServer.call(pid, :port, 15_000)

  @impl true
  def init(_args), do: {:ok, %{}, {:continue, :assign_port}}

  @impl true
  def handle_continue(:assign_port, _state) do
    {:noreply, %{port: assign_port()}}
  end

  # A replacement worker (started by poolboy after a crash) can momentarily
  # find no port available if it asks before the registry has processed the
  # dead worker's :DOWN and reclaimed its port. Retry briefly instead of
  # crashing this worker outright.
  #
  # Blocking in a GenServer callback is normally wrong, but this one runs from `handle_continue`
  # during startup: the worker has no other work queued and is not usable until it holds a port.
  defp assign_port do
    case_wait External.claim(), timeout: 1_000, interval: 100 do
      port when is_integer(port) ->
        port
    else
      {:error, :no_external_ports_available} ->
        raise "TestTenantDb.Backend.External.Worker: no external port became available after retrying"
    end
  end

  @impl true
  def handle_call(:port, _from, state), do: {:reply, state[:port], state}
end
