defmodule RealtimeWeb.RealtimeChannel.Logging do
  @moduledoc """
  Log functions for Realtime channels
  """

  alias Realtime.Telemetry
  require Logger

  defmacro __using__(_opts) do
    quote do
      require Logger
      import RealtimeWeb.RealtimeChannel.Logging
    end
  end

  @doc """
  Logs an error message
  """
  @spec log_error(socket :: Phoenix.Socket.t(), code :: binary(), msg :: any()) ::
          {:error, %{reason: binary}}
  def log_error(socket, code, msg) do
    msg = build_msg(code, msg)
    log(socket, :error, code, msg)
    {:error, %{reason: msg}}
  end

  @doc """
  Logs a warning message
  """
  @spec log_warning(socket :: Phoenix.Socket.t(), code :: binary(), msg :: any()) ::
          {:error, %{reason: binary}}
  def log_warning(socket, code, msg) do
    msg = build_msg(code, msg)
    log(socket, :warning, code, msg)
    {:error, %{reason: msg}}
  end

  @doc """
  Logs an error if the log level is set to error.

  Accepts an optional `throttle: {max_count, window_ms}` option to limit
  how many times the log is emitted per tenant+code within the given time window.
  """
  @spec maybe_log_error(socket :: Phoenix.Socket.t(), code :: binary(), msg :: any(), opts :: keyword()) ::
          {:error, %{reason: binary}}
  def maybe_log_error(socket, code, msg, opts \\ []), do: maybe_log(socket, :error, code, msg, opts)

  @doc """
  Logs a warning if the log level is set to warning.

  Accepts an optional `throttle: {max_count, window_ms}` option to limit
  how many times the log is emitted per tenant+code within the given time window.
  """
  @spec maybe_log_warning(socket :: Phoenix.Socket.t(), code :: binary(), msg :: any(), opts :: keyword()) ::
          {:error, %{reason: binary}}
  def maybe_log_warning(socket, code, msg, opts \\ []), do: maybe_log(socket, :warning, code, msg, opts)

  @doc """
  Logs an info if the log level is set to info.
  """
  @spec maybe_log_info(socket :: Phoenix.Socket.t(), msg :: any()) :: :ok
  def maybe_log_info(socket, msg), do: maybe_log(socket, :info, nil, msg, [])

  defp build_msg(nil, msg), do: stringify!(msg)
  defp build_msg(code, msg), do: "#{code}: #{stringify!(msg)}"

  defp log(%{assigns: assigns}, level, code, msg) do
    tenant = assigns.tenant
    Logger.metadata(external_id: tenant, project: tenant)
    enrich_metadata(level, Map.get(assigns, :access_token))
    Logger.log(level, msg, error_code: code)
    emit_telemetry(level, code, tenant)
  end

  defp enrich_metadata(level, token) when level in [:error, :warning],
    do: update_metadata_with_token_claims(token)

  defp enrich_metadata(_level, _token), do: :ok

  defp emit_telemetry(:error, code, tenant),
    do: Telemetry.execute([:realtime, :channel, :error], %{count: 1}, %{code: code, tenant: tenant})

  defp emit_telemetry(_level, _code, _tenant), do: :ok

  defp maybe_log(%{assigns: %{log_level: log_level}} = socket, level, code, msg, opts) do
    built_msg = build_msg(code, msg)
    if Logger.compare_levels(log_level, level) != :gt, do: do_log(socket, level, code, built_msg, opts)
    if level in [:error, :warning], do: {:error, %{reason: built_msg}}, else: :ok
  end

  defp do_log(socket, level, code, msg, []), do: log(socket, level, code, msg)

  defp do_log(%{assigns: %{tenant: tenant}} = socket, level, code, msg, throttle: {max_count, window_ms}) do
    key = {tenant, level, code}

    case Cachex.get(Realtime.LogThrottle, key) do
      {:ok, nil} ->
        Cachex.put(Realtime.LogThrottle, key, 1, expire: window_ms)
        log(socket, level, code, msg)

      {:ok, count} when count < max_count ->
        Cachex.incr(Realtime.LogThrottle, key)
        log(socket, level, code, msg)

      _ ->
        emit_telemetry(level, code, tenant)
    end
  end

  defp stringify!(msg) when is_binary(msg), do: msg
  defp stringify!(msg), do: inspect(msg, pretty: true)

  defp update_metadata_with_token_claims(nil), do: :ok

  defp update_metadata_with_token_claims(token) do
    case Joken.peek_claims(token) do
      {:ok, claims} -> Logger.metadata(sub: claims["sub"], exp: claims["exp"], iss: claims["iss"])
      _ -> :ok
    end
  end
end
