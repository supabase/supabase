defmodule Supavisor do
  @moduledoc false

  require Logger

  alias Supavisor.{
    Errors.PoolTerminatingError,
    Errors.TenantBannedError,
    Helpers,
    Manager,
    Protocol.Server,
    Tenants
  }

  require Record

  @type sock :: tcp_sock() | ssl_sock()
  @type ssl_sock :: {:ssl, :ssl.sslsocket()}
  @type tcp_sock :: {:gen_tcp, :gen_tcp.socket()}
  @type workers :: %{manager: pid, pool: pid}
  @type secrets :: map()
  @type mode :: :transaction | :session | :native | :proxy
  @type subscribe_opts :: %{workers: workers, ps: list, idle_timeout: integer}

  Record.defrecord(:id, [
    :type,
    :tenant,
    :user,
    :mode,
    :db,
    :search_path,
    upstream_tls: false
  ])

  @type id() ::
          record(:id,
            type: :single | :cluster,
            tenant: String.t(),
            user: String.t(),
            mode: mode(),
            db: String.t(),
            search_path: String.t() | nil,
            upstream_tls: boolean()
          )

  @registry Supavisor.Registry.Tenants
  @max_pools Application.compile_env(:supavisor, :max_pools, 50)

  @spec start_dist(id, secrets, keyword()) :: {:ok, pid()} | {:error, any()}
  def start_dist(id, secrets, options \\ []) do
    options =
      Keyword.validate!(options, log_level: nil, force_node: false, availability_zone: nil)

    log_level = Keyword.fetch!(options, :log_level)
    force_node = Keyword.fetch!(options, :force_node)
    availability_zone = Keyword.fetch!(options, :availability_zone)

    case get_global_sup(id) do
      nil ->
        node = if force_node, do: force_node, else: determine_node(id, availability_zone)

        if node == node() do
          Logger.debug("Starting local pool for #{inspect_id(id)}")
          try_start_local_pool(id, secrets, log_level)
        else
          Logger.debug("Starting remote pool for #{inspect_id(id)}")
          Helpers.rpc(node, __MODULE__, :try_start_local_pool, [id, secrets, log_level])
        end

      pid ->
        {:ok, pid}
    end
  end

  @spec start(id, secrets) :: {:ok, pid} | {:error, any}
  def start(id, secrets) do
    case get_global_sup(id) do
      nil ->
        try_start_local_pool(id, secrets, nil)

      pid ->
        {:ok, pid}
    end
  end

  @spec stop(id) :: :ok | {:error, Supavisor.Errors.WorkerNotFoundError.t()}
  def stop(id) do
    case get_global_sup(id) do
      nil ->
        {:error, %Supavisor.Errors.WorkerNotFoundError{id: id}}

      pid ->
        Supervisor.stop(pid)
    end
  end

  @doc """
  Stops the tenant supervisor `sup` asynchronously.
  """
  @spec async_stop(pid) :: DynamicSupervisor.on_start_child()
  def async_stop(sup) do
    Task.Supervisor.start_child(Supavisor.PoolTerminator, fn ->
      try do
        Supervisor.stop(sup)
      catch
        :exit, {:noproc, _} -> :ok
        :exit, {{:normal, _}, _} -> :ok
      end
    end)
  end

  @spec get_local_workers(id) ::
          {:ok, workers} | {:error, Supavisor.Errors.WorkerNotFoundError.t()}
  def get_local_workers(id) do
    workers = %{
      manager: get_local_manager(id),
      pool: get_local_pool(id)
    }

    if nil in Map.values(workers) do
      {:error, %Supavisor.Errors.WorkerNotFoundError{id: id}}
    else
      {:ok, workers}
    end
  end

  @spec subscribe(id, pid) ::
          {:ok, subscribe_opts}
          | {:error, Supavisor.Errors.MaxConnectionsError.t()}
          | {:error, Supavisor.Errors.PoolTerminatingError.t()}
          | {:error, Supavisor.Errors.WorkerNotFoundError.t()}
  def subscribe(id, pid \\ self()) do
    with {:ok, workers} <- get_local_workers(id),
         {:ok, ps, idle_timeout} <- Manager.subscribe(workers.manager, pid) do
      {:ok, %{workers: workers, ps: ps, idle_timeout: idle_timeout}}
    end
  end

  @spec get_global_sup(id) :: pid | nil
  def get_global_sup(id) do
    case :syn.whereis_name({:tenants, id}) do
      :undefined -> nil
      pid -> pid
    end
  end

  @doc """
  Terminate all connection trees for a tenant across the cluster

  During netsplits, or due to certain internal conflicts, :syn may store inconsistent
  data across the cluster.

  If `error` is provided, `Manager.shutdown_with_error/2` will be used to first
  terminate the clients with the provided error, before terminating a pool -
  which is done asynchronously from the `Manager`.

  There's a race, in which the pool may be terminated before the clients terminate with the error
  - then their connection will be closed forcibly without the error message.
  """
  @spec dirty_terminate(String.t(), Supavisor.Error.t() | nil, pos_integer()) ::
          map()
  def dirty_terminate(tenant, error \\ nil, timeout \\ 15_000)

  def dirty_terminate(tenant, nil, timeout) do
    Supavisor.Registry.TenantSups
    |> Registry.lookup(tenant)
    |> Enum.reduce(%{}, fn {pid, id(user: user)}, acc ->
      resp = %{
        stop:
          try do
            Supervisor.stop(pid, :shutdown, timeout)
          catch
            error, reason -> {:error, {error, reason}}
          end,
        cache: del_all_cache(tenant, user)
      }

      Map.put(acc, user, resp)
    end)
  end

  def dirty_terminate(tenant, error, _timeout) do
    Supavisor.Registry.TenantSups
    |> Registry.lookup(tenant)
    |> Enum.reduce(%{}, fn {_pid, id(user: user) = id}, acc ->
      resp = %{
        stop:
          if pid = get_local_manager(id) do
            Manager.shutdown_with_error(pid, TenantBannedError.postgres_error(error))
          else
            {:error, :manager_not_found}
          end,
        cache: del_all_cache(tenant, user)
      }

      Map.put(acc, user, resp)
    end)
  end

  def terminate_global(tenant, error \\ nil) do
    :erpc.multicall(
      [node() | Node.list()],
      Supavisor,
      :dirty_terminate,
      [tenant, error],
      60_000
    )
  end

  @doc """
  Moves every pool in the cluster to the node `determine_node/2` picks for it now.

  A pool stays on the node it started on, even after new nodes join the cluster.
  Pools started while only part of the cluster was up are therefore concentrated
  on the first nodes. Running this once all nodes are up spreads them again.

  A pool is moved by stopping its tenant supervisor. Its `Supavisor.Terminator`
  drains the clients, which then reconnect and start the pool on its new node.
  Pools are stopped in the background, after this function returns.

  Options:

    * `:dry_run` - only report the pools that would be moved. Defaults to `false`.
    * `:max_concurrency` - pools stopped at the same time on each node. Defaults to `100`.

  Returns the pools being moved away from each node, with their new node.
  """
  @spec rebalance(keyword()) :: %{Node.t() => {:ok, [{id, Node.t()}]} | {:error, term()}}
  def rebalance(opts \\ []) do
    opts = Keyword.validate!(opts, dry_run: false, max_concurrency: 100)
    nodes = [node() | Node.list()]

    results = :erpc.multicall(nodes, Supavisor, :rebalance_local, [opts], 60_000)

    nodes
    |> Enum.zip(results)
    |> Map.new(fn
      {node, {:ok, _moves} = result} -> {node, result}
      {node, error} -> {node, {:error, error}}
    end)
  end

  @doc """
  Moves the pools of this node whose target node is another one. See `rebalance/1`,
  which validates `opts`.
  """
  @spec rebalance_local(keyword()) :: [{id, Node.t()}]
  def rebalance_local(opts) do
    dry_run = Keyword.fetch!(opts, :dry_run)

    moves =
      for {sup, id} <-
            Registry.select(Supavisor.Registry.TenantSups, [
              {{:_, :"$1", :"$2"}, [], [{{:"$1", :"$2"}}]}
            ]),
          {^sup, %{availability_zone: availability_zone}} <- [:syn.lookup(:tenants, id)],
          target = determine_node(id, availability_zone),
          target != node() do
        {sup, id, target}
      end

    Logger.info("Rebalancing #{length(moves)} pools away from this node, dry_run: #{dry_run}")

    if !dry_run do
      Task.Supervisor.start_child(Supavisor.PoolTerminator, fn ->
        moves
        |> Task.async_stream(fn {sup, id, _target} -> stop_for_rebalance(sup, id) end,
          max_concurrency: Keyword.fetch!(opts, :max_concurrency),
          timeout: :infinity
        )
        |> Stream.run()
      end)
    end

    Enum.map(moves, fn {_sup, id, target} -> {id, target} end)
  end

  defp stop_for_rebalance(sup, id) do
    Supervisor.stop(sup, :shutdown, 15_000)
  catch
    :exit, {:noproc, _} -> :ok
    :exit, reason -> Logger.error("Failed to stop pool #{inspect_id(id)}: #{inspect(reason)}")
  end

  @doc """
  Updates credentials for all SecretChecker processes for a tenant across the cluster.
  Used for auth_query mode (require_user: false) to hot-update credentials without restarting pools.
  """
  @spec update_secret_checker_credentials_global(String.t(), String.t(), String.t()) :: [
          {node(), term()}
        ]
  def update_secret_checker_credentials_global(tenant, new_user, password) do
    :erpc.multicall(
      [node() | Node.list()],
      Supavisor,
      :update_secret_checker_credentials_local,
      [tenant, new_user, password],
      60_000
    )
  end

  @spec update_secret_checker_credentials_local(String.t(), String.t(), String.t()) :: map()
  def update_secret_checker_credentials_local(tenant, new_user, password) do
    Registry.lookup(Supavisor.Registry.TenantSups, tenant)
    |> Enum.reduce(%{}, fn {_pid, id(user: user, mode: mode) = pool_id}, acc ->
      result = Supavisor.SecretChecker.update_credentials(pool_id, new_user, password)
      Map.put(acc, {user, mode}, result)
    end)
  end

  @spec del_all_cache(String.t(), String.t()) :: [map()]
  def del_all_cache(tenant, user) do
    Logger.info("Deleting all cache for tenant #{tenant} and user #{user}")
    {:ok, keys} = Cachex.keys(Supavisor.Cache)

    del = fn key, acc ->
      result = Cachex.del(Supavisor.Cache, key)
      [%{inspect(key) => inspect(result)} | acc]
    end

    Enum.reduce(keys, [], fn
      {:metrics, ^tenant} = key, acc -> del.(key, acc)
      {:secrets_for_validation, ^tenant, ^user} = key, acc -> del.(key, acc)
      {:secrets_check, ^tenant, ^user} = key, acc -> del.(key, acc)
      {:user_cache, _, ^user, ^tenant, _} = key, acc -> del.(key, acc)
      {:tenant_cache, ^tenant, _} = key, acc -> del.(key, acc)
      {:pool_config_cache, ^tenant, ^user} = key, acc -> del.(key, acc)
      _, acc -> acc
    end)
  end

  @spec del_all_cache(String.t()) :: [map()]
  def del_all_cache(tenant) do
    Logger.info("Deleting all cache for tenant #{tenant}")

    del = fn key, acc ->
      result = Cachex.del(Supavisor.Cache, key)
      [%{inspect(key) => inspect(result)} | acc]
    end

    :ets.foldl(
      fn
        {:entry, key, _, _, _result}, acc ->
          case key do
            {:metrics, ^tenant} -> del.(key, acc)
            {:secrets_for_validation, ^tenant, _} -> del.(key, acc)
            {:secrets_check, ^tenant, _} -> del.(key, acc)
            {:user_cache, _, _, ^tenant, _} -> del.(key, acc)
            {:tenant_cache, ^tenant, _} -> del.(key, acc)
            {:pool_config_cache, ^tenant, _} -> del.(key, acc)
            _ -> acc
          end

        other, acc ->
          Logger.error("Unknown key: #{inspect(other)}")
          acc
      end,
      [],
      Supavisor.Cache
    )
  end

  @spec del_all_cache_dist(String.t(), pos_integer()) :: [map()]
  def del_all_cache_dist(tenant, timeout \\ 15_000) do
    Logger.info("Deleting all dist cache for tenant #{tenant}")

    for node <- [node() | Node.list()] do
      %{to_string(node) => :erpc.call(node, Supavisor, :del_all_cache, [tenant], timeout)}
    end
  end

  @spec get_local_pool(id) :: map | pid | nil
  def get_local_pool(id(type: :single) = id) do
    case Registry.lookup(@registry, {:pool, :write, 0, id}) do
      [{pid, _}] -> pid
      _ -> nil
    end
  end

  def get_local_pool(id) do
    match = {{:pool, :_, :_, id}, :"$2", :"$3"}
    body = [{{:"$2", :"$3"}}]

    case Registry.select(@registry, [{match, [], body}]) do
      [{pool, _}] ->
        pool

      [_ | _] = pools ->
        # transform [{pid1, :read}, {pid2, :read}, {pid3, :write}]
        # to %{read: [pid1, pid2], write: [pid3]}
        Enum.group_by(pools, &elem(&1, 1), &elem(&1, 0))

      _ ->
        nil
    end
  end

  @spec get_local_manager(id) :: pid | nil
  def get_local_manager(id) do
    case Registry.lookup(@registry, {:manager, id}) do
      [{pid, _}] -> pid
      _ -> nil
    end
  end

  @spec determine_node(id, String.t() | nil) :: Node.t()
  def determine_node(id(tenant: tenant), availability_zone) do
    # Nodes that started shutting down leave the :accepting_pools scope, so they
    # stop being picked for new pools while they drain.
    #
    # If the AWS zone group is empty, we will use all accepting nodes.
    # If the AWS zone group exists with the same zone, we will use nodes from this group.
    accepting = accepting_nodes()

    nodes =
      with zone when is_binary(zone) <- availability_zone,
           zone_nodes when zone_nodes != [] <- scope_nodes(:availability_zone, zone),
           [_ | _] = zone_nodes <- Enum.filter(zone_nodes, &(&1 in accepting)) do
        zone_nodes
      else
        _ -> accepting
      end

    index = :erlang.phash2(tenant, length(nodes))

    nodes
    |> Enum.sort()
    |> Enum.at(index)
  end

  @doc """
  Nodes that are available to host new pools.

  Nodes join the `:accepting_pools` scope on boot and leave it when they start
  shutting down, so a draining node stops receiving new pools while the ones it
  already hosts drain.

  Falls back to every connected node when no node is accepting pools, which
  includes this node even if it is itself shutting down. Placing the pool
  somewhere is better than having nowhere to place it.
  """
  @spec accepting_nodes() :: [Node.t()]
  def accepting_nodes do
    case scope_nodes(:accepting_pools, :nodes) do
      [] ->
        Logger.warning("No node is accepting pools, falling back to all connected nodes")
        [node() | Node.list()]

      nodes ->
        nodes
    end
  end

  @spec scope_nodes(atom(), term()) :: [Node.t()]
  defp scope_nodes(scope, group) do
    scope
    |> :syn.members(group)
    |> Enum.map(fn {pid, _meta} -> node(pid) end)
  end

  @spec try_start_local_pool(id, secrets, atom()) :: {:ok, pid} | {:error, any}
  def try_start_local_pool(id, secrets, log_level) do
    cond do
      local_pool_shutting_down?(id) ->
        {:error, %PoolTerminatingError{underlying_error: Server.cannot_connect_now()}}

      count_pools(id(id, :tenant)) >= @max_pools ->
        {:error, %Supavisor.Errors.MaxPoolsReachedError{}}

      true ->
        start_local_pool(id, secrets, log_level)
    end
  end

  # A shutting down tenant supervisor is de-registered from :syn by its
  # Terminator, but keeps its local registrations until it exits.
  @spec local_pool_shutting_down?(id) :: boolean()
  defp local_pool_shutting_down?(id(tenant: tenant) = id) do
    registered = get_global_sup(id)

    Supavisor.Registry.TenantSups
    |> Registry.lookup(tenant)
    |> Enum.any?(fn {pid, sup_id} -> sup_id == id and pid != registered end)
  end

  @spec start_local_pool(id, secrets, atom()) :: {:ok, pid} | {:error, any}
  def start_local_pool(
        id(tenant: tenant, type: type) = id,
        secrets,
        log_level \\ nil
      ) do
    Logger.metadata(project: tenant, user: secrets.user)
    Logger.info("Starting pool(s) for #{inspect_id(id)}")

    secrets_map = secrets
    user = secrets_map.user

    case type do
      :single -> Tenants.get_pool_config_cache(tenant, user)
      :cluster -> Tenants.get_cluster_config(tenant, user)
    end
    |> case do
      [_ | _] = replicas ->
        # Extract only minimal info needed for pool creation
        replicas_info =
          Enum.map(replicas, fn replica ->
            case replica do
              %Tenants.ClusterTenants{tenant: tenant, type: type} ->
                first_user = List.first(tenant.users)

                %{
                  replica_type: type,
                  pool_size:
                    if(first_user, do: first_user.pool_size, else: tenant.default_pool_size)
                }

              %Tenants.Tenant{} = tenant ->
                first_user = List.first(tenant.users)

                %{
                  replica_type: :write,
                  pool_size:
                    if(first_user, do: first_user.pool_size, else: tenant.default_pool_size)
                }
            end
          end)

        availability_zone =
          case replicas do
            [%Tenants.Tenant{availability_zone: availability_zone}] -> availability_zone
            # The replicas of a cluster may be in different zones
            _ -> nil
          end

        DynamicSupervisor.start_child(
          {:via, PartitionSupervisor, {Supavisor.DynamicSupervisor, id}},
          {Supavisor.TenantSupervisor,
           %{
             id: id,
             replicas: replicas_info,
             secrets: secrets,
             log_level: log_level,
             availability_zone: availability_zone
           }}
        )
        |> case do
          {:error, {:already_started, pid}} -> {:ok, pid}
          resp -> resp
        end

      error ->
        Logger.error("Can't find pool config for #{inspect(id)} #{inspect(error)}")
        {:error, %Supavisor.Errors.PoolConfigNotFoundError{id: id}}
    end
  end

  ## Internal functions

  @spec set_parameter_status(id, [{binary, binary}]) ::
          :ok | {:error, :not_found}
  def set_parameter_status(id, ps) do
    case get_local_manager(id) do
      nil -> {:error, :not_found}
      pid -> Manager.set_parameter_status(pid, ps)
    end
  end

  @spec get_pool_ranch(id) :: {:ok, map()} | {:error, Supavisor.Errors.PoolRanchNotFoundError.t()}
  def get_pool_ranch(id) do
    case :syn.lookup(:tenants, id) do
      {_sup_pid, %{port: _port, host: _host} = meta} -> {:ok, meta}
      _ -> {:error, %Supavisor.Errors.PoolRanchNotFoundError{id: id}}
    end
  end

  @spec get_local_server(id) :: map()
  def get_local_server(id(mode: mode) = id) do
    host = Application.get_env(:supavisor, :node_host)

    ports =
      case mode do
        :session -> Application.fetch_env!(:supavisor, :session_proxy_ports)
        :transaction -> Application.fetch_env!(:supavisor, :transaction_proxy_ports)
      end

    shard = :erlang.phash2(id, length(ports))
    %{host: host, port: :ranch.get_port({:pg_proxy_internal, mode, shard})}
  end

  def inspect_id(id, opts \\ %Inspect.Opts{})

  def inspect_id(
        id(
          type: type,
          tenant: tenant,
          mode: mode,
          user: user,
          db: db,
          search_path: search_path,
          upstream_tls: upstream_tls
        ),
        opts
      ) do
    import Inspect.Algebra

    fields = [
      {"type: ", type},
      {"tenant: ", tenant},
      {"mode: ", mode},
      {"user: ", user},
      {"db: ", db},
      {"search_path: ", search_path},
      {"upstream_tls: ", upstream_tls}
    ]

    fun = fn {key, value}, doc_opts ->
      if value do
        concat(key, to_doc(value, doc_opts))
      else
        empty()
      end
    end

    ["Supavisor.id", container_doc("(", fields, ")", opts, fun, break: :strict)]
    |> concat()
    |> Inspect.Algebra.format(160)
    |> IO.iodata_to_binary()
  end

  # Catch-all for invalid ids
  def inspect_id(id, _) do
    inspect(id)
  end

  @spec count_pools(String.t()) :: non_neg_integer()
  def count_pools(tenant),
    do: Registry.count_match(Supavisor.Registry.TenantSups, tenant, :_)
end
