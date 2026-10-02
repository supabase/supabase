defmodule Supavisor.Errors.CheckoutRetriesExhaustedError do
  @moduledoc """
  This error is returned when checkout retries are exhausted due to repeated DbHandler exits
  """

  use Supavisor.Error, code: "ECHECKOUTRETRIES"

  @type t() :: %__MODULE__{
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(_error) do
    "failed to check out a connection after multiple retries"
  end
end
