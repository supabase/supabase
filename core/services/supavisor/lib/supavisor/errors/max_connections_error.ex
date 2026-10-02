defmodule Supavisor.Errors.MaxConnectionsError do
  @moduledoc """
  This error is returned when the connection limit is reached.
  It is used for transaction, session, and proxy modes.
  """

  use Supavisor.Error, [:mode, :limit, code: "EMAXCONN"]

  @type t() :: %__MODULE__{
          mode: Supavisor.mode(),
          limit: pos_integer(),
          code: binary()
        }

  @spec new(Supavisor.mode(), pos_integer()) :: t()
  def new(mode, limit) do
    code = if mode == :session, do: "EMAXCONNSESSION", else: "EMAXCONN"
    %__MODULE__{mode: mode, limit: limit, code: code}
  end

  @impl Supavisor.Error
  def error_message(%{mode: :session, limit: limit}) do
    "max clients reached in session mode - max clients are limited to pool_size: #{inspect(limit)}"
  end

  def error_message(%{mode: mode, limit: limit}) when mode in [:transaction, :proxy] do
    "max client connections reached, limit: #{inspect(limit)}"
  end

  @impl Supavisor.Error
  def log_message(%{mode: :proxy, limit: limit} = error) do
    IO.iodata_to_binary([
      ?(,
      error.code,
      ?),
      " max proxy connections reached, limit: ",
      inspect(limit)
    ])
  end

  def log_message(%{mode: :transaction, limit: limit} = error) do
    IO.iodata_to_binary([
      ?(,
      error.code,
      ?),
      " max client connections reached in transaction mode, limit: ",
      inspect(limit)
    ])
  end

  def log_message(error), do: message(error)
end
