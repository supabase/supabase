defmodule Realtime.Logs do
  @moduledoc """
  Logging operations for Realtime
  """
  require Logger

  defmacro __using__(_opts) do
    quote do
      require Logger

      import Realtime.Logs
    end
  end

  @doc """
  Prepares a value to be logged
  """
  def to_log(value) when is_binary(value), do: value
  def to_log(value), do: inspect(value, pretty: true)

  defmacro log_error(code, error, metadata \\ []) do
    quote bind_quoted: [code: code, error: error, metadata: metadata], location: :keep do
      Logger.error("#{code}: #{Realtime.Logs.to_log(error)}", [error_code: code] ++ metadata)
    end
  end

  defmacro log_warning(code, warning, metadata \\ []) do
    quote bind_quoted: [code: code, warning: warning, metadata: metadata], location: :keep do
      Logger.warning("#{code}: #{Realtime.Logs.to_log(warning)}", [{:error_code, code} | metadata])
    end
  end
end

defimpl Jason.Encoder, for: DBConnection.ConnectionError do
  def encode(
        %DBConnection.ConnectionError{message: message, reason: reason, severity: severity},
        _opts
      ) do
    inspect(%{message: message, reason: reason, severity: severity}, pretty: true)
  end
end

defimpl Jason.Encoder, for: Postgrex.Error do
  def encode(
        %Postgrex.Error{
          message: message,
          postgres: %{code: code, schema: schema, table: table}
        },
        _opts
      ) do
    inspect(%{message: message, schema: schema, table: table, code: code}, pretty: true)
  end
end

defimpl Jason.Encoder, for: Tuple do
  require Logger

  def encode(tuple, _opts) do
    Logger.error("UnableToEncodeJson: Tuple encoding not supported: #{inspect(tuple)}")
    inspect(%{error: "unable to parse response"}, pretty: true)
  end
end
