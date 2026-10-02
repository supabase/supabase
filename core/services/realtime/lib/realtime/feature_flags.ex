defmodule Realtime.FeatureFlags do
  @moduledoc """
  Manages feature flags with optional per-tenant overrides and percentage rollout.

  Each flag has a global enabled/disabled state and a rollout percentage
  (0-100, default 100) used to gradually enable it for a subset of tenants.
  Tenants can also override the flag entirely via a JSONB map stored on the
  tenant record.

  Use `enabled?/1` to check the global `enabled` value only. It ignores
  rollout percentage, since there is no tenant to compute a rollout bucket
  against.

  Use `enabled?/2` when the flag supports per-tenant overrides and percentage
  rollout. Resolution order:
    1. Tenant-specific override (if present) always wins.
    2. Otherwise, `false` when the flag is globally disabled or does not exist.
    3. Otherwise, whether the tenant falls within `rollout_percentage`.

  Rollout bucketing is deterministic per tenant (`:erlang.phash2({tenant_id, bucket_key}, 100)`),
  so it is sticky/monotonic: a tenant included at N% remains included at any
  percentage >= N. Raising the percentage only ever adds tenants.

  `bucket_key` defaults to the flag's own `name`, so different flags get
  independent, decorrelated cohorts. Set the same `bucket_key` on two flags to
  make them intentionally share the same cohort.
  """

  alias Realtime.Api
  alias Realtime.Api.FeatureFlag
  alias Realtime.FeatureFlags.Cache
  alias Realtime.Tenants.Cache, as: TenantsCache

  @spec set_tenant_flag(String.t(), String.t(), boolean()) ::
          {:ok, Realtime.Api.Tenant.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def set_tenant_flag(flag_name, tenant_id, enabled)
      when is_binary(flag_name) and is_binary(tenant_id) and is_boolean(enabled) do
    case Api.get_tenant_by_external_id(tenant_id, use_replica?: false) do
      nil ->
        {:error, :not_found}

      tenant ->
        updated_flags = Map.put(tenant.feature_flags, flag_name, enabled)
        Api.update_tenant_by_external_id(tenant_id, %{feature_flags: updated_flags})
    end
  end

  @doc """
  Removes a tenant's explicit override for `flag_name`, so the tenant falls back
  to the global enabled/rollout resolution. A no-op if no override is present.
  """
  @spec clear_tenant_flag(String.t(), String.t()) ::
          {:ok, Realtime.Api.Tenant.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def clear_tenant_flag(flag_name, tenant_id) when is_binary(flag_name) and is_binary(tenant_id) do
    case Api.get_tenant_by_external_id(tenant_id, use_replica?: false) do
      nil ->
        {:error, :not_found}

      tenant ->
        updated_flags = Map.delete(tenant.feature_flags, flag_name)
        Api.update_tenant_by_external_id(tenant_id, %{feature_flags: updated_flags})
    end
  end

  @spec enabled?(String.t()) :: boolean()
  def enabled?(flag_name) when is_binary(flag_name) do
    case Cache.get_flag(flag_name) do
      nil -> false
      %FeatureFlag{enabled: enabled} -> enabled
    end
  end

  @spec enabled?(String.t(), String.t()) :: boolean()
  def enabled?(flag_name, tenant_id) when is_binary(flag_name) and is_binary(tenant_id) do
    case Cache.get_flag(flag_name) do
      nil ->
        false

      %FeatureFlag{} = flag ->
        rollout_result = in_rollout?(flag, tenant_id)

        case TenantsCache.get_tenant_by_external_id(tenant_id) do
          nil -> rollout_result
          %{feature_flags: flags} -> Map.get(flags, flag_name, rollout_result)
        end
    end
  end

  @spec in_rollout?(FeatureFlag.t(), String.t()) :: boolean()
  defp in_rollout?(%FeatureFlag{enabled: false}, _tenant_id), do: false

  defp in_rollout?(%FeatureFlag{enabled: true, rollout_percentage: rollout_percentage} = flag, tenant_id) do
    bucket_key = flag.bucket_key || flag.name
    :erlang.phash2({tenant_id, bucket_key}, 100) < rollout_percentage
  end
end
