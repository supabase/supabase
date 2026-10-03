defmodule Supavisor.Errors.AuthProtocolError do
  @moduledoc """
  This error is returned when there's a protocol violation during authentication,
  such as unexpected messages or decode errors.
  """

  use Supavisor.Error, [:details, code: "EAUTHPROTOCOL"]

  @type t() :: %__MODULE__{
          details: binary(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(_error) do
    "protocol violation during authentication"
  end

  @impl Supavisor.Error
  def log_message(%{details: details}) do
    "auth protocol error: #{details}"
  end

  @impl Supavisor.Error
  def postgres_error(error) do
    Supavisor.Error.protocol_error("FATAL", "08P01", message(error))
  end
end
