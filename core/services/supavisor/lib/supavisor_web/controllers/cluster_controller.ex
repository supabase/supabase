defmodule SupavisorWeb.ClusterController do
  use SupavisorWeb, :controller

  require Logger

  alias Supavisor.Repo
  alias Supavisor.Tenants
  alias Supavisor.Tenants.Cluster, as: ClusterModel

  action_fallback(SupavisorWeb.FallbackController)

  # def index(conn, _params) do
  #   clusters = Tenants.list_clusters()
  #   render(conn, :index, clusters: clusters)
  # end

  def create(conn, %{"cluster" => params}) do
    with {:ok, %ClusterModel{} = cluster} <- Tenants.create_cluster(params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", Routes.tenant_path(conn, :show, cluster))
      |> render(:show, cluster: cluster)
    end
  end

  def show(conn, %{"alias" => id}) do
    id
    |> Tenants.get_cluster_by_alias()
    |> case do
      %ClusterModel{} = cluster ->
        render(conn, "show.json", cluster: cluster)

      nil ->
        conn
        |> put_status(404)
        |> render("not_found.json", cluster: nil)
    end
  end

  def update(conn, %{"alias" => id, "cluster" => params}) do
    cluster_tenants =
      Enum.map(params["cluster_tenants"], fn e ->
        Map.put(e, "cluster_alias", id)
      end)

    params = %{params | "cluster_tenants" => cluster_tenants}

    case Tenants.get_cluster_by_alias(id) do
      nil ->
        create(conn, %{"cluster" => Map.put(params, "alias", id)})

      cluster ->
        cluster = Repo.preload(cluster, :cluster_tenants)

        with {:ok, %ClusterModel{} = cluster} <-
               Tenants.update_cluster(cluster, params) do
          result = Supavisor.terminate_global("cluster.#{cluster.alias}")
          Logger.warning("Stop #{cluster.alias}: #{inspect(result)}")
          render(conn, "show.json", cluster: cluster)
        end
    end
  end

  def delete(conn, %{"alias" => id}) do
    code = if Tenants.delete_cluster_by_alias(id), do: 204, else: 404

    send_resp(conn, code, "")
  end
end
