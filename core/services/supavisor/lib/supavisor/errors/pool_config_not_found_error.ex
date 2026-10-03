defmodule Supavisor.Errors.PoolConfigNotFoundError do
  @moduledoc """
  This error is returned when pool configuration lookup fails (from get_pool_config_cache or get_cluster_config)
  """

  use Supavisor.Error, [:id, code: "EPOOLCONFIGNOTFOUND"]

  @type t() :: %__MODULE__{
          id: term(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{id: id}) do
    "pool configuration not found for #{inspect(id)}"
  end

  @impl Supavisor.Error
  def log_level(_), do: :warning
end
