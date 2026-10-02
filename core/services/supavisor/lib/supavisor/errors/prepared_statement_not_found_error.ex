defmodule Supavisor.Errors.PreparedStatementNotFoundError do
  @moduledoc """
  This error is returned when a prepared statement is referenced but does not exist.
  """

  use Supavisor.Error, [:name, code: "EPREPAREDNOTFOUND"]

  @type t() :: %__MODULE__{
          name: binary(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{name: name}) do
    "prepared statement #{inspect(name)} does not exist"
  end

  @impl Supavisor.Error
  def postgres_error(error) do
    Supavisor.Error.protocol_error("FATAL", "26000", message(error))
  end
end
