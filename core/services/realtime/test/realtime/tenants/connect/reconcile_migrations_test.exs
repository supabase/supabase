defmodule Realtime.Tenants.Connect.ReconcileMigrationsTest do
  use Realtime.DataCase, async: true

  alias Realtime.Api
  alias Realtime.Tenants.Connect.ReconcileMigrations
  alias Realtime.Tenants.Migrations

  setup do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    %{tenant: tenant}
  end

  describe "run/1" do
    test "does nothing when migrations_ran matches database count", %{tenant: tenant} do
      acc = %{tenant: tenant, migrations_ran_on_database: tenant.migrations_ran}

      assert {:ok, %{tenant: returned_tenant}} = ReconcileMigrations.run(acc)
      assert returned_tenant.migrations_ran == tenant.migrations_ran
    end

    test "updates tenant when database has fewer migrations than cached count", %{tenant: tenant} do
      stale_count = tenant.migrations_ran - 5
      acc = %{tenant: tenant, migrations_ran_on_database: stale_count}

      assert {:ok, %{tenant: updated_tenant}} = ReconcileMigrations.run(acc)
      assert updated_tenant.migrations_ran == stale_count
    end

    test "updates tenant when database has more migrations than cached count", %{tenant: tenant} do
      {:ok, tenant} =
        Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{migrations_ran: 0})

      total = Enum.count(Migrations.migrations())
      acc = %{tenant: tenant, migrations_ran_on_database: total}

      assert {:ok, %{tenant: updated_tenant}} = ReconcileMigrations.run(acc)
      assert updated_tenant.migrations_ran == total
    end

    test "returns :tenant_not_found when tenant has been removed", %{tenant: tenant} do
      assert Api.delete_tenant_by_external_id(tenant.external_id)
      acc = %{tenant: tenant, migrations_ran_on_database: 11}
      assert {:error, :tenant_not_found} = ReconcileMigrations.run(acc)
    end
  end
end
