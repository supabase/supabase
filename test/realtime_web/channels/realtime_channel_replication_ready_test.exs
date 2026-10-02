defmodule RealtimeWeb.RealtimeChannelReplicationReadyTest do
  use RealtimeWeb.ChannelCase, async: false
  use Mimic

  alias Phoenix.Socket
  alias Realtime.Tenants.Connect
  alias RealtimeWeb.UserSocket

  setup :set_mimic_from_context

  setup_all do
    tenant = TestTenantDb.checkout_tenant_unboxed(run_migrations: true)
    Realtime.Tenants.Cache.update_cache(tenant)
    {:ok, tenant: tenant}
  end

  test "pushes the system message immediately when replication is already established", %{tenant: tenant} do
    expect(Connect, :lookup_or_start_connection, fn _ -> {:ok, self()} end)
    expect(Connect, :replication_status, fn _ -> {:ok, self()} end)

    assert {:ok, _, _} = join(tenant)

    assert_receive %Socket.Message{event: "system", payload: %{message: "Replication connection established"}}, 500
  end

  test "pushes the system message once replication becomes ready while polling", %{tenant: tenant} do
    expect(Connect, :lookup_or_start_connection, fn _ -> {:ok, self()} end)

    expect(Connect, :replication_status, fn _ -> {:error, :not_connected} end)
    expect(Connect, :replication_status, fn _ -> {:error, :not_connected} end)
    expect(Connect, :replication_status, fn _ -> {:ok, self()} end)

    assert {:ok, _, _} = join(tenant)

    assert_receive %Socket.Message{event: "system", payload: %{message: "Replication connection established"}}, 3000
  end

  test "does not push while replication is unavailable", %{tenant: tenant} do
    expect(Connect, :lookup_or_start_connection, fn _ -> {:ok, self()} end)
    stub(Connect, :replication_status, fn _ -> {:error, :not_connected} end)

    assert {:ok, _, _} = join(tenant)

    refute_receive %Socket.Message{event: "system", payload: %{message: "Replication connection established"}}, 1000
  end

  test "notifies at most once", %{tenant: tenant} do
    expect(Connect, :lookup_or_start_connection, fn _ -> {:ok, self()} end)
    expect(Connect, :replication_status, fn _ -> {:ok, self()} end)

    assert {:ok, _, _} = join(tenant)

    assert_receive %Socket.Message{event: "system", payload: %{message: "Replication connection established"}}, 1000

    refute_receive %Socket.Message{event: "system", payload: %{message: "Replication connection established"}}, 1000
  end

  test "shuts down the channel when replication is not established before the timeout", %{tenant: tenant} do
    previous = Application.get_env(:realtime, :replication_ready_timeout)
    Application.put_env(:realtime, :replication_ready_timeout, 50)
    on_exit(fn -> Application.put_env(:realtime, :replication_ready_timeout, previous) end)

    expect(Connect, :lookup_or_start_connection, fn _ -> {:ok, self()} end)
    stub(Connect, :replication_status, fn _ -> {:error, :not_connected} end)

    assert {:ok, _, socket} = join(tenant)
    ref = Process.monitor(socket.channel_pid)

    assert_receive %Socket.Message{
                     event: "system",
                     payload: %{status: "error", message: "Replication connection was not established in time"}
                   },
                   1000

    assert_receive {:DOWN, ^ref, :process, _, _}, 500
  end

  test "does not arm replication readiness notifications unless opted in", %{tenant: tenant} do
    expect(Connect, :lookup_or_start_connection, fn _ -> {:ok, self()} end)
    reject(&Connect.replication_status/1)

    jwt = generate_jwt_token(tenant)
    {:ok, socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))
    assert {:ok, _, _} = subscribe_and_join(socket, "realtime:test", %{"config" => %{}})

    refute_receive %Socket.Message{event: "system"}, 1000
  end

  test "opts in when replication_ready is the string \"true\"", %{tenant: tenant} do
    expect(Connect, :lookup_or_start_connection, fn _ -> {:ok, self()} end)
    expect(Connect, :replication_status, fn _ -> {:ok, self()} end)

    assert {:ok, _, _} = join_with(tenant, "true")

    assert_receive %Socket.Message{event: "system", payload: %{message: "Replication connection established"}}, 500
  end

  test "does not opt in when replication_ready is the string \"false\"", %{tenant: tenant} do
    expect(Connect, :lookup_or_start_connection, fn _ -> {:ok, self()} end)
    reject(&Connect.replication_status/1)

    assert {:ok, _, _} = join_with(tenant, "false")

    refute_receive %Socket.Message{event: "system"}, 1000
  end

  test "does not opt in when replication_ready is not a boolean", %{tenant: tenant} do
    expect(Connect, :lookup_or_start_connection, fn _ -> {:ok, self()} end)
    reject(&Connect.replication_status/1)

    assert {:ok, _, _} = join_with(tenant, "maybe")

    refute_receive %Socket.Message{event: "system"}, 1000
  end

  defp join(tenant), do: join_with(tenant, true)

  defp join_with(tenant, replication_ready) do
    jwt = generate_jwt_token(tenant)
    {:ok, socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

    subscribe_and_join(socket, "realtime:test", %{
      "config" => %{"broadcast" => %{"replication_ready" => replication_ready}}
    })
  end

  defp conn_opts(tenant, token) do
    [
      connect_info: %{
        uri: URI.parse("https://#{tenant.external_id}.localhost:4000/socket/websocket"),
        x_headers: [{"x-api-key", token}]
      }
    ]
  end
end
