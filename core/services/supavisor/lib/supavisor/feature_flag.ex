defmodule Supavisor.FeatureFlag do
  @moduledoc """
  Module for checking feature flags on a per-tenant basis.

  Feature flags can be set either in the tenant's feature_flags field
  or as application-wide defaults via configuration:

      config :supavisor, Supavisor.FeatureFlag, %{
        "new_prepared_statements" => false,
        "enhanced_logging" => true
      }

  Tenant-specific flags take precedence over application defaults.
  """

  alias Supavisor.Tenants.Tenant

  @doc """
  Checks if a feature flag is enabled for a given tenant.

  First checks the tenant's feature_flags map, then falls back to
  application configuration. Returns false if flag is not found anywhere.
  """
  @spec enabled?(Tenant.t() | map(), String.t()) :: boolean()
  def enabled?(%Tenant{feature_flags: feature_flags}, flag_name) when is_binary(flag_name) do
    enabled?(feature_flags, flag_name)
  end

  def enabled?(feature_flags, flag_name) when is_map(feature_flags) and is_binary(flag_name) do
    case Map.get(feature_flags, flag_name) do
      nil ->
        # Fall back to application config
        app_flags = Application.get_env(:supavisor, __MODULE__, %{})
        Map.get(app_flags, flag_name, false)

      value when is_boolean(value) ->
        value

      _ ->
        false
    end
  end
end
