# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :supavisor,
  ecto_repos: [Supavisor.Repo],
  version: Mix.Project.config()[:version],
  env: Mix.env(),
  metrics_disabled: System.get_env("METRICS_DISABLED") == "true",
  switch_active_count: System.get_env("SWITCH_ACTIVE_COUNT", "100") |> String.to_integer(),
  subscribe_retries: System.get_env("SUBSCRIBE_RETRIES", "20") |> String.to_integer(),
  # Worst-case wait (retries * backoff * 1.25 with jitter) must stay well below the 5s handshake timeout.
  admission_retries: System.get_env("ADMISSION_RETRIES", "5") |> String.to_integer(),
  admission_backoff: System.get_env("ADMISSION_BACKOFF", "300") |> String.to_integer()

config :prom_ex, storage_adapter: Supavisor.Monitoring.PromEx.Store

config :syn, event_handler: Supavisor.SynHandler

# Configures the endpoint
config :supavisor, SupavisorWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "ktyW57usZxrivYdvLo9os7UGcUUZYKchOMHT3tzndmnHuxD09k+fQnPUmxlPMUI3",
  render_errors: [view: SupavisorWeb.ErrorView, accepts: ~w(html json), layout: false],
  pubsub_server: Supavisor.PubSub,
  live_view: [signing_salt: "qf3AEZ7n"]

metadata = [
  :request_id,
  :project,
  :user,
  :region,
  :instance_id,
  :mode,
  :type,
  :app_name,
  :peer_ip,
  :local,
  :proxy
]

# Configures Elixir's Logger
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: metadata

# Use built-in JSON module for JSON parsing
config :phoenix, :json_library, JSON

config :open_api_spex, :cache_adapter, OpenApiSpex.Plug.PersistentTermCache

config :libcluster,
  debug: false,
  topologies: [
    default: [
      # The selected clustering strategy. Required.
      strategy: Cluster.Strategy.Epmd,
      # Configuration for the provided strategy. Optional.
      # config: [hosts: [:"a@127.0.0.1", :"b@127.0.0.1"]],
      # The function to use for connecting nodes. The node
      # name will be appended to the argument list. Optional
      connect: {:net_kernel, :connect_node, []},
      # The function to use for disconnecting nodes. The node
      # name will be appended to the argument list. Optional
      disconnect: {:erlang, :disconnect_node, []},
      # The function to use for listing nodes.
      # This function must return a list of node names. Optional
      list_nodes: {:erlang, :nodes, [:connected]}
    ]
  ]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
