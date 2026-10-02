defmodule Supavisor.Errors.WorkerNotFoundError do
  @moduledoc """
  This error is returned when the manager or pool processes for a tenant aren't registered locally yet
  """

  use Supavisor.Error, [:id, code: "EWORKERNOTFOUND"]

  @type t() :: %__MODULE__{
          id: term(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{id: id}) do
    "worker processes (manager/pool) not found for tenant #{inspect(id)}"
  end

  @impl Supavisor.Error
  def log_level(_), do: :warning
end
