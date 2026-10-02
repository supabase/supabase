defmodule Integration.TrackerTest do
  # Changing the Tracker ETS table
  use RealtimeWeb.ConnCase, async: false

  alias RealtimeWeb.RealtimeChannel.Tracker
  alias Phoenix.Socket.Message
  alias Realtime.Tenants.Connect
  alias Realtime.Integration.WebsocketClient
  import ExUnit.CaptureLog

  setup do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    :ets.delete_all_objects(Tracker.table_name())

    {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
    assert Connect.ready?(tenant.external_id)
    %{db_conn: db_conn, tenant: tenant}
  end

  test "tracks and untracks properly channels", %{tenant: tenant} do
    {socket, _} = get_connection(tenant)
    config = %{broadcast: %{self: true}, private: false, presence: %{enabled: false}}

    topics =
      for _ <- 1..10 do
        topic = "realtime:#{random_string()}"
        :ok = WebsocketClient.join(socket, topic, %{config: config})
        assert_receive %Message{topic: ^topic, event: "phx_reply"}, 500
        topic
      end

    for topic <- topics do
      :ok = WebsocketClient.leave(socket, topic, %{})
      assert_receive %Message{topic: ^topic, event: "phx_close"}, 500
    end

    start_supervised!({Tracker, check_interval_in_ms: 100})
    # wait to trigger tracker
    assert_process_down(socket, 1000)
  end

  test "suppresses Ranch killed connection log when connection is killed by tracker", %{
    tenant: tenant
  } do
    {socket, _} = get_connection(tenant)
    config = %{broadcast: %{self: true}, private: false, presence: %{enabled: false}}
    topic = "realtime:#{random_string()}"

    :ok = WebsocketClient.join(socket, topic, %{config: config})
    assert_receive %Message{topic: ^topic, event: "phx_reply"}, 500

    :ok = WebsocketClient.leave(socket, topic, %{})
    assert_receive %Message{topic: ^topic, event: "phx_close"}, 500

    log =
      capture_log(fn ->
        start_supervised!({Tracker, check_interval_in_ms: 100})
        assert_process_down(socket, 1000)
      end)

    assert log =~ "Killing 1 transport pids with no channels open"
    refute log =~ "had connection process started with"
    refute log =~ "exit with reason: :killed"
  end

  test "failed connections are present in tracker with counter lower than 0 so they are actioned on by tracker", %{
    tenant: tenant
  } do
    assert [] = Tracker.list_pids()

    {socket, _} = get_connection(tenant)
    config = %{broadcast: %{self: true}, private: true, presence: %{enabled: false}}

    for _ <- 1..10 do
      topic = "realtime:#{random_string()}"
      :ok = WebsocketClient.join(socket, topic, %{config: config})
      assert_receive %Message{topic: ^topic, event: "phx_reply", payload: %{"status" => "error"}}, 500
    end

    assert [{_pid, count}] = Tracker.list_pids()
    assert count == 0
  end

  test "failed connections but one succeeds properly tracks", %{tenant: tenant} do
    assert [] = Tracker.list_pids()

    {socket, _} = get_connection(tenant)
    topic = "realtime:#{random_string()}"

    :ok =
      WebsocketClient.join(socket, topic, %{
        config: %{broadcast: %{self: true}, private: false, presence: %{enabled: false}}
      })

    assert_receive %Message{topic: ^topic, event: "phx_reply", payload: %{"status" => "ok"}}, 500
    assert [{_pid, count}] = Tracker.list_pids()
    assert count == 1

    for _ <- 1..10 do
      topic = "realtime:#{random_string()}"

      :ok =
        WebsocketClient.join(socket, topic, %{
          config: %{broadcast: %{self: true}, private: true, presence: %{enabled: false}}
        })

      assert_receive %Message{topic: ^topic, event: "phx_reply", payload: %{"status" => "error"}}, 500
    end

    topic = "realtime:#{random_string()}"

    :ok =
      WebsocketClient.join(socket, topic, %{
        config: %{broadcast: %{self: true}, private: false, presence: %{enabled: false}}
      })

    assert_receive %Message{topic: ^topic, event: "phx_reply", payload: %{"status" => "ok"}}, 500
    assert [{_pid, count}] = Tracker.list_pids()
    assert count == 2
  end

  test "a join rejected before tracking does not untrack the socket's live channels", %{tenant: tenant} do
    assert [] = Tracker.list_pids()

    {socket, _} = get_connection(tenant)
    config = %{broadcast: %{self: true}, private: false, presence: %{enabled: false}}

    topic = "realtime:#{random_string()}"
    :ok = WebsocketClient.join(socket, topic, %{config: config})
    assert_receive %Message{topic: ^topic, event: "phx_reply", payload: %{"status" => "ok"}}, 500
    assert [{_pid, 1}] = Tracker.list_pids()

    # `realtime:` is rejected by the first join/3 clause, before the channel is tracked
    for _ <- 1..5 do
      :ok = WebsocketClient.join(socket, "realtime:", %{config: config})

      assert_receive %Message{topic: "realtime:", event: "phx_reply", payload: %{"status" => "error"}}, 1000
    end

    assert [{_pid, count}] = Tracker.list_pids()
    assert count == 1

    # the socket still has a channel open, so the Tracker must not reap it
    start_supervised!({Tracker, check_interval_in_ms: 100})
    Process.sleep(300)
    assert Process.alive?(socket)
  end
end
