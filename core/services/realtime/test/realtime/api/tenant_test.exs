defmodule Realtime.Api.TenantTest do
  use ExUnit.Case, async: true

  alias Realtime.Api.Tenant
  alias Realtime.Crypto

  describe "encrypt_jwt_secret/1 via changeset/2" do
    test "encrypts jwt_secret with the configured cipher" do
      changeset = Tenant.changeset(%Tenant{}, %{external_id: "tenant", jwt_secret: "my-secret"})
      jwt_secret = Ecto.Changeset.get_change(changeset, :jwt_secret)

      assert jwt_secret != "my-secret"
      assert Crypto.gcm?(jwt_secret)
      assert Crypto.decrypt!(jwt_secret) == "my-secret"
    end

    test "does nothing when jwt_secret is not part of the changes" do
      changeset = Tenant.changeset(%Tenant{}, %{external_id: "tenant", jwt_jwks: %{"keys" => []}})

      refute Ecto.Changeset.get_change(changeset, :jwt_secret)
    end

    test "leaves a cleared jwt_secret cleared" do
      tenant = %Tenant{external_id: "tenant", jwt_secret: "ciphertext"}
      changeset = Tenant.changeset(tenant, %{jwt_secret: nil, jwt_jwks: %{"keys" => []}})

      assert Ecto.Changeset.get_change(changeset, :jwt_secret) == nil
    end

    test "leaves jwt_secret unencrypted on an invalid changeset" do
      changeset = Tenant.changeset(%Tenant{}, %{jwt_secret: "my-secret"})

      refute changeset.valid?
      assert Ecto.Changeset.get_change(changeset, :jwt_secret) == "my-secret"
    end
  end

  describe "decrypt_jwt_secret/1" do
    test "returns nil for a tenant without a jwt_secret" do
      assert Tenant.decrypt_jwt_secret(nil) == nil
    end

    test "decrypts an encrypted jwt_secret" do
      assert "my-secret" |> Crypto.encrypt!() |> Tenant.decrypt_jwt_secret() == "my-secret"
    end
  end

  describe "gcm_migrated_at_changeset/2" do
    test "casts gcm_migrated_at and ignores every other field" do
      now = DateTime.utc_now() |> DateTime.truncate(:second)
      changeset = Tenant.gcm_migrated_at_changeset(%Tenant{}, %{gcm_migrated_at: now, name: "should be ignored"})

      assert %Ecto.Changeset{valid?: true, changes: %{gcm_migrated_at: ^now} = changes} = changeset
      refute Map.has_key?(changes, :name)
    end

    test "requires gcm_migrated_at" do
      refute Tenant.gcm_migrated_at_changeset(%Tenant{}, %{}).valid?
    end
  end

  describe "changeset/2 legacy extension type normalization" do
    test ~s(remaps a legacy "postgres" extension type to "postgres_cdc_rls") do
      attrs = %{
        external_id: "tenant",
        jwt_secret: "my-secret",
        extensions: [%{"type" => "postgres", "settings" => %{"region" => "us-east-1"}}]
      }

      changeset = Tenant.changeset(%Tenant{}, attrs)
      [extension_changeset] = Ecto.Changeset.get_change(changeset, :extensions)

      assert Ecto.Changeset.get_change(extension_changeset, :type) == "postgres_cdc_rls"
    end
  end

  describe "maybe_set_default/3" do
    test "keeps the changeset unchanged when the property already has a value" do
      changeset = Ecto.Changeset.change(%Tenant{max_bytes_per_second: 12_345})
      result = Tenant.maybe_set_default(changeset, :max_bytes_per_second, :tenant_max_bytes_per_second)

      refute Ecto.Changeset.get_change(result, :max_bytes_per_second)
    end
  end
end
