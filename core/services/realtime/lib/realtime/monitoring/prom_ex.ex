defmodule Realtime.PromEx do
  alias Realtime.PromEx.Plugins.Distributed
  alias Realtime.PromEx.Plugins.GenRpc
  alias Realtime.PromEx.Plugins.Migrations
  alias Realtime.PromEx.Plugins.Muster
  alias Realtime.PromEx.Plugins.OsMon
  alias Realtime.PromEx.Plugins.Phoenix
  alias Realtime.PromEx.Plugins.Presence
  alias Realtime.PromEx.Plugins.TenantGlobal
  alias Realtime.PromEx.Plugins.Tenants

  @moduledoc """
  PromEx configuration for global metrics (BEAM, OS, Phoenix, distributed infrastructure).

  These are higher-priority metrics. Configure your Victoria Metrics scrape interval
  lower compared to the tenant metrics endpoint.

  Exposes metrics via `/metrics` and `/metrics/:region`.

  Be sure to add the following to finish setting up PromEx:

  1. Update your configuration (config.exs, dev.exs, prod.exs, releases.exs, etc) to
     configure the necessary bit of PromEx. Be sure to check out `PromEx.Config` for
     more details regarding configuring PromEx:
     ```
     config :realtime, Realtime.PromEx,
       disabled: false,
       manual_metrics_start_delay: :no_delay,
       drop_metrics_groups: [],
       grafana: :disabled,
       metrics_server: :disabled
     ```

  2. Add this module to your application supervision tree. It should be one of the first
     things that is started so that no Telemetry events are missed. For example, if PromEx
     is started after your Repo module, you will miss Ecto's init events and the dashboards
     will be missing some data points:
     ```
     def start(_type, _args) do
       children = [
         Realtime.PromEx,

         ...
       ]

       ...
     end
     ```

  3. Update your `endpoint.ex` file to expose your metrics (or configure a standalone
     server using the `:metrics_server` config options). Be sure to put this plug before
     your `Plug.Telemetry` entry so that you can avoid having calls to your `/metrics`
     endpoint create their own metrics and logs which can pollute your logs/metrics given
     that Prometheus will scrape at a regular interval and that can get noisy:
     ```
     defmodule RealtimeWeb.Endpoint do
       use Phoenix.Endpoint, otp_app: :realtime

       ...

       plug PromEx.Plug, prom_ex_module: Realtime.PromEx

       ...
     end
     ```

  4. Update the list of plugins in the `plugins/0` function return list to reflect your
     application's dependencies. Also update the list of dashboards that are to be uploaded
     to Grafana in the `dashboards/0` function.
  """

  use PromEx, otp_app: :realtime

  alias PromEx.Plugins

  defmodule Store do
    @moduledoc false
    # Custom store to set global tags

    @behaviour PromEx.Storage

    @impl true
    def scrape(name) do
      Peep.get_all_metrics(name)
      |> Realtime.Monitoring.Prometheus.export()
    end

    @impl true
    def child_spec(name, metrics) do
      Peep.child_spec(
        name: name,
        metrics: metrics,
        global_tags: global_tags(),
        storage: {Realtime.Monitoring.Peep.PartitionedTables, tables: 4, routing_tag: :tenant}
      )
    end

    defp global_tags do
      node = node()
      [_name, host] = node |> Atom.to_string() |> String.split("@", parts: 2)

      %{
        region: Realtime.Nodes.region(),
        host: host,
        id: Realtime.Nodes.short_node_id_from_name(node)
      }
    end
  end

  @impl true
  def plugins do
    poll_rate = Application.get_env(:realtime, :prom_poll_rate)

    [
      {Plugins.Beam, poll_rate: poll_rate, metric_prefix: [:beam]},
      {Phoenix, router: RealtimeWeb.Router, poll_rate: poll_rate, metric_prefix: [:phoenix]},
      {OsMon, poll_rate: poll_rate},
      {Migrations, poll_rate: poll_rate},
      {Tenants, poll_rate: poll_rate},
      {TenantGlobal, poll_rate: poll_rate},
      {Distributed, poll_rate: poll_rate},
      {GenRpc, poll_rate: poll_rate},
      {Muster, poll_rate: poll_rate},
      Presence
    ]
  end

  @impl true
  def dashboard_assigns do
    [
      datasource_id: "YOUR_PROMETHEUS_DATASOURCE_ID"
    ]
  end

  @impl true
  def dashboards do
    [
      # PromEx built in Grafana dashboards
      # {:prom_ex, "application.json"},
      # {:prom_ex, "beam.json"},
      # {:prom_ex, "phoenix.json"}
      # {:prom_ex, "ecto.json"},
      # {:prom_ex, "oban.json"},
      # {:prom_ex, "phoenix_live_view.json"}

      # Add your dashboard definitions here with the format: {:otp_app, "path_in_priv"}
      # {:realtime, "/grafana_dashboards/user_metrics.json"}
    ]
  end

  def get_global_metrics do
    metrics = PromEx.get_metrics(Realtime.PromEx)

    Realtime.PromEx.__ets_cron_flusher_name__()
    |> PromEx.ETSCronFlusher.defer_ets_flush()

    metrics
  end

  @doc deprecated: "Use get_global_metrics/0 instead"
  def get_metrics, do: get_global_metrics()
end
