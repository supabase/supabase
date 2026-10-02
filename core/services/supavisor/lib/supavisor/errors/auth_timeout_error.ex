defmodule Supavisor.Errors.AuthTimeoutError do
  @moduledoc """
  This error is returned when authentication times out while waiting for a message.
  """

  use Supavisor.Error, [:context, code: "EAUTHTIMEOUT"]

  @type t() :: %__MODULE__{
          context: atom() | nil,
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(_error) do
    "timeout while waiting for message"
  end

  @impl Supavisor.Error
  def log_message(%{context: context}) do
    "Timeout while waiting for message in state #{context_description(context)}"
  end

  @impl Supavisor.Error
  def postgres_error(error) do
    Supavisor.Error.protocol_error("FATAL", "08006", message(error))
  end

  defp context_description(:auth_md5_wait), do: "MD5"
  defp context_description(:auth_scram_first_wait), do: "SCRAM first"
  defp context_description(:auth_scram_final_wait), do: "SCRAM final"
  defp context_description(other), do: inspect(other)
end
