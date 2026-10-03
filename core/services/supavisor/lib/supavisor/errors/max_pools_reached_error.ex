defmodule Supavisor.Errors.MaxPoolsReachedError do
  @moduledoc """
  This error is returned when the maximum number of connection pools has been reached
  """

  use Supavisor.Error, code: "EMAXPOOLSREACHED"

  @type t() :: %__MODULE__{
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(_error) do
    "max pools count reached"
  end
end
