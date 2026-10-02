defmodule SupavisorWeb.ClusterJSON do
  alias Supavisor.Tenants.Cluster

  @doc """
  Renders a list of clusters.
  """
  def index(%{clusters: clusters}) do
    %{data: for(cluster <- clusters, do: data(cluster))}
  end

  @doc """
  Renders a single cluster.
  """
  def show(%{cluster: cluster}) do
    %{data: data(cluster)}
  end

  defp data(%Cluster{} = cluster) do
    %{
      id: cluster.id,
      active: cluster.active
    }
  end
end
