defmodule Realtime.Tenants.Connect.GetTenantTest do
  use Realtime.DataCase, async: true

  alias Realtime.Tenants.Connect.GetTenant

  describe "run/1" do
    test "returns tenant when found" do
      tenant = TestTenantDb.checkout_tenant()
      assert {:ok, %{tenant: %Realtime.Api.Tenant{}}} = GetTenant.run(%{tenant_id: tenant.external_id})
    end

    test "returns error when tenant not found" do
      assert {:error, :tenant_not_found} = GetTenant.run(%{tenant_id: "nonexistent_tenant_id"})
    end
  end
end
