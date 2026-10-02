defmodule TestTenantDb.Backend.Docker.Worker do
  @moduledoc false
  # Poolboy worker for the Docker backend: claims a container from
  # TestTenantDb.Backend.Docker on start and waits for it to accept
  # connections before joining the pool.
  use GenServer

  alias TestTenantDb.Backend.Docker

  def start_link(args \\ [], opts \\ []) do
    GenServer.start_link(__MODULE__, args, opts)
  end

  # The worker does not answer calls until it has claimed a container and waited
  # for Postgres, so this call is really "wait for the container to come up".
  def port(pid), do: GenServer.call(pid, :port, Docker.worker_ready_timeout_ms())

  # Deliberately shorter: this is only called on the failure path, to name
  # the container - don't want to wait too long on a failure.
  @container_call_timeout_ms 5_000

  # Name of the docker container backing this worker, for diagnostics and teardown.
  def container(pid) do
    GenServer.call(pid, :container, @container_call_timeout_ms)
  catch
    _, _ -> nil
  end

  @impl true
  def init(_args), do: {:ok, %{}, {:continue, :claim}}

  @impl true
  def handle_continue(:claim, _state) do
    {:ok, name, port} = Docker.claim()
    {:noreply, %{name: name, port: port}, {:continue, :wait_ready}}
  end

  @impl true
  def handle_continue(:wait_ready, state) do
    Docker.wait_ready!(state.name, state.port)
    {:noreply, state}
  end

  @impl true
  def handle_call(:port, _from, state), do: {:reply, state[:port], state}

  @impl true
  def handle_call(:container, _from, state), do: {:reply, state[:name], state}
end
