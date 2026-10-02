defmodule Realtime.Integration.RegionAwareMigrationsTest do
  use Realtime.DataCase, async: false
  use Mimic

  setup :set_mimic_from_context

  alias Realtime.Tenants
  alias Realtime.Tenants.Migrations

  setup do
    {:ok, port} = TestTenantDb.checkout()

    settings = [
      %{
        "type" => "postgres_cdc_rls",
        "settings" => %{
          "db_host" => "127.0.0.1",
          "db_name" => "postgres",
          "db_user" => "supabase_admin",
          "db_password" => "postgres",
          "db_port" => "#{port}",
          "poll_interval" => 100,
          "poll_max_changes" => 100,
          "poll_max_record_bytes" => 1_048_576,
          "region" => "ap-southeast-2",
          "publication" => "supabase_realtime_test",
          "ssl_enforced" => false
        }
      }
    ]

    tenant = tenant_fixture(%{extensions: settings})
    region = Application.get_env(:realtime, :region)
    tenant_region = Tenants.region(tenant)

    {:ok, node} =
      Clustered.start(nil,
        extra_config: [
          {:realtime, :region, tenant_region},
          {:realtime, :master_region, region}
        ]
      )

    # The peer registers itself in the syn `RegionNodes` group asynchronously after
    # connecting; wait for that
    assert_eventually Realtime.Nodes.region_nodes(tenant_region) != []

    %{tenant: tenant, node: node}
  end

  test "run_migrations routes to node in tenant's region with expected arguments", %{tenant: tenant, node: node} do
    assert tenant.migrations_ran == 0

    Realtime.GenRpc
    |> Mimic.expect(:call, fn
      called_node, Realtime.Nodes, func, args, opts ->
        call_original(Realtime.GenRpc, :call, [called_node, Realtime.Nodes, func, args, opts])

      called_node, Migrations, func, args, opts ->
        assert called_node == node
        assert func == :start_migration
        assert opts[:tenant_id] == tenant.external_id

        arg = hd(args)
        assert arg.tenant_external_id == tenant.external_id
        assert arg.migrations_ran == tenant.migrations_ran
        assert arg.settings == hd(tenant.extensions).settings

        assert opts[:timeout] == 50_000

        call_original(Realtime.GenRpc, :call, [node, Migrations, func, args, opts])
    end)

    assert :ok = Migrations.run_migrations(tenant)

    # Migration runs over gen_rpc on the peer node
    assert_eventually Realtime.Repo.reload!(tenant).migrations_ran != 0
  end
end
