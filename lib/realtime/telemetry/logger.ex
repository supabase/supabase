defmodule Realtime.Telemetry.Logger do
  @moduledoc """
  We can log less frequent Telemetry events to get data into BigQuery.
  """

  require Logger
  use Realtime.Logs

  use GenServer

  @events [
    [:realtime, :connections],
    [:realtime, :rate_counter, :channel, :events],
    [:realtime, :rate_counter, :channel, :db_events],
    [:realtime, :rate_counter, :channel, :presence_events],
    [:realtime, :tenants, :migrations, :start],
    [:realtime, :tenants, :migrations, :stop],
    [:realtime, :tenants, :migrations, :exception],
    [:realtime, :tenants, :migrations, :reconcile, :stop],
    [:realtime, :tenants, :migrations, :reconcile, :exception],
    [:phoenix, :error_rendered],
    [:phoenix, :endpoint, :stop]
  ]

  def start_link(args) do
    GenServer.start_link(__MODULE__, args)
  end

  def init(handler_id: handler_id) do
    :telemetry.detach({Phoenix.Logger, [:phoenix, :endpoint, :stop]})
    :telemetry.attach_many(handler_id, @events, &__MODULE__.handle_event/4, [])

    {:ok, []}
  end

  @doc """
  Logs billing metrics for a tenant aggregated and emitted by a PromEx metric poller.
  """
  def handle_event(event, measurements, %{tenant: tenant}, _config) do
    meta = %{project: tenant, measurements: measurements}
    Logger.info(["Billing metrics: ", inspect(event)], meta)
    :ok
  end

  def handle_event([:realtime, :tenants, :migrations, :start], _measurements, metadata, _config) do
    Logger.info(
      "Applying migrations to #{metadata.hostname}",
      external_id: metadata.external_id,
      project: metadata.external_id
    )
  end

  def handle_event([:realtime, :tenants, :migrations, :stop], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(measurements.duration, :native, :millisecond)

    message =
      case metadata.source do
        :dump ->
          "Finished loading the dump of #{metadata.migrations_executed} migrations for tenant #{metadata.external_id} in #{duration_ms}ms"

        :migrator ->
          "Finished applying #{metadata.migrations_executed} migrations for tenant #{metadata.external_id} in #{duration_ms}ms"
      end

    Logger.info(message, external_id: metadata.external_id, project: metadata.external_id)
  end

  def handle_event([:realtime, :tenants, :migrations, :exception], _measurements, metadata, _config) do
    log_error(
      "MigrationsFailedToRun",
      metadata.reason,
      external_id: metadata.external_id,
      project: metadata.external_id,
      error_code: metadata.error_code
    )
  end

  def handle_event([:realtime, :tenants, :migrations, :reconcile, :stop], _measurements, metadata, _config) do
    log_warning(
      "MigrationCountMismatch",
      "Reconciling migrations_ran for tenant #{metadata.external_id} cached=#{metadata.cached_migrations_ran} database=#{metadata.database_migrations_ran}",
      external_id: metadata.external_id,
      project: metadata.external_id
    )
  end

  def handle_event([:realtime, :tenants, :migrations, :reconcile, :exception], _measurements, metadata, _config) do
    log_error(
      "MigrationCountMismatchReconcileFailed",
      metadata.reason,
      external_id: metadata.external_id,
      project: metadata.external_id
    )
  end

  def handle_event([:phoenix, :error_rendered], _measurements, metadata, _config) do
    %{status: status, kind: kind, reason: reason} = metadata
    status = Plug.Conn.Status.code(status)
    message = "Sent #{status} response: #{format_reason(kind, reason)}"

    if status >= 500 do
      log_error("HttpServerError", message)
    else
      log_warning("HttpClientError", message)
    end
  end

  def handle_event([:phoenix, :endpoint, :stop], measurements, %{conn: conn} = metadata, _config) do
    case resolve_log_level(metadata[:options][:log], conn) do
      false ->
        :ok

      level ->
        duration_ms = System.convert_time_unit(measurements.duration, :native, :millisecond)
        message = "#{conn.method} #{conn.request_path} - Sent #{conn.status} in #{duration_ms}ms"
        Logger.log(level, message)
    end
  end

  def handle_event(_event, _measurements, _metadata, _config) do
    :ok
  end

  # in practice we always have MFA set --> matching on it first for a micto bit of perf 😇
  defp resolve_log_level({mod, fun, args}, conn), do: apply(mod, fun, [conn | args])
  defp resolve_log_level(nil, _conn), do: :info
  defp resolve_log_level(level, _conn) when is_atom(level), do: level

  defp format_reason(_kind, reason) when is_exception(reason),
    do: "#{inspect(reason.__struct__)} - #{Exception.message(reason)}"

  defp format_reason(kind, reason), do: "#{kind} - #{to_log(reason)}"

  def handle_info(_msg, state) do
    {:noreply, state}
  end
end
