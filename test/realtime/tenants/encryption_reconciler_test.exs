defmodule Realtime.Tenants.EncryptionReconcilerTest do
  # async: false due to cache usage
  use Realtime.DataCase, async: false
  use Mimic

  setup :set_mimic_from_context

  alias Realtime.Api
  alias Realtime.Api.Tenant
  alias Realtime.Crypto
  alias Realtime.FeatureFlags
  alias Realtime.Repo
  alias Realtime.Tenants
  alias Realtime.Tenants.EncryptionReconciler

  @flag "gcm_encryption_backfill"
  @exception_event [:realtime, :tenants, :encryption, :reconcile, :exception]

  # reconcile/1 writes from a detached task, so there is nothing to poll on when asserting that no
  # write happens: give a stray write time to land instead.
  @async_write_window 200
  @probe_interval 20

  describe "reconcile/1" do
    setup do
      stub(FeatureFlags, :enabled?, fn @flag, _tenant_id -> true end)
      :ok
    end

    test "does nothing when the gcm_encryption_backfill flag is disabled for the tenant" do
      tenant = TestTenantDb.checkout_tenant() |> rewind_to_legacy_encryption()
      stub(FeatureFlags, :enabled?, fn @flag, _tenant_id -> false end)

      assert :ok = EncryptionReconciler.reconcile(tenant)

      assert_still_on_legacy_cipher(tenant.external_id)
    end

    test "does nothing when GCM writes are switched off" do
      tenant = TestTenantDb.checkout_tenant() |> rewind_to_legacy_encryption()
      Application.put_env(:realtime, :db_enc_write_gcm, false)
      on_exit(fn -> Application.put_env(:realtime, :db_enc_write_gcm, true) end)

      assert :ok = EncryptionReconciler.reconcile(tenant)

      assert_still_on_legacy_cipher(tenant.external_id)
    end

    test "does nothing when no GCM key is configured" do
      tenant = TestTenantDb.checkout_tenant() |> rewind_to_legacy_encryption()
      key = Application.get_env(:realtime, :db_enc_key_gcm)
      Application.delete_env(:realtime, :db_enc_key_gcm)
      on_exit(fn -> Application.put_env(:realtime, :db_enc_key_gcm, key) end)

      refute Crypto.write_gcm?()
      assert :ok = EncryptionReconciler.reconcile(tenant)

      assert_still_on_legacy_cipher(tenant.external_id)
    end

    test "does not clobber a jwt_secret rotated while the backfill is in flight" do
      tenant = TestTenantDb.checkout_tenant() |> rewind_to_legacy_encryption()
      stale_secret = tenant.jwt_secret

      {:ok, _} = Api.update_tenant_by_external_id(tenant.external_id, %{jwt_secret: "rotated-secret"})

      # The backfill still holds the pre-rotation ciphertext, as it would mid-flight.
      assert {:error, :jwt_secret_changed} =
               Api.reencrypt_tenant_jwt_secret(
                 tenant.external_id,
                 stale_secret,
                 Crypto.re_encrypt!(stale_secret)
               )

      reloaded = Api.get_tenant_by_external_id(tenant.external_id)
      assert Crypto.decrypt!(reloaded.jwt_secret) == "rotated-secret"
    end

    test "does not clobber settings changed while the backfill is in flight" do
      tenant = TestTenantDb.checkout_tenant() |> rewind_to_legacy_encryption()
      [extension] = tenant.extensions
      stale_settings = extension.settings

      {:ok, _} =
        extension
        |> Ecto.Changeset.change(%{settings: Map.put(stale_settings, "region", "eu-west-2")})
        |> Repo.update()

      assert {:error, :settings_changed} =
               Api.reencrypt_extension_settings(
                 tenant.external_id,
                 extension.id,
                 stale_settings,
                 Crypto.re_encrypt_settings!(stale_settings, encrypted_settings_keys())
               )

      assert %{extensions: [%{settings: %{"region" => "eu-west-2"}}]} =
               Api.get_tenant_by_external_id(tenant.external_id)
    end

    test "re-encrypts jwt_secret and each extension's settings in place, preserving the plaintext" do
      tenant = TestTenantDb.checkout_tenant()
      jwt_secret = Crypto.decrypt!(tenant.jwt_secret)
      [%{settings: settings}] = tenant.extensions
      db_password = Crypto.decrypt!(settings["db_password"])

      tenant = rewind_to_legacy_encryption(tenant)

      assert :ok = EncryptionReconciler.reconcile(tenant)
      assert_eventually migrated?(tenant.external_id)

      reloaded = Api.get_tenant_by_external_id(tenant.external_id)
      assert Crypto.decrypt!(reloaded.jwt_secret) == jwt_secret

      assert %{extensions: [%{settings: %{"db_password" => reloaded_password}}]} = reloaded
      assert Crypto.decrypt!(reloaded_password) == db_password
    end

    test "leaves settings keys that are not encrypted alone" do
      tenant = TestTenantDb.checkout_tenant()
      [%{settings: %{"region" => region}}] = tenant.extensions
      tenant = rewind_to_legacy_encryption(tenant)

      assert :ok = EncryptionReconciler.reconcile(tenant)
      assert_eventually migrated?(tenant.external_id)

      assert %{extensions: [%{settings: %{"region" => ^region}}]} =
               Api.get_tenant_by_external_id(tenant.external_id)
    end

    test "does nothing for a tenant already on GCM" do
      tenant = TestTenantDb.checkout_tenant()

      assert :ok = EncryptionReconciler.reconcile(tenant)

      assert_always(
        (
          reloaded = Api.get_tenant_by_external_id(tenant.external_id)

          reloaded.updated_at == tenant.updated_at and
            Enum.map(reloaded.extensions, & &1.updated_at) == Enum.map(tenant.extensions, & &1.updated_at)
        ),
        timeout: @async_write_window,
        interval: @probe_interval
      )
    end

    test "migrates the extensions of a tenant authenticated via jwt_jwks only" do
      tenant = TestTenantDb.checkout_tenant() |> rewind_to_legacy_encryption()

      {:ok, tenant} =
        tenant
        |> Ecto.Changeset.change(%{jwt_secret: nil, jwt_jwks: %{"keys" => []}})
        |> Repo.update()

      tenant = %{tenant | extensions: Api.get_tenant_by_external_id(tenant.external_id).extensions}

      assert :ok = EncryptionReconciler.reconcile(tenant)
      assert_eventually migrated?(tenant.external_id)

      assert %Tenant{jwt_secret: nil} = Api.get_tenant_by_external_id(tenant.external_id)
    end

    test "skips an encrypted key that is absent from settings" do
      tenant = TestTenantDb.checkout_tenant() |> rewind_to_legacy_encryption()
      [extension] = tenant.extensions

      settings = Map.delete(extension.settings, "db_password")
      {:ok, extension} = extension |> Ecto.Changeset.change(%{settings: settings}) |> Repo.update()
      tenant = %{tenant | extensions: [extension]}

      assert :ok = EncryptionReconciler.reconcile(tenant)
      assert_eventually migrated?(tenant.external_id)

      assert %{extensions: [%{settings: reloaded_settings}]} = Api.get_tenant_by_external_id(tenant.external_id)
      refute Map.has_key?(reloaded_settings, "db_password")
      assert Crypto.gcm?(reloaded_settings["db_user"])
    end

    test "reports telemetry and does not crash when the tenant has been deleted before the async write lands" do
      tenant = TestTenantDb.checkout_tenant() |> rewind_to_legacy_encryption()
      ref = :telemetry_test.attach_event_handlers(self(), [@exception_event])

      assert Api.delete_tenant_by_external_id(tenant.external_id)
      assert :ok = EncryptionReconciler.reconcile(tenant)

      assert_receive {@exception_event, ^ref, _measurements, %{reason: :tenant_not_found}}, 1000
      assert_receive {@exception_event, ^ref, _measurements, %{reason: :extension_not_found}}, 1000

      assert is_nil(Api.get_tenant_by_external_id(tenant.external_id))
    end

    test "stamps gcm_migrated_at once jwt_secret and every extension's settings are re-encrypted" do
      tenant = TestTenantDb.checkout_tenant() |> rewind_to_legacy_encryption()
      assert is_nil(tenant.gcm_migrated_at)

      assert :ok = EncryptionReconciler.reconcile(tenant)

      assert_eventually migrated?(tenant.external_id)
      assert %Tenant{gcm_migrated_at: %DateTime{}} = Api.get_tenant_by_external_id(tenant.external_id)
    end
  end

  # Deliberately does not stub FeatureFlags: `enabled?/2` reads the tenant cache, and
  # `get_tenant_by_external_id/1` is the fallback Cachex runs for that key.
  describe "get_tenant_by_external_id/1 with the real feature flag lookup" do
    test "returns a legacy tenant through the cache while the backfill flag row exists" do
      tenant = TestTenantDb.checkout_tenant()
      external_id = tenant.external_id
      rewind_to_legacy_encryption(tenant)

      {:ok, _flag} = Api.upsert_feature_flag(%{name: @flag, enabled: false})
      Tenants.Cache.invalidate_tenant_cache(external_id)

      task =
        Task.async(fn ->
          Ecto.Adapters.SQL.Sandbox.allow(Repo, self(), self())
          Tenants.Cache.get_tenant_by_external_id(external_id)
        end)

      assert {:ok, %Tenant{external_id: ^external_id}} = Task.yield(task, 5_000),
             "get_tenant_by_external_id/1 deadlocked re-entering the tenant cache"
    end

    test "backfills the tenant when the flag is enabled for it" do
      tenant = TestTenantDb.checkout_tenant()
      external_id = tenant.external_id
      rewind_to_legacy_encryption(tenant)

      {:ok, _flag} = Api.upsert_feature_flag(%{name: @flag, enabled: true})
      Tenants.Cache.invalidate_tenant_cache(external_id)

      assert %Tenant{} = Tenants.Cache.get_tenant_by_external_id(external_id)
      assert_eventually migrated?(external_id)
    end
  end

  # Fully migrated: nothing legacy left and the run stamped. A tenant on jwt_jwks has no jwt_secret
  # to move.
  defp migrated?(external_id) do
    tenant = Api.get_tenant_by_external_id(external_id)

    not is_nil(tenant.gcm_migrated_at) and
      (is_nil(tenant.jwt_secret) or Crypto.gcm?(tenant.jwt_secret)) and
      Enum.all?(tenant.extensions, &(not Crypto.legacy_settings?(&1.settings, encrypted_settings_keys())))
  end

  defp assert_still_on_legacy_cipher(external_id) do
    assert_always on_legacy_cipher?(external_id), timeout: @async_write_window, interval: @probe_interval
  end

  defp on_legacy_cipher?(external_id) do
    tenant = Api.get_tenant_by_external_id(external_id)

    not Crypto.gcm?(tenant.jwt_secret) and
      Enum.all?(tenant.extensions, &Crypto.legacy_settings?(&1.settings, encrypted_settings_keys())) and
      is_nil(tenant.gcm_migrated_at)
  end
end
