defmodule Supavisor.Errors.MaxPreparedStatementsMemoryError do
  @moduledoc """
  This error is returned when the prepared statements memory limit per connection is reached.
  """

  use Supavisor.Error, [:limit_mb, code: "EMAXPREPAREDMEM"]

  @type t() :: %__MODULE__{
          limit_mb: float(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{limit_mb: limit_mb}) do
    "max prepared statements memory limit reached. Limit: #{limit_mb}MB per connection"
  end
end
