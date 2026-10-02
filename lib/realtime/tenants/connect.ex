defmodule Realtime.Tenants.Connect do
  @moduledoc """
  This module is responsible for attempting to connect to a tenant's database and store the DBConnection in a Syn registry.

  ## Options
  * `:check_connected_user_interval` - The interval in milliseconds to check if there are any connected users to a tenant channel. If there are no connected users, the connection will be stopped.
  * `:check_connect_region_interval` - The interval in milliseconds to check if this process is in the correct region. If the region is not correct it stops the connection.
  * `:erpc_timeout` - The timeout in milliseconds for the `:erpc` calls to the tenant's database.
  """
  use GenServer, restart: :temporary

  use Realtime.Logs

  alias Realtime.Api.Tenant
  alias Realtime.GenCounter
  alias Realtime.RateCounter
  alias Realtime.Rpc
  alias Realtime.Tenants
  alias Realtime.Tenants.Connect.CheckConnection
  alias Realtime.Tenants.Connect.GetTenant
  alias Realtime.Tenants.Connect.Piper
  alias Realtime.Tenants.Connect.ReconcileMigrations
  alias Realtime.Tenants.Connect.RegisterProcess
  alias Realtime.Tenants.Migrations
  alias Realtime.Tenants.Rebalancer
  alias Realtime.Tenants.ReplicationConnection
  alias Realtime.UsersCounter
  alias DBConnection.Backoff

  @rpc_timeout_default 30_000
  @check_connected_user_interval_default :timer.seconds(60)
  @connected_users_bucket_shutdown [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  # How long the database pool may stay disconnected before we give up and stop
  # Connect. The durable pool reconnects forever with backoff, so without a bound
  # a permanent failure (e.g. rotated credentials, dropped database) would retry
  # silently forever. Stopping lets the next request re-run the probe and surface
  # a real error instead.
  @max_db_recovery_ms :timer.minutes(10)

  @type t :: %__MODULE__{
          tenant_id: binary(),
          db_conn_reference: reference(),
          db_conn_pid: pid(),
          replication_connection_pid: pid(),
          replication_connection_reference: reference(),
          replication_start_task: reference() | nil,
          backoff: Backoff.t(),
          replication_recovery_started_at: non_neg_integer() | nil,
          db_recovery_started_at: non_neg_integer() | nil,
          check_connected_user_interval: non_neg_integer(),
          connected_users_bucket: list(non_neg_integer()),
          check_connect_region_interval: non_neg_integer(),
          migrations_ran_on_database: non_neg_integer()
        }

  defstruct tenant_id: nil,
            db_conn_reference: nil,
            db_conn_pid: nil,
            replication_connection_pid: nil,
            replication_connection_reference: nil,
            replication_start_task: nil,
            backoff: nil,
            replication_recovery_started_at: nil,
            db_recovery_started_at: nil,
            check_connected_user_interval: nil,
            connected_users_bucket: [1],
            check_connect_region_interval: nil,
            migrations_ran_on_database: 0

  @tenant_id_spec [{{:"$1", :_, :_, :_, :_, :_}, [], [:"$1"]}]
  @spec list_tenants() :: [binary]
  def list_tenants do
    :syn_registry_by_name
    |> :syn_backbone.get_table_name(__MODULE__)
    |> :ets.select(@tenant_id_spec)
  end

  @doc "Check if Connect has finished setting up connections"
  def ready?(tenant_id) do
    case whereis(tenant_id) do
      pid when is_pid(pid) -> GenServer.call(pid, :ready?)
      _ -> false
    end
  end

  @doc """
  Returns the database connection for a tenant. If the tenant is not connected, it will attempt to connect to the tenant's database.
  """
  @spec lookup_or_start_connection(binary(), keyword()) ::
          {:ok, pid()}
          | {:error, :tenant_database_unavailable}
          | {:error, :initializing}
          | {:error, :tenant_database_connection_initializing}
          | {:error, :tenant_db_too_many_connections}
          | {:error, :connect_rate_limit_reached}
          | {:error, :rpc_error, term()}
  def lookup_or_start_connection(tenant_id, opts \\ []) when is_binary(tenant_id) do
    case get_status(tenant_id) do
      {:ok, conn} ->
        {:ok, conn}

      error ->
        rate_args = Tenants.connect_errors_per_second_rate(tenant_id)
        {:ok, rate} = RateCounter.get(rate_args)

        if rate.limit.triggered do
          {:error, :connect_rate_limit_reached}
        else
          case error do
            {:error, :tenant_database_connection_initializing} ->
              case call_external_node(tenant_id, opts) do
                {:ok, pid} ->
                  {:ok, pid}

                err ->
                  GenCounter.add(rate_args.id)
                  err
              end

            {:error, :initializing} ->
              {:error, :tenant_database_unavailable}

            {:error, reason} ->
              {:error, reason}
          end
        end
    end
  end

  @doc """
  Returns the database connection pid from :syn if it exists.
  """
  @spec get_status(binary()) ::
          {:ok, pid()}
          | {:error, :tenant_database_unavailable}
          | {:error, :initializing}
          | {:error, :tenant_database_connection_initializing}
          | {:error, :tenant_db_too_many_connections}
  def get_status(tenant_id) do
    case :syn.lookup(__MODULE__, tenant_id) do
      {pid, %{conn: nil}} ->
        wait_for_connection(pid, tenant_id)

      {_, %{conn: conn, replication_conn: nil}} ->
        {:ok, conn}

      {_, %{conn: conn}} ->
        {:ok, conn}

      :undefined ->
        {:error, :tenant_database_connection_initializing}

      error ->
        log_error("SynInitializationError", error)
        {:error, :tenant_database_unavailable}
    end
  end

  def syn_topic(tenant_id), do: "connect:#{tenant_id}"

  defp wait_for_connection(pid, tenant_id) do
    RealtimeWeb.Endpoint.subscribe(syn_topic(tenant_id))

    # We do a lookup after subscribing because we could've missed a message while subscribing
    case :syn.lookup(__MODULE__, tenant_id) do
      {_pid, %{conn: conn}} when is_pid(conn) ->
        {:ok, conn}

      _ ->
        # Wait for up to 5 seconds for the ready event
        receive do
          %{event: "ready", payload: %{pid: ^pid, conn: conn}} ->
            {:ok, conn}

          %{event: "connect_down", payload: %{pid: ^pid, reason: {:shutdown, :tenant_db_too_many_connections}}} ->
            {:error, :tenant_db_too_many_connections}

          %{event: "connect_down", payload: %{pid: ^pid, reason: _reason}} ->
            metadata = [external_id: tenant_id, project: tenant_id]
            log_error("UnableToConnectToTenantDatabase", "Unable to connect to tenant database", metadata)
            {:error, :tenant_database_unavailable}
        after
          connection_ready_timeout() -> {:error, :initializing}
        end
    end
  after
    RealtimeWeb.Endpoint.unsubscribe(syn_topic(tenant_id))
  end

  # How long a caller waits for a tenant connection to become ready before giving up.
  defp connection_ready_timeout, do: Application.get_env(:realtime, :connect_connection_ready_timeout, 15_000)

  @doc """
  Connects to a tenant's database and stores the DBConnection in the process :syn metadata
  """
  @spec connect(binary(), binary(), keyword()) :: {:ok, DBConnection.t()} | {:error, term()}
  def connect(tenant_id, region, opts \\ []) do
    supervisor =
      {:via, PartitionSupervisor, {Realtime.Tenants.Connect.DynamicSupervisor, tenant_id}}

    spec = {__MODULE__, [tenant_id: tenant_id, region: region] ++ opts}
    metadata = [external_id: tenant_id, project: tenant_id]

    case DynamicSupervisor.start_child(supervisor, spec) do
      {:ok, _} ->
        get_status(tenant_id)

      {:error, {:already_started, _}} ->
        get_status(tenant_id)

      {:error, error} ->
        log_error("UnableToConnectToTenantDatabase", error, metadata)
        {:error, :tenant_database_unavailable}
    end
  end

  @doc """
  Returns the pid of the tenant Connection process and db_conn pid
  """
  @spec whereis(binary()) :: pid() | nil
  def whereis(tenant_id) do
    case :syn.lookup(__MODULE__, tenant_id) do
      {pid, _} when is_pid(pid) -> pid
      _ -> nil
    end
  end

  @doc """
  Returns the replication connection status from :syn metadata without RPC calls.
  """
  @spec replication_status(binary()) :: {:ok, pid()} | {:error, :not_connected}
  def replication_status(tenant_id) do
    case :syn.lookup(__MODULE__, tenant_id) do
      {_, %{replication_conn: pid}} when is_pid(pid) -> {:ok, pid}
      _ -> {:error, :not_connected}
    end
  end

  @doc """
  Shutdown the tenant Connection and linked processes
  """
  @spec shutdown(binary()) :: :ok
  def shutdown(tenant_id) do
    case whereis(tenant_id) do
      pid when is_pid(pid) ->
        send(pid, :shutdown_connect)
        :ok

      _ ->
        :ok
    end
  end

  def start_link(opts) do
    tenant_id = Keyword.get(opts, :tenant_id)
    region = Keyword.get(opts, :region)

    check_connected_user_interval =
      Keyword.get(opts, :check_connected_user_interval, @check_connected_user_interval_default)

    check_connect_region_interval = Keyword.get(opts, :check_connect_region_interval, rebalance_check_interval_in_ms())

    name = {__MODULE__, tenant_id, %{conn: nil, region: region, replication_conn: nil}}

    state = %__MODULE__{
      tenant_id: tenant_id,
      check_connected_user_interval: check_connected_user_interval,
      check_connect_region_interval: check_connect_region_interval,
      backoff: Backoff.new(backoff_min: :timer.seconds(5), backoff_max: :timer.minutes(5), backoff_type: :rand_exp)
    }

    opts = Keyword.put(opts, :name, {:via, :syn, name})

    GenServer.start_link(__MODULE__, state, opts)
  end

  ## GenServer callbacks
  # Needs to be done on init/1 to guarantee the GenServer only starts if we are able to connect to the database
  @impl GenServer
  def init(%{tenant_id: tenant_id} = state) do
    Logger.metadata(external_id: tenant_id, project: tenant_id)

    {:ok, state, {:continue, :db_connect}}
  end

  @impl true
  def handle_continue(:db_connect, state) do
    pipes = [
      GetTenant,
      CheckConnection,
      ReconcileMigrations,
      RegisterProcess
    ]

    case Piper.run(pipes, state) do
      {:ok, acc} ->
        {:noreply, acc, {:continue, :provision_tenant}}

      {:error, :tenant_not_found} ->
        {:stop, {:shutdown, :tenant_not_found}, state}

      {:error, :tenant_db_too_many_connections} ->
        {:stop, {:shutdown, :tenant_db_too_many_connections}, state}

      {:error, error} ->
        log_error("UnableToConnectToTenantDatabase", error)
        {:stop, :shutdown, state}
    end
  end

  def handle_continue(:provision_tenant, state) do
    %{tenant: tenant, db_conn_pid: db_conn_pid} = state
    Logger.info("Tenant #{tenant.external_id} is initializing: #{inspect(node())}")

    with res when res in [:ok, :noop] <- Migrations.run_migrations(tenant),
         :ok <- Tenants.create_messages_partitions(db_conn_pid) do
      {:noreply, state, {:continue, :start_replication}}
    else
      error ->
        log_error("MigrationsFailedToRun", error)
        {:stop, :shutdown, state}
    end
  rescue
    error ->
      log_error("MigrationsFailedToRun", error)
      {:stop, :shutdown, state}
  end

  def handle_continue(:start_replication, state) do
    {:noreply, async_start_replication_connection(state), {:continue, :setup_connected_user_events}}
  end

  def handle_continue(:setup_connected_user_events, state) do
    %{check_connected_user_interval: check_connected_user_interval, tenant_id: tenant_id} = state

    :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, "realtime:operations:" <> tenant_id)
    schedule_connected_user_check(check_connected_user_interval)
    :ets.insert(__MODULE__, {tenant_id})
    {:noreply, state, {:continue, :start_connect_region_check}}
  end

  def handle_continue(:start_connect_region_check, state) do
    send_connect_region_check_message(state.check_connect_region_interval)
    {:noreply, state}
  end

  @impl GenServer
  def handle_info(
        :check_connected_users,
        %{
          tenant_id: tenant_id,
          check_connected_user_interval: check_connected_user_interval,
          connected_users_bucket: connected_users_bucket
        } = state
      ) do
    case update_connected_users_bucket(tenant_id, connected_users_bucket) do
      @connected_users_bucket_shutdown ->
        Logger.info("Tenant has no connected users, database connection will be terminated")
        {:stop, :shutdown, state}

      connected_users_bucket ->
        schedule_connected_user_check(check_connected_user_interval)
        {:noreply, %{state | connected_users_bucket: connected_users_bucket}}
    end
  end

  def handle_info({:check_connect_region, previous_nodes_set}, state) do
    current_nodes_set = MapSet.new(Node.list())

    case Rebalancer.check(previous_nodes_set, current_nodes_set, state.tenant_id) do
      :ok ->
        # Let's check again in the future
        send_connect_region_check_message(state.check_connect_region_interval)
        {:noreply, state}

      {:error, :wrong_region} ->
        Logger.warning("Rebalancing Tenant database connection for a closer region")
        {:stop, {:shutdown, :rebalancing}, state}
    end
  end

  def handle_info(:shutdown_connect, state) do
    Logger.warning("Shutdowning tenant connection")
    {:stop, :shutdown, state}
  end

  # Handle database connection termination
  def handle_info(
        {:DOWN, db_conn_reference, _, _, _},
        %{db_conn_reference: db_conn_reference} = state
      ) do
    Logger.warning("Database connection has been terminated")
    {:stop, :shutdown, state}
  end

  # Database pool connection listener events (registered in CheckConnection).
  # A pool connection came up: the pool is usable again, close any recovery window.
  def handle_info({:connected, _conn_pid, _tag}, state), do: {:noreply, close_db_recovery(state)}

  # A pool connection dropped. The pool reconnects on its own with backoff, but we
  # open a bounded recovery window so a permanent failure doesn't retry forever.
  def handle_info({:disconnected, _conn_pid, _tag}, state), do: {:noreply, open_db_recovery(state)}

  # stale timer: window already closed (a reconnect cleared started_at) → ignore it
  def handle_info(:db_recovery_timeout, %{db_recovery_started_at: nil} = state), do: {:noreply, state}

  # Recovery window elapsed without the pool reconnecting: give up so the tenant
  # is re-evaluated from scratch on the next request.
  def handle_info(:db_recovery_timeout, state) do
    elapsed = System.monotonic_time(:millisecond) - state.db_recovery_started_at

    if elapsed >= @max_db_recovery_ms do
      log_warning(
        "DatabaseConnectionRecoveryWindowExceeded",
        "Database pool could not reconnect within #{@max_db_recovery_ms}ms, terminating connection"
      )

      {:stop, :shutdown, state}
    else
      Process.send_after(self(), :db_recovery_timeout, @max_db_recovery_ms - elapsed)
      {:noreply, state}
    end
  end

  # Handle replication connection termination
  def handle_info(
        {:DOWN, replication_connection_reference, _, _, _},
        %{replication_connection_reference: replication_connection_reference} = state
      ) do
    log_warning("ReplicationConnectionDown", "Replication connection has been terminated, recovery window opened")
    {:noreply, open_replication_recovery(state)}
  end

  # Handle the result of the async replication connection start task
  def handle_info({replication_start_task, result}, %{replication_start_task: replication_start_task} = state) do
    Process.demonitor(replication_start_task, [:flush])
    state = %{state | replication_start_task: nil}

    case result do
      {:ok, replication_connection_pid} ->
        update_syn_replication_conn(state.tenant_id, replication_connection_pid)
        replication_connection_reference = Process.monitor(replication_connection_pid)

        {:noreply,
         %{
           state
           | replication_connection_pid: replication_connection_pid,
             replication_connection_reference: replication_connection_reference,
             backoff: Backoff.reset(state.backoff),
             replication_recovery_started_at: nil
         }}

      {:error, :max_wal_senders_reached} ->
        log_error("ReplicationMaxWalSendersReached", "Tenant database has reached the maximum number of WAL senders")
        {:noreply, open_replication_recovery(state)}

      {:error, :replication_connection_timeout} ->
        log_error("ReplicationConnectionTimeout", "Replication connection timed out during initialization")
        {:noreply, open_replication_recovery(state)}

      {:error, error} ->
        log_error("StartReplicationFailed", error)
        {:noreply, open_replication_recovery(state)}
    end
  end

  # Handle a crash of the async replication connection start task
  def handle_info(
        {:DOWN, replication_start_task, :process, _, reason},
        %{replication_start_task: replication_start_task} = state
      ) do
    log_error("StartReplicationFailed", reason)
    {:noreply, open_replication_recovery(%{state | replication_start_task: nil})}
  end

  @replication_connection_query "SELECT 1 from pg_stat_activity where application_name='realtime_replication_connection'"
  @max_replication_recovery_ms :timer.hours(2)
  def handle_info(:recover_replication_connection, %{replication_recovery_started_at: nil} = state) do
    {:noreply, state}
  end

  def handle_info(:recover_replication_connection, state) do
    %{db_conn_pid: db_conn_pid, replication_recovery_started_at: started_at} = state
    elapsed = System.monotonic_time(:millisecond) - started_at

    cond do
      elapsed > @max_replication_recovery_ms ->
        log_warning(
          "ReplicationRecoveryWindowExceeded",
          "Replication recovery window exceeded after #{elapsed}ms, terminating connection"
        )

        {:stop, :shutdown, state}

      # A start is already in flight, don't start another one
      is_reference(state.replication_start_task) ->
        {:noreply, state}

      true ->
        case Postgrex.query(db_conn_pid, @replication_connection_query, []) do
          {:ok, %{num_rows: 0}} ->
            {:noreply, async_start_replication_connection(state)}

          {:ok, %{num_rows: _}} ->
            Logger.info("Waiting for old walsender to exit")
            {:noreply, schedule_replication_retry(state)}

          {:error, error} ->
            log_error("ReplicationConnectionRecoveryFailed", "DB check failed during recovery: #{inspect(error)}")
            {:noreply, schedule_replication_retry(state)}
        end
    end
  end

  def handle_info(_, state), do: {:noreply, state}

  @impl true
  def handle_call(:ready?, _from, state) do
    # We just want to know if the process is ready to reply to the client
    # Essentially checking if all handle_continue's were completed
    {:reply, true, state}
  end

  @impl true
  def terminate(reason, %{tenant_id: tenant_id}) do
    Logger.info("Tenant #{tenant_id} has been terminated: #{inspect(reason)}")
    :ok
  end

  ## Private functions
  defp call_external_node(tenant_id, opts) do
    Logger.info("Connection process starting up", external_id: tenant_id, project: tenant_id)
    rpc_timeout = Keyword.get(opts, :rpc_timeout, @rpc_timeout_default)

    with tenant <- Tenants.Cache.get_tenant_by_external_id(tenant_id),
         :ok <- tenant_suspended?(tenant),
         {:ok, node, region} <- Realtime.Nodes.get_node_for_tenant(tenant) do
      Rpc.enhanced_call(node, __MODULE__, :connect, [tenant_id, region, opts],
        timeout: rpc_timeout,
        tenant_id: tenant_id
      )
    end
  end

  defp update_connected_users_bucket(tenant_id, connected_users_bucket) do
    connected_users_bucket
    |> then(&(&1 ++ [UsersCounter.tenant_users(tenant_id)]))
    |> Enum.take(-10)
  end

  defp schedule_connected_user_check(check_connected_user_interval) do
    Process.send_after(self(), :check_connected_users, check_connected_user_interval)
  end

  defp send_connect_region_check_message(check_connect_region_interval) do
    Process.send_after(self(), {:check_connect_region, MapSet.new(Node.list())}, check_connect_region_interval)
  end

  defp tenant_suspended?(%Tenant{suspend: true}), do: {:error, :tenant_suspended}
  defp tenant_suspended?(_), do: :ok

  defp rebalance_check_interval_in_ms, do: Application.fetch_env!(:realtime, :rebalance_check_interval_in_ms)

  # Opens the database pool recovery window on the first disconnect. Edge-triggered:
  # a later disconnect while already open keeps the original start time, and any
  # reconnect (`close_db_recovery/1`) clears it. Only a full window with no reconnect
  # in between stops Connect.
  defp open_db_recovery(%{db_recovery_started_at: nil} = state) do
    log_warning("DatabaseConnectionDown", "Database pool connection lost, recovery window opened")
    Process.send_after(self(), :db_recovery_timeout, @max_db_recovery_ms)
    %{state | db_recovery_started_at: System.monotonic_time(:millisecond)}
  end

  defp open_db_recovery(state), do: state

  defp close_db_recovery(%{db_recovery_started_at: nil} = state), do: state

  defp close_db_recovery(state) do
    Logger.info("Database pool reconnected, recovery window closed")
    %{state | db_recovery_started_at: nil}
  end

  defp open_replication_recovery(%{tenant_id: tenant_id} = state) do
    update_syn_replication_conn(tenant_id, nil)
    recovery_started_at = state.replication_recovery_started_at || System.monotonic_time(:millisecond)

    state = %{
      state
      | replication_connection_pid: nil,
        replication_connection_reference: nil,
        replication_recovery_started_at: recovery_started_at
    }

    schedule_replication_retry(state)
  end

  defp schedule_replication_retry(%{backoff: backoff} = state) do
    {timeout, backoff} = Backoff.backoff(backoff)
    Process.send_after(self(), :recover_replication_connection, timeout)
    %{state | backoff: backoff}
  end

  defp update_syn_replication_conn(tenant_id, pid) do
    :syn.update_registry(__MODULE__, tenant_id, fn _pid, meta -> %{meta | replication_conn: pid} end)
  end

  # Starts the replication connection off-process so Connect stays responsive to its mailbox
  # while Postgrex.ReplicationConnection performs its (up to ~30s) synchronous connect.
  # The resulting process is supervised by its own DynamicSupervisor and monitors `connect_pid`,
  # so it self-cleans if Connect dies while the start is in flight. `connect_pid` must be captured
  # here (the Connect process) and not inside the task, which would pass the task's pid.
  defp async_start_replication_connection(%{tenant: tenant} = state) do
    connect_pid = self()

    %Task{ref: ref} =
      Task.Supervisor.async_nolink(Realtime.TaskSupervisor, fn ->
        ReplicationConnection.start(tenant, connect_pid)
      end)

    %{state | replication_start_task: ref}
  end
end
