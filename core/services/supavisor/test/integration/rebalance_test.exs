defmodule Supavisor.Integration.RebalanceTest do
  use SupavisorWeb.ConnCase, async: false

  require Supavisor

  import Supavisor.Asserts

  alias Ecto.Adapters.SQL.Sandbox
  alias Postgrex, as: P
  alias Supavisor.Support.Cluster
  alias Supavisor.Tenants

  @moduletag cluster: true

  @tenants for i <- 1..10, do: "rebalance_tenant_#{i}"
  @peer_name :rebalance_peer
  @peer_node :"rebalance_peer@127.0.0.1"
  # The only node in this zone is the peer, see `Supavisor.Support.Cluster`
  @peer_zone "ap-southeast-1c"

  setup do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)

    for tenant <- @tenants, sup = Supavisor.get_global_sup(id(tenant, db_conf)) do
      Supervisor.stop(sup)
    end

    # Hashing alone places this tenant on this node, so only its availability
    # zone sends it to the peer
    zoned_tenant =
      Enum.find(@tenants, &(:erlang.phash2(&1, 2) == index_of(node())))

    # Outside the sandbox, so that the peer sees the tenants
    Sandbox.unboxed_run(Supavisor.Repo, fn ->
      for tenant <- @tenants do
        Tenants.delete_tenant_by_external_id(tenant)

        availability_zone = if tenant == zoned_tenant, do: @peer_zone
        {:ok, _} = create_tenant(tenant, db_conf, availability_zone)
      end
    end)

    on_exit(fn ->
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        for tenant <- @tenants, do: Tenants.delete_tenant_by_external_id(tenant)
      end)
    end)

    proxies = Map.new(@tenants, &{&1, start_proxy(&1, db_conf)})

    for {tenant, proxy} <- proxies do
      assert %P.Result{rows: [[1]]} = P.query!(proxy, "SELECT 1", [])
      assert node(Supavisor.get_global_sup(id(tenant, db_conf))) == node()
    end

    sups = Map.new(@tenants, &{&1, Supavisor.get_global_sup(id(&1, db_conf))})

    {:ok, _peer, @peer_node} = Cluster.start_node(@peer_name)
    true = Node.connect(@peer_node)

    assert_eventually(10, 500, fn ->
      @peer_node in Supavisor.accepting_nodes() and
        Supavisor.determine_node(id(zoned_tenant, db_conf), @peer_zone) == @peer_node
    end)

    moved =
      Enum.filter(@tenants, fn tenant ->
        tenant == zoned_tenant or :erlang.phash2(tenant, 2) == index_of(@peer_node)
      end)

    assert zoned_tenant in moved
    assert length(moved) < length(@tenants)

    %{
      db_conf: db_conf,
      proxies: proxies,
      sups: sups,
      moved: moved,
      zoned_tenant: zoned_tenant
    }
  end

  test "dry run lists the pools to move without moving them", %{
    conn: conn,
    db_conf: db_conf,
    sups: sups,
    moved: moved
  } do
    response =
      conn
      |> put_req_header("authorization", "Bearer " <> gen_token())
      |> put_req_header("content-type", "application/json")
      |> post(~p"/api/rebalance", Jason.encode!(%{dry_run: true}))
      |> json_response(200)
      |> assert_schema("Rebalance")

    assert response.errors == %{}

    moves =
      for move <- response.moves, move.tenant in @tenants, do: Map.from_struct(move)

    assert Enum.sort_by(moves, & &1.tenant) ==
             for(
               tenant <- Enum.sort(moved),
               do: %{
                 tenant: tenant,
                 user: db_conf[:username],
                 mode: "transaction",
                 database: db_conf[:database],
                 from_node: to_string(node()),
                 to_node: to_string(@peer_node)
               }
             )

    for tenant <- @tenants do
      assert Supavisor.get_global_sup(id(tenant, db_conf)) == sups[tenant]
    end
  end

  @tag timeout: 180_000
  test "moves pools to the node they would be started on now", %{
    db_conf: db_conf,
    proxies: proxies,
    sups: sups,
    moved: moved
  } do
    result = Supavisor.rebalance()

    assert {:ok, []} = result[@peer_node]
    assert {:ok, moves} = result[node()]

    assert moves
           |> Enum.filter(fn {id, _} -> Supavisor.id(id, :tenant) in @tenants end)
           |> Enum.sort() ==
             Enum.sort(for tenant <- moved, do: {id(tenant, db_conf), @peer_node})

    for tenant <- moved do
      assert_eventually(20, 500, fn ->
        match?({:ok, %P.Result{}}, P.query(proxies[tenant], "SELECT 1", [], timeout: 1000)) and
          node(Supavisor.get_global_sup(id(tenant, db_conf))) == @peer_node
      end)
    end

    for tenant <- @tenants -- moved do
      assert %P.Result{rows: [[1]]} = P.query!(proxies[tenant], "SELECT 1", [])
      assert Supavisor.get_global_sup(id(tenant, db_conf)) == sups[tenant]
    end
  end

  test "places cluster pools on the node they would be moved to", %{
    db_conf: db_conf,
    zoned_tenant: zoned_tenant
  } do
    # Hashing alone places this cluster on this node, while its only replica is
    # in the peer's zone
    cluster_alias =
      1..100
      |> Enum.map(&"rebalance_cluster_#{&1}")
      |> Enum.find(&(:erlang.phash2(&1, 2) == index_of(node())))

    {:ok, cluster} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        Tenants.create_cluster(%{
          active: true,
          alias: cluster_alias,
          cluster_tenants: [
            %{
              type: "write",
              cluster_alias: cluster_alias,
              tenant_external_id: zoned_tenant,
              active: true
            }
          ]
        })
      end)

    id =
      Supavisor.id(
        type: :cluster,
        tenant: cluster_alias,
        user: db_conf[:username],
        mode: :transaction,
        db: db_conf[:database]
      )

    on_exit(fn ->
      {:ok, _} = Sandbox.unboxed_run(Supavisor.Repo, fn -> Tenants.delete_cluster(cluster) end)
      Supavisor.del_all_cache(cluster_alias)

      # A pool on the peer is gone with it
      with sup when is_pid(sup) and node(sup) == node() <- Supavisor.get_global_sup(id) do
        Supervisor.stop(sup)
      end
    end)

    proxy =
      start_proxy(cluster_alias, db_conf, db_conf[:username] <> ".cluster." <> cluster_alias)

    query_result = P.query(proxy, "SELECT 1", [])
    assert node(Supavisor.get_global_sup(id)) == node()
    assert {:ok, %P.Result{rows: [[1]]}} = query_result

    result = Supavisor.rebalance(dry_run: true)

    for node <- [node(), @peer_node] do
      assert {:ok, moves} = result[node]
      refute List.keymember?(moves, id, 0)
    end
  end

  defp index_of(node), do: [node(), @peer_node] |> Enum.sort() |> Enum.find_index(&(&1 == node))

  # No default parameter status, so that the pools never update the tenant
  defp create_tenant(tenant, db_conf, availability_zone) do
    Tenants.create_tenant(%{
      db_host: to_string(db_conf[:hostname]),
      db_port: db_conf[:port],
      db_database: db_conf[:database],
      default_parameter_status: %{},
      external_id: tenant,
      require_user: true,
      availability_zone: availability_zone,
      users: [
        %{
          "db_user" => db_conf[:username],
          "db_password" => db_conf[:password],
          "pool_size" => 5,
          "mode_type" => "transaction"
        }
      ]
    })
  end

  defp start_proxy(tenant, db_conf, username \\ nil) do
    {:ok, proxy} =
      start_supervised(
        {P,
         hostname: db_conf[:hostname],
         port: Application.get_env(:supavisor, :proxy_port_transaction),
         database: db_conf[:database],
         password: db_conf[:password],
         username: username || db_conf[:username] <> "." <> tenant,
         backoff_min: 100,
         backoff_max: 500},
        id: {:proxy, tenant}
      )

    proxy
  end

  defp id(tenant, db_conf) do
    Supavisor.id(
      type: :single,
      tenant: tenant,
      user: db_conf[:username],
      mode: :transaction,
      db: db_conf[:database]
    )
  end

  defp gen_token do
    Supavisor.Jwt.Token.gen!(Application.fetch_env!(:supavisor, :api_jwt_secret))
  end
end
