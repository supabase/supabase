defmodule SupavisorWeb.ClusterView do
  use SupavisorWeb, :view

  alias SupavisorWeb.ClusterTenantsView
  alias SupavisorWeb.ClusterView

  def render("index.json", %{clusters: clusters}) do
    %{data: render_many(clusters, ClusterView, "cluster.json")}
  end

  def render("show.json", %{cluster: cluster}) do
    %{data: render_one(cluster, ClusterView, "cluster.json")}
  end

  def render("cluster.json", %{cluster: cluster}) do
    %{
      id: cluster.id,
      alias: cluster.alias,
      active: cluster.active,
      inserted_at: cluster.inserted_at,
      updated_at: cluster.updated_at,
      cluster_tenants:
        render_many(cluster.cluster_tenants, ClusterTenantsView, "cluster_tenant.json")
    }
  end

  def render("error.json", %{error: reason}) do
    %{error: reason}
  end

  def render("show_terminate.json", %{result: result}) do
    %{result: result}
  end
end
