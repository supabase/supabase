defmodule Realtime.PromEx.Plugins.Migrations do
  @moduledoc """
  Tenant migration metrics.
  """

  use PromEx.Plugin

  defmodule Buckets do
    @moduledoc false
    use Peep.Buckets.Custom,
      buckets: [100, 250, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 30_000, 45_000, 60_000, 90_000, 120_000]
  end

  @impl true
  def event_metrics(_opts) do
    Event.build(:realtime_tenants_migrations, [
      distribution(
        [:realtime, :tenants, :migrations, :duration, :milliseconds],
        event_name: [:realtime, :tenants, :migrations, :stop],
        measurement: :duration,
        unit: {:native, :millisecond},
        description: "Tenant migrations duration",
        keep: &__MODULE__.migrations_executed/1,
        tags: [:platform_region],
        reporter_options: [peep_bucket_calculator: Buckets]
      ),
      counter(
        [:realtime, :tenants, :migrations, :exceptions, :total],
        event_name: [:realtime, :tenants, :migrations, :exception],
        tags: [:error_code],
        description: "Count of failed tenant migrations"
      ),
      counter(
        [:realtime, :tenants, :migrations, :reconcile, :total],
        event_name: [:realtime, :tenants, :migrations, :reconcile, :stop],
        description: "Count of reconciled tenant migrations"
      ),
      counter(
        [:realtime, :tenants, :migrations, :reconcile, :exceptions, :total],
        event_name: [:realtime, :tenants, :migrations, :reconcile, :exception],
        description: "Count of failed migrations_ran reconciliations"
      )
    ])
  end

  def migrations_executed(%{migrations_executed: n}) when is_integer(n) and n > 0, do: true
  def migrations_executed(_), do: false
end
