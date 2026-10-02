import Config

parse_integer_list = fn numbers when is_binary(numbers) ->
  numbers
  |> String.split(",", trim: true)
  |> Enum.map(&String.to_integer/1)
end

config :supavisor,
  region: "eu",
  fly_alloc_id: "123e4567-e89b-12d3-a456-426614174000",
  api_jwt_secret: "dev",
  metrics_jwt_secret: "dev",
  jwt_claim_validators: %{},
  proxy_port_session: System.get_env("PROXY_PORT_SESSION", "7653") |> String.to_integer(),
  proxy_port_transaction: System.get_env("PROXY_PORT_TRANSACTION", "7654") |> String.to_integer(),
  proxy_port: System.get_env("PROXY_PORT", "5412") |> String.to_integer(),
  secondary_proxy_port: 7655,
  secondary_http: 4003,
  prom_poll_rate: 500,
  api_blocklist: [
    "TEST_JWT_REDACTED"
  ],
  metrics_blocklist: [],
  cache_bypass_users: ["bypass_user", "temp_user"],
  no_warm_pool_users: ["no_warm_pool_user"],
  node_host: System.get_env("NODE_IP", "127.0.0.1"),
  availability_zone: System.get_env("AVAILABILITY_ZONE"),
  session_proxy_ports:
    System.get_env("SESSION_PROXY_PORTS", "12100,12101,12102,12103") |> parse_integer_list.(),
  transaction_proxy_ports:
    System.get_env("TRANSACTION_PROXY_PORTS", "12104,12105,12106,12107") |> parse_integer_list.(),
  max_pools: 10,
  subscribe_retries: System.get_env("SUBSCRIBE_RETRIES", "5") |> String.to_integer(),
  admission_retries: System.get_env("ADMISSION_RETRIES", "3") |> String.to_integer(),
  admission_backoff: System.get_env("ADMISSION_BACKOFF", "100") |> String.to_integer(),
  metrics_pusher_req_options: [
    plug: {Req.Test, Supavisor.MetricsPusher.Global}
  ],
  tenant_metrics_pusher_req_options: [
    plug: {Req.Test, Supavisor.MetricsPusher.Tenant}
  ]

config :supavisor, Supavisor.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "supavisor_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 10,
  port: 6432

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :supavisor, SupavisorWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  server: false

config :supavisor, Supavisor.Vault,
  ciphers: [
    default: {
      Cloak.Ciphers.AES.GCM,
      tag: "AES.GCM.V1", key: "aHD8DZRdk2emnkdktFZRh3E9RNg4aOY7"
    }
  ]

config :supavisor, Supavisor.FeatureFlag, %{
  "test_global_flag" => true,
  "test_disabled_flag" => false,
  "override_test" => true
}

# Print only warnings and errors during test
config :logger, :default_handler, level: String.to_atom(System.get_env("LOGGER_LEVEL", "none"))

config :logger, :default_formatter,
  metadata: [:error_code, :file, :line, :pid, :project, :user, :mode]

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime
