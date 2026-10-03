defmodule Realtime.PromEx.Plugins.MigrationsTest do
  use Realtime.DataCase, async: false

  alias Realtime.PromEx.Plugins.Migrations
  alias Realtime.Telemetry

  defmodule MetricsTest do
    use PromEx, otp_app: :realtime_test_migrations

    @impl true
    def plugins, do: [Migrations]
  end

  setup_all do
    start_supervised!(MetricsTest)
    :ok
  end

  defp metric_value(metric, expected_tags \\ nil) do
    MetricsTest
    |> PromEx.get_metrics()
    |> MetricsHelper.search(metric, expected_tags)
  end

  test "records migration duration histogram on stop" do
    start_time =
      Telemetry.start([:realtime, :tenants, :migrations], %{
        external_id: "tenant",
        hostname: "localhost",
        platform_region: "sa-east-1"
      })

    Telemetry.stop(
      [:realtime, :tenants, :migrations],
      start_time,
      %{external_id: "tenant", hostname: "localhost", platform_region: "sa-east-1", migrations_executed: 3}
    )

    assert metric_value("realtime_tenants_migrations_duration_milliseconds_count", platform_region: "sa-east-1") == 1

    assert metric_value("realtime_tenants_migrations_duration_milliseconds_bucket",
             platform_region: "sa-east-1",
             le: "100.0"
           ) > 0
  end

  test "skips duration histogram when migrations_executed is 0" do
    before =
      metric_value("realtime_tenants_migrations_duration_milliseconds_count", platform_region: "sa-east-1") || 0

    start_time =
      Telemetry.start([:realtime, :tenants, :migrations], %{
        external_id: "tenant",
        hostname: "localhost",
        platform_region: "sa-east-1"
      })

    Telemetry.stop(
      [:realtime, :tenants, :migrations],
      start_time,
      %{external_id: "tenant", hostname: "localhost", platform_region: "sa-east-1", migrations_executed: 0}
    )

    assert (metric_value("realtime_tenants_migrations_duration_milliseconds_count", platform_region: "sa-east-1") || 0) ==
             before
  end

  test "tags Postgrex errors with the SQLSTATE atom" do
    metric = "realtime_tenants_migrations_exceptions_total"
    start_time = Telemetry.start([:realtime, :tenants, :migrations], %{external_id: "tenant", hostname: "localhost"})

    Telemetry.exception(
      [:realtime, :tenants, :migrations],
      start_time,
      :error,
      %Postgrex.Error{postgres: %{code: :undefined_column}},
      [],
      %{external_id: "tenant", error_code: :undefined_column}
    )

    assert metric_value(metric, error_code: "undefined_column") == 1
  end

  test "tags connection errors with error_code=connection_error" do
    metric = "realtime_tenants_migrations_exceptions_total"
    start_time = Telemetry.start([:realtime, :tenants, :migrations], %{external_id: "tenant", hostname: "localhost"})

    Telemetry.exception(
      [:realtime, :tenants, :migrations],
      start_time,
      :error,
      %DBConnection.ConnectionError{message: "ssl send: closed"},
      [],
      %{external_id: "tenant", error_code: :connection_error}
    )

    assert metric_value(metric, error_code: "connection_error") == 1
  end

  test "counts reconciliations" do
    start_time = Telemetry.start([:realtime, :tenants, :migrations, :reconcile], %{external_id: "tenant"})

    Telemetry.stop(
      [:realtime, :tenants, :migrations, :reconcile],
      start_time,
      %{external_id: "tenant", cached_migrations_ran: 60, database_migrations_ran: 65}
    )

    assert metric_value("realtime_tenants_migrations_reconcile_total") == 1
  end

  test "counts reconcile exceptions" do
    start_time = Telemetry.start([:realtime, :tenants, :migrations, :reconcile], %{external_id: "tenant"})

    Telemetry.exception(
      [:realtime, :tenants, :migrations, :reconcile],
      start_time,
      :error,
      %RuntimeError{message: "boom"},
      [],
      %{external_id: "tenant"}
    )

    assert metric_value("realtime_tenants_migrations_reconcile_exceptions_total") == 1
  end
end
