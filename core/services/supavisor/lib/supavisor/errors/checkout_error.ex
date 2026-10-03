defmodule Supavisor.Errors.CheckoutError do
  @moduledoc """
  Returned when checking out a DbHandler fails, includes a postgres error explaining the reason
  """

  use Supavisor.Error, [:pid, :postgres_error, code: "ECHECKOUTFAILED"]

  @type t() :: %__MODULE__{
          pid: pid(),
          postgres_error: map(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{postgres_error: postgres_error}) do
    "checkout failed due to #{inspect(postgres_error)}"
  end

  @impl Supavisor.Error
  def postgres_error(%{postgres_error: postgres_error}) do
    postgres_error
  end
end
