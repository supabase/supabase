defmodule Supavisor.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  require Logger

  alias Supavisor.Monitoring.PromEx

  @metrics_disabled Application.compile_env(:supavisor, :metrics_disabled, false)

  @impl true
  def start(_type, _args) do
    primary_config = :logger.get_primary_config()

    host =
      case node() |> Atom.to_string() |> String.split("@") do
        [_, host] -> host
        _ -> nil
      end

    region = Application.get_env(:supavisor, :region)

    global_metadata =
      %{
        nodehost: host,
        az: Application.get_env(:supavisor, :availability_zone),
        region: region,
        location: System.get_env("LOCATION_KEY") || region,
        instance_id: System.get_env("INSTANCE_ID"),
        short_node_id: short_node_id()
      }

    :ok =
      :logger.set_primary_config(
        :metadata,
        Map.merge(primary_config.metadata, global_metadata)
      )

    :ok = Logger.add_handlers(:supavisor)

    :ok =
      :gen_event.swap_sup_handler(
        :erl_signal_server,
        {:erl_signal_handler, []},
        {Supavisor.SignalHandler, []}
      )

    session_shards =
      :supavisor
      |> Application.fetch_env!(:session_proxy_ports)
      |> build_shards(:session)

    transaction_shards =
      :supavisor
      |> Application.fetch_env!(:transaction_proxy_ports)
      |> build_shards(:transaction)

    proxy_ports =
      [
        {:pg_proxy_transaction, Application.get_env(:supavisor, :proxy_port_transaction),
         %{mode: :transaction, local: false}, Supavisor.ClientHandler},
        {:pg_proxy_session, Application.get_env(:supavisor, :proxy_port_session),
         %{mode: :session, local: false}, Supavisor.ClientHandler},
        {:pg_proxy, Application.get_env(:supavisor, :proxy_port), %{mode: :proxy, local: false},
         Supavisor.ClientHandler}
      ] ++ session_shards ++ transaction_shards

    num_acceptors = String.to_integer(System.get_env("NUM_ACCEPTORS") || "100")

    max_connections =
      case System.get_env("MAX_CONNECTIONS") do
        nil -> :infinity
        value -> String.to_integer(value)
      end

    ranch_listeners =
      for {key, port, opts, handler} <- proxy_ports do
        :ranch.child_spec(
          key,
          :ranch_tcp,
          %{
            max_connections: max_connections,
            num_acceptors: num_acceptors,
            num_listen_sockets: min(System.schedulers_online(), num_acceptors),
            socket_opts: [port: port, keepalive: true, reuseport: true]
          },
          handler,
          opts
        )
      end

    :syn.add_node_to_scopes([:tenants, :availability_zone, :accepting_pools])

    Supavisor.CircuitBreaker.init()
    Supavisor.ConnectBackoff.init()

    topologies = Application.get_env(:libcluster, :topologies) || []

    children =
      [
        {Cachex, name: Supavisor.Cache},
        Supavisor.ErlSysMon,
        Supavisor.Logger.LinesCounter,
        Supavisor.Health,
        Supavisor.ClientAuthentication.RefreshLimiter,
        Supavisor.CircuitBreaker.Janitor,
        Supavisor.ConnectBackoff.Janitor,
        Supavisor.DeadPortSweeper,
        {Task.Supervisor, name: Supavisor.PoolTerminator},
        {Task.Supervisor, name: Supavisor.TaskSupervisor},
        {Registry, keys: :unique, name: Supavisor.Registry.Tenants},
        {Registry, keys: :unique, name: Supavisor.Registry.ManagerTables},
        {Registry, keys: :unique, name: Supavisor.Registry.PoolPids},
        {Registry, keys: :duplicate, name: Supavisor.Registry.TenantSups},
        {Registry,
         keys: :duplicate,
         name: Supavisor.Registry.TenantClients,
         partitions: System.schedulers_online()},
        {Registry,
         keys: :duplicate,
         name: Supavisor.Registry.TenantProxyClients,
         partitions: System.schedulers_online()},
        {Cluster.Supervisor, [topologies, [name: Supavisor.ClusterSupervisor]]},
        Supavisor.Repo,
        # Start the Telemetry supervisor
        SupavisorWeb.Telemetry,
        # Start the PubSub system
        {Phoenix.PubSub, name: Supavisor.PubSub},
        {
          PartitionSupervisor,
          child_spec: DynamicSupervisor, strategy: :one_for_one, name: Supavisor.DynamicSupervisor
        },
        Supavisor.Vault,

        # Start the Endpoint (http/https)
        SupavisorWeb.Endpoint
      ] ++ ranch_listeners

    Logger.warning("metrics_disabled is #{inspect(@metrics_disabled)}")

    children =
      if @metrics_disabled do
        children
      else
        children ++
          [
            {Supavisor.SchedulerUtilization,
             interval: Application.fetch_env!(:supavisor, :prom_poll_rate)},
            PromEx,
            Supavisor.TenantsMetrics,
            Supavisor.MetricsCleaner
          ] ++
          metrics_pusher_children()
      end

    # These two must be last, in this order. NodeMembership is terminated
    # first, so other nodes stop placing new pools here. The Drainer follows,
    # draining every local pool before the client listeners are torn down.
    children = children ++ [Supavisor.Drainer, Supavisor.NodeMembership]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Supavisor.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    SupavisorWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  @spec metrics_pusher_children() :: [Supervisor.child_spec()]
  def metrics_pusher_children do
    [
      if Application.get_env(:supavisor, :metrics_pusher_enabled) do
        Supervisor.child_spec(
          {Supavisor.MetricsPusher, scope: :global, name: Supavisor.MetricsPusher.Global},
          id: Supavisor.MetricsPusher.Global
        )
      end,
      if Application.get_env(:supavisor, :tenant_metrics_pusher_enabled) do
        Supervisor.child_spec(
          {Supavisor.MetricsPusher, scope: :tenant, name: Supavisor.MetricsPusher.Tenant},
          id: Supavisor.MetricsPusher.Tenant
        )
      end
    ]
    |> Enum.reject(&is_nil/1)
  end

  @spec build_shards([pos_integer()], atom()) :: term()
  defp build_shards(ports, mode) do
    for {port, shard} <- Enum.with_index(ports) do
      {{:pg_proxy_internal, mode, shard}, port, %{mode: mode, local: true, shard: shard},
       Supavisor.ClientHandler}
    end
  end

  @spec short_node_id() :: String.t() | nil
  defp short_node_id do
    with {:ok, fly_alloc_id} when is_binary(fly_alloc_id) <-
           Application.fetch_env(:supavisor, :fly_alloc_id),
         [short_alloc_id, _] <- String.split(fly_alloc_id, "-", parts: 2) do
      short_alloc_id
    else
      _ -> nil
    end
  end
end
