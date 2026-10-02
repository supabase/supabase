defmodule Realtime.Tenants.Connect.RegisterProcessTest do
  use Realtime.DataCase, async: true
  alias Realtime.Tenants.Connect.RegisterProcess
  alias Realtime.Database

  describe "run/1" do
    setup do
      tenant = TestTenantDb.checkout_tenant(run_migrations: true)
      # Warm cache to avoid Cachex and Ecto.Sandbox ownership issues
      Realtime.Tenants.Cache.update_cache(tenant)
      {:ok, conn} = Database.connect(tenant, "realtime_test")
      %{tenant_id: tenant.external_id, db_conn_pid: conn}
    end

    test "registers the process in syn and Registry and updates metadata", %{tenant_id: tenant_id, db_conn_pid: conn} do
      # Fake the process registration in :syn
      :syn.register(Realtime.Tenants.Connect, tenant_id, self(), %{conn: nil})
      assert {:ok, _} = RegisterProcess.run(%{tenant_id: tenant_id, db_conn_pid: conn})
      assert {pid, %{conn: ^conn}} = :syn.lookup(Realtime.Tenants.Connect, tenant_id)
      assert [{^pid, %{}}] = Registry.lookup(Realtime.Tenants.Connect.Registry, tenant_id)
    end

    test "fails to register the process in syn and Registry and updates metadata", %{
      tenant_id: tenant_id,
      db_conn_pid: conn
    } do
      # Fake the process registration in :syn
      :syn.register(Realtime.Tenants.Connect, tenant_id, self(), %{conn: nil})

      # Register normally
      assert {:ok, _} = RegisterProcess.run(%{tenant_id: tenant_id, db_conn_pid: conn})
      assert {pid, %{conn: ^conn}} = :syn.lookup(Realtime.Tenants.Connect, tenant_id)
      assert [{^pid, %{}}] = Registry.lookup(Realtime.Tenants.Connect.Registry, tenant_id)

      # Check failure
      assert {:error, :already_registered} = RegisterProcess.run(%{tenant_id: tenant_id, db_conn_pid: conn})
    end

    test "handles undefined process error" do
      assert {:error, :process_not_found} =
               RegisterProcess.run(%{tenant_id: Generators.random_string(), db_conn_pid: nil})
    end
  end
end
