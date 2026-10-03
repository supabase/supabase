# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :realtime,
  websocket_fullsweep_after: 20,
  ecto_repos: [Realtime.Repo],
  version: Mix.Project.config()[:version],
  replication_watchdog_interval: :timer.minutes(5),
  replication_watchdog_timeout: :timer.minutes(1),
  replication_ready_timeout: :timer.minutes(1),
  # Blocks the transport process, so keep it under the client heartbeat interval (30s)
  postgres_changes_wait_max_timeout: :timer.seconds(20)

# Configures the endpoint
config :realtime, RealtimeWeb.Endpoint,
  url: [host: "127.0.0.1"],
  secret_key_base: "ktyW57usZxrivYdvLo9os7UGcUUZYKchOMHT3tzndmnHuxD09k+fQnPUmxlPMUI3",
  render_errors: [view: RealtimeWeb.ErrorView, accepts: ~w(html json), layout: false],
  pubsub_server: Realtime.PubSub,
  live_view: [signing_salt: "wUMBeR8j"]

config :realtime, :extensions,
  postgres_cdc_rls: %{
    type: :postgres_cdc,
    key: "postgres_cdc_rls",
    driver: Extensions.PostgresCdcRls,
    supervisor: Extensions.PostgresCdcRls.Supervisor,
    db_settings: Extensions.PostgresCdcRls.DbSettings
  }

config :esbuild,
  version: "0.14.29",
  default: [
    args:
      ~w(js/app.js --bundle --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

config :tailwind,
  version: "3.3.2",
  default: [
    args: ~w(
      --config=tailwind.config.js
      --input=css/app.css
      --output=../priv/static/assets/app.css
    ),
    cd: Path.expand("../assets", __DIR__)
  ]

# Configures Elixir's Logger
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [
    :request_id,
    :project,
    :external_id,
    :application_name,
    :error_code,
    :sub,
    :iss,
    :exp
  ]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

config :open_api_spex, :cache_adapter, OpenApiSpex.Plug.PersistentTermCache

config :logflare_logger_backend,
  flush_interval: 1_000,
  max_batch_size: 50,
  metadata: :all

config :phoenix, :filter_parameters, {:keep, []}

config :opentelemetry,
  resource_detectors: [:otel_resource_app_env, :otel_resource_env_var],
  resource: %{
    :"service.name" => "realtime"
  },
  text_map_propagators: [:baggage, :trace_context],
  # Exporter must be configured through environment variables
  traces_exporter: :none,
  span_processor: :batch

config :gen_rpc,
  extra_process_flags: [fullsweep_after: 20],
  # Inactivity period in milliseconds after which a pending process holding an async_call return value will exit.
  # This is used for process sanitation purposes so please make sure to set it in a sufficiently high number
  async_call_inactivity_timeout: 300_000

config :prom_ex, :storage_adapter, Realtime.PromEx.Store
config :realtime, Realtime.PromEx, ets_flush_interval: 90_000
config :realtime, Realtime.TenantPromEx, ets_flush_interval: 90_000

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
