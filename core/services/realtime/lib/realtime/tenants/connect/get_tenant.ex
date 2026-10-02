defmodule Realtime.Tenants.Connect.GetTenant do
  @moduledoc """
  Get tenant database connection.
  """

  alias Realtime.Api.Tenant
  alias Realtime.Tenants
  @behaviour Realtime.Tenants.Connect.Piper

  @impl Realtime.Tenants.Connect.Piper
  def run(acc) do
    %{tenant_id: tenant_id} = acc

    case Tenants.Cache.get_tenant_by_external_id(tenant_id) do
      %Tenant{} = tenant -> {:ok, Map.put(acc, :tenant, tenant)}
      _ -> {:error, :tenant_not_found}
    end
  end
end
