defmodule Realtime.Integration.RegionAwareEncryptionTest do
  @moduledoc """
  The backfill writes are master-region-only: a node outside the master region routes them over
  gen_rpc instead of writing locally. Covers that branch of `Realtime.Api.reencrypt_tenant_jwt_secret/3`
  and `Realtime.Api.reencrypt_extension_settings/4`.
  """
  use Realtime.DataCase, async: false

  alias Realtime.Api
  alias Realtime.Crypto
  alias Realtime.Nodes

  setup do
    tenant = tenant_fixture()
    master_region = Application.get_env(:realtime, :region)
    local = node()

    {:ok, node} =
      Clustered.start(nil,
        extra_config: [
          {:realtime, :region, "eu-west-2"},
          {:realtime, :master_region, master_region}
        ]
      )

    # We need the nodes available for our region aware encryption to work.
    assert_eventually :erpc.call(node, Nodes, :region_nodes, [master_region]) == [local], timeout: 5_000, interval: 100

    %{tenant: rewind_to_legacy_encryption(tenant), node: node}
  end

  test "reencrypt_tenant_jwt_secret/3 from a non-master region routes to the master", %{
    tenant: tenant,
    node: node
  } do
    legacy = tenant.jwt_secret
    jwt_secret = Crypto.decrypt!(legacy)

    assert {:ok, _tenant} = reencrypt_jwt_secret(node, tenant.external_id, legacy)

    reloaded = Api.get_tenant_by_external_id(tenant.external_id)
    assert Crypto.gcm?(reloaded.jwt_secret)
    assert Crypto.decrypt!(reloaded.jwt_secret) == jwt_secret
  end

  test "reencrypt_extension_settings/4 from a non-master region routes to the master", %{
    tenant: tenant,
    node: node
  } do
    [extension] = tenant.extensions
    legacy = extension.settings

    assert {:ok, _extension} =
             :erpc.call(node, Api, :reencrypt_extension_settings, [
               tenant.external_id,
               extension.id,
               legacy,
               Crypto.re_encrypt_settings!(legacy, encrypted_settings_keys())
             ])

    [reloaded] = Api.get_tenant_by_external_id(tenant.external_id).extensions
    refute Crypto.legacy_settings?(reloaded.settings, encrypted_settings_keys())
    assert Crypto.decrypt!(reloaded.settings["db_password"]) == Crypto.decrypt!(legacy["db_password"])
  end

  test "a stale write from a non-master region is rejected by the master", %{tenant: tenant, node: node} do
    legacy = tenant.jwt_secret
    {:ok, _} = Api.update_tenant_by_external_id(tenant.external_id, %{jwt_secret: "rotated-secret"})

    assert {:error, :jwt_secret_changed} = reencrypt_jwt_secret(node, tenant.external_id, legacy)

    reloaded = Api.get_tenant_by_external_id(tenant.external_id)
    assert Crypto.decrypt!(reloaded.jwt_secret) == "rotated-secret"
  end

  defp reencrypt_jwt_secret(node, external_id, ciphertext) do
    :erpc.call(node, Api, :reencrypt_tenant_jwt_secret, [external_id, ciphertext, Crypto.re_encrypt!(ciphertext)])
  end
end
