defmodule Supavisor.Errors.PoolCheckoutError do
  @moduledoc """
  This error is returned when checking out a connection from the pool fails for a non-timeout reason.
  """

  use Supavisor.Error, [:reason, code: "EPOOLCHECKOUT"]

  @type t() :: %__MODULE__{
          reason: term(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{reason: reason}) do
    "pool checkout failed: #{inspect(reason)}"
  end
end
