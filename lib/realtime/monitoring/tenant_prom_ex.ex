defmodule Realtime.TenantPromEx do
  alias Realtime.PromEx.Plugins.Channels
  alias Realtime.PromEx.Plugins.Tenant

  @moduledoc """
  PromEx configuration for tenant-level metrics.

  These metrics are per-tenant and considered secondary priority for scraping.
  Configure your Victoria Metrics scrape interval higher (e.g. 60s) compared
  to the global metrics endpoint.

  Exposes metrics via `/metrics/tenant` and `/metrics/:region/tenant`.
  """

  use PromEx, otp_app: :realtime

  @impl true
  def plugins do
    poll_rate = Application.get_env(:realtime, :prom_poll_rate)

    [
      {Tenant, poll_rate: poll_rate},
      {Channels, poll_rate: poll_rate}
    ]
  end

  def get_metrics do
    metrics = PromEx.get_metrics(Realtime.TenantPromEx)

    Realtime.TenantPromEx.__ets_cron_flusher_name__()
    |> PromEx.ETSCronFlusher.defer_ets_flush()

    metrics
  end
end
