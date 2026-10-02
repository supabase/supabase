defmodule Supavisor.Manager do
  @moduledoc """
  The Manager is responsible for managing the config and parameter status for a pool
  """

  use GenServer
  require Logger
  require Supavisor

  alias Supavisor.Protocol.Server
  alias Supavisor.Tenants
  alias Supavisor.Helpers

  alias Supavisor.Errors.{
    MaxConnectionsError,
    PoolTerminatingError
  }

  @check_timeout 120_000

  @doc """
  Starts the pool manager
  """
  def start_link(args) do
    name = {:via, Registry, {Supavisor.Registry.Tenants, {:manager, args.id}}}

    GenServer.start_link(__MODULE__, args, name: name)
  end

  @doc """
  Subscribes to a pool

  Upon subscription, a client "joins" a pool. From this point, it's an active connection and
  it may receive updates destined to the pool.
  """
  @spec subscribe(pid, pid) ::
          {:ok, iodata() | [], integer}
          | {:error, MaxConnectionsError.t()}
          | {:error, PoolTerminatingError.t()}
  def subscribe(manager, pid) when node(manager) == node() do
    GenServer.call(manager, {:subscribe, pid})
  end

  @doc """
  Checks if the client limit has been reached for a pool.

  This is used by ClientHandler for early rejection before authentication.
  If the Manager's ETS table exists, checks the current count against the limit.
  If the table doesn't exist yet (pool not started), allows the connection to proceed.

  The limit is determined by mode:
  - `:session` mode: limited by pool_size (each client holds a connection)
  - `:transaction` mode: limited by max_clients
  """
  @spec check_client_limit(Supavisor.id(), map(), :session | :transaction) ::
          :ok | {:error, MaxConnectionsError.t()}
  def check_client_limit(id, info, mode) do
    case Registry.lookup(Supavisor.Registry.ManagerTables, id) do
      [{_pid, tid}] ->
        pool_size = info.user.pool_size || info.tenant.default_pool_size
        max_clients = info.user.max_clients || info.tenant.default_max_clients
        check_limit(mode, pool_size, max_clients, :ets.info(tid, :size))

      _ ->
        :ok
    end
  end

  @doc """
  Updates parameter status for the pool

  Sends the parameter status update to all subscribed client handlers.
  """
  @spec set_parameter_status(pid, map) :: :ok
  def set_parameter_status(manager, ps) do
    GenServer.call(manager, {:set_parameter_status, ps})
  end

  @doc """
  Get the current parameter status for a pool
  """
  @spec get_parameter_status(pid) :: iodata() | []
  def get_parameter_status(manager) do
    GenServer.call(manager, :get_parameter_status)
  end

  @doc """
  Get the current config for a pool
  """
  @spec get_config(pid | Supavisor.id()) :: map()
  def get_config(manager_or_id) do
    manager = resolve_manager(manager_or_id)
    GenServer.call(manager, :get_config)
  end

  @doc """
  Shuts down the pool with an error.

  Sends error to all clients and stops accepting new connections.
  """
  @spec shutdown_with_error(pid | Supavisor.id(), map()) :: :ok
  def shutdown_with_error(manager_or_id, error) do
    manager = resolve_manager(manager_or_id)
    GenServer.cast(manager, {:shutdown_with_error, error})
  end

  @doc """
  Stops the pool's tenant supervisor asynchronously.

  Its `Supavisor.Terminator` drains the clients gracefully.
  """
  @spec stop_pool(pid | Supavisor.id()) :: :ok
  def stop_pool(manager_or_id) do
    manager = resolve_manager(manager_or_id)
    GenServer.cast(manager, :stop_pool)
  end

  @doc """
  Initiates graceful shutdown of the pool.

  Sends admin shutdown message to all clients and stops accepting new connections.
  Blocks until all clients have disconnected or `drain_timeout` is reached.

  If `drain_timeout` is reached, remaining clients are forcefully terminated with
  an error.

  `call_timeout` bounds the whole call. The manager only arms its own
  `drain_timeout` once it picks the message up, so a manager that is busy in
  another `handle_call` can take longer than `drain_timeout` to reply. It must be
  larger than `drain_timeout`.
  """
  @spec graceful_shutdown(pid | Supavisor.id(), timeout(), timeout()) :: :ok
  def graceful_shutdown(manager_or_id, drain_timeout, call_timeout) do
    manager = resolve_manager(manager_or_id)
    GenServer.call(manager, {:graceful_shutdown, drain_timeout}, call_timeout)
  end

  @doc """
  Unsubscribes a client from the pool.

  Can be used on termination to free the client slot while cleanup is performed.
  """
  @spec unsubscribe(pid | Supavisor.id()) :: :ok
  def unsubscribe(manager_or_id) do
    manager = resolve_manager(manager_or_id)
    GenServer.call(manager, {:unsubscribe, self()}, 5000)
  end

  @doc """
  Registers a DbHandler as waiting for secrets to become available.
  """
  @spec register_waiting_for_secrets(pid | Supavisor.id(), pid) :: :ok
  def register_waiting_for_secrets(manager_or_id, db_handler_pid) do
    manager = resolve_manager(manager_or_id)
    GenServer.cast(manager, {:register_waiting_for_secrets, db_handler_pid})
  end

  @doc """
  Notifies waiting DbHandlers that secrets are now available.

  If the manager is not found, this is a no-op (pool may not be started yet).
  """
  @spec notify_secrets_available(Supavisor.id()) :: :ok
  def notify_secrets_available(id) do
    case Supavisor.get_local_manager(id) do
      nil -> :ok
      pid -> GenServer.cast(pid, :notify_secrets_available)
    end
  end

  ## Callbacks

  @impl true
  def init(args) do
    Helpers.set_log_level(args.log_level)
    tid = :ets.new(__MODULE__, [:protected])
    pid_to_ref = :ets.new(__MODULE__.PidToRef, [:protected])

    Supavisor.id(type: type, tenant: tenant, user: user, mode: mode, db: db_name) = args.id

    {tenant_record, replica_type} =
      case type do
        :single ->
          tenants = Tenants.get_pool_config_cache(tenant, user)
          {List.first(tenants), :write}

        :cluster ->
          case Tenants.get_cluster_config(tenant, user) do
            {:error, reason} ->
              raise "Failed to get cluster config: #{inspect(reason)}"

            cluster_tenants ->
              selected =
                Enum.find(cluster_tenants, fn ct -> ct.type == :write end) ||
                  List.first(cluster_tenants)

              case selected do
                %Tenants.ClusterTenants{tenant: t, type: rt} -> {t, rt}
                nil -> raise "No cluster tenant configuration found"
              end
          end
      end

    %{
      db_host: db_host,
      db_port: db_port,
      db_database: db_database,
      default_parameter_status: ps,
      ip_version: ip_ver,
      default_pool_size: default_pool_size,
      default_max_clients: default_max_clients,
      client_idle_timeout: client_idle_timeout,
      sni_hostname: sni_hostname,
      feature_flags: feature_flags
    } = tenant_record

    user_config = List.first(tenant_record.users)
    pool_size = (user_config && user_config.pool_size) || default_pool_size
    max_clients = (user_config && user_config.max_clients) || default_max_clients

    connection_params = %Supavisor.ConnectionParameters{
      host: String.to_charlist(db_host),
      sni_hostname: if(sni_hostname != nil, do: to_charlist(sni_hostname)),
      port: db_port,
      database: if(db_name != nil, do: db_name, else: db_database),
      ip_version: Helpers.ip_version(ip_ver, db_host),
      upstream_ssl: Supavisor.id(args.id, :upstream_tls),
      upstream_verify: tenant_record.upstream_verify,
      upstream_tls_ca: Helpers.upstream_cert(tenant_record.upstream_tls_ca)
    }

    persisted_ps = Supavisor.TenantCache.get_parameter_status(args.id)

    state = %{
      id: args.id,
      sup: args.sup,
      check_ref: check_subscribers(),
      tid: tid,
      pid_to_ref: pid_to_ref,
      tenant: tenant,
      parameter_status: persisted_ps,
      wait_ps: [],
      default_parameter_status: ps,
      max_clients: max_clients,
      idle_timeout: client_idle_timeout,
      connection_params: connection_params,
      mode: mode,
      replica_type: replica_type,
      pool_size: pool_size,
      log_level: args.log_level,
      tenant_feature_flags: feature_flags,
      terminating_error: nil,
      drain_caller: nil,
      drain_timer: nil,
      waiting_for_secrets: []
    }

    Logger.metadata(project: tenant, user: user, type: type, db_name: db_name)
    Registry.register(Supavisor.Registry.ManagerTables, args.id, tid)

    {:ok, state}
  end

  @impl true
  def handle_call({:subscribe, _pid}, _, %{terminating_error: error} = state)
      when not is_nil(error) do
    Logger.warning("Rejecting subscription to terminating pool #{Supavisor.inspect_id(state.id)}")
    {:reply, {:error, %PoolTerminatingError{underlying_error: error}}, state}
  end

  def handle_call({:subscribe, pid}, _, state) do
    Logger.debug("Subscribing #{inspect(pid)} to tenant #{Supavisor.inspect_id(state.id)}")
    current_count = :ets.info(state.tid, :size)

    case check_limit(state.mode, state.pool_size, state.max_clients, current_count) do
      :ok ->
        ref = Process.monitor(pid)
        :ets.insert(state.tid, {ref, pid, now()})
        :ets.insert(state.pid_to_ref, {pid, ref})

        new_state =
          if state.parameter_status == [] do
            update_in(state.wait_ps, &[pid | &1])
          else
            state
          end

        {:reply, {:ok, state.parameter_status, state.idle_timeout}, new_state}

      {:error, _} = error ->
        {:reply, error, state}
    end
  end

  def handle_call({:unsubscribe, pid}, _from, state) do
    case :ets.take(state.pid_to_ref, pid) do
      [{^pid, ref}] ->
        :ets.delete(state.tid, ref)
        Process.demonitor(ref, [:flush])

      [] ->
        Logger.warning("Unsubscribe: no entry found for #{inspect(pid)}")
    end

    new_state = %{state | wait_ps: Enum.reject(state.wait_ps, &(&1 == pid))}

    {:reply, :ok, maybe_complete_drain(new_state)}
  end

  def handle_call({:set_parameter_status, ps}, _, %{parameter_status: []} = state) do
    encoded_ps = Server.encode_parameter_status(ps)
    maybe_update_parameter_status(state.tenant, ps, state.default_parameter_status)
    Supavisor.TenantCache.put_parameter_status(state.id, encoded_ps)

    for pid <- state.wait_ps do
      send(pid, {:parameter_status, encoded_ps})
    end

    {:reply, :ok, %{state | parameter_status: encoded_ps, wait_ps: []}}
  end

  def handle_call({:set_parameter_status, _ps}, _, state) do
    {:reply, :ok, state}
  end

  def handle_call(:get_config, _, state) do
    config = %{
      id: state.id,
      connection_params: state.connection_params,
      user: Supavisor.id(state.id, :user),
      tenant: state.tenant,
      mode: state.mode,
      replica_type: state.replica_type,
      log_level: state.log_level,
      tenant_feature_flags: state.tenant_feature_flags
    }

    {:reply, config, state}
  end

  def handle_call(:get_parameter_status, _, state) do
    {:reply, state.parameter_status, state}
  end

  def handle_call({:graceful_shutdown, _timeout}, _from, %{terminating_error: error} = state)
      when not is_nil(error) do
    Logger.debug(
      "Pool #{Supavisor.inspect_id(state.id)} already terminating, skipping graceful shutdown"
    )

    {:reply, :ok, state}
  end

  def handle_call({:graceful_shutdown, timeout}, from, state) do
    Logger.info("Pool #{Supavisor.inspect_id(state.id)} shutting down gracefully")

    each_client(state, fn {_, pid, _} ->
      Supavisor.ClientHandler.graceful_shutdown(pid)
    end)

    if :ets.info(state.tid, :size) == 0 do
      {:reply, :ok, %{state | terminating_error: Server.cannot_connect_now()}}
    else
      drain_timer = Process.send_after(self(), :drain_timeout, timeout)

      {:noreply,
       %{
         state
         | terminating_error: Server.cannot_connect_now(),
           drain_caller: from,
           drain_timer: drain_timer
       }}
    end
  end

  @impl true
  def handle_cast({:shutdown_with_error, error}, state) do
    Logger.warning(
      "Shutting down pool #{Supavisor.inspect_id(state.id)} with error: #{inspect(error)}"
    )

    error_message = Server.encode_error_message(error)

    each_client(state, fn {_, pid, _} ->
      Supavisor.ClientHandler.send_error_and_terminate(pid, error_message)
    end)

    async_stop_sup(state)

    {:noreply, %{state | terminating_error: error}}
  end

  def handle_cast(:stop_pool, state) do
    async_stop_sup(state)
    {:noreply, state}
  end

  def handle_cast({:register_waiting_for_secrets, db_handler_pid}, state) do
    Logger.debug("Manager: Registering #{inspect(db_handler_pid)} as waiting for secrets")

    # Check if secrets are already available to avoid race condition
    case Supavisor.UpstreamAuthentication.get_upstream_auth_secrets(state.id) do
      {:ok, _secrets} ->
        Supavisor.DbHandler.notify_secrets_available(db_handler_pid)
        {:noreply, state}

      {:error, :not_found} ->
        ref = Process.monitor(db_handler_pid, tag: :DB_HANDLER_DOWN)

        {:noreply,
         %{state | waiting_for_secrets: [{ref, db_handler_pid} | state.waiting_for_secrets]}}
    end
  end

  def handle_cast(:notify_secrets_available, state) do
    case state.waiting_for_secrets do
      [] ->
        :ok

      _ ->
        Logger.info(
          "Manager: Notifying #{length(state.waiting_for_secrets)} db handlers that secrets are available"
        )
    end

    for {ref, pid} <- state.waiting_for_secrets do
      Process.demonitor(ref, [:flush])
      Supavisor.DbHandler.notify_secrets_available(pid)
    end

    {:noreply, %{state | waiting_for_secrets: []}}
  end

  @impl true
  def handle_info({:DOWN, ref, _, pid, _}, state) do
    Process.cancel_timer(state.check_ref)
    :ets.delete(state.tid, ref)
    :ets.delete(state.pid_to_ref, pid)

    state = maybe_complete_drain(state)

    {:noreply, %{state | check_ref: check_subscribers()}}
  end

  def handle_info({:DB_HANDLER_DOWN, ref, _, _, _}, state) do
    waiting_for_secrets = Enum.reject(state.waiting_for_secrets, fn {r, _} -> r == ref end)

    {:noreply, %{state | waiting_for_secrets: waiting_for_secrets}}
  end

  def handle_info(:drain_timeout, state) do
    Logger.warning(
      "Pool #{Supavisor.inspect_id(state.id)} drain timeout, force terminating remaining clients"
    )

    error_message = Server.encode_error_message(Server.admin_shutdown())

    each_client(state, fn {_, pid, _} ->
      Supavisor.ClientHandler.send_error_and_terminate(pid, error_message)
    end)

    if state.drain_caller do
      GenServer.reply(state.drain_caller, :ok)
    end

    {:noreply, %{state | drain_caller: nil, drain_timer: nil}}
  end

  def handle_info(:check_subscribers, state) do
    Process.cancel_timer(state.check_ref)

    if :ets.info(state.tid, :size) == 0 do
      Logger.info("No subscribers for pool #{Supavisor.inspect_id(state.id)}, shutting down")
      async_stop_sup(state)
      {:noreply, state}
    else
      {:noreply, %{state | check_ref: check_subscribers()}}
    end
  end

  def handle_info(msg, state) do
    Logger.warning("Undefined msg: #{inspect(msg, pretty: true)}")
    {:noreply, state}
  end

  @impl true
  def terminate(_reason, _state) do
    :ok
  end

  ## Internal functions

  defp check_subscribers do
    Process.send_after(
      self(),
      :check_subscribers,
      @check_timeout
    )
  end

  defp now do
    System.system_time(:second)
  end

  @spec maybe_update_parameter_status(binary, map, map) :: :ok
  defp maybe_update_parameter_status(tenant, parameter_status, default_parameter_status) do
    parameter_status
    |> Enum.filter(fn {key, new_value} ->
      case default_parameter_status do
        %{^key => value} when value != new_value -> true
        _ -> false
      end
    end)
    |> case do
      [] ->
        :ok

      changed_parameters ->
        Logger.warning("Changed parameters: #{inspect(changed_parameters)}")

        # TODO: should we update all? Previously we only updated server version
        changed_parameters = Map.new(changed_parameters)
        Tenants.update_tenant_ps(tenant, %{server_version: changed_parameters["server_version"]})

        :ok
    end
  end

  defp async_stop_sup(state) do
    Supavisor.async_stop(state.sup)
  end

  defp maybe_complete_drain(%{drain_caller: nil} = state), do: state

  defp maybe_complete_drain(state) do
    if :ets.info(state.tid, :size) == 0 do
      if state.drain_timer, do: Process.cancel_timer(state.drain_timer)
      GenServer.reply(state.drain_caller, :ok)
      %{state | drain_caller: nil, drain_timer: nil}
    else
      state
    end
  end

  defp each_client(state, fun) do
    wrapped = fn client, _acc -> fun.(client) end
    :ets.foldl(wrapped, nil, state.tid)
    :ok
  end

  # Helper to resolve manager PID from either PID or ID
  defp resolve_manager(pid) when is_pid(pid), do: pid

  defp resolve_manager(id) do
    case Supavisor.get_local_manager(id) do
      nil -> raise "Manager not found for pool #{Supavisor.inspect_id(id)}"
      pid -> pid
    end
  end

  @spec check_limit(Supavisor.mode(), non_neg_integer(), non_neg_integer(), non_neg_integer()) ::
          :ok | {:error, MaxConnectionsError.t()}
  defp check_limit(:session, pool_size, _max_clients, current_count)
       when current_count >= pool_size do
    {:error, MaxConnectionsError.new(:session, pool_size)}
  end

  defp check_limit(:transaction, _pool_size, max_clients, current_count)
       when current_count >= max_clients do
    {:error, MaxConnectionsError.new(:transaction, max_clients)}
  end

  defp check_limit(_mode, _pool_size, _max_clients, _current_count), do: :ok
end
