defmodule Realtime.Tenants.ReplicationConnection.Watchdog do
  @moduledoc """
  Monitors ReplicationConnection health by performing periodic call checks.
  If the call times out, logs an error and terminates the ReplicationConnection process to trigger a restart.

  On each interval it also queries the tenant database to verify the replication slot
  is alive: the slot still exists and is actively being consumed. A ReplicationConnection
  can keep answering health checks while its temporary replication slot has silently
  disappeared or gone inactive, in which case no changes are being streamed. When the
  slot is not alive the watchdog stops so the ReplicationConnection (linked to this
  process) is restarted.

  It also checks the replication slot WAL lag. If the lag exceeds 50% of
  max_slot_wal_keep_size, the watchdog stops so the ReplicationConnection is stopped.
  When max_slot_wal_keep_size = -1 (unlimited) the lag check is skipped entirely,
  as there is no per-slot enforcement threshold to reason against.
  """
  use GenServer
  use Realtime.Logs
  alias Realtime.Database
  alias Realtime.Tenants.Connect
  alias Realtime.Tenants.ReplicationConnection

  @default_check_interval :timer.minutes(5)
  @default_timeout :timer.minutes(1)

  defstruct [:parent_pid, :tenant_id, :check_interval, :timeout, :replication_slot_name]

  def start_link(opts), do: GenServer.start_link(__MODULE__, opts)

  @impl true
  def init(opts) do
    parent_pid = Keyword.fetch!(opts, :parent_pid)
    tenant_id = Keyword.fetch!(opts, :tenant_id)

    check_interval =
      Keyword.get(
        opts,
        :watchdog_interval,
        Application.get_env(:realtime, :replication_watchdog_interval, @default_check_interval)
      )

    timeout =
      Keyword.get(
        opts,
        :watchdog_timeout,
        Application.get_env(:realtime, :replication_watchdog_timeout, @default_timeout)
      )

    replication_slot_name = Keyword.get(opts, :replication_slot_name)

    Logger.metadata(external_id: tenant_id, project: tenant_id)

    Process.send_after(self(), :health_check, check_interval)

    state = %__MODULE__{
      parent_pid: parent_pid,
      tenant_id: tenant_id,
      check_interval: check_interval,
      timeout: timeout,
      replication_slot_name: replication_slot_name
    }

    {:ok, state}
  end

  @impl true
  def handle_info(:health_check, state) do
    case ReplicationConnection.health_check(state.parent_pid, state.timeout) do
      :ok ->
        case check_slot(state) do
          :ok ->
            Process.send_after(self(), :health_check, state.check_interval)
            {:noreply, state}

          {:error, reason} when reason in [:slot_not_found, :slot_inactive] ->
            log_error(
              "ReplicationSlotNotAlive",
              "Replication slot #{state.replication_slot_name} is not alive (#{reason}), shutting down"
            )

            {:stop, :replication_slot_not_alive, state}

          {:error, :lag_too_high} ->
            log_error(
              "ReplicationSlotLagTooHigh",
              "Replication slot lag exceeds 50% of max_slot_wal_keep_size, shutting down"
            )

            {:stop, :slot_lag_too_high, state}

          {:error, reason} ->
            log_warning("ReplicationSlotCheckSkipped", "Could not check replication slot: #{inspect(reason)}")
            Process.send_after(self(), :health_check, state.check_interval)
            {:noreply, state}
        end
    end
  catch
    :exit, {:timeout, _} ->
      log_error("ReplicationConnectionWatchdogTimeout", "ReplicationConnection is not responding")

      {:stop, :watchdog_timeout, state}
  end

  defp check_slot(%{replication_slot_name: nil}), do: :ok

  defp check_slot(%{tenant_id: tenant_id, replication_slot_name: slot_name}) do
    case Connect.get_status(tenant_id) do
      {:ok, conn} -> Database.check_replication_slot(conn, slot_name)
      {:error, reason} -> {:error, reason}
    end
  end
end
