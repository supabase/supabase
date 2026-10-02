defmodule Realtime.Tenants.Janitor.MaintenanceTask do
  @moduledoc """
  Perform maintenance on tenant's database:

    - Delete old messages
    - Create new partitions

  """

  @spec run(String.t()) :: :ok | {:error, any}
  def run(tenant_external_id) do
    with %Realtime.Api.Tenant{} = tenant <- Realtime.Tenants.Cache.get_tenant_by_external_id(tenant_external_id),
         {:ok, conn} <- Realtime.Database.connect(tenant, "realtime_janitor"),
         :ok <- Realtime.Messages.delete_old_messages(conn),
         :ok <- Realtime.Tenants.create_messages_partitions(conn) do
      GenServer.stop(conn)
      :ok
    end
  end
end
