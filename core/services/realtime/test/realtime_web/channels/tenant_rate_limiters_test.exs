defmodule RealtimeWeb.TenantRateLimitersTest do
  use Realtime.DataCase, async: true

  use Mimic

  setup :set_mimic_from_context

  alias RealtimeWeb.TenantRateLimiters
  alias Realtime.Api.Tenant

  setup do
    tenant = %Tenant{external_id: random_string(), max_concurrent_users: 1, max_joins_per_second: 1}

    %{tenant: tenant}
  end

  describe "check_tenant/1" do
    test "rate is not exceeded", %{tenant: tenant} do
      assert TenantRateLimiters.check_tenant(tenant) == :ok
    end

    test "max concurrent users is exceeded", %{tenant: tenant} do
      Realtime.UsersCounter.add(self(), tenant.external_id)

      assert TenantRateLimiters.check_tenant(tenant) == {:error, :too_many_connections}
    end

    test "max joins is exceeded", %{tenant: tenant} do
      expect(Realtime.RateCounter, :get, fn _ -> {:ok, %{limit: %{triggered: true}}} end)

      assert TenantRateLimiters.check_tenant(tenant) == {:error, :too_many_joins}
    end
  end
end
