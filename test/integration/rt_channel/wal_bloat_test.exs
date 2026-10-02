defmodule Realtime.Integration.RtChannel.WalBloatTest do
  # WAL-bloat detection and replication recovery are serializer-independent, so this
  # only runs under a single serializer (the websocket encode/decode path is covered elsewhere).
  use RealtimeWeb.ConnCase, async: false

  import Generators

  alias Phoenix.Socket.Message
  alias Postgrex
  alias Realtime.Database
  alias Realtime.Integration.WebsocketClient
  alias Realtime.Tenants.Connect
  alias Realtime.Tenants.ReplicationConnection

  @moduletag :capture_log

  setup [:short_replication_watchdog, :checkout_tenant_and_connect]

  describe "WAL bloat handling" do
    setup %{tenant: tenant} do
      topic = random_string()
      {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)

      %{rows: [[max_wal_size]]} = Postgrex.query!(db_conn, "SHOW max_wal_size", [])
      %{rows: [[wal_keep_size]]} = Postgrex.query!(db_conn, "SHOW wal_keep_size", [])
      %{rows: [[max_slot_wal_keep_size]]} = Postgrex.query!(db_conn, "SHOW max_slot_wal_keep_size", [])

      assert max_wal_size == "1GB"
      assert wal_keep_size == "32MB"
      assert max_slot_wal_keep_size == "32MB"

      Postgrex.query!(db_conn, "CREATE TABLE IF NOT EXISTS wal_test (id INT, data TEXT)", [])

      Postgrex.query!(
        db_conn,
        """
          CREATE OR REPLACE FUNCTION wal_test_trigger_func() RETURNS TRIGGER AS $$
          BEGIN
            PERFORM realtime.send(json_build_object ('value', 'test' :: text)::jsonb, 'test', '#{topic}', false);
            RETURN NULL;
          END;
          $$ LANGUAGE plpgsql;
        """,
        []
      )

      Postgrex.query!(db_conn, "DROP TRIGGER IF EXISTS wal_test_trigger ON wal_test", [])

      Postgrex.query!(
        db_conn,
        """
          CREATE TRIGGER wal_test_trigger
          AFTER INSERT OR UPDATE OR DELETE ON wal_test
          FOR EACH ROW
          EXECUTE FUNCTION wal_test_trigger_func()
        """,
        []
      )

      GenServer.stop(db_conn)

      on_exit(fn ->
        {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)

        Postgrex.query!(db_conn, "DROP TABLE IF EXISTS wal_test CASCADE", [])
        GenServer.stop(db_conn)
      end)

      %{topic: topic}
    end

    # TODO: fix potential incompatibility on realtime.send in OrioleDB. See https://github.com/orioledb/orioledb/issues/936
    @tag :skip_orioledb
    @tag timeout: :timer.minutes(3)
    test "track PID changes during WAL bloat creation", %{tenant: tenant, topic: topic} do
      {socket, _} = get_connection(tenant, RealtimeWeb.Socket.V2Serializer, role: "authenticated")
      full_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, full_topic, %{config: %{broadcast: %{self: true}, private: false}})
      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500
      assert Connect.ready?(tenant.external_id)

      {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      original_connect_pid = Connect.whereis(tenant.external_id)
      # Replication now starts asynchronously, so wait for the slot to be active before
      # reading the replication pid (it would otherwise race and return nil).
      await_replication_slot_active(db_conn, 15_000)
      original_db_pid = active_replication_slot_pid!(db_conn)
      original_replication_pid = ReplicationConnection.whereis(tenant.external_id)

      replication_ref = Process.monitor(original_replication_pid)

      generate_wal_bloat(tenant)
      terminate_bloat_connections(db_conn)

      assert_receive {:DOWN, ^replication_ref, :process, ^original_replication_pid, _}, 60_000

      assert Connect.ready?(tenant.external_id)
      {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
      new_db_pid = await_replication_slot_active(db_conn, 60_000)

      assert new_db_pid != original_db_pid
      assert ^original_connect_pid = Connect.whereis(tenant.external_id)
      assert original_replication_pid != ReplicationConnection.whereis(tenant.external_id)

      payload = %{"event" => "TEST", "payload" => %{"msg" => 1}, "type" => "broadcast"}
      WebsocketClient.send_event(socket, full_topic, "broadcast", payload)
      assert_receive %Message{event: "broadcast", payload: ^payload, topic: ^full_topic}, 500

      Postgrex.query!(db_conn, "INSERT INTO wal_test VALUES (1, 'test')", [])

      assert_receive %Message{
                       event: "broadcast",
                       payload: %{
                         "event" => "test",
                         "payload" => %{"value" => "test"},
                         "type" => "broadcast"
                       },
                       join_ref: nil,
                       ref: nil,
                       topic: ^full_topic
                     },
                     5000
    end
  end

  defp short_replication_watchdog(_context) do
    prev = Application.get_env(:realtime, :replication_watchdog_interval)
    ExUnit.Callbacks.on_exit(fn -> Application.put_env(:realtime, :replication_watchdog_interval, prev) end)
    Application.put_env(:realtime, :replication_watchdog_interval, 100)
  end

  defp active_replication_slot_pid!(db_conn) do
    %{rows: [[pid]]} =
      Postgrex.query!(
        db_conn,
        "SELECT active_pid FROM pg_replication_slots WHERE active_pid IS NOT NULL AND slot_name = 'supabase_realtime_messages_replication_slot_'",
        []
      )

    pid
  end

  # Waits for the slot to be not just active, but caught up (lag back under the
  # watchdog's threshold). A slot can briefly show an active_pid while still
  # replaying leftover WAL from the bloat, only for the watchdog to kill it again
  # moments later - checking the same condition the watchdog checks avoids that race.
  defp await_replication_slot_active(db_conn, timeout_ms) do
    slot_name = "supabase_realtime_messages_replication_slot_"

    case_wait Database.check_replication_slot(db_conn, slot_name),
      timeout: timeout_ms,
      interval: WaitForIt.Backoff.exponential(start: 25, max: 500) do
      :ok -> active_replication_slot_pid!(db_conn)
    else
      last -> flunk("Replication slot did not become active within #{timeout_ms}ms. Last check: #{inspect(last)}")
    end
  end

  defp generate_wal_bloat(tenant) do
    1..5
    |> Enum.map(fn _ ->
      Task.async(fn ->
        {:ok, conn} = Database.connect(tenant, "realtime_bloat", :stop)

        Postgrex.transaction(conn, fn tx ->
          Postgrex.query(tx, "INSERT INTO wal_test SELECT generate_series(1, 100000), repeat('x', 2000)", [])
          {:error, "test"}
        end)

        Process.exit(conn, :normal)
      end)
    end)
    |> Task.await_many(20_000)
  end

  defp terminate_bloat_connections(db_conn) do
    Postgrex.query!(
      db_conn,
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name = 'realtime_bloat'",
      []
    )
  end
end
