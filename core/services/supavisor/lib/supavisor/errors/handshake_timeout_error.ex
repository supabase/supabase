defmodule Supavisor.Errors.HandshakeTimeoutError do
  @moduledoc """
  This error is returned when a client doesn't finish the connection handshake in time
  """

  use Supavisor.Error, code: "EHANDSHAKETIMEOUT"

  @type t() :: %__MODULE__{
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(_error) do
    "handshake timeout"
  end

  @impl Supavisor.Error
  def log_level(_error), do: :warning

  @impl Supavisor.Error
  def postgres_error(_error), do: nil
end
