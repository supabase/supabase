defmodule Supavisor.Errors.StartupMessageError do
  @moduledoc """
  This error is returned when client sends an invalid startup message
  """

  use Supavisor.Error, [:reason, :payload, code: "ESTARTUPMESSAGE"]

  @type t() :: %__MODULE__{
          reason: atom(),
          payload: binary() | nil,
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{reason: reason}) do
    "Invalid startup message: #{inspect(reason)}"
  end

  @impl Supavisor.Error
  def log_message(%{payload: nil} = error), do: message(error)

  def log_message(%{payload: payload} = error) do
    [message(error), " payload: ", inspect(payload, limit: 200)]
  end

  @impl Supavisor.Error
  def postgres_error(error) do
    Supavisor.Error.protocol_error("FATAL", "08P01", message(error))
  end
end
