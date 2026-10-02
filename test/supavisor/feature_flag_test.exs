defmodule Supavisor.FeatureFlagTest do
  use Supavisor.DataCase

  alias Supavisor.FeatureFlag
  alias Supavisor.Tenants

  import Supavisor.TenantsFixtures

  describe "enabled?/2" do
    test "returns true when flag is true in tenant feature_flags" do
      tenant = tenant_fixture(%{feature_flags: %{"debug_mode" => true}})
      assert FeatureFlag.enabled?(tenant, "debug_mode") == true
    end

    test "returns false when flag is false in tenant feature_flags" do
      tenant = tenant_fixture(%{feature_flags: %{"debug_mode" => false}})
      assert FeatureFlag.enabled?(tenant, "debug_mode") == false
    end

    test "returns false when flag is not found anywhere" do
      tenant = tenant_fixture(%{feature_flags: %{}})
      assert FeatureFlag.enabled?(tenant, "unknown_flag") == false
    end

    test "falls back to application config when flag not in tenant" do
      tenant = tenant_fixture(%{feature_flags: %{}})

      # Uses config from test.exs
      assert FeatureFlag.enabled?(tenant, "test_global_flag") == true
      assert FeatureFlag.enabled?(tenant, "test_disabled_flag") == false
    end

    test "tenant flag takes precedence over application config" do
      # override_test is true in config, but tenant sets it to false
      tenant = tenant_fixture(%{feature_flags: %{"override_test" => false}})
      assert FeatureFlag.enabled?(tenant, "override_test") == false
    end

    test "returns false for non-boolean values in tenant feature_flags" do
      tenant = tenant_fixture(%{feature_flags: %{"invalid_flag" => "not_boolean"}})
      assert FeatureFlag.enabled?(tenant, "invalid_flag") == false
    end

    test "can update tenant feature flags" do
      tenant = tenant_fixture(%{feature_flags: %{"updateable_flag" => false}})
      assert FeatureFlag.enabled?(tenant, "updateable_flag") == false

      # Update the tenant's feature flags
      {:ok, updated_tenant} =
        Tenants.update_tenant(tenant, %{feature_flags: %{"updateable_flag" => true}})

      assert FeatureFlag.enabled?(updated_tenant, "updateable_flag") == true
    end
  end
end
