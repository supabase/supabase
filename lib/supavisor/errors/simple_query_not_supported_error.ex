defmodule Supavisor.Errors.SimpleQueryNotSupportedError do
  @moduledoc """
  This error is returned when a simple query protocol is used for prepared statements in transaction mode.
  Transaction mode only supports prepared statements using the Extended Query Protocol.
  """

  use Supavisor.Error, code: "EPSSIMPLEQUERY"

  @type t() :: %__MODULE__{
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(_error) do
    "transaction mode only supports prepared statements using the Extended Query Protocol"
  end
end
