defmodule Realtime.Tenants.Connect.RegisterProcess do
  @moduledoc """
  Registers the database process in :syn
  """
  alias Realtime.Tenants.Connect
  @behaviour Realtime.Tenants.Connect.Piper

  @impl true
  def run(acc) do
    %{tenant_id: tenant_id, db_conn_pid: conn} = acc

    with {:ok, _} <- :syn.update_registry(Connect, tenant_id, fn _pid, meta -> %{meta | conn: conn} end),
         {:ok, _} <- Registry.register(Connect.Registry, tenant_id, %{}) do
      {:ok, acc}
    else
      {:error, :undefined} -> {:error, :process_not_found}
      {:error, {:already_registered, _}} -> {:error, :already_registered}
      {:error, reason} -> {:error, reason}
    end
  end
end
