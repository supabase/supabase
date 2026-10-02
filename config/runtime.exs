import Config
alias Realtime.Env

api_jwt_secret =
  ["API_JWT_SECRET", "API_JWT_SECRET_NEXT"]
  |> Enum.map(&System.get_env/1)
  |> Enum.reject(&is_nil/1)

api_token_blocklist = Env.get_list("API_TOKEN_BLOCKLIST", [])
app_name = System.get_env("APP_NAME", "")
broadcast_pool_size = Env.get_integer("BROADCAST_POOL_SIZE", 10)
channel_error_backoff_ms = Env.get_integer("CHANNEL_ERROR_BACKOFF_MS", to_timeout(second: 5))
client_presence_max_calls = Env.get_integer("CLIENT_PRESENCE_MAX_CALLS", 5)
client_presence_window_ms = Env.get_integer("CLIENT_PRESENCE_WINDOW_MS", 30_000)
access_token_throttle_ms = Env.get_integer("ACCESS_TOKEN_THROTTLE_MS", to_timeout(second: 10))
connect_error_backoff_ms = Env.get_integer("CONNECT_ERROR_BACKOFF_MS", to_timeout(second: 2))
connect_partition_slots = Env.get_integer("CONNECT_PARTITION_SLOTS", System.schedulers_online() * 2)
dashboard_auth = System.get_env("DASHBOARD_AUTH", "basic_auth")
dashboard_password = System.get_env("DASHBOARD_PASSWORD", :crypto.strong_rand_bytes(12) |> Base.encode16(case: :lower))
dashboard_user = System.get_env("DASHBOARD_USER", :crypto.strong_rand_bytes(12) |> Base.encode16(case: :lower))
db_after_connect_query = System.get_env("DB_AFTER_CONNECT_QUERY")
db_enc_key = System.get_env("DB_ENC_KEY")
db_enc_key_gcm = System.get_env("DB_ENC_KEY_GCM")
db_enc_write_gcm = Env.get_boolean("DB_ENC_WRITE_GCM", false)
db_host = System.get_env("DB_HOST", "127.0.0.1")
db_ip_version = System.get_env("DB_IP_VERSION")
db_master_region = System.get_env("DB_MASTER_REGION")
db_name = System.get_env("DB_NAME", "postgres")
db_password = System.get_env("DB_PASSWORD", "postgres")
db_pool_size = Env.get_integer("DB_POOL_SIZE", 5)
db_port = System.get_env("DB_PORT", "5432")
db_queue_interval = Env.get_integer("DB_QUEUE_INTERVAL", 5000)
db_queue_target = Env.get_integer("DB_QUEUE_TARGET", 5000)
db_replica_host = System.get_env("DB_REPLICA_HOST")
db_replica_pool_size = Env.get_integer("DB_REPLICA_POOL_SIZE", 5)
db_ssl = Env.get_boolean("DB_SSL", false)
db_ssl_ca_cert = System.get_env("DB_SSL_CA_CERT")
db_user = System.get_env("DB_USER", "supabase_admin")
disable_healthcheck_logging = Env.get_boolean("DISABLE_HEALTHCHECK_LOGGING", false)
dns_nodes = System.get_env("DNS_NODES")
gen_rpc_compress = Env.get_integer("GEN_RPC_COMPRESS", 0)
gen_rpc_compression_threshold_in_bytes = Env.get_integer("GEN_RPC_COMPRESSION_THRESHOLD_IN_BYTES", 1000)
gen_rpc_connect_timeout_in_ms = Env.get_integer("GEN_RPC_CONNECT_TIMEOUT_IN_MS", 10_000)
gen_rpc_ipv6_only = Env.get_boolean("GEN_RPC_IPV6_ONLY", false)
gen_rpc_max_batch_size = Env.get_integer("GEN_RPC_MAX_BATCH_SIZE", 0)
gen_rpc_send_timeout_in_ms = Env.get_integer("GEN_RPC_SEND_TIMEOUT_IN_MS", 10_000)
gen_rpc_socket_buffer = Env.get_integer("GEN_RPC_SOCKET_BUFFER")
gen_rpc_socket_ip = Env.get_charlist("GEN_RPC_SOCKET_IP", ~c"0.0.0.0")
gen_rpc_socket_recbuf = Env.get_integer("GEN_RPC_SOCKET_RECEIVE_BUFFER")
gen_rpc_socket_sndbuf = Env.get_integer("GEN_RPC_SOCKET_SEND_BUFFER")
gen_rpc_ssl_client_port = Env.get_integer("GEN_RPC_SSL_CLIENT_PORT", 6369)
gen_rpc_ssl_server_port = Env.get_integer("GEN_RPC_SSL_SERVER_PORT")

gen_rpc_default_port = 5369
gen_rpc_dev_port_range = gen_rpc_default_port..(gen_rpc_default_port + 99)
gen_rpc_tcp_client_port = Env.get_integer("GEN_RPC_TCP_CLIENT_PORT", gen_rpc_default_port)

# Only the server port is bound. Nodes on one machine cannot share it, so a dev node takes the
# first free port of the range and Realtime.GenRpc.get_config/1 tells its peers which one it took.
# A test run derives its ports from one scan in config/test.exs instead, and dials peers through
# gen_rpc's own tcp_client_port, the same lookup production uses.
gen_rpc_tcp_server_port =
  case {config_env(), Env.get_integer("GEN_RPC_TCP_SERVER_PORT")} do
    {:test, _port} ->
      nil

    # A mix task without distribution (mix seed, mix ecto.migrate) has no cluster to serve, and
    # binding a port would make two of them collide.
    {:dev, nil} ->
      if Node.alive?() do
        Enum.find(gen_rpc_dev_port_range, &Env.port_available?/1) ||
          raise "no free gen_rpc port on range #{inspect(gen_rpc_dev_port_range)}"
      else
        false
      end

    {:dev, port} ->
      if Env.port_available?(port) do
        port
      else
        raise "GEN_RPC_TCP_SERVER_PORT=#{port} is set but it's already in use."
      end

    {_env, port} ->
      port || gen_rpc_default_port
  end

http_dynamic_buffer_min = Env.get_integer("HTTP_DYNAMIC_BUFFER_MIN")
http_dynamic_buffer_max = Env.get_integer("HTTP_DYNAMIC_BUFFER_MAX")
janitor_children_timeout = Env.get_integer("JANITOR_CHILDREN_TIMEOUT", to_timeout(second: 5))
janitor_chunk_size = Env.get_integer("JANITOR_CHUNK_SIZE", 10)
janitor_max_children = Env.get_integer("JANITOR_MAX_CHILDREN", 5)
janitor_run_after_in_ms = Env.get_integer("JANITOR_RUN_AFTER_IN_MS", to_timeout(minute: 10))
janitor_schedule_randomize = Env.get_boolean("JANITOR_SCHEDULE_RANDOMIZE", true)
janitor_schedule_timer_in_ms = Env.get_integer("JANITOR_SCHEDULE_TIMER_IN_MS", to_timeout(hour: 4))
jwt_claim_validators = System.get_env("JWT_CLAIM_VALIDATORS", "{}")
log_level = System.get_env("LOG_LEVEL", "info") |> String.to_existing_atom()
log_throttle_janitor_interval_in_ms = Env.get_integer("LOG_THROTTLE_JANITOR_INTERVAL_IN_MS", to_timeout(minute: 10))
logflare_logger_backend_url = System.get_env("LOGFLARE_LOGGER_BACKEND_URL", "https://api.logflare.app")
logs_engine = System.get_env("LOGS_ENGINE")
max_gen_rpc_clients = Env.get_integer("MAX_GEN_RPC_CLIENTS", 5)
max_gen_rpc_call_clients = Env.get_integer("MAX_GEN_RPC_CALL_CLIENTS", 1)
measure_traffic_interval_in_ms = Env.get_integer("MEASURE_TRAFFIC_INTERVAL_IN_MS", to_timeout(second: 10))
metrics_cleaner_schedule_timer_in_ms = Env.get_integer("METRICS_CLEANER_SCHEDULE_TIMER_IN_MS", to_timeout(minute: 30))
metrics_pusher_auth = System.get_env("METRICS_PUSHER_AUTH")
metrics_pusher_compress = Env.get_boolean("METRICS_PUSHER_COMPRESS", true)
metrics_pusher_enabled = Env.get_boolean("METRICS_PUSHER_ENABLED", false)
metrics_pusher_extra_labels = Env.get_key_value_list("METRICS_PUSHER_EXTRA_LABELS")
metrics_pusher_interval_ms = Env.get_integer("METRICS_PUSHER_INTERVAL_MS", to_timeout(second: 30))
metrics_pusher_timeout_ms = Env.get_integer("METRICS_PUSHER_TIMEOUT_MS", to_timeout(second: 15))
metrics_pusher_url = System.get_env("METRICS_PUSHER_URL")
metrics_pusher_user = System.get_env("METRICS_PUSHER_USER", "realtime")
tenant_metrics_pusher_auth = System.get_env("TENANT_METRICS_PUSHER_AUTH")
tenant_metrics_pusher_compress = Env.get_boolean("TENANT_METRICS_PUSHER_COMPRESS", true)
tenant_metrics_pusher_enabled = Env.get_boolean("TENANT_METRICS_PUSHER_ENABLED", false)
tenant_metrics_pusher_extra_labels = Env.get_key_value_list("TENANT_METRICS_PUSHER_EXTRA_LABELS")
tenant_metrics_pusher_interval_ms = Env.get_integer("TENANT_METRICS_PUSHER_INTERVAL_MS", to_timeout(second: 30))
tenant_metrics_pusher_timeout_ms = Env.get_integer("TENANT_METRICS_PUSHER_TIMEOUT_MS", to_timeout(second: 15))
tenant_metrics_pusher_url = System.get_env("TENANT_METRICS_PUSHER_URL")
tenant_metrics_pusher_user = System.get_env("TENANT_METRICS_PUSHER_USER", "realtime")
metrics_rpc_timeout_in_ms = Env.get_integer("METRICS_RPC_TIMEOUT_IN_MS", to_timeout(second: 15))
metrics_token_blocklist = Env.get_list("METRICS_TOKEN_BLOCKLIST", [])
migration_partition_slots = Env.get_integer("MIGRATION_PARTITION_SLOTS", System.schedulers_online() * 2)
no_channel_timeout_in_ms = Env.get_integer("NO_CHANNEL_TIMEOUT_IN_MS", to_timeout(minute: 10))
node_balance_uptime_threshold_in_ms = Env.get_integer("NODE_BALANCE_UPTIME_THRESHOLD_IN_MS", to_timeout(minute: 5))
platform = if System.get_env("AWS_EXECUTION_ENV") == "AWS_ECS_FARGATE", do: :aws, else: :fly
postgres_cdc_scope_shards = Env.get_integer("POSTGRES_CDC_SCOPE_SHARDS", 5)
presence_broadcast_period_in_ms = Env.get_integer("PRESENCE_BROADCAST_PERIOD_IN_MS", 1_500)
presence_permdown_period_in_ms = Env.get_integer("PRESENCE_PERMDOWN_PERIOD_IN_MS", 1_200_000)
presence_pool_size = Env.get_integer("PRESENCE_POOL_SIZE", 10)
prom_poll_rate = Env.get_integer("PROM_POLL_RATE", 5000)
realtime_ip_version = System.get_env("REALTIME_IP_VERSION")
rebalance_check_interval_in_ms = Env.get_integer("REBALANCE_CHECK_INTERVAL_IN_MS", to_timeout(minute: 10))
region = System.get_env("REGION", "local")
region_mapping = System.get_env("REGION_MAPPING")
request_id_baggage_key = System.get_env("REQUEST_ID_BAGGAGE_KEY", "request-id")
rpc_timeout = Env.get_integer("RPC_TIMEOUT", to_timeout(second: 30))
run_janitor = Env.get_boolean("RUN_JANITOR", false)
slot_name_suffix = System.get_env("SLOT_NAME_SUFFIX")
tenant_cache_expiration_in_ms = Env.get_integer("TENANT_CACHE_EXPIRATION_IN_MS", to_timeout(second: 30))
tenant_max_bytes_per_second = Env.get_integer("TENANT_MAX_BYTES_PER_SECOND", 100_000)
tenant_max_channels_per_client = Env.get_integer("TENANT_MAX_CHANNELS_PER_CLIENT", 100)
tenant_max_concurrent_users = Env.get_integer("TENANT_MAX_CONCURRENT_USERS", 200)
tenant_max_events_per_second = Env.get_integer("TENANT_MAX_EVENTS_PER_SECOND", 100)
tenant_max_joins_per_second = Env.get_integer("TENANT_MAX_JOINS_PER_SECOND", 100)
users_scope_shards = Env.get_integer("USERS_SCOPE_SHARDS", 5)
muster_scope_shards = Env.get_integer("MUSTER_SCOPE_SHARDS", 5)

# Forum.Muster router-role handoff at shutdown (see Realtime.MusterDrainer).
# `timeout_ms` caps how long we wait for every peer to ack having rebalanced us out
# of its ring; `settle_ms` is the post-ack window we stay alive servicing inbound
# route RPCs, and must be at least the Muster scope's :rpc_timeout_ms (5s) so a
# broadcast a peer routed here just before evicting us can still fan out. The
# SIGTERM grace period must exceed timeout + settle + the rest of shutdown.
muster_drain_timeout_ms = Env.get_integer("MUSTER_DRAIN_TIMEOUT_MS", :timer.seconds(10))
muster_drain_settle_ms = Env.get_integer("MUSTER_DRAIN_SETTLE_MS", 7_500)
websocket_max_heap_size = div(Env.get_integer("WEBSOCKET_MAX_HEAP_SIZE", 50_000_000), :erlang.system_info(:wordsize))

cluster_strategies = Env.get_binary("CLUSTER_STRATEGIES", "POSTGRES")

metrics_jwt_secret =
  if config_env() == :test do
    System.get_env("METRICS_JWT_SECRET")
  else
    System.fetch_env!("METRICS_JWT_SECRET")
  end

after_connect_query_args =
  case db_after_connect_query do
    nil -> nil
    query -> {Postgrex, :query!, [query, []]}
  end

ssl_opts =
  cond do
    db_ssl and is_binary(db_ssl_ca_cert) -> [cacertfile: db_ssl_ca_cert]
    db_ssl -> [verify: :verify_none]
    true -> false
  end

if !(db_ip_version in [nil, "ipv6", "ipv4"]),
  do: raise("Invalid IP version, please set either ipv6 or ipv4")

if db_enc_key_gcm && byte_size(db_enc_key_gcm) != 32,
  do: raise("DB_ENC_KEY_GCM must be exactly 32 bytes for AES-256-GCM, got #{byte_size(db_enc_key_gcm)} bytes")

socket_options =
  cond do
    db_ip_version == "ipv6" ->
      [:inet6]

    db_ip_version == "ipv4" ->
      [:inet]

    true ->
      case Realtime.Database.detect_ip_version(db_host) do
        {:ok, ip_version} -> [ip_version]
        {:error, reason} -> raise "Failed to detect IP version for DB_HOST: #{reason}"
      end
  end

repo_opts = [
  pool_size: db_pool_size,
  queue_target: db_queue_target,
  queue_interval: db_queue_interval,
  parameters: [application_name: "supabase_mt_realtime"],
  after_connect: after_connect_query_args,
  socket_options: socket_options,
  ssl: ssl_opts
]

# Where to connect, except in test: config/test.exs points a run at a database named after itself,
# on the port that run scanned, and this would overwrite both.
repo_opts =
  if config_env() == :test,
    do: repo_opts,
    else: [hostname: db_host, username: db_user, password: db_password, database: db_name, port: db_port] ++ repo_opts

config :realtime, Realtime.Repo, repo_opts

config :realtime,
  websocket_max_heap_size: websocket_max_heap_size,
  migration_partition_slots: migration_partition_slots,
  connect_partition_slots: connect_partition_slots,
  rebalance_check_interval_in_ms: rebalance_check_interval_in_ms,
  tenant_max_bytes_per_second: tenant_max_bytes_per_second,
  tenant_max_channels_per_client: tenant_max_channels_per_client,
  tenant_max_concurrent_users: tenant_max_concurrent_users,
  tenant_max_events_per_second: tenant_max_events_per_second,
  tenant_max_joins_per_second: tenant_max_joins_per_second,
  metrics_cleaner_schedule_timer_in_ms: metrics_cleaner_schedule_timer_in_ms,
  metrics_rpc_timeout: metrics_rpc_timeout_in_ms,
  tenant_cache_expiration: tenant_cache_expiration_in_ms,
  rpc_timeout: rpc_timeout,
  no_channel_timeout_in_ms: no_channel_timeout_in_ms,
  platform: platform,
  broadcast_pool_size: broadcast_pool_size,
  presence_pool_size: presence_pool_size,
  presence_broadcast_period: presence_broadcast_period_in_ms,
  presence_permdown_period: presence_permdown_period_in_ms,
  users_scope_shards: users_scope_shards,
  muster_scope_shards: muster_scope_shards,
  muster_drain_opts: [timeout_ms: muster_drain_timeout_ms, settle_ms: muster_drain_settle_ms],
  postgres_cdc_scope_shards: postgres_cdc_scope_shards,
  master_region: db_master_region,
  region_mapping: region_mapping,
  measure_traffic_interval_in_ms: measure_traffic_interval_in_ms,
  client_presence_rate_limit: [
    max_calls: client_presence_max_calls,
    window_ms: client_presence_window_ms
  ],
  log_throttle_janitor_interval_ms: log_throttle_janitor_interval_in_ms,
  disable_healthcheck_logging: disable_healthcheck_logging,
  metrics_pusher_enabled: metrics_pusher_enabled,
  metrics_pusher_url: metrics_pusher_url,
  metrics_pusher_user: metrics_pusher_user,
  metrics_pusher_auth: metrics_pusher_auth,
  metrics_pusher_interval_ms: metrics_pusher_interval_ms,
  metrics_pusher_timeout_ms: metrics_pusher_timeout_ms,
  metrics_pusher_compress: metrics_pusher_compress,
  metrics_pusher_extra_labels: metrics_pusher_extra_labels,
  tenant_metrics_pusher_enabled: tenant_metrics_pusher_enabled,
  tenant_metrics_pusher_url: tenant_metrics_pusher_url,
  tenant_metrics_pusher_user: tenant_metrics_pusher_user,
  tenant_metrics_pusher_auth: tenant_metrics_pusher_auth,
  tenant_metrics_pusher_interval_ms: tenant_metrics_pusher_interval_ms,
  tenant_metrics_pusher_timeout_ms: tenant_metrics_pusher_timeout_ms,
  tenant_metrics_pusher_compress: tenant_metrics_pusher_compress,
  tenant_metrics_pusher_extra_labels: tenant_metrics_pusher_extra_labels

if config_env() != :test && run_janitor do
  config :realtime,
    run_janitor: true,
    janitor_schedule_randomize: janitor_schedule_randomize,
    janitor_max_children: janitor_max_children,
    janitor_chunk_size: janitor_chunk_size,
    janitor_run_after_in_ms: janitor_run_after_in_ms,
    janitor_children_timeout: janitor_children_timeout,
    janitor_schedule_timer: janitor_schedule_timer_in_ms
end

cluster_topologies =
  cluster_strategies
  |> String.upcase()
  |> String.split(",")
  |> Enum.reduce([], fn strategy, acc ->
    strategy
    |> String.trim()
    |> then(fn
      "DNS" ->
        [
          dns: [
            strategy: Cluster.Strategy.DNSPoll,
            config: [polling_interval: 5_000, query: dns_nodes, node_basename: app_name]
          ]
        ] ++ acc

      "EPMD" ->
        # Every node is dialed by name, so they must be known upfront. The default is what
        # compose.yml names its nodes.
        hosts =
          "CLUSTER_EPMD_HOSTS"
          |> Env.get_list(["pink@127.0.0.1", "orange@127.0.0.1"])
          |> Enum.map(&String.to_atom/1)

        [
          epmd: [
            strategy: Cluster.Strategy.Epmd,
            config: [hosts: hosts],
            connect: {:net_kernel, :connect_node, []},
            disconnect: {:net_kernel, :disconnect_node, []}
          ]
        ] ++ acc

      "POSTGRES" ->
        [
          postgres: [
            strategy: LibclusterPostgres.Strategy,
            config: [
              hostname: db_host,
              username: db_user,
              password: db_password,
              database: db_name,
              port: db_port,
              parameters: [application_name: "cluster_node_#{node()}"],
              socket_options: socket_options,
              ssl: ssl_opts,
              heartbeat_interval: 5_000
            ]
          ]
        ] ++ acc

      _ ->
        acc
    end)
  end)

# Setup Logging

if logs_engine == "logflare" do
  if !System.get_env("LOGFLARE_API_KEY") or !System.get_env("LOGFLARE_SOURCE_ID") do
    raise """
    Environment variable LOGFLARE_API_KEY or LOGFLARE_SOURCE_ID is missing.
    Check those variables or choose another LOGS_ENGINE.
    """
  end

  config :logflare_logger_backend, url: logflare_logger_backend_url

  config :logger,
    sync_threshold: 6_000,
    discard_threshold: 6_000,
    default_handler: false
end

# Setup production and development environments
if config_env() != :test do
  gen_rpc_default_driver = if gen_rpc_ssl_server_port, do: :ssl, else: :tcp

  if gen_rpc_default_driver == :ssl do
    gen_rpc_ssl_opts = [
      certfile: System.fetch_env!("GEN_RPC_CERTFILE"),
      keyfile: System.fetch_env!("GEN_RPC_KEYFILE"),
      cacertfile: System.fetch_env!("GEN_RPC_CACERTFILE")
    ]

    config :gen_rpc,
      ssl_server_port: gen_rpc_ssl_server_port,
      ssl_client_port: gen_rpc_ssl_client_port,
      ssl_client_options: gen_rpc_ssl_opts,
      ssl_server_options: gen_rpc_ssl_opts,
      tcp_server_port: false,
      tcp_client_port: false
  else
    config :gen_rpc,
      ssl_server_port: false,
      ssl_client_port: false,
      tcp_server_port: gen_rpc_tcp_server_port,
      tcp_client_port: gen_rpc_tcp_client_port
  end

  case :inet.parse_address(gen_rpc_socket_ip) do
    {:ok, address} ->
      config :gen_rpc,
        default_client_driver: gen_rpc_default_driver,
        connect_timeout: gen_rpc_connect_timeout_in_ms,
        send_timeout: gen_rpc_send_timeout_in_ms,
        ipv6_only: gen_rpc_ipv6_only,
        socket_ip: address,
        max_batch_size: gen_rpc_max_batch_size,
        compress: gen_rpc_compress,
        compression_threshold: gen_rpc_compression_threshold_in_bytes

      [
        socket_buffer: gen_rpc_socket_buffer,
        socket_recbuf: gen_rpc_socket_recbuf,
        socket_sndbuf: gen_rpc_socket_sndbuf
      ]
      |> Enum.reject(fn {_k, v} -> is_nil(v) end)
      |> case do
        [] -> :ok
        opts -> config(:gen_rpc, opts)
      end

    _ ->
      raise """
      Environment variable GEN_RPC_SOCKET_IP is not a valid IP Address
      Most likely it should be "0.0.0.0" (ipv4) or "::" (ipv6) to bind to all interfaces
      """
  end

  config :logger, level: log_level

  config :realtime,
    request_id_baggage_key: request_id_baggage_key,
    jwt_claim_validators: jwt_claim_validators,
    api_jwt_secret: api_jwt_secret,
    api_blocklist: api_token_blocklist,
    metrics_blocklist: metrics_token_blocklist,
    metrics_jwt_secret: metrics_jwt_secret,
    db_enc_key: db_enc_key,
    db_enc_key_gcm: db_enc_key_gcm,
    db_enc_write_gcm: db_enc_write_gcm,
    region: region,
    prom_poll_rate: prom_poll_rate,
    slot_name_suffix: slot_name_suffix,
    max_gen_rpc_clients: max_gen_rpc_clients,
    max_gen_rpc_call_clients: max_gen_rpc_call_clients,
    connect_error_backoff_ms: connect_error_backoff_ms,
    channel_error_backoff_ms: channel_error_backoff_ms
end

# Setup Production

if config_env() == :prod do
  config :libcluster, debug: false, topologies: cluster_topologies
  config :realtime, node_balance_uptime_threshold_in_ms: node_balance_uptime_threshold_in_ms
  config :realtime, access_token_throttle_ms: access_token_throttle_ms
  secret_key_base = System.fetch_env!("SECRET_KEY_BASE")
  if app_name == "", do: raise("APP_NAME not available")

  realtime_ip_version =
    case realtime_ip_version do
      "ipv6" ->
        :inet6

      "ipv4" ->
        :inet

      _ ->
        case :gen_tcp.listen(0, [:inet6]) do
          {:ok, socket} ->
            :gen_tcp.close(socket)
            :inet6

          {:error, _} ->
            :inet
        end
    end

  http_dynamic_buffer =
    case {http_dynamic_buffer_min, http_dynamic_buffer_max} do
      {nil, nil} -> []
      {min, max} when is_integer(min) and is_integer(max) -> [dynamic_buffer: {min, max}]
      _ -> raise ArgumentError, "HTTP_DYNAMIC_BUFFER_MIN and HTTP_DYNAMIC_BUFFER_MAX must both be set or both be unset"
    end

  http_protocol_options =
    [max_header_value_length: Env.get_integer("MAX_HEADER_LENGTH", 4096)] ++ http_dynamic_buffer

  config :realtime, RealtimeWeb.Endpoint,
    server: true,
    url: [host: "#{app_name}.supabase.co", port: 443],
    http: [
      compress: true,
      port: Env.get_integer("PORT", 4000),
      protocol_options: http_protocol_options,
      transport_options: [
        max_connections: Env.get_integer("MAX_CONNECTIONS", 1000),
        num_acceptors: Env.get_integer("NUM_ACCEPTORS", 100),
        socket_opts: [realtime_ip_version]
      ]
    ],
    check_origin: false,
    secret_key_base: secret_key_base

  alias Realtime.Repo.Replica

  replica_repos = %{
    Realtime.Repo.Replica.FRA => System.get_env("DB_HOST_REPLICA_FRA", db_host),
    Realtime.Repo.Replica.IAD => System.get_env("DB_HOST_REPLICA_IAD", db_host),
    Realtime.Repo.Replica.SIN => System.get_env("DB_HOST_REPLICA_SIN", db_host),
    Realtime.Repo.Replica.SJC => System.get_env("DB_HOST_REPLICA_SJC", db_host),
    Realtime.Repo.Replica.Singapore => System.get_env("DB_HOST_REPLICA_SIN", db_host),
    Realtime.Repo.Replica.London => System.get_env("DB_HOST_REPLICA_FRA", db_host),
    Realtime.Repo.Replica.NorthVirginia => System.get_env("DB_HOST_REPLICA_IAD", db_host),
    Realtime.Repo.Replica.Oregon => System.get_env("DB_HOST_REPLICA_SJC", db_host),
    Realtime.Repo.Replica.SanJose => System.get_env("DB_HOST_REPLICA_SJC", db_host),
    Realtime.Repo.Replica.Local => db_host
  }

  # Legacy repos
  # username, password, database, and port must match primary credentials
  for {replica_repo, hostname} <- replica_repos do
    config :realtime, replica_repo,
      hostname: hostname,
      username: db_user,
      password: db_password,
      database: db_name,
      port: db_port,
      pool_size: db_replica_pool_size,
      queue_target: db_queue_target,
      queue_interval: db_queue_interval,
      parameters: [
        application_name: "supabase_mt_realtime_ro"
      ],
      socket_options: socket_options,
      ssl: ssl_opts
  end

  # New main replica repo
  if db_replica_host do
    config :realtime, Realtime.Repo.Replica,
      hostname: db_replica_host,
      username: db_user,
      password: db_password,
      database: db_name,
      port: db_port,
      pool_size: db_replica_pool_size,
      queue_target: db_queue_target,
      queue_interval: db_queue_interval,
      parameters: [
        application_name: "supabase_mt_realtime_ro"
      ],
      socket_options: socket_options,
      ssl: ssl_opts
  end
end

if config_env() != :test do
  case dashboard_auth do
    "zta" ->
      config :realtime, dashboard_auth: :zta

    _ ->
      config :realtime,
        dashboard_auth: :basic_auth,
        dashboard_credentials: {dashboard_user, dashboard_password}
  end
end

if config_env() == :dev do
  # Dev servers find each other through the realtime database they share, the same way production
  # nodes do. A mix task without distribution has no cluster to join.
  topologies = if Node.alive?(), do: cluster_topologies, else: []

  config :libcluster, debug: false, topologies: topologies
  config :gen_rpc, client_config_per_node: {:external, Realtime.GenRpc}
end
