defmodule Realtime.Integration.RegionAwareRoutingTest do
  use Realtime.DataCase, async: false
  use Mimic

  setup :set_mimic_from_context

  import Ecto.Query

  alias Realtime.Api
  alias Realtime.Api.FeatureFlag
  alias Realtime.Api.Tenant
  alias Realtime.GenRpc
  alias Realtime.Nodes

  setup do
    original_master_region = Application.get_env(:realtime, :master_region)

    on_exit(fn ->
      Application.put_env(:realtime, :master_region, original_master_region)
    end)

    Application.put_env(:realtime, :master_region, "eu-west-2")

    {:ok, master_node} =
      Clustered.start(nil,
        extra_config: [
          {:realtime, :region, "eu-west-2"},
          {:realtime, :master_region, "eu-west-2"}
        ]
      )

    # This node is the one doing the routing, so it is this node's view of the master region that
    # has to have caught up. The peer joins the syn `RegionNodes` group asynchronously.
    assert_eventually Nodes.region_nodes("eu-west-2") == [master_node], timeout: 5_000, interval: 25

    %{master_node: master_node}
  end

  # Installs a global stub on GenRpc.call/5 that forwards Realtime.Api routing
  # calls to the test process and passes everything else through to the real
  # implementation. Using a stub instead of a bounded Mimic.expect keeps these
  # tests from being tripped by unrelated background GenRpc.call/5 traffic (e.g.
  # Realtime.Latency node pings), which otherwise races with the expectations.
  defp record_api_routing do
    test_pid = self()

    Mimic.stub(GenRpc, :call, fn node, mod, func, args, opts ->
      if mod == Realtime.Api, do: send(test_pid, {:api_call, node, func, opts})
      call_original(GenRpc, :call, [node, mod, func, args, opts])
    end)
  end

  test "create_tenant automatically routes to master region", %{master_node: master_node} do
    external_id = "test_routing_#{System.unique_integer([:positive])}"

    attrs = %{
      "external_id" => external_id,
      "name" => external_id,
      "jwt_secret" => "secret",
      "public_key" => "public",
      "extensions" => [],
      "postgres_cdc_default" => "postgres_cdc_rls",
      "max_concurrent_users" => 200,
      "max_events_per_second" => 100
    }

    record_api_routing()

    result = Api.create_tenant(attrs)

    assert {:ok, %Tenant{} = tenant} = result
    assert tenant.external_id == external_id

    assert_receive {:api_call, ^master_node, :create_tenant, opts}
    assert opts[:tenant_id] == external_id

    assert Realtime.Repo.get_by(Tenant, external_id: external_id)
  end

  test "update_tenant automatically routes to master region", %{master_node: master_node} do
    # Create tenant on master node first
    tenant_attrs = %{
      "external_id" => "test_update_#{System.unique_integer([:positive])}",
      "name" => "original",
      "jwt_secret" => "secret",
      "public_key" => "public",
      "extensions" => [],
      "postgres_cdc_default" => "postgres_cdc_rls",
      "max_concurrent_users" => 200,
      "max_events_per_second" => 100
    }

    record_api_routing()

    tenant = tenant_fixture(tenant_attrs)

    new_name = "updated_via_routing"
    result = Api.update_tenant_by_external_id(tenant.external_id, %{name: new_name})

    assert {:ok, %Tenant{} = updated} = result
    assert updated.name == new_name

    assert_receive {:api_call, ^master_node, :create_tenant, create_opts}
    assert create_opts[:tenant_id] == tenant_attrs["external_id"]
    assert_receive {:api_call, ^master_node, :update_tenant_by_external_id, update_opts}
    assert update_opts[:tenant_id] == tenant_attrs["external_id"]

    reloaded = Realtime.Repo.get(Tenant, tenant.id)
    assert reloaded.name == new_name
  end

  test "delete_tenant_by_external_id automatically routes to master region", %{master_node: master_node} do
    # Create tenant on master node first
    tenant_attrs = %{
      "external_id" => "test_delete_#{System.unique_integer([:positive])}",
      "name" => "to_delete",
      "jwt_secret" => "secret",
      "public_key" => "public",
      "extensions" => [],
      "postgres_cdc_default" => "postgres_cdc_rls",
      "max_concurrent_users" => 200,
      "max_events_per_second" => 100
    }

    record_api_routing()

    tenant = tenant_fixture(tenant_attrs)

    result = Api.delete_tenant_by_external_id(tenant.external_id)

    assert result == true

    assert_receive {:api_call, ^master_node, :create_tenant, create_opts}
    assert create_opts[:tenant_id] == tenant_attrs["external_id"]
    assert_receive {:api_call, ^master_node, :delete_tenant_by_external_id, delete_opts}
    assert delete_opts[:tenant_id] == tenant_attrs["external_id"]

    refute Realtime.Repo.get(Tenant, tenant.id)
  end

  test "update_migrations_ran automatically routes to master region", %{master_node: master_node} do
    # Create tenant on master node first
    tenant_attrs = %{
      "external_id" => "test_migrations_#{System.unique_integer([:positive])}",
      "name" => "migrations_test",
      "jwt_secret" => "secret",
      "public_key" => "public",
      "extensions" => [],
      "postgres_cdc_default" => "postgres_cdc_rls",
      "max_concurrent_users" => 200,
      "max_events_per_second" => 100,
      "migrations_ran" => 0
    }

    record_api_routing()

    tenant = tenant_fixture(tenant_attrs)

    new_migrations_ran = 5
    result = Api.update_migrations_ran(tenant.external_id, new_migrations_ran)

    assert {:ok, updated} = result
    assert updated.migrations_ran == new_migrations_ran

    assert_receive {:api_call, ^master_node, :create_tenant, create_opts}
    assert create_opts[:tenant_id] == tenant_attrs["external_id"]
    assert_receive {:api_call, ^master_node, :update_migrations_ran, update_opts}
    assert update_opts[:tenant_id] == tenant_attrs["external_id"]

    reloaded = Realtime.Repo.get(Tenant, tenant.id)
    assert reloaded.migrations_ran == new_migrations_ran
  end

  test "returns error when Nodes.node_from_region returns {:error, :not_available}" do
    external_id = "test_error_node_unavailable_#{System.unique_integer([:positive])}"

    attrs = %{
      "external_id" => external_id,
      "name" => external_id,
      "jwt_secret" => "secret",
      "public_key" => "public",
      "extensions" => [],
      "postgres_cdc_default" => "postgres_cdc_rls",
      "max_concurrent_users" => 200,
      "max_events_per_second" => 100
    }

    Mimic.stub(Nodes, :node_from_region, fn _region, _key -> {:error, :not_available} end)
    result = Api.create_tenant(attrs)
    assert {:error, :not_available} = result
  end

  test "returns error when GenRpc.call returns {:error, :rpc_error, reason}" do
    external_id = "test_error_rpc_error_#{System.unique_integer([:positive])}"
    rpc_error_reason = :timeout

    attrs = %{
      "external_id" => external_id,
      "name" => external_id,
      "jwt_secret" => "secret",
      "public_key" => "public",
      "extensions" => [],
      "postgres_cdc_default" => "postgres_cdc_rls",
      "max_concurrent_users" => 200,
      "max_events_per_second" => 100
    }

    Mimic.stub(GenRpc, :call, fn node, mod, func, args, opts ->
      if mod == Realtime.Api do
        {:error, :rpc_error, rpc_error_reason}
      else
        call_original(GenRpc, :call, [node, mod, func, args, opts])
      end
    end)

    result = Api.create_tenant(attrs)
    assert {:error, ^rpc_error_reason} = result
  end

  test "upsert_feature_flag automatically routes to master region", %{master_node: master_node} do
    flag_name = "test_routing_flag_#{System.unique_integer([:positive])}"
    on_exit(fn -> Realtime.Repo.delete_all(from f in FeatureFlag, where: f.name == ^flag_name) end)

    record_api_routing()

    assert {:ok, %FeatureFlag{name: ^flag_name, enabled: true}} =
             Api.upsert_feature_flag(%{name: flag_name, enabled: true})

    assert_receive {:api_call, ^master_node, :upsert_feature_flag, opts}
    assert opts == []

    assert Realtime.Repo.get_by(FeatureFlag, name: flag_name)
  end

  test "upsert_feature_flag surfaces error", %{master_node: master_node} do
    # validation will fail
    flag_name = ""
    on_exit(fn -> Realtime.Repo.delete_all(from f in FeatureFlag, where: f.name == ^flag_name) end)

    record_api_routing()

    assert {:error, %Ecto.Changeset{errors: [name: {"can't be blank", [validation: :required]}]}} =
             Api.upsert_feature_flag(%{name: flag_name, enabled: true})

    assert_receive {:api_call, ^master_node, :upsert_feature_flag, opts}
    assert opts == []
  end

  test "delete_feature_flag automatically routes to master region", %{master_node: master_node} do
    flag_name = "test_routing_delete_#{System.unique_integer([:positive])}"

    record_api_routing()

    {:ok, flag} = Api.upsert_feature_flag(%{name: flag_name, enabled: true})
    assert {:ok, _} = Api.delete_feature_flag(flag)

    assert_receive {:api_call, ^master_node, :upsert_feature_flag, _upsert_opts}
    assert_receive {:api_call, ^master_node, :delete_feature_flag, delete_opts}
    assert delete_opts == []

    refute Realtime.Repo.get_by(FeatureFlag, name: flag_name)
  end
end
