import Config

get_integer = fn env, default ->
  case System.get_env(env) do
    nil -> default
    value -> String.to_integer(value)
  end
end

port_free? = fn port ->
  case :gen_tcp.listen(port, [:inet, ip: {0, 0, 0, 0}, reuseaddr: true, active: false]) do
    {:ok, socket} -> :gen_tcp.close(socket) == :ok
    {:error, _reason} -> false
  end
end

first_http_port = 4002

port =
  get_integer.("TEST_PORT", nil) ||
    Enum.find(first_http_port..4999, port_free?) ||
    raise "no free port in #{first_http_port}..4999"

# The endpoint port is the only one bound for a whole run, so taking it is what makes a run
# unique. Every other port sits the same distance from its own default: peer ports are bound
# only while a clustered test runs, so scanning for those would let two runs claim the same ones.
offset = port - first_http_port

# Node names, kept short: they end up inside inspected maps in logs that tests assert on.
node_suffix =
  case offset do
    0 -> ""
    _ -> "_#{port}"
  end

# Names this run's database and containers. One knob covers a whole environment: TENANT names a
# test run just as it names the dev stack, so `TENANT=review mise run db-start` and
# `TENANT=review mix test` are the same review environment. The default tenant is the unmarked
# run, so a plain `mix test` keeps the names it always had. TEST_RUN overrides TENANT for a run
# that wants a label without a tenant behind it ("pr_1234").
default_tenant = "realtime-dev"

run_name =
  case {System.get_env("TEST_RUN", ""), System.get_env("TENANT", "")} do
    {"", ^default_tenant} -> ""
    {"", tenant} -> tenant
    {run, _} -> run
  end

# An unnamed run is labelled by its endpoint port instead, which also lets a later run tell
# whether the run that left something behind is gone. "port" keeps that label out of the
# namespace of names, so a tenant called "4003" is never read as a run holding port 4003.
run_tag =
  case {offset, run_name} do
    {0, ""} -> ""
    {_, ""} -> "_port#{port}"
    # A name reaches a database name and a container name, so keep it to what both take.
    {_, name} -> "_" <> String.replace(name, ~r/[^A-Za-z0-9_]/, "_")
  end

partition = System.get_env("MIX_TEST_PARTITION")
db_port = get_integer.("DB_PORT", 5432)
db_name = System.get_env("TEST_DB_NAME", "realtime_test#{partition}#{run_tag}")

for repo <- [
      Realtime.Repo,
      Realtime.Repo.Replica.FRA,
      Realtime.Repo.Replica.IAD,
      Realtime.Repo.Replica.SIN,
      Realtime.Repo.Replica.SJC,
      Realtime.Repo.Replica.Singapore,
      Realtime.Repo.Replica.London,
      Realtime.Repo.Replica.NorthVirginia,
      Realtime.Repo.Replica.Oregon,
      Realtime.Repo.Replica.SanJose
    ] do
  config :realtime, repo,
    username: "supabase_admin",
    password: "postgres",
    database: db_name,
    hostname: "127.0.0.1",
    port: db_port,
    pool: Ecto.Adapters.SQL.Sandbox
end

# One port per peer slot in TestEnv (12 today), plus room to add a few more. TestEnv documents
# how these two starts and the rest of a run's ports are laid out.
peer_ports_per_run = 16
peer_http_base = get_integer.("TEST_PEER_PORT_BASE", nil) || 10_000 + offset * peer_ports_per_run
peer_gen_rpc_base = get_integer.("TEST_PEER_GEN_RPC_PORT_BASE", nil) || 26_000 + offset * peer_ports_per_run

config :realtime,
  test_run_tag: run_tag,
  test_node_suffix: node_suffix,
  test_node_name: :"main#{node_suffix}@127.0.0.1",
  test_http_port: port,
  test_peer_http_base: peer_http_base,
  test_peer_gen_rpc_base: peer_gen_rpc_base,
  test_peer_ports_per_run: peer_ports_per_run

# Single-node test scopes have no peers to agree with, so they only reach
# :ready via the singleton-promotion timer. Keep it short so Muster.targets/3
# stops flooding almost immediately instead of after the 30s default.
config :realtime, muster_singleton_promotion_timeout_ms: 100

config :realtime,
  users_scope_broadcast_interval_in_ms: 100,
  users_scope_discover_interval_in_ms: 100

config :realtime, RealtimeWeb.Endpoint,
  http: [port: port],
  server: true

# that's what config/runtime.exs expects to see as region
System.put_env("REGION", "us-east-1")

config :realtime,
  region: "us-east-1",
  db_enc_key: "1234567890123456",
  db_enc_key_gcm: "12345678901234567890123456789012",
  db_enc_write_gcm: true,
  jwt_claim_validators: System.get_env("JWT_CLAIM_VALIDATORS", "{}"),
  api_jwt_secret: System.get_env("API_JWT_SECRET", "secret"),
  metrics_jwt_secret: "test",
  load_tenant_db_dump: false,
  prom_poll_rate: 5_000,
  request_id_baggage_key: "sb-request-id",
  node_balance_uptime_threshold_in_ms: 999_999_999_999,
  connect_error_backoff_ms: 100,
  channel_error_backoff_ms: 100,
  access_token_throttle_ms: to_timeout(second: 1),
  connect_connection_ready_timeout: 2_000,
  max_gen_rpc_clients: 5,
  max_gen_rpc_call_clients: 1,
  metrics_pusher_req_options: [
    adapter: Realtime.MetricsPusherReqAdapter
  ]

# Print nothing during tests unless captured or a test failure happens
config :logger,
  default_handler: false,
  level: :info

# Configures Elixir's Logger
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [
    :error_code,
    :request_id,
    :project,
    :external_id,
    :application_name,
    :sub,
    :iss,
    :exp
  ]

config :opentelemetry,
  span_processor: :simple,
  traces_exporter: :none,
  processors: [{:otel_simple_processor, %{}}]

# Adjacent server and client ports: Clustered swaps them so a peer can connect back.
gen_rpc_base = get_integer.("TEST_GEN_RPC_TCP_SERVER_PORT", nil) || 5969 + offset * 2

config :gen_rpc,
  tcp_server_port: gen_rpc_base,
  tcp_client_port: get_integer.("TEST_GEN_RPC_TCP_CLIENT_PORT", gen_rpc_base + 1),
  connect_timeout: 500

config :realtime, :dashboard_auth, :basic_auth
config :realtime, :dashboard_credentials, {"test_user", "test_password"}
