defmodule SupavisorWeb.ClusterTenantsView do
  use SupavisorWeb, :view
  alias SupavisorWeb.ClusterTenantsView

  def render("index.json", %{cluster_tenants: cluster_tenants}) do
    %{data: render_many(cluster_tenants, ClusterTenantsView, "cluster_tenant.json")}
  end

  def render("show.json", %{cluster_tenant: cluster_tenant}) do
    %{data: render_one(cluster_tenant, ClusterTenantsView, "cluster_tenant.json")}
  end

  def render("cluster_tenant.json", %{cluster_tenants: ct}) do
    %{
      id: ct.id,
      active: ct.active,
      cluster_alias: ct.cluster_alias,
      tenant_external_id: ct.tenant_external_id,
      inserted_at: ct.inserted_at,
      updated_at: ct.updated_at
    }
  end

  def render("error.json", %{error: reason}) do
    %{error: reason}
  end

  def render("show_terminate.json", %{result: result}) do
    %{result: result}
  end
end
