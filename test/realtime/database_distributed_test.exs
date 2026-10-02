defmodule Realtime.DatabaseDistributedTest do
  # async: false due to usage of Clustered
  use Realtime.DataCase, async: false

  import ExUnit.CaptureLog

  alias Realtime.Database
  alias Realtime.Rpc
  alias Realtime.Tenants.Connect

  doctest Realtime.Database
  def handle_telemetry(event, metadata, content, pid: pid), do: send(pid, {event, metadata, content})

  setup do
    tenant = TestTenantDb.checkout_tenant()
    :telemetry.attach(__MODULE__, [:realtime, :database, :transaction], &__MODULE__.handle_telemetry/4, pid: self())

    on_exit(fn -> :telemetry.detach(__MODULE__) end)

    %{tenant: tenant}
  end

  @aux_mod (quote do
              defmodule DatabaseAux do
                def checker(transaction_conn) do
                  Postgrex.query!(transaction_conn, "SELECT 1", [])
                end

                def error(transaction_conn) do
                  Postgrex.query!(transaction_conn, "SELECT 1/0", [])
                end

                def exception(_) do
                  raise RuntimeError, "💣"
                end
              end
            end)

  Code.eval_quoted(@aux_mod)

  describe "transaction/1 in clustered mode" do
    setup do
      tenant = TestTenantDb.checkout_tenant_unboxed(run_migrations: true)
      %{distributed_tenant: tenant}
    end

    test "success call returns output", %{distributed_tenant: tenant} do
      {:ok, node} = Clustered.start(@aux_mod)
      {:ok, db_conn} = Rpc.call(node, Connect, :connect, [tenant.external_id, "us-east-1"])
      assert node(db_conn) == node
      assert {:ok, %Postgrex.Result{rows: [[1]]}} = Database.transaction(db_conn, &DatabaseAux.checker/1)
    end

    test "handles database errors", %{distributed_tenant: tenant} do
      metadata = [external_id: "123", project: "123"]
      {:ok, node} = Clustered.start(@aux_mod)
      {:ok, db_conn} = Rpc.call(node, Connect, :connect, [tenant.external_id, "us-east-1"])
      assert node(db_conn) == node

      assert capture_log(fn ->
               assert {:error, %Postgrex.Error{}} = Database.transaction(db_conn, &DatabaseAux.error/1, [], metadata)
               # We have to wait for logs to be relayed to this node
               Process.sleep(100)
             end) =~ "project=123 external_id=123 [error] ErrorExecutingTransaction:"
    end

    test "handles exception", %{distributed_tenant: tenant} do
      metadata = [external_id: "123", project: "123"]
      {:ok, node} = Clustered.start(@aux_mod)
      {:ok, db_conn} = Rpc.call(node, Connect, :connect, [tenant.external_id, "us-east-1"])
      assert node(db_conn) == node

      assert capture_log(fn ->
               assert {:error, %RuntimeError{}} = Database.transaction(db_conn, &DatabaseAux.exception/1, [], metadata)
               # We have to wait for logs to be relayed to this node
               Process.sleep(100)
             end) =~ "project=123 external_id=123 [error] ErrorExecutingTransaction:"
    end

    test "db process is not alive anymore" do
      metadata = [external_id: "123", project: "123", tenant_id: "123"]
      {:ok, node} = Clustered.start(@aux_mod)

      pid = Rpc.call(node, :erlang, :self, [])
      assert node(pid) == node

      assert capture_log(fn ->
               assert {:error, {:exit, {:noproc, {DBConnection.Holder, :checkout, [^pid, []]}}}} =
                        Database.transaction(pid, &DatabaseAux.checker/1, [], metadata)

               # We have to wait for logs to be relayed to this node
               Process.sleep(100)
             end) =~ "project=123 external_id=123 [error] ErrorExecutingTransaction:"
    end
  end
end
