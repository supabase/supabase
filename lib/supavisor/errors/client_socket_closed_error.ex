defmodule Supavisor.Errors.ClientSocketClosedError do
  @moduledoc """
  This error is returned when a client socket is closed unexpectedly
  """

  use Supavisor.Error, [:mode, :client_state, :reason, code: "ECLIENTSOCKETCLOSED"]

  @type t() :: %__MODULE__{
          mode: atom() | nil,
          client_state: atom() | nil,
          reason: term() | nil,
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{mode: mode, client_state: client_state}) do
    "Client socket closed while state was #{client_state} (#{mode})"
  end

  @impl Supavisor.Error
  def log_message(%{reason: nil} = error), do: message(error)

  def log_message(%{reason: reason} = error) do
    "#{message(error)}: #{inspect(reason)}"
  end

  @impl Supavisor.Error
  def log_level(%{client_state: client_state, mode: mode}) do
    cond do
      client_state == :idle or mode == :proxy ->
        :info

      client_state == :handshake ->
        :warning

      true ->
        :error
    end
  end

  @impl Supavisor.Error
  def postgres_error(_error), do: nil
end
