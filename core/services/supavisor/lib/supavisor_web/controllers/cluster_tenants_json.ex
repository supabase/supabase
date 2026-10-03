defmodule SupavisorWeb.ClusterTenantsJSON do
  alias Supavisor.Tenants.ClusterTenants

  @doc """
  Renders a list of cluster_tenants.
  """
  def index(%{cluster_tenants: cluster_tenants}) do
    %{data: for(cluster_tenants <- cluster_tenants, do: data(cluster_tenants))}
  end

  @doc """
  Renders a single cluster_tenants.
  """
  def show(%{cluster_tenants: cluster_tenants}) do
    %{data: data(cluster_tenants)}
  end

  defp data(%ClusterTenants{} = cluster_tenants) do
    %{
      id: cluster_tenants.id,
      active: cluster_tenants.active
    }
  end
end
