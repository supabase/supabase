defmodule Supavisor.TenantCache do
  @moduledoc """
  Caches tenant-specific data that needs to survive child process restarts.

  We use this to store `upstream_cache_secrets` and `parameter_status`. This
  allows these values to be updated and retrieved anytime, and automatically
  cleans them up if the pool is restarted.
  """

  use GenServer

  def start_link(args) do
    GenServer.start_link(__MODULE__, args)
  end

  def init(%{id: id, upstream_auth_secrets: upstream_auth_secrets}) do
    table = :ets.new(:tenant_cache, [:set, :public])
    :ets.insert(table, {:upstream_auth_secrets, upstream_auth_secrets})
    Registry.register(Supavisor.Registry.Tenants, {:cache, id}, table)
    {:ok, %{table: table, id: id}}
  end

  @spec get_parameter_status(Supavisor.id()) :: iodata() | []
  def get_parameter_status(id) do
    case Registry.lookup(Supavisor.Registry.Tenants, {:cache, id}) do
      [{_pid, table}] ->
        :ets.lookup_element(table, :parameter_status, 2, [])

      _ ->
        []
    end
  end

  @spec put_parameter_status(Supavisor.id(), iodata()) :: true
  def put_parameter_status(id, encoded_ps) do
    case Registry.lookup(Supavisor.Registry.Tenants, {:cache, id}) do
      [{_pid, table}] ->
        :ets.insert(table, {:parameter_status, encoded_ps})

      _ ->
        true
    end
  end

  @spec get_upstream_auth_secrets(Supavisor.id()) ::
          {:ok, map()} | {:error, :not_found}
  def get_upstream_auth_secrets(id) do
    case Registry.lookup(Supavisor.Registry.Tenants, {:cache, id}) do
      [{_pid, table}] ->
        case :ets.lookup(table, :upstream_auth_secrets) do
          [{:upstream_auth_secrets, secrets}] -> {:ok, secrets}
          _ -> {:error, :not_found}
        end

      _ ->
        {:error, :not_found}
    end
  end

  @spec put_upstream_auth_secrets(Supavisor.id(), map()) :: true
  def put_upstream_auth_secrets(id, secrets) do
    case Registry.lookup(Supavisor.Registry.Tenants, {:cache, id}) do
      [{_pid, table}] ->
        :ets.insert(table, {:upstream_auth_secrets, secrets})

      _ ->
        true
    end
  end

  @spec delete_upstream_auth_secrets(Supavisor.id()) :: true
  def delete_upstream_auth_secrets(id) do
    case Registry.lookup(Supavisor.Registry.Tenants, {:cache, id}) do
      [{_pid, table}] ->
        :ets.delete(table, :upstream_auth_secrets)

      _ ->
        true
    end
  end
end
