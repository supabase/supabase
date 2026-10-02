defmodule Supavisor.Errors.DuplicatePreparedStatementError do
  @moduledoc """
  This error is returned when attempting to create a prepared statement that already exists.
  """

  use Supavisor.Error, [:name, code: "EPREPAREDDUP"]

  @type t() :: %__MODULE__{
          name: binary(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{name: name}) do
    "prepared statement #{inspect(name)} already exists"
  end

  @impl Supavisor.Error
  def postgres_error(error) do
    Supavisor.Error.protocol_error("FATAL", "42P05", message(error))
  end
end
