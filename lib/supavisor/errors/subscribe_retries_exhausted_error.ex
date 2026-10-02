defmodule Supavisor.Errors.SubscribeRetriesExhaustedError do
  @moduledoc """
  This error is returned when the client fails to subscribe to a tenant after multiple retry attempts
  """

  use Supavisor.Error, code: "ESUBSCRIBERETRIES"

  @type t() :: %__MODULE__{
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(_error) do
    "failed to subscribe to tenant after multiple retries. Terminating"
  end
end
