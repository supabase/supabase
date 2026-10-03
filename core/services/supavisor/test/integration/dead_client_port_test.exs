defmodule Supavisor.Integration.DeadClientPortTest do
  use Supavisor.DataCase, async: true

  require Supavisor

  alias Supavisor.Support.ProtocolClient

  @tenant "dead_port_repro_tenant"

  test "unresponsive client is killed upon send timeout" do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)
    port = Application.get_env(:supavisor, :proxy_port_transaction)

    id =
      Supavisor.id(
        type: :single,
        tenant: @tenant,
        user: db_conf[:username],
        mode: :transaction,
        db: nil
      )

    {:ok, sock} = :gen_tcp.connect(~c"127.0.0.1", port, [:binary, active: false])

    user = "#{db_conf[:username]}.#{@tenant}"
    password = db_conf[:password]

    ProtocolClient.authenticate(sock, user, password)

    client_pid = wait_for_client_handler_pid(id)
    ref = Process.monitor(client_pid)
    {_state, %{sock: {:gen_tcp, client_port}}} = :sys.get_state(client_pid)

    # This query returns >50MB. Since we aren't reading the output at all, this will
    # eventually fill the tcp stack buffers and cause a send timeout, which causes
    # the socket to be killed by the send_timeout_close option
    query = "SELECT repeat('a', 1000000) FROM generate_series(1, 50)"
    :ok = :gen_tcp.send(sock, :pgo_protocol.encode_query_message(query))

    assert :ok =
             wait_until(
               fn -> :inet.peername(client_port) in [{:error, :enotconn}, {:error, :einval}] end,
               35_000
             )

    assert_receive {:DOWN, ^ref, :process, ^client_pid, _reason}, 5_000
  end

  defp wait_for_client_handler_pid(id) do
    wait_until_present(fn ->
      case Registry.lookup(Supavisor.Registry.TenantClients, id) do
        [{client_pid, _}] -> client_pid
        _ -> nil
      end
    end)
  end

  defp wait_until_present(fun, attempts \\ 100)

  defp wait_until_present(_fun, 0), do: flunk("value never became present")

  defp wait_until_present(fun, attempts) do
    case fun.() do
      nil ->
        Process.sleep(50)
        wait_until_present(fun, attempts - 1)

      value ->
        value
    end
  end
end
