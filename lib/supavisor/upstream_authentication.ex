defmodule Supavisor.UpstreamAuthentication do
  @moduledoc """
  Manages upstream database authentication: resolving secrets and caching them.

  Upstream secrets are used by DbHandler to authenticate TO the upstream database.
  They are stored in the tenant-specific ETS cache via TenantCache.
  """

  @doc """
  Gets auth secrets to authenticate to the upstream database.
  """
  def get_upstream_auth_secrets(id) do
    Supavisor.TenantCache.get_upstream_auth_secrets(id)
  end

  @doc """
  Caches upstream auth secrets in the tenant-specific cache.
  """
  def put_upstream_auth_secrets(id, secrets) do
    Supavisor.Manager.notify_secrets_available(id)
    Supavisor.TenantCache.put_upstream_auth_secrets(id, secrets)
  end

  @doc """
  Deletes upstream auth secrets from the tenant cache.
  """
  def delete_upstream_auth_secrets(id) do
    Supavisor.TenantCache.delete_upstream_auth_secrets(id)
  end
end
