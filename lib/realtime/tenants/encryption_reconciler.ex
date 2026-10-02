defmodule Realtime.Tenants.EncryptionReconciler do
  @moduledoc """
  Moves a tenant's stored secrets from the legacy AES-128-ECB cipher to AES-256-GCM.

  Temporary: once every tenant is on GCM this module and its call site in `Realtime.Tenants` are
  deleted wholesale, along with the legacy branch in `Realtime.Crypto`.
  """

  # TODO: delete this module once no tenant is left on AES-128-ECB.

  use Realtime.Logs

  alias Realtime.Api
  alias Realtime.Api.Tenant
  alias Realtime.Crypto
  alias Realtime.Extensions
  alias Realtime.FeatureFlags
  alias Realtime.Telemetry

  @event [:realtime, :tenants, :encryption, :reconcile]
  @flag "gcm_encryption_backfill"

  @doc """
  Re-encrypts a tenant's legacy values, in a detached task so a slow or failing write never blocks
  the caller. On success stamps `gcm_migrated_at`, so a null there means the tenant still holds
  legacy ciphertext.

  Gated by the #{@flag} feature flag so the rollout can be controlled per tenant.
  """
  @spec reconcile(Tenant.t()) :: :ok
  def reconcile(tenant) do
    if Crypto.write_gcm?() and needs_reconciliation?(tenant) do
      # The flag check has to happen inside the task: `FeatureFlags.enabled?/2` reads the tenant
      # cache and `Tenants.get_tenant_by_external_id/1` is itself the fallback Cachex runs for that
      # key, so checking it here re-enters the courier for an in-flight fetch and blocks forever.
      Task.Supervisor.start_child(Realtime.TaskSupervisor, fn ->
        if FeatureFlags.enabled?(@flag, tenant.external_id), do: reconcile_now(tenant)
      end)
    end

    :ok
  end

  defp needs_reconciliation?(tenant) do
    is_nil(tenant.gcm_migrated_at) and
      (legacy_jwt_secret?(tenant) or Enum.any?(tenant.extensions, &legacy_settings?/1))
  end

  defp legacy_jwt_secret?(%Tenant{jwt_secret: jwt_secret}) when is_binary(jwt_secret),
    do: not Crypto.gcm?(jwt_secret)

  defp legacy_jwt_secret?(_tenant), do: false

  defp legacy_settings?(extension),
    do: Crypto.legacy_settings?(extension.settings, encrypted_settings_keys(extension.type))

  defp reconcile_now(%Tenant{external_id: external_id, extensions: extensions} = tenant) do
    # Every write is attempted before the results are inspected: one failure shouldn't leave the rest
    # of the tenant's values on the legacy cipher until the next read.
    results = [reconcile_jwt_secret(tenant) | Enum.map(extensions, &reconcile_settings(external_id, &1))]

    if Enum.all?(results, &(&1 == :ok)), do: Api.update_tenant_gcm_migrated_at(external_id)

    :ok
  end

  defp reconcile_jwt_secret(%Tenant{jwt_secret: jwt_secret, external_id: external_id} = tenant) do
    if legacy_jwt_secret?(tenant) do
      measure(external_id, "jwt_secret", fn ->
        Api.reencrypt_tenant_jwt_secret(external_id, jwt_secret, Crypto.re_encrypt!(jwt_secret))
      end)
    else
      :ok
    end
  end

  defp reconcile_settings(external_id, %{settings: settings, type: type, id: id} = extension) do
    if legacy_settings?(extension) do
      measure(external_id, "settings:#{type}", fn ->
        re_encrypted = Crypto.re_encrypt_settings!(settings, encrypted_settings_keys(type))
        Api.reencrypt_extension_settings(external_id, id, settings, re_encrypted)
      end)
    else
      :ok
    end
  end

  defp measure(external_id, field, write_fun) do
    metadata = %{external_id: external_id, field: field}
    start_time = Telemetry.start(@event, metadata)

    case write_fun.() do
      {:ok, _record} ->
        Telemetry.stop(@event, start_time, metadata)
        :ok

      {:error, reason} ->
        Telemetry.exception(@event, start_time, :error, reason, [], metadata)
        log_error("EncryptionReconcileFailed", reason, external_id: external_id, field: field)
        :error
    end
  end

  defp encrypted_settings_keys(extension_type) do
    for {field, _checker, true} <- Extensions.db_settings(extension_type).required, do: field
  end
end
