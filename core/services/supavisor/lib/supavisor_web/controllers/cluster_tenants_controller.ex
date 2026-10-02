defmodule SupavisorWeb.ClusterTenantsController do
  use SupavisorWeb, :controller

  alias Supavisor.Tenants
  alias Supavisor.Tenants.ClusterTenants

  action_fallback(SupavisorWeb.FallbackController)

  def index(conn, _params) do
    cluster_tenants = Tenants.list_cluster_tenants()
    render(conn, :index, cluster_tenants: cluster_tenants)
  end

  def create(conn, %{"cluster_tenants" => cluster_tenants_params}) do
    with {:ok, %ClusterTenants{} = cluster_tenants} <-
           Tenants.create_cluster_tenants(cluster_tenants_params) do
      conn
      |> put_status(:created)
      # |> put_resp_header("location", ~p"/api/cluster_tenants/#{cluster_tenants}")
      |> render(:show, cluster_tenants: cluster_tenants)
    end
  end

  def show(conn, %{"id" => id}) do
    cluster_tenants = Tenants.get_cluster_tenants!(id)
    render(conn, :show, cluster_tenants: cluster_tenants)
  end

  def update(conn, %{"id" => id, "cluster_tenants" => cluster_tenants_params}) do
    cluster_tenants = Tenants.get_cluster_tenants!(id)

    with {:ok, %ClusterTenants{} = cluster_tenants} <-
           Tenants.update_cluster_tenants(cluster_tenants, cluster_tenants_params) do
      render(conn, :show, cluster_tenants: cluster_tenants)
    end
  end

  def delete(conn, %{"id" => id}) do
    cluster_tenants = Tenants.get_cluster_tenants!(id)

    with {:ok, %ClusterTenants{}} <- Tenants.delete_cluster_tenants(cluster_tenants) do
      send_resp(conn, :no_content, "")
    end
  end
end
