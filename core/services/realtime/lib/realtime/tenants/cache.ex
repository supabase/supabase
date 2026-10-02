defmodule Realtime.Tenants.Cache do
  @moduledoc """
  Cache for Tenants.
  """
  require Cachex.Spec

  alias Realtime.Api.Tenant
  alias Realtime.GenRpc
  alias Realtime.Tenants

  def child_spec(_) do
    tenant_cache_expiration = Application.get_env(:realtime, :tenant_cache_expiration)

    %{
      id: __MODULE__,
      start: {Cachex, :start_link, [__MODULE__, [expiration: Cachex.Spec.expiration(default: tenant_cache_expiration)]]}
    }
  end

  @spec fetch_tenant_by_external_id(String.t()) :: {:ok, Tenant.t()} | {:error, :tenant_not_found}
  def fetch_tenant_by_external_id(tenant_id) do
    case get_tenant_by_external_id(tenant_id) do
      %Tenant{} = tenant -> {:ok, tenant}
      _ -> {:error, :tenant_not_found}
    end
  end

  @spec get_tenant_by_external_id(String.t()) :: Tenant.t() | nil
  def get_tenant_by_external_id(tenant_id) do
    case Cachex.fetch(__MODULE__, cache_key(tenant_id), fn _key ->
           case Tenants.get_tenant_by_external_id(tenant_id) do
             %Tenant{} = tenant -> {:commit, tenant}
             _ -> {:ignore, nil}
           end
         end) do
      {:commit, value} -> value
      {:ok, value} -> value
      {:ignore, value} -> value
    end
  end

  defp cache_key(tenant_id), do: {:get_tenant_by_external_id, tenant_id}

  @doc """
  Invalidates the cache for a tenant in the local node
  """
  def invalidate_tenant_cache(tenant_id), do: Cachex.del(__MODULE__, cache_key(tenant_id))

  def distributed_invalidate_tenant_cache(tenant_id) when is_binary(tenant_id) do
    GenRpc.multicast(__MODULE__, :invalidate_tenant_cache, [tenant_id])
  end

  @doc """
  Update the cache for a tenant
  """
  def update_cache(tenant) do
    Cachex.put(__MODULE__, cache_key(tenant.external_id), tenant)
  end

  @doc """
  Update the cache for a tenant in all nodes
  """
  @spec global_cache_update(Realtime.Api.Tenant.t()) :: :ok
  def global_cache_update(tenant) do
    GenRpc.multicast(__MODULE__, :update_cache, [tenant])
  end
end
