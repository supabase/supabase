import Config

require Logger

parse_integer_list = fn numbers when is_binary(numbers) ->
  numbers
  |> String.split(",", trim: true)
  |> Enum.map(&String.to_integer/1)
end

db_socket_options =
  case System.get_env("SUPAVISOR_DB_IP_VERSION") do
    "ipv6" ->
      [:inet6]

    "ipv4" ->
      [:inet]

    _ ->
      # Auto-detect IP version from DATABASE_URL hostname:
      database_url =
        System.get_env("DATABASE_URL", "ecto://postgres:postgres@localhost:6432/postgres")

      case URI.parse(database_url) do
        %URI{host: host} when is_binary(host) ->
          [Supavisor.Helpers.detect_ip_version(host)]

        _ ->
          [:inet]
      end
  end

secret_key_base =
  if config_env() in [:dev, :test] do
    "3S1V5RyqQcuPrMVuR4BjH9XBayridj56JA0EE6wYidTEc6H84KSFY6urVX7GfOhK"
  else
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """
  end

config :supavisor, SupavisorWeb.Endpoint,
  server: true,
  http: [
    port: String.to_integer(System.get_env("PORT") || "4000"),
    compress: true,
    transport_options: [
      max_connections: String.to_integer(System.get_env("MAX_CONNECTIONS") || "1000"),
      num_acceptors: String.to_integer(System.get_env("NUM_ACCEPTORS") || "100"),
      socket_opts: [
        System.get_env("ADDR_TYPE", "inet")
        |> tap(fn addr_type ->
          if addr_type not in ["inet", "inet6"] do
            raise "ADDR_TYPE env var is invalid: #{inspect(addr_type)}"
          end
        end)
        |> String.to_atom()
      ]
    ]
  ],
  secret_key_base: secret_key_base

topologies = []

topologies =
  if System.get_env("DNS_POLL") do
    dns_poll = [
      strategy: Cluster.Strategy.DNSPoll,
      config: [
        polling_interval: 5_000,
        query: System.get_env("DNS_POLL"),
        node_basename:
          System.get_env("NODE_NAME") || System.get_env("FLY_APP_NAME") || "supavisor"
      ]
    ]

    Keyword.put(topologies, :dns_poll, dns_poll)
  else
    topologies
  end

topologies =
  if System.get_env("CLUSTER_NODES") do
    epmd = [
      strategy: Cluster.Strategy.Epmd,
      config: [
        hosts:
          System.get_env("CLUSTER_NODES", "")
          |> String.split(",")
          |> Enum.map(&String.to_atom/1)
      ],
      connect: {:net_kernel, :connect_node, []},
      disconnect: {:erlang, :disconnect_node, []},
      list_nodes: {:erlang, :nodes, [:connected]}
    ]

    Keyword.put(topologies, :epmd, epmd)
  else
    topologies
  end

topologies =
  if System.get_env("CLUSTER_POSTGRES") && Application.spec(:supavisor, :vsn) do
    %Version{major: maj, minor: min} =
      Application.spec(:supavisor, :vsn) |> List.to_string() |> Version.parse!()

    region =
      Enum.find_value(~W[CLUSTER_ID LOCATION_ID REGION], &System.get_env/1)
      |> String.replace("-", "_")

    postgres = [
      strategy: Cluster.Strategy.Postgres,
      config: [
        url: System.get_env("DATABASE_URL", "ecto://postgres:postgres@localhost:6432/postgres"),
        heartbeat_interval: 5_000,
        channel_name: "supavisor_#{region}_#{maj}_#{min}",
        socket_options: db_socket_options
      ]
    ]

    Keyword.put(topologies, :postgres, postgres)
  else
    topologies
  end

config :libcluster,
  debug: false,
  topologies: topologies

if config_env() != :test do
  config :supavisor,
    metrics_pusher_enabled: Supavisor.Helpers.get_env_bool("METRICS_PUSHER_ENABLED", false),
    metrics_pusher_url: System.get_env("METRICS_PUSHER_URL"),
    metrics_pusher_user: System.get_env("METRICS_PUSHER_USER", "supavisor"),
    metrics_pusher_auth: System.get_env("METRICS_PUSHER_AUTH"),
    metrics_pusher_interval_ms:
      System.get_env("METRICS_PUSHER_INTERVAL_MS", "30000") |> String.to_integer(),
    metrics_pusher_timeout_ms:
      System.get_env("METRICS_PUSHER_TIMEOUT_MS", "15000") |> String.to_integer(),
    metrics_pusher_compress: Supavisor.Helpers.get_env_bool("METRICS_PUSHER_COMPRESS", true),
    metrics_pusher_extra_labels:
      Supavisor.Helpers.parse_extra_labels("METRICS_PUSHER_EXTRA_LABELS"),
    tenant_metrics_pusher_enabled:
      Supavisor.Helpers.get_env_bool("TENANT_METRICS_PUSHER_ENABLED", false),
    tenant_metrics_pusher_url: System.get_env("TENANT_METRICS_PUSHER_URL"),
    tenant_metrics_pusher_user: System.get_env("TENANT_METRICS_PUSHER_USER", "supavisor"),
    tenant_metrics_pusher_auth: System.get_env("TENANT_METRICS_PUSHER_AUTH"),
    tenant_metrics_pusher_interval_ms:
      System.get_env("TENANT_METRICS_PUSHER_INTERVAL_MS", "30000") |> String.to_integer(),
    tenant_metrics_pusher_timeout_ms:
      System.get_env("TENANT_METRICS_PUSHER_TIMEOUT_MS", "15000") |> String.to_integer(),
    tenant_metrics_pusher_compress:
      Supavisor.Helpers.get_env_bool("TENANT_METRICS_PUSHER_COMPRESS", true),
    tenant_metrics_pusher_extra_labels:
      Supavisor.Helpers.parse_extra_labels("TENANT_METRICS_PUSHER_EXTRA_LABELS")
end

upstream_ca =
  if path = System.get_env("GLOBAL_UPSTREAM_CA_PATH") do
    File.read!(path)
    |> Supavisor.Helpers.cert_to_bin()
    |> case do
      {:ok, bin} ->
        Logger.info("Loaded upstream CA from $GLOBAL_UPSTREAM_CA_PATH",
          ansi_color: :green
        )

        bin

      {:error, _} ->
        raise "There is no valid certificate in $GLOBAL_UPSTREAM_CA_PATH"
    end
  end

downstream_cert =
  if path = System.get_env("GLOBAL_DOWNSTREAM_CERT_PATH") do
    if File.exists?(path) do
      Logger.info("Loaded downstream cert from $GLOBAL_DOWNSTREAM_CERT_PATH, path: #{path}",
        ansi_color: :green
      )

      path
    else
      raise "There is no such file in $GLOBAL_DOWNSTREAM_CERT_PATH"
    end
  end

downstream_key =
  if path = System.get_env("GLOBAL_DOWNSTREAM_KEY_PATH") do
    if File.exists?(path) do
      Logger.info("Loaded downstream key from $GLOBAL_DOWNSTREAM_KEY_PATH, path: #{path}",
        ansi_color: :green
      )

      path
    else
      raise "There is no such file in $GLOBAL_DOWNSTREAM_KEY_PATH"
    end
  end

downstream_ec_cert =
  if path = System.get_env("DOWNSTREAM_SERVER_ECDSA_CERT") do
    if File.exists?(path) do
      Logger.info(
        "Loaded downstream ECDSA cert from $DOWNSTREAM_SERVER_ECDSA_CERT, path: #{path}",
        ansi_color: :green
      )

      path
    else
      raise "There is no such file in $DOWNSTREAM_SERVER_ECDSA_CERT"
    end
  end

downstream_ec_key =
  if path = System.get_env("DOWNSTREAM_SERVER_ECDSA_KEY") do
    if File.exists?(path) do
      Logger.info(
        "Loaded downstream ECDSA key from $DOWNSTREAM_SERVER_ECDSA_KEY, path: #{path}",
        ansi_color: :green
      )

      path
    else
      raise "There is no such file in $DOWNSTREAM_SERVER_ECDSA_KEY"
    end
  end

if config_env() != :test do
  config :supavisor,
    session_proxy_ports:
      System.get_env("SESSION_PROXY_PORTS", "12100,12101,12102,12103")
      |> parse_integer_list.(),
    transaction_proxy_ports:
      System.get_env("TRANSACTION_PROXY_PORTS", "12104,12105,12106,12107")
      |> parse_integer_list.(),
    availability_zone: System.get_env("AVAILABILITY_ZONE"),
    region: System.get_env("REGION") || System.get_env("FLY_REGION"),
    fly_alloc_id: System.get_env("FLY_ALLOC_ID"),
    jwt_claim_validators: System.get_env("JWT_CLAIM_VALIDATORS", "{}") |> JSON.decode!(),
    api_jwt_secret: System.get_env("API_JWT_SECRET"),
    metrics_jwt_secret: System.get_env("METRICS_JWT_SECRET"),
    proxy_port_transaction:
      System.get_env("PROXY_PORT_TRANSACTION", "6543") |> String.to_integer(),
    proxy_port_session: System.get_env("PROXY_PORT_SESSION", "5432") |> String.to_integer(),
    proxy_port: System.get_env("PROXY_PORT", "5412") |> String.to_integer(),
    prom_poll_rate: System.get_env("PROM_POLL_RATE", "15000") |> String.to_integer(),
    global_upstream_ca: upstream_ca,
    global_downstream_cert: downstream_cert,
    global_downstream_key: downstream_key,
    global_downstream_ec_cert: downstream_ec_cert,
    global_downstream_ec_key: downstream_ec_key,
    api_blocklist: System.get_env("API_TOKEN_BLOCKLIST", "") |> String.split(","),
    metrics_blocklist: System.get_env("METRICS_TOKEN_BLOCKLIST", "") |> String.split(","),
    cache_bypass_users:
      System.get_env("CACHE_BYPASS_USERS", "")
      |> String.split(",", trim: true)
      |> Enum.map(&String.trim/1),
    no_warm_pool_users:
      System.get_env("NO_WARM_POOL_USERS", "")
      |> String.split(",", trim: true)
      |> Enum.map(&String.trim/1),
    node_host: System.get_env("NODE_IP", "127.0.0.1")

  config :supavisor, Supavisor.FeatureFlag, %{
    "named_prepared_statements" =>
      Supavisor.Helpers.get_env_bool("NAMED_PREPARED_STATEMENTS_ENABLED", false),
    "app_name_metric" => Supavisor.Helpers.get_env_bool("APP_NAME_METRIC_ENABLED", false)
  }

  config :supavisor, Supavisor.Repo,
    url: System.get_env("DATABASE_URL", "ecto://postgres:postgres@localhost:6432/postgres"),
    pool_size: System.get_env("DB_POOL_SIZE", "25") |> String.to_integer(),
    ssl_opts: [
      verify: :verify_none
    ],
    parameters: [
      application_name: "supavisor_meta"
    ],
    socket_options: db_socket_options

  config :supavisor, Supavisor.Vault,
    ciphers: [
      default: {
        Cloak.Ciphers.AES.GCM,
        tag: "AES.GCM.V1", key: System.get_env("VAULT_ENC_KEY")
      }
    ]
end

if path = System.get_env("SUPAVISOR_LOG_FILE_PATH") do
  config :logger, :default_handler,
    config: [
      file: to_charlist(path),
      file_check: 1000,
      max_no_files: 5,
      # 8 MiB as a max file size
      max_no_bytes: 8 * 1024 * 1024
    ]
end

if System.get_env("SUPAVISOR_LOG_FORMAT") == "json" do
  config :logger, :default_handler,
    formatter:
      {Supavisor.Logger.LogflareFormatter,
       %{
         # metadata: metadata,
         top_level: [:project],
         context: []
       }}
end

burst_limit_enable =
  case System.get_env("SUPAVISOR_LOG_BURST_LIMIT_ENABLE") do
    nil -> true
    v -> v in ~w(true 1)
  end

burst_limit_max_count =
  System.get_env("SUPAVISOR_LOG_BURST_LIMIT_MAX_COUNT", "500") |> String.to_integer()

burst_limit_window_time =
  System.get_env("SUPAVISOR_LOG_BURST_LIMIT_WINDOW_TIME", "1000") |> String.to_integer()

config :logger, :default_handler,
  config: [
    burst_limit_enable: burst_limit_enable,
    burst_limit_max_count: burst_limit_max_count,
    burst_limit_window_time: burst_limit_window_time
  ]

config :supavisor,
  logger_burst_limit_enable: burst_limit_enable,
  logger_burst_limit_max_count: burst_limit_max_count,
  logger_burst_limit_window_time: burst_limit_window_time

config :logger,
  backends: [:console]

if System.get_env("LOGS_ENGINE") == "logflare" do
  if !System.get_env("LOGFLARE_API_KEY") or !System.get_env("LOGFLARE_SOURCE_ID") do
    raise """
    Environment variable LOGFLARE_API_KEY or LOGFLARE_SOURCE_ID is missing.
    Check those variables or choose another LOGS_ENGINE.
    """
  end

  config :logger,
    backends: [LogflareLogger.HttpBackend]
end
