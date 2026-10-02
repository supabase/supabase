defmodule Supavisor.Errors.StartupPacketTooLargeError do
  @moduledoc """
  This error is returned when client sends a startup packet larger than the maximum allowed size
  """

  use Supavisor.Error, [:packet_size, code: "ESTARTUPPACKETTOOLARGE"]

  @type t() :: %__MODULE__{
          packet_size: non_neg_integer(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{packet_size: packet_size}) do
    "Startup packet too large: #{packet_size} bytes (max #{Supavisor.Protocol.max_startup_packet_size()} bytes)"
  end

  @impl Supavisor.Error
  def postgres_error(error) do
    Supavisor.Error.protocol_error("FATAL", "08P01", message(error))
  end
end
