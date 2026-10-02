defmodule Supavisor.Errors.PoolRanchNotFoundError do
  @moduledoc """
  This error is returned when the pool's ranch listener isn't registered yet (proxy mode)
  """

  use Supavisor.Error, [:id, code: "EPOOLRANCHNOTFOUND"]

  @type t() :: %__MODULE__{
          id: term(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{id: id}) do
    "pool ranch listener not found for #{inspect(id)}"
  end

  @impl Supavisor.Error
  def log_level(_), do: :warning
end
