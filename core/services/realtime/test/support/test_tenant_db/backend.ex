defmodule TestTenantDb.Backend do
  @moduledoc false
  # Strategy for provisioning the test suite's tenant databases:
  #
  #   * TestTenantDb.Backend.Docker   — ephemeral supabase/postgres docker
  #     containers, one per pool worker (the default).
  #   * TestTenantDb.Backend.External — pre-existing, external
  #     Postgres-wire-compatible servers (e.g. Multigres) on
  #     EXTERNAL_TENANT_DB_PORTS (USE_EXTERNAL_TENANT_DB=true).
  #
  # The backend is resolved exactly once per run, in test_helper.exs, and
  # stashed in :persistent_term.
  #
  # Each backend is self-contained: it owns its pool workers and (for
  # pre-provisioned resources) its own registry. TestTenantDb only calls the
  # callbacks below.

  alias Realtime.Env

  @key {__MODULE__, :current}

  # Number of concurrent ExUnit cases this backend supports.
  @callback max_cases() :: pos_integer()

  # Where to probe the capabilities the suite's tags gate on. `:realtime_db` when
  # that database runs the same image and can answer for the tenants.
  @callback capability_probe_port() :: pos_integer() | :realtime_db

  # One-off setup before the pool starts. Runs before TestTenantDb.start_link/1.
  @callback prepare!() :: :ok

  # Undo prepare!/0, called from TestTenantDb.shutdown/1 at the end of the run.
  @callback cleanup!() :: :ok

  # Poolboy worker module and pool size.
  @callback pool_spec(max_cases :: pos_integer()) :: {module(), pos_integer()}

  # Port of a checked-out pool worker.
  @callback worker_port(pid()) :: pos_integer()

  # Ensure the tenant's database exists
  @callback storage_up!(tenant :: struct()) :: :ok

  # Forensics for a worker whose database stopped answering: a short label
  # identifying the backing resource (so repeat offenders can be grouped) and a
  # best-effort human-readable dump. Only ever called on the unhealthy path, so
  # it is allowed to be slow.
  @callback diagnose(pid()) :: {label :: String.t(), details :: String.t()}

  # Destroy a worker's backing resource. The worker is being thrown away, and a
  # container we have given up on keeps competing for the runner's CPU and memory
  # for the rest of the suite if it is still running.
  @callback discard(pid()) :: :ok

  def resolve! do
    backend = choose()
    :persistent_term.put(@key, backend)
    backend
  end

  def current, do: :persistent_term.get(@key)

  def choose do
    if Env.get_boolean("USE_EXTERNAL_TENANT_DB", false) do
      TestTenantDb.Backend.External
    else
      TestTenantDb.Backend.Docker
    end
  end
end
