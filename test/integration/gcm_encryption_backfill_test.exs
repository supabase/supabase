defmodule Realtime.Integration.GcmEncryptionBackfillTest do
  @moduledoc """
  End-to-end cover for the AES-128-ECB to AES-256-GCM backfill: a tenant sitting on legacy
  ciphertext must keep authenticating and keep connecting to its database both before and after
  `Realtime.Tenants.EncryptionReconciler` rewrites its secrets in place.

  Deliberately uses the real feature flag lookup rather than stubbing it, since the flag is read
  from inside the tenant cache fallback.
  """
  use Realtime.DataCase, async: false

  alias Realtime.Api
  alias Realtime.Api.Tenant
  alias Realtime.Crypto
  alias Realtime.Database
  alias Realtime.Tenants
  alias RealtimeWeb.ChannelsAuthorization

  @flag "gcm_encryption_backfill"

  # The backfill writes from a detached task, so there is nothing to poll on when asserting that no
  # write happens: give a stray write time to land instead.
  @async_write_window 500
  @probe_interval 50

  setup do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    jwt_secret = Crypto.decrypt!(tenant.jwt_secret)

    %{tenant: rewind_to_legacy_encryption(tenant), jwt_secret: jwt_secret}
  end

  describe "backfill of a tenant on legacy ciphertext" do
    test "keeps auth and database connectivity working across the migration", %{
      tenant: tenant,
      jwt_secret: jwt_secret
    } do
      external_id = tenant.external_id
      set_flag(enabled: true)

      token = generate_jwt_token(jwt_secret)

      # Before: legacy ciphertext authenticates and connects.
      assert {:ok, _claims} = ChannelsAuthorization.authorize(token, Crypto.decrypt!(tenant.jwt_secret), nil)
      assert {:ok, _conn} = Database.connect(tenant, "realtime_backfill_before", :stop)

      read_through_cache(external_id)

      assert_eventually Api.get_tenant_by_external_id(external_id).gcm_migrated_at

      migrated = Api.get_tenant_by_external_id(external_id)

      # After: every secret is on GCM, the plaintext is unchanged, and both paths still work.
      assert Crypto.gcm?(migrated.jwt_secret)
      assert Crypto.decrypt!(migrated.jwt_secret) == jwt_secret

      for extension <- migrated.extensions do
        refute Crypto.legacy_settings?(extension.settings, encrypted_settings_keys())
      end

      assert {:ok, _claims} = ChannelsAuthorization.authorize(token, Crypto.decrypt!(migrated.jwt_secret), nil)
      assert {:ok, _conn} = Database.connect(migrated, "realtime_backfill_after", :stop)
    end

    test "leaves the tenant untouched while the feature flag is off", %{tenant: tenant} do
      set_flag(enabled: false)

      read_through_cache(tenant.external_id)

      assert_still_on_legacy_cipher(tenant.external_id)
    end

    test "leaves the tenant untouched when no GCM key is configured", %{tenant: tenant} do
      set_flag(enabled: true)

      key = Application.get_env(:realtime, :db_enc_key_gcm)
      Application.delete_env(:realtime, :db_enc_key_gcm)
      on_exit(fn -> Application.put_env(:realtime, :db_enc_key_gcm, key) end)

      read_through_cache(tenant.external_id)

      assert_still_on_legacy_cipher(tenant.external_id)
    end
  end

  defp set_flag(enabled: enabled?) do
    {:ok, flag} = Api.upsert_feature_flag(%{name: @flag, enabled: enabled?})
    on_exit(fn -> Api.delete_feature_flag(flag) end)
  end

  # Reading the tenant through the cache is what triggers the backfill.
  defp read_through_cache(external_id) do
    Tenants.Cache.invalidate_tenant_cache(external_id)
    assert %Tenant{} = Tenants.Cache.get_tenant_by_external_id(external_id)
  end

  defp assert_still_on_legacy_cipher(external_id) do
    assert_always on_legacy_cipher?(external_id), timeout: @async_write_window, interval: @probe_interval
  end

  defp on_legacy_cipher?(external_id) do
    untouched = Api.get_tenant_by_external_id(external_id)

    refute Crypto.gcm?(untouched.jwt_secret)
    assert is_nil(untouched.gcm_migrated_at)

    Enum.each(untouched.extensions, fn extension ->
      assert Crypto.legacy_settings?(extension.settings, encrypted_settings_keys())
    end)

    true
  end
end
