defmodule Supavisor.Errors.MaxPreparedStatementsError do
  @moduledoc """
  This error is returned when the prepared statements limit per connection is reached.
  """

  use Supavisor.Error, [:limit, code: "EMAXPREPARED"]

  @type t() :: %__MODULE__{
          limit: non_neg_integer(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{limit: limit}) do
    "max prepared statements limit reached. Limit: #{limit} per connection"
  end
end
