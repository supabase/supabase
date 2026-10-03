defmodule Realtime.FeatureFlagsTest do
  use Realtime.DataCase, async: false
  use Mimic

  setup :set_mimic_from_context

  alias Realtime.Api
  alias Realtime.Api.FeatureFlag
  alias Realtime.FeatureFlags
  alias Realtime.FeatureFlags.Cache
  alias Realtime.Repo
  alias Realtime.Tenants.Cache, as: TenantsCache

  setup do
    Cachex.clear(Cache)
    Cachex.clear(TenantsCache)
    :ok
  end

  describe "Cache.get_flag/1" do
    test "returns nil when the cache/database lookup errors instead of leaking the error" do
      stub(Cachex, :fetch, fn _cache, _key, _fallback -> {:error, :boom} end)
      assert Cache.get_flag("any_flag") == nil
    end

    test "returns the flag when it exists" do
      {:ok, flag} = Api.upsert_feature_flag(%{name: "present_flag", enabled: true})
      assert %FeatureFlag{name: "present_flag", enabled: true} = Cache.get_flag("present_flag")
      assert Cache.get_flag("present_flag").id == flag.id
    end

    test "caches a miss so the flag is not re-read from the database" do
      # First lookup misses and caches the "not found" sentinel.
      assert Cache.get_flag("ghost_flag") == nil

      # The sentinel is what's actually stored: Cachex holds :not_found (not nil,
      # which it would treat as absent and re-fetch). The key mirrors cache_key/1.
      assert {:ok, :not_found} = Cachex.get(Cache, {:get_flag, "ghost_flag"})

      # Insert directly, bypassing upsert_feature_flag/1's global_update_cache broadcast,
      # so the only way to observe the new row is a fresh database read.
      %FeatureFlag{}
      |> FeatureFlag.changeset(%{name: "ghost_flag", enabled: true})
      |> Repo.insert!()

      # Still nil: the negative result was cached, so no fresh read happens. A plain
      # `nil` sentinel would fail here, since Cachex re-runs the fallback for `nil`.
      assert Cache.get_flag("ghost_flag") == nil
    end
  end

  describe "Cache.update_cache/1" do
    test "overwrites a cached miss (as global_update_cache/1 does on create)" do
      # Cache the "not found" sentinel first.
      assert Cache.get_flag("late_flag") == nil

      # update_cache/1 is what global_update_cache/1 invokes on every node.
      Cache.update_cache(%FeatureFlag{name: "late_flag", enabled: true})

      assert %FeatureFlag{name: "late_flag", enabled: true} = Cache.get_flag("late_flag")
      assert FeatureFlags.enabled?("late_flag")
    end
  end

  describe "Cache.invalidate_cache/1" do
    test "drops a cached flag so the next lookup reads the database again" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "drop_flag", enabled: true})
      assert %FeatureFlag{name: "drop_flag"} = Cache.get_flag("drop_flag")

      Repo.delete_all(from(f in FeatureFlag, where: f.name == "drop_flag"))
      # Still served from cache until invalidated.
      assert %FeatureFlag{name: "drop_flag"} = Cache.get_flag("drop_flag")

      Cache.invalidate_cache("drop_flag")
      assert Cache.get_flag("drop_flag") == nil
    end
  end

  describe "enabled?/1" do
    test "returns false when flag does not exist" do
      refute FeatureFlags.enabled?("missing_flag")
    end

    test "returns false when lookup errors" do
      stub(Cachex, :fetch, fn _cache, _key, _fallback -> {:error, :boom} end)
      refute FeatureFlags.enabled?("any_flag")
    end

    test "returns false when flag is disabled" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "off_flag", enabled: false})
      refute FeatureFlags.enabled?("off_flag")
    end

    test "returns true when flag is enabled" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "on_flag", enabled: true})
      assert FeatureFlags.enabled?("on_flag")
    end
  end

  describe "enabled?/2" do
    test "returns false when flag does not exist" do
      refute FeatureFlags.enabled?("missing_flag", "tenant_1")
    end

    test "returns false when flag is disabled and tenant has no entry (follows global)" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "off_flag", enabled: false})
      tenant = tenant_fixture(%{feature_flags: %{}})
      refute FeatureFlags.enabled?("off_flag", tenant.external_id)
    end

    test "returns true when flag is disabled globally but tenant has it explicitly enabled" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "tenant_override_flag", enabled: false})
      tenant = tenant_fixture(%{feature_flags: %{"tenant_override_flag" => true}})
      assert FeatureFlags.enabled?("tenant_override_flag", tenant.external_id)
    end

    test "returns global value when flag is enabled but tenant does not exist" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "enabled_flag", enabled: true})
      assert FeatureFlags.enabled?("enabled_flag", "nonexistent_tenant")
    end

    test "returns true when flag is enabled and tenant has no entry (follows global)" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "partial_flag", enabled: true})
      tenant = tenant_fixture(%{feature_flags: %{}})
      assert FeatureFlags.enabled?("partial_flag", tenant.external_id)
    end

    test "returns true when flag is enabled and tenant has it explicitly enabled" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "tenant_flag", enabled: true})
      tenant = tenant_fixture(%{feature_flags: %{"tenant_flag" => true}})
      assert FeatureFlags.enabled?("tenant_flag", tenant.external_id)
    end

    test "returns false when flag is enabled but tenant has it explicitly disabled" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "disabled_for_tenant", enabled: true})
      tenant = tenant_fixture(%{feature_flags: %{"disabled_for_tenant" => false}})
      refute FeatureFlags.enabled?("disabled_for_tenant", tenant.external_id)
    end
  end

  describe "enabled?/2 percentage rollout" do
    # precomputed :erlang.phash2({external_id, bucket_key}, 100) buckets for these fixed ids,
    # where bucket_key defaults to the flag's own name:
    # {"t_6", "rollout_flag"} -> 3, {"t_7", "rollout_flag"} -> 85, {"t_11", "monotonic_flag"} -> 2
    test "tenant within the rollout percentage is enabled, tenant outside it is not" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "rollout_flag", enabled: true, rollout_percentage: 10})

      in_bucket = tenant_fixture(%{external_id: "t_6", feature_flags: %{}})
      out_of_bucket = tenant_fixture(%{external_id: "t_7", feature_flags: %{}})

      assert FeatureFlags.enabled?("rollout_flag", in_bucket.external_id)
      refute FeatureFlags.enabled?("rollout_flag", out_of_bucket.external_id)
    end

    test "raising the rollout percentage never disables a tenant already included (monotonic)" do
      {:ok, flag} = Api.upsert_feature_flag(%{name: "monotonic_flag", enabled: true, rollout_percentage: 10})
      tenant = tenant_fixture(%{external_id: "t_11", feature_flags: %{}})

      assert FeatureFlags.enabled?("monotonic_flag", tenant.external_id)

      for percentage <- [15, 25, 50, 100] do
        {:ok, _} = Api.upsert_feature_flag(%{name: flag.name, enabled: true, rollout_percentage: percentage})
        assert FeatureFlags.enabled?("monotonic_flag", tenant.external_id)
      end
    end

    test "0% rollout keeps everyone disabled regardless of bucket" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "zero_percent_flag", enabled: true, rollout_percentage: 0})
      tenant = tenant_fixture(%{feature_flags: %{}})
      refute FeatureFlags.enabled?("zero_percent_flag", tenant.external_id)
    end

    test "100% rollout enables everyone regardless of bucket" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "hundred_percent_flag", enabled: true, rollout_percentage: 100})
      tenant = tenant_fixture(%{feature_flags: %{}})
      assert FeatureFlags.enabled?("hundred_percent_flag", tenant.external_id)
    end

    test "disabled flag stays disabled even for tenants inside the rollout bucket" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "off_with_rollout", enabled: false, rollout_percentage: 100})
      tenant = tenant_fixture(%{feature_flags: %{}})
      refute FeatureFlags.enabled?("off_with_rollout", tenant.external_id)
    end

    test "explicit tenant override wins over the rollout percentage in both directions" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "override_flag", enabled: true, rollout_percentage: 0})

      forced_on = tenant_fixture(%{feature_flags: %{"override_flag" => true}})
      assert FeatureFlags.enabled?("override_flag", forced_on.external_id)

      {:ok, _} = Api.upsert_feature_flag(%{name: "override_flag_2", enabled: true, rollout_percentage: 100})
      forced_off = tenant_fixture(%{feature_flags: %{"override_flag_2" => false}})
      refute FeatureFlags.enabled?("override_flag_2", forced_off.external_id)
    end
  end

  describe "enabled?/2 bucket_key" do
    # precomputed :erlang.phash2({external_id, bucket_key}, 100) for "t_1":
    # {"t_1", "indep_flag_a"} -> 4, {"t_1", "indep_flag_b"} -> 59
    test "flags default to independent (decorrelated) cohorts based on their own name" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "indep_flag_a", enabled: true, rollout_percentage: 10})
      {:ok, _} = Api.upsert_feature_flag(%{name: "indep_flag_b", enabled: true, rollout_percentage: 10})
      tenant = tenant_fixture(%{external_id: "t_1", feature_flags: %{}})

      assert FeatureFlags.enabled?("indep_flag_a", tenant.external_id)
      refute FeatureFlags.enabled?("indep_flag_b", tenant.external_id)
    end

    test "flags sharing an explicit bucket_key always agree on cohort membership" do
      {:ok, _} =
        Api.upsert_feature_flag(%{
          name: "shared_flag_a",
          enabled: true,
          rollout_percentage: 50,
          bucket_key: "shared_cohort"
        })

      {:ok, _} =
        Api.upsert_feature_flag(%{
          name: "shared_flag_b",
          enabled: true,
          rollout_percentage: 50,
          bucket_key: "shared_cohort"
        })

      for i <- 1..10 do
        tenant = tenant_fixture(%{external_id: "shared_cohort_tenant_#{i}", feature_flags: %{}})
        a_enabled = FeatureFlags.enabled?("shared_flag_a", tenant.external_id)
        b_enabled = FeatureFlags.enabled?("shared_flag_b", tenant.external_id)
        assert a_enabled == b_enabled
      end
    end
  end

  describe "set_tenant_flag/3" do
    test "writes an explicit override into the tenant's feature_flags map" do
      tenant = tenant_fixture(%{feature_flags: %{}})

      assert {:ok, updated} = FeatureFlags.set_tenant_flag("some_flag", tenant.external_id, true)
      assert updated.feature_flags == %{"some_flag" => true}
    end

    test "returns {:error, :not_found} for an unknown tenant" do
      assert {:error, :not_found} = FeatureFlags.set_tenant_flag("some_flag", "nonexistent_tenant", true)
    end
  end

  describe "clear_tenant_flag/2" do
    test "removes the override so the tenant falls back to global resolution" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "clearable_flag", enabled: true, rollout_percentage: 100})
      tenant = tenant_fixture(%{feature_flags: %{"clearable_flag" => false}})

      # Override forces it off despite the global 100% rollout.
      refute FeatureFlags.enabled?("clearable_flag", tenant.external_id)

      assert {:ok, updated} = FeatureFlags.clear_tenant_flag("clearable_flag", tenant.external_id)
      refute Map.has_key?(updated.feature_flags, "clearable_flag")

      # The tenant cache is refreshed via an async multicast; clear it so enabled?/2
      # reads the updated row instead of the pre-clear override.
      Cachex.clear(TenantsCache)

      # With the override gone, the tenant inherits the global rollout again.
      assert FeatureFlags.enabled?("clearable_flag", tenant.external_id)
    end

    test "leaves other overrides untouched" do
      tenant = tenant_fixture(%{feature_flags: %{"a" => true, "b" => false}})

      assert {:ok, updated} = FeatureFlags.clear_tenant_flag("a", tenant.external_id)
      assert updated.feature_flags == %{"b" => false}
    end

    test "is a no-op when there is no override" do
      tenant = tenant_fixture(%{feature_flags: %{}})

      assert {:ok, updated} = FeatureFlags.clear_tenant_flag("missing", tenant.external_id)
      assert updated.feature_flags == %{}
    end

    test "returns {:error, :not_found} for an unknown tenant" do
      assert {:error, :not_found} = FeatureFlags.clear_tenant_flag("some_flag", "nonexistent_tenant")
    end
  end

  describe "enabled?/1 ignores rollout percentage" do
    test "returns true for an enabled flag even with a 0% rollout percentage" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "global_ignores_rollout", enabled: true, rollout_percentage: 0})
      assert FeatureFlags.enabled?("global_ignores_rollout")
    end
  end
end
