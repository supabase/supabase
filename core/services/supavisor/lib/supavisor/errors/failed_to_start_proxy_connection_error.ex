defmodule Supavisor.Errors.FailedToStartProxyConnectionError do
  @moduledoc """
  This error is returned when a proxy connection failed to start.
  """

  use Supavisor.Error, code: "EPROXYSTARTFAILED"

  @type t() :: %__MODULE__{
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(_error) do
    "failed to start proxy connection"
  end
end
