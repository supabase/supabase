defmodule Supavisor.TenantsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Supavisor.Tenants` context.
  """

  @doc """
  Generate a tenant.
  """
  def tenant_fixture(attrs \\ %{}) do
    {:ok, tenant} =
      attrs
      |> Enum.into(%{
        db_database: "supavisor_test",
        db_host: "localhost",
        db_port: 6432,
        external_id: "dev_tenant",
        default_parameter_status: %{"server_version" => "15.0"},
        require_user: true,
        users: [
          %{
            "db_user" => "postgres",
            "db_password" => "postgres",
            "pool_size" => 3,
            "mode_type" => "transaction"
          }
        ]
      })
      |> Supavisor.Tenants.create_tenant()

    tenant
  end

  # @doc """
  # Generate a unique cluster tenant_external_id.
  # """
  # def unique_cluster_tenant_external_id,
  #   do: "some tenant_external_id#{System.unique_integer([:positive])}"

  @doc """
  Generate a unique cluster type.
  """
  def unique_cluster_type, do: "some type#{System.unique_integer([:positive])}"

  @doc """
  Generate a cluster.
  """
  def cluster_fixture(attrs \\ %{}) do
    {:ok, cluster} =
      attrs
      |> Enum.into(%{
        active: true,
        alias: "some_alias",
        cluster_tenants: [
          %{
            type: "write",
            cluster_alias: "some_alias",
            tenant_external_id: "proxy_tenant1",
            active: true
          }
        ]
      })
      |> Supavisor.Tenants.create_cluster()

    cluster
  end
end
