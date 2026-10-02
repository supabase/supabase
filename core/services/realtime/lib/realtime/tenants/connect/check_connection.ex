defmodule Realtime.Tenants.Connect.CheckConnection do
  @moduledoc """
  Check tenant database connection.
  """

  @behaviour Realtime.Tenants.Connect.Piper
  @impl true
  def run(acc) do
    %{tenant: tenant, tenant_id: tenant_id} = acc

    # Piper runs in the Connect process, so `self()` is the Connect pid. Register it
    # as a DBConnection listener (tagged with the tenant id) on the durable pool, so
    # Connect receives {:connected, _, _} / {:disconnected, _, _} messages and can
    # bound how long the pool may stay disconnected before giving up.
    case Realtime.Database.check_tenant_connection(tenant, {[self()], tenant_id}) do
      {:ok, conn, migrations_ran} ->
        db_conn_reference = Process.monitor(conn)

        {:ok,
         %{
           acc
           | db_conn_pid: conn,
             db_conn_reference: db_conn_reference,
             migrations_ran_on_database: migrations_ran
         }}

      {:error, error} ->
        {:error, error}
    end
  end
end
