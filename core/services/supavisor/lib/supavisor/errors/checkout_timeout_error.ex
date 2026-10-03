defmodule Supavisor.Errors.CheckoutTimeoutError do
  @moduledoc """
  This error is returned when unable to check out a connection from the pool due to timeout.
  This happens when all connections in the pool are busy and none become available within the checkout timeout period.
  Applies to both session and transaction modes.
  """

  use Supavisor.Error, [:mode, :timeout_ms, code: "ECHECKOUTTIMEOUT"]

  @type t() :: %__MODULE__{
          mode: :session | :transaction,
          timeout_ms: non_neg_integer(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{mode: mode, timeout_ms: timeout_ms}) do
    mode_str = mode |> to_string() |> String.capitalize()
    "unable to check out connection from the pool after #{timeout_ms}ms in #{mode_str} mode"
  end
end
