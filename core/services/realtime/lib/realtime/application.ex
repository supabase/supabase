defmodule Realtime.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application
  require Cachex.Spec
  require Logger

  alias Realtime.Repo.Replica
  alias Realtime.Tenants.ReplicationConnection
  alias Realtime.Tenants.Connect
  alias Realtime.Tenants.Migrations

  defmodule JwtSecretError, do: defexception([:message])
  defmodule JwtClaimValidatorsError, do: defexception([:message])
  defmodule RegionMappingError, do: defexception([:message])

  defp check_for_local_ipv6_host do
    hostname = Node.self() |> Atom.to_string()

    if String.contains?(hostname, "fd00:ec2::172:2") do
      Logger.error("Invalid hostname #{hostname}")
      :timer.sleep(5000)
      :erlang.halt(222)
    end
  end

  def start(_type, _args) do
    if Application.get_env(:logflare_logger_backend, :url) do
      Logger.add_backend(LogflareLogger.HttpBackend)
    end

    Realtime.LogFilter.setup()
    primary_config = :logger.get_primary_config()

    # add the region to logs
    :ok =
      :logger.set_primary_config(
        :metadata,
        Enum.into([region: System.get_env("REGION"), cluster: System.get_env("CLUSTER")], primary_config.metadata)
      )

    opentelemetry_setup()
    check_for_local_ipv6_host()
    Realtime.Crypto.check_config()

    topologies = Application.get_env(:libcluster, :topologies) || []

    case Application.fetch_env!(:realtime, :jwt_claim_validators) |> Jason.decode() do
      {:ok, claims} when is_map(claims) ->
        Application.put_env(:realtime, :jwt_claim_validators, claims)

      _ ->
        raise JwtClaimValidatorsError,
          message: "JWT claim validators is not a valid JSON object"
    end

    setup_region_mapping()

    :ok =
      :gen_event.swap_sup_handler(
        :erl_signal_server,
        {:erl_signal_handler, []},
        {Realtime.SignalHandler, %{handler_mod: :erl_signal_handler}}
      )

    :ets.new(Realtime.Tenants.Connect, [:named_table, :set, :public])

    set_persist_storage(RealtimeWeb.UserSocket, :realtime, :websocket_max_heap_size)
    set_persist_storage(RealtimeWeb.UserSocket, :realtime, :measure_traffic_interval_in_ms)
    set_persist_storage(RealtimeWeb.UserSocket, :realtime, :connect_error_backoff_ms)
    set_persist_storage(RealtimeWeb.RealtimeChannel, :realtime, :channel_error_backoff_ms)

    :syn.set_event_handler(Realtime.SynHandler)
    :ok = :syn.add_node_to_scopes([RegionNodes, Realtime.Tenants.Connect])

    region = Realtime.Nodes.region()
    broadcast_pool_size = Application.get_env(:realtime, :broadcast_pool_size, 10)
    presence_pool_size = Application.get_env(:realtime, :presence_pool_size, 10)
    presence_broadcast_period = Application.get_env(:realtime, :presence_broadcast_period, 1_500)
    presence_permdown_period = Application.get_env(:realtime, :presence_permdown_period, 1_200_000)
    migration_partition_slots = Application.get_env(:realtime, :migration_partition_slots)
    connect_partition_slots = Application.get_env(:realtime, :connect_partition_slots)
    no_channel_timeout_in_ms = Application.get_env(:realtime, :no_channel_timeout_in_ms)
    master_region = Application.get_env(:realtime, :master_region) || region
    user_scope_shards = Application.fetch_env!(:realtime, :users_scope_shards)
    user_scope_broadast_interval_in_ms = Application.get_env(:realtime, :users_scope_broadcast_interval_in_ms, 10_000)
    user_scope_discover_interval_in_ms = Application.get_env(:realtime, :users_scope_discover_interval_in_ms, 60_000)

    muster_scope_shards = Application.fetch_env!(:realtime, :muster_scope_shards)

    # Only set in :test, where the single-node scope must reach :ready quickly
    # instead of waiting out Muster's 30s default singleton-promotion timer.
    # Unset in prod/dev, so Muster keeps its own conservative default.
    muster_singleton_promotion_timeout_ms =
      Application.get_env(:realtime, :muster_singleton_promotion_timeout_ms)

    # One Muster scope per region: the atom is otherwise just an identifier, so
    # embedding the region keeps each region's ring/gossip/rebalancing isolated
    # even though ErlDist's broadcast fans out over the whole distribution mesh.
    muster_scope = :"realtime_channels_#{region}"
    Application.put_env(:realtime, :muster_scope, muster_scope)

    :syn.join(RegionNodes, region, self(), node: node())

    zta_children =
      case Application.get_env(:realtime, :dashboard_auth) do
        :zta -> [{NimbleZTA.Cloudflare, name: Realtime.ZTA, identity_key: System.fetch_env!("CF_TEAM_DOMAIN")}]
        _ -> []
      end

    children =
      [
        Realtime.ErlSysMon,
        Realtime.GenCounter,
        Realtime.GenRpcMetrics,
        Realtime.PromEx,
        Realtime.TenantPromEx,
        {Realtime.Telemetry.Logger, handler_id: "telemetry-logger"},
        RealtimeWeb.Telemetry,
        Realtime.GenRpcPubSub.RegionRings,
        {Cluster.Supervisor, [topologies, [name: Realtime.ClusterSupervisor]]},
        {Forum.Muster,
         [
           muster_scope,
           [
             partitions: muster_scope_shards,
             message_module: Forum.Adapter.ErlDist,
             # For now makes it impossible to crash the application due to Muster failures
             max_restarts: 1_000,
             max_seconds: 1
           ] ++
             if(muster_singleton_promotion_timeout_ms,
               do: [singleton_promotion_timeout_ms: muster_singleton_promotion_timeout_ms],
               else: []
             )
         ]},
        # Placed right after Forum.Muster (and before RealtimeWeb.Endpoint): on
        # shutdown children terminate in reverse start order, so this drains the
        # Muster router role AFTER the Endpoint closed its websockets and BEFORE
        # the Muster coordinator terminates. See Realtime.MusterDrainer.
        {Realtime.MusterDrainer,
         scope: muster_scope, drain_opts: Application.get_env(:realtime, :muster_drain_opts, [])},
        {Phoenix.PubSub,
         name: Realtime.PubSub, pool_size: 10, adapter: pubsub_adapter(), broadcast_pool_size: broadcast_pool_size},
        {Forum.Census,
         [
           :users,
           [
             partitions: user_scope_shards,
             broadcast_interval_in_ms: user_scope_broadast_interval_in_ms,
             discover_interval_in_ms: user_scope_discover_interval_in_ms,
             message_module: Realtime.ForumPubSubAdapter
           ]
         ]},
        Supervisor.child_spec({Cachex, name: Realtime.RateCounter}, id: Realtime.RateCounter),
        Supervisor.child_spec({Cachex, name: Realtime.Nodes.Cache}, id: Realtime.Nodes.Cache),
        Supervisor.child_spec(
          {Cachex,
           name: Realtime.LogThrottle,
           expiration:
             Cachex.Spec.expiration(
               interval: Application.get_env(:realtime, :log_throttle_janitor_interval_ms, :timer.minutes(10))
             )},
          id: Realtime.LogThrottle
        ),
        Realtime.Tenants.Cache,
        Realtime.FeatureFlags.Cache,
        Realtime.RateCounter.DynamicSupervisor,
        Realtime.Latency,
        {Registry, keys: :duplicate, name: Realtime.Registry},
        {Registry, keys: :unique, name: Realtime.Registry.Unique},
        {Registry, keys: :unique, name: Realtime.Tenants.Connect.Registry},
        {Registry, keys: :unique, name: Extensions.PostgresCdcRls.ReplicationPoller.Registry},
        {Task.Supervisor, name: Realtime.TaskSupervisor},
        {Task.Supervisor, name: Realtime.Tenants.Migrations.TaskSupervisor},
        {PartitionSupervisor,
         child_spec: {DynamicSupervisor, max_restarts: 0},
         strategy: :one_for_one,
         name: Migrations.DynamicSupervisor,
         partitions: migration_partition_slots},
        {PartitionSupervisor,
         child_spec: DynamicSupervisor,
         strategy: :one_for_one,
         name: ReplicationConnection.DynamicSupervisor,
         partitions: connect_partition_slots},
        {PartitionSupervisor,
         child_spec: DynamicSupervisor,
         strategy: :one_for_one,
         name: Connect.DynamicSupervisor,
         partitions: connect_partition_slots},
        Realtime.Tenants.Reconnector,
        {RealtimeWeb.RealtimeChannel.Tracker, check_interval_in_ms: no_channel_timeout_in_ms},
        RealtimeWeb.Endpoint,
        {RealtimeWeb.Presence,
         log_level: :info,
         pool_size: presence_pool_size,
         broadcast_period: presence_broadcast_period,
         permdown_period: presence_permdown_period}
      ] ++ extensions_supervisors() ++ janitor_tasks() ++ Realtime.MetricsPusher.child_specs() ++ zta_children

    database_connections = if master_region == region, do: [Realtime.Repo], else: [Replica.replica()]

    children = database_connections ++ children

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Realtime.Supervisor]
    Supervisor.start_link(children, opts)
  end

  defp extensions_supervisors do
    Enum.reduce(Application.get_env(:realtime, :extensions), [], fn
      {_, %{supervisor: name}}, acc ->
        opts = %{
          id: name,
          start: {name, :start_link, []},
          restart: :transient
        }

        [opts | acc]

      _, acc ->
        acc
    end)
  end

  defp janitor_tasks do
    if Application.get_env(:realtime, :run_janitor) do
      janitor_max_children = Application.get_env(:realtime, :janitor_max_children)
      janitor_children_timeout = Application.get_env(:realtime, :janitor_children_timeout)

      [
        {
          Task.Supervisor,
          name: Realtime.Tenants.Janitor.TaskSupervisor,
          max_children: janitor_max_children,
          max_seconds: janitor_children_timeout,
          max_restarts: 1
        },
        Realtime.Tenants.Janitor,
        Realtime.MetricsCleaner
      ]
    else
      []
    end
  end

  defp opentelemetry_setup do
    :opentelemetry_cowboy.setup()
    OpentelemetryPhoenix.setup(adapter: :cowboy2)
    OpentelemetryEcto.setup([:realtime, :repo], db_statement: :enabled)
  end

  defp pubsub_adapter, do: Realtime.GenRpcPubSub

  defp setup_region_mapping do
    case Application.get_env(:realtime, :region_mapping) do
      nil ->
        :ok

      mapping_json when is_binary(mapping_json) ->
        case Jason.decode(mapping_json) do
          {:ok, mapping} when is_map(mapping) ->
            if Enum.all?(mapping, fn {k, v} -> is_binary(k) and is_binary(v) end) do
              Application.put_env(:realtime, :region_mapping, mapping)
            else
              raise RegionMappingError,
                message: "REGION_MAPPING must contain only string keys and values"
            end

          {:ok, _} ->
            raise RegionMappingError,
              message: "REGION_MAPPING must be a JSON object"

          {:error, %Jason.DecodeError{} = error} ->
            raise RegionMappingError,
              message: "Failed to parse REGION_MAPPING: #{Exception.message(error)}"
        end
    end
  end

  defp set_persist_storage(mod, app, key), do: :persistent_term.put({mod, key}, Application.fetch_env!(app, key))
end
