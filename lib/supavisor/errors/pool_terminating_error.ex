defmodule Supavisor.Errors.PoolTerminatingError do
  @moduledoc """
  This error is returned when attempting to use a pool that is in a terminating state.
  It wraps the underlying database error that caused the termination.
  """

  use Supavisor.Error, [:underlying_error, code: "EPOOLTERMINATING"]

  @type t() :: %__MODULE__{
          underlying_error: map(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{underlying_error: underlying_error}) do
    # Extract the message from the underlying protocol error if available
    underlying_message = Map.get(underlying_error, "M", "pool is terminating")
    "pool terminating: #{underlying_message}"
  end

  @impl Supavisor.Error
  def postgres_error(%{underlying_error: underlying_error}) do
    # Return the underlying protocol error directly since it's already formatted
    underlying_error
  end
end
