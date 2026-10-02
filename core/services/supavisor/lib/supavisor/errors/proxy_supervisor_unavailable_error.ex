defmodule Supavisor.Errors.ProxySupervisorUnavailableError do
  @moduledoc """
  This error is returned when the proxy supervisor could not be started after retries.
  """

  use Supavisor.Error, code: "EPROXYSUPERVISORUNAVAILABLE"

  @type t() :: %__MODULE__{
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(_error) do
    "proxy supervisor unavailable after retries"
  end
end
