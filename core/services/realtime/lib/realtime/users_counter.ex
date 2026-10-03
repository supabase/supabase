defmodule Realtime.UsersCounter do
  @moduledoc """
  Counts of connected clients for a tenant across the whole cluster or for a single node.
  """
  alias Forum.Census

  @doc """
  Adds a RealtimeChannel pid to the `:users` scope for a tenant so we can keep track of all connected clients for a tenant.
  """
  @spec add(pid(), String.t()) :: :ok
  def add(pid, tenant_id) when is_pid(pid) and is_binary(tenant_id) do
    :ok = Census.join(:users, tenant_id, pid)
  end

  @doc "Return true if pid is already counted for tenant_id"
  @spec already_counted?(pid(), String.t()) :: boolean()
  def already_counted?(pid, tenant_id), do: Census.local_member?(:users, tenant_id, pid)

  @doc "List all local tenants with connected clients on this node."
  @spec local_tenants() :: [String.t()]
  def local_tenants, do: Census.local_groups(:users)

  @doc """
  Returns the count of all connected clients for a tenant for the cluster.
  """
  @spec tenant_users(String.t()) :: non_neg_integer()
  def tenant_users(tenant_id), do: Census.member_count(:users, tenant_id)

  @doc """
  Returns the count of connected clients for a tenant on a specific node.
  """
  @spec tenant_users(String.t(), node()) :: non_neg_integer()
  def tenant_users(tenant_id, node), do: Census.member_count(:users, tenant_id, node)

  @doc """
  Returns the counts of all connected clients for all tenants for the cluster.
  """
  @spec tenant_counts() :: %{String.t() => non_neg_integer()}
  def tenant_counts, do: Census.member_counts(:users)

  @doc """
  Returns the counts of all connected clients for all tenants for the local node.
  """
  @spec local_tenant_counts() :: %{String.t() => non_neg_integer()}
  def local_tenant_counts, do: Census.local_member_counts(:users)
end
