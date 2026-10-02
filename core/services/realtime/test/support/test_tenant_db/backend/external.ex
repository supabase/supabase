defmodule TestTenantDb.Backend.External do
  @moduledoc false
  # USE_EXTERNAL_TENANT_DB=true: tenant tests target one or more
  # already-running, external Postgres-wire-compatible servers (e.g.
  # Multigres) on EXTERNAL_TENANT_DB_PORTS, host fixed at 127.0.0.1. Each
  # configured port is an independent DB — the pool hands out exactly one per
  # concurrent test, same checkout/checkin contract as the docker pool.
  #
  # This module is both the backend implementation and the registry that
  # hands each TestTenantDb.Backend.External.Worker its port. The registry
  # monitors claimants and reclaims a crashed worker's port — pool size
  # equals the port count exactly (no spare), so a poolboy-restarted worker
  # could otherwise permanently exhaust the list after a single crash.
  @behaviour TestTenantDb.Backend

  use GenServer

  # -- TestTenantDb.Backend implementation

  # Each configured port is one independent DB reused for the whole run, so
  # max_cases must not exceed the port count — oversubscribing causes far
  # worse, cascading failures than running serially (concurrent tenant
  # setup, e.g. DROP SCHEMA realtime CASCADE, stomping on each other once
  # demand exceeds supply). MAX_CASES is therefore ignored.
  @impl TestTenantDb.Backend
  def max_cases do
    # One port is held back as a spare: some tests check out a second database while
    # holding the first, and a checkin can lag the test that made it.
    forced = max(1, length(ports!()) - 1)

    if System.get_env("MAX_CASES") do
      IO.puts(
        "[TestTenantDb.Backend.External] USE_EXTERNAL_TENANT_DB=true: ignoring MAX_CASES, " <>
          "forcing max_cases to #{forced} (one fewer than the configured external ports)."
      )
    end

    forced
  end

  # TENANT_DB_IMAGE can differ from the realtime database's image, and every
  # configured port runs it, so the first port answers for all.
  @impl TestTenantDb.Backend
  def capability_probe_port, do: hd(ports!())

  # No image to pull or containers to stop — just start the port registry
  # the pool workers will claim from.
  @impl TestTenantDb.Backend
  def prepare! do
    {:ok, _pid} = GenServer.start_link(__MODULE__, ports!(), name: __MODULE__)
    :ok
  end

  # The external servers outlive the run; there is nothing of ours to tear down.
  @impl TestTenantDb.Backend
  def cleanup!, do: :ok

  @impl TestTenantDb.Backend
  def pool_spec(_max_cases), do: {__MODULE__.Worker, length(ports!())}

  @impl TestTenantDb.Backend
  def worker_port(pid), do: __MODULE__.Worker.port(pid)

  # The tenant DB is the external server's pre-existing `postgres` database;
  # there's nothing to create, and some Postgres-wire-compatible servers
  # don't implement CREATE DATABASE (or mishandle Ecto's zero-column
  # existence probe).
  @impl TestTenantDb.Backend
  def storage_up!(_tenant), do: :ok

  @impl TestTenantDb.Backend
  def diagnose(pid) do
    # Tolerant of a worker that is dead or not answering: this runs on the failure
    # path, where raising would bury the failure it is meant to explain.
    port =
      try do
        __MODULE__.Worker.port(pid)
      catch
        _, _ -> "unknown"
      end

    {"127.0.0.1:#{port}", "external tenant DB on 127.0.0.1:#{port} stopped answering."}
  end

  # The external servers are supplied to us; throwing the worker away cannot
  # recreate one, and a replacement worker reclaims the very same port. Retrying
  # the checkout is therefore futile here, and TestTenantDb raises instead.
  @impl TestTenantDb.Backend
  def discard(_pid), do: :ok

  # -- Port configuration

  # EXTERNAL_TENANT_DB_PORTS is a comma-separated list, one port per
  # independent external DB (e.g. one per Multigres cluster).
  # EXTERNAL_TENANT_DB_PORT (singular) is kept as an alias for a single-port
  # list.
  def ports! do
    ports_config!(System.get_env("EXTERNAL_TENANT_DB_PORTS"), System.get_env("EXTERNAL_TENANT_DB_PORT"))
  end

  def ports_config!(ports_value, port_value) do
    case presence(ports_value) || presence(port_value) do
      nil ->
        raise "USE_EXTERNAL_TENANT_DB=true requires EXTERNAL_TENANT_DB_PORTS (comma-separated) or EXTERNAL_TENANT_DB_PORT to be set"

      value ->
        parse_ports!(value)
    end
  end

  def parse_ports!(value) do
    value
    |> String.split(",")
    |> Enum.map(&String.trim/1)
    |> Enum.map(&parse_port!/1)
  end

  defp parse_port!(entry) do
    case Integer.parse(entry) do
      {port, ""} when port > 0 -> port
      _ -> raise "EXTERNAL_TENANT_DB_PORTS: #{inspect(entry)} is not a valid port number"
    end
  end

  # Treats an explicitly-empty env var the same as unset, so e.g.
  # EXTERNAL_TENANT_DB_PORTS="" falls through to EXTERNAL_TENANT_DB_PORT (or
  # the clear "not set" error) instead of failing to parse "".
  defp presence(nil), do: nil
  defp presence(""), do: nil
  defp presence(value), do: value

  # -- Port registry (claimed by TestTenantDb.Backend.External.Worker)

  def claim, do: GenServer.call(__MODULE__, :claim, 10_000)

  @impl GenServer
  def init(ports), do: {:ok, %{free: ports, owners: %{}}}

  @impl GenServer
  def handle_call(:claim, {pid, _tag}, state) do
    case state.free do
      [port | rest] ->
        Process.monitor(pid)
        {:reply, port, %{state | free: rest, owners: Map.put(state.owners, pid, port)}}

      [] ->
        # Momentary exhaustion — e.g. a replacement worker asked before the
        # dead worker's :DOWN reclaimed its port. The caller retries.
        {:reply, {:error, :no_external_ports_available}, state}
    end
  end

  @impl GenServer
  def handle_info({:DOWN, _ref, :process, pid, _reason}, state) do
    case Map.pop(state.owners, pid) do
      {nil, _owners} ->
        {:noreply, state}

      {port, owners} ->
        {:noreply, %{state | free: [port | state.free], owners: owners}}
    end
  end
end
