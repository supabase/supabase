defmodule Supavisor.Errors.SslHandshakeError do
  @moduledoc """
  This error is returned when SSL handshake fails during client connection
  """

  use Supavisor.Error, [:reason, code: "ESSLHANDSHAKE"]

  @type t() :: %__MODULE__{
          reason: term(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{reason: reason}) do
    "SSL handshake failed: #{inspect(reason)}"
  end

  @impl Supavisor.Error
  def postgres_error(error) do
    Supavisor.Error.protocol_error("FATAL", "08006", message(error))
  end
end
