defmodule Realtime.Tenants.ReplicationConnectionTest do
  # Async false due to tweaking application env
  use Realtime.DataCase, async: false

  import ExUnit.CaptureLog

  alias Realtime.Api
  alias Realtime.Api.Message
  alias Realtime.Database
  alias Realtime.FeatureFlags
  alias Realtime.GenCounter
  alias Realtime.RateCounter
  alias Realtime.Tenants
  alias Realtime.Tenants.ReplicationConnection
  alias RealtimeWeb.Endpoint
  alias Realtime.Tenants.Repo

  @replication_slot_name "supabase_realtime_messages_replication_slot_test"

  setup context do
    slot = Application.get_env(:realtime, :slot_name_suffix)
    on_exit(fn -> Application.put_env(:realtime, :slot_name_suffix, slot) end)
    Application.put_env(:realtime, :slot_name_suffix, "test")

    maybe_checkout_tenant(context)
  end

  # Pure struct/binary tests (and those building their own tenant) never touch the context
  # tenant/db_conn, so they skip the expensive tenant checkout + postgres_changes setup.
  defp maybe_checkout_tenant(%{without_db: true}), do: :ok

  defp maybe_checkout_tenant(_context) do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)

    {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)
    Integrations.setup_postgres_changes(db_conn)
    Postgrex.query(db_conn, "SELECT pg_drop_replication_slot($1)", [@replication_slot_name])

    %{tenant: tenant, db_conn: db_conn}
  end

  describe "temporary process" do
    test "starts a temporary process", %{tenant: tenant} do
      assert {:ok, pid} = ReplicationConnection.start(tenant, self())
      assert conn = ReplicationConnection.whereis(tenant.external_id)

      # Brutally kill the process
      Process.exit(pid, :kill)
      assert_process_down(pid)
      assert_process_down(conn)

      # A temporary connection must stay unregistered after it dies.
      assert_always is_nil(ReplicationConnection.whereis(tenant.external_id)), timeout: 1_000, interval: 50
    end
  end

  describe "watchdog kills unresponsive replication" do
    setup do
      replication_watchdog_interval = Application.get_env(:realtime, :replication_watchdog_interval)
      replication_watchdog_timeout = Application.get_env(:realtime, :replication_watchdog_timeout)

      on_exit(fn ->
        Application.put_env(:realtime, :replication_watchdog_interval, replication_watchdog_interval)
        Application.put_env(:realtime, :replication_watchdog_timeout, replication_watchdog_timeout)
      end)

      Application.put_env(:realtime, :replication_watchdog_interval, 100)
      Application.put_env(:realtime, :replication_watchdog_timeout, 100)
    end

    test "watchdog kills replication connection that is not responding to health checks", %{tenant: tenant} do
      assert {:ok, pid} = ReplicationConnection.start(tenant, self())

      log =
        capture_log(fn ->
          # Let's make it not reply to health checks
          :sys.suspend(pid)

          reason = assert_process_down(pid, 400)
          assert reason == :watchdog_timeout
        end)

      assert log =~ "ReplicationConnectionWatchdogTimeout"
    end
  end

  describe "replication" do
    @tag without_db: true
    test "fails if tenant connection is invalid" do
      tenant =
        tenant_fixture(%{
          "extensions" => [
            %{
              "type" => "postgres_cdc_rls",
              "settings" => %{
                "db_host" => "127.0.0.1",
                "db_name" => "postgres",
                "db_user" => "supabase_admin",
                "db_password" => "postgres",
                "db_port" => "9001",
                "poll_interval" => 100,
                "poll_max_changes" => 100,
                "poll_max_record_bytes" => 1_048_576,
                "region" => "us-east-1",
                "ssl_enforced" => true
              }
            }
          ]
        })

      assert {:error, _} = ReplicationConnection.start(tenant, self())
    end

    test "starts a handler for the tenant and broadcasts", %{tenant: tenant, db_conn: db_conn} do
      start_link_supervised!(
        {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
        restart: :transient
      )

      topic = random_string()
      tenant_topic = Tenants.tenant_topic(tenant.external_id, topic, false)
      subscribe(tenant_topic, topic)

      total_messages = 5
      # Works with one insert per transaction
      for _ <- 1..total_messages do
        value = random_string()

        row =
          message_fixture(tenant, %{
            "topic" => topic,
            "private" => true,
            "event" => "INSERT",
            "payload" => %{"value" => value}
          })

        assert_receive {:socket_push, :text, data}
        message = data |> IO.iodata_to_binary() |> Jason.decode!()

        payload = %{
          "event" => "INSERT",
          "meta" => %{"id" => row.id},
          "payload" => %{
            "value" => value
          },
          "type" => "broadcast"
        }

        assert message == %{"event" => "broadcast", "payload" => payload, "ref" => nil, "topic" => topic}
      end

      Process.sleep(500)
      # Works with batch inserts
      messages =
        for _ <- 1..total_messages do
          Message.changeset(%Message{}, %{
            "topic" => topic,
            "private" => true,
            "event" => "INSERT",
            "extension" => "broadcast",
            "payload" => %{"value" => random_string()}
          })
        end

      {:ok, _} = Repo.insert_all_entries(db_conn, messages, Message)

      messages_received =
        for _ <- 1..total_messages, into: [] do
          assert_receive {:socket_push, :text, data}
          data |> IO.iodata_to_binary() |> Jason.decode!()
        end

      for row <- messages do
        assert Enum.count(messages_received, fn message_received ->
                 value = row |> Map.from_struct() |> get_in([:changes, :payload, "value"])

                 match?(
                   %{
                     "event" => "broadcast",
                     "payload" => %{
                       "event" => "INSERT",
                       "meta" => %{"id" => _id},
                       "payload" => %{
                         "value" => ^value
                       }
                     },
                     "ref" => nil,
                     "topic" => ^topic
                   },
                   message_received
                 )
               end) == 1
      end
    end

    test "starts a handler for the tenant and broadcasts to public channel", %{tenant: tenant, db_conn: db_conn} do
      start_link_supervised!(
        {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
        restart: :transient
      )

      topic = random_string()
      tenant_topic = Tenants.tenant_topic(tenant.external_id, topic, true)
      subscribe(tenant_topic, topic)

      total_messages = 5
      # Works with one insert per transaction
      for _ <- 1..total_messages do
        value = random_string()

        row =
          message_fixture(tenant, %{
            "topic" => topic,
            "private" => false,
            "event" => "INSERT",
            "payload" => %{"value" => value}
          })

        assert_receive {:socket_push, :text, data}
        message = data |> IO.iodata_to_binary() |> Jason.decode!()

        payload = %{
          "event" => "INSERT",
          "meta" => %{"id" => row.id},
          "payload" => %{
            "value" => value
          },
          "type" => "broadcast"
        }

        assert message == %{"event" => "broadcast", "payload" => payload, "ref" => nil, "topic" => topic}
      end

      Process.sleep(500)
      # Works with batch inserts
      messages =
        for _ <- 1..total_messages do
          Message.changeset(%Message{}, %{
            "topic" => topic,
            "private" => false,
            "event" => "INSERT",
            "extension" => "broadcast",
            "payload" => %{"value" => random_string()}
          })
        end

      {:ok, _} = Repo.insert_all_entries(db_conn, messages, Message)

      messages_received =
        for _ <- 1..total_messages, into: [] do
          assert_receive {:socket_push, :text, data}
          data |> IO.iodata_to_binary() |> Jason.decode!()
        end

      for row <- messages do
        assert Enum.count(messages_received, fn message_received ->
                 value = row |> Map.from_struct() |> get_in([:changes, :payload, "value"])

                 match?(
                   %{
                     "event" => "broadcast",
                     "payload" => %{
                       "event" => "INSERT",
                       "meta" => %{"id" => _id},
                       "payload" => %{
                         "value" => ^value
                       }
                     },
                     "ref" => nil,
                     "topic" => ^topic
                   },
                   message_received
                 )
               end) == 1
      end
    end

    test "does not broadcast messages already sent over WebSocket", %{tenant: tenant} do
      start_link_supervised!(
        {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
        restart: :transient
      )

      topic = random_string()
      tenant_topic = Tenants.tenant_topic(tenant.external_id, topic, false)
      subscribe(tenant_topic, topic)

      message_fixture(tenant, %{
        "topic" => topic,
        "private" => true,
        "event" => "INSERT",
        "extension" => "broadcast",
        "payload" => %{"value" => random_string()},
        "skip_broadcast" => true
      })

      refute_receive {:socket_push, :text, _}, 500

      message_fixture(tenant, %{
        "topic" => topic,
        "private" => true,
        "event" => "INSERT",
        "extension" => "broadcast",
        "payload" => %{"value" => random_string()}
      })

      assert_receive {:socket_push, :text, _}, 2000
    end

    test "replicates binary with exactly 16 bytes to test UUID conversion error", %{tenant: tenant} do
      start_link_supervised!(
        {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
        restart: :transient
      )

      topic = "db:job_scheduler"
      tenant_topic = Tenants.tenant_topic(tenant.external_id, topic, false)
      subscribe(tenant_topic, topic)
      payload = %{"value" => random_string()}

      row =
        message_fixture(tenant, %{
          "topic" => topic,
          "private" => true,
          "event" => "UPDATE",
          "extension" => "broadcast",
          "payload" => payload
        })

      row_id = row.id

      assert_receive {:socket_push, :text, data}, 2000
      message = data |> IO.iodata_to_binary() |> Jason.decode!()

      assert %{
               "event" => "broadcast",
               "payload" => %{
                 "event" => "UPDATE",
                 "meta" => %{"id" => ^row_id},
                 "payload" => received_payload,
                 "type" => "broadcast"
               },
               "ref" => nil,
               "topic" => ^topic
             } = message

      assert received_payload == payload
    end

    test "should not process unsupported relations", %{tenant: tenant, db_conn: db_conn} do
      # update
      queries = [
        "DROP TABLE IF EXISTS public.test",
        """
        CREATE TABLE "public"."test" (
        "id" int4 NOT NULL default nextval('test_id_seq'::regclass),
        "details" text,
        PRIMARY KEY ("id"));
        """
      ]

      Postgrex.transaction(db_conn, fn conn ->
        Enum.each(queries, &Postgrex.query!(conn, &1, []))
      end)

      logs =
        capture_log(fn ->
          start_link_supervised!(
            {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
            restart: :transient
          )

          assert_replication_started(db_conn, @replication_slot_name)
          assert_publication_contains_only_messages(db_conn, "supabase_realtime_messages_publication")

          # Add table to publication to test the error handling
          Postgrex.query!(db_conn, "ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE public.test", [])
          %{rows: [[_id]]} = Postgrex.query!(db_conn, "insert into test (details) values ('test') returning id", [])

          topic = "db:job_scheduler"
          tenant_topic = Tenants.tenant_topic(tenant.external_id, topic, false)
          subscribe(tenant_topic, topic)
          payload = %{"value" => random_string()}

          row =
            message_fixture(tenant, %{
              "topic" => topic,
              "private" => true,
              "event" => "UPDATE",
              "extension" => "broadcast",
              "payload" => payload
            })

          row_id = row.id

          assert_receive {:socket_push, :text, data}, 2000
          message = data |> IO.iodata_to_binary() |> Jason.decode!()

          assert %{
                   "event" => "broadcast",
                   "payload" => %{
                     "event" => "UPDATE",
                     "meta" => %{"id" => ^row_id},
                     "payload" => received_payload,
                     "type" => "broadcast"
                   },
                   "ref" => nil,
                   "topic" => ^topic
                 } = message

          assert received_payload == payload
        end)

      assert logs =~ "Unexpected relation on schema 'public' and table 'test'"
    end

    test "monitored pid stopping brings down ReplicationConnection ", %{tenant: tenant} do
      monitored_pid =
        spawn(fn ->
          receive do
            :stop -> :ok
          end
        end)

      logs =
        capture_log(fn ->
          pid =
            start_supervised!(
              {ReplicationConnection,
               %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: monitored_pid}},
              restart: :transient
            )

          send(monitored_pid, :stop)

          ref = Process.monitor(pid)
          assert_receive {:DOWN, ^ref, :process, ^pid, _reason}, 100
          refute Process.alive?(pid)
        end)

      assert logs =~ "Disconnecting broadcast changes handler in the step"
    end

    test "message without event logs error", %{tenant: tenant} do
      logs =
        capture_log(fn ->
          start_supervised!(
            {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
            restart: :transient
          )

          topic = random_string()
          tenant_topic = Tenants.tenant_topic(tenant.external_id, topic, false)
          assert :ok = Endpoint.subscribe(tenant_topic)

          message_fixture(tenant, %{
            "topic" => "some_topic",
            "private" => true,
            "payload" => %{"value" => "something"}
          })

          refute_receive _any, 500
        end)

      assert logs =~ "UnableToBroadcastChanges"
    end

    test "message that exceeds payload size is not broadcast and logs error", %{tenant: tenant} do
      logs =
        capture_log(fn ->
          start_supervised!(
            {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
            restart: :transient
          )

          topic = random_string()
          tenant_topic = Tenants.tenant_topic(tenant.external_id, topic, false)
          assert :ok = Endpoint.subscribe(tenant_topic)

          message_fixture(tenant, %{
            "event" => random_string(),
            "topic" => topic,
            "private" => true,
            "payload" => %{"data" => random_string(tenant.max_payload_size_in_kb * 1000 + 1)}
          })

          refute_receive _any, 500
        end)

      assert logs =~ "UnableToBroadcastChanges: :payload_size_exceeded"
    end

    test "message is not broadcast and logs error when rate limit is exceeded", %{tenant: tenant} do
      events_per_second_rate = Tenants.events_per_second_rate(tenant)

      # Start with a clean rate counter and push it well above the limit so the
      # avg stays over the threshold for the full duration of the test.
      RateCounterHelper.stop(tenant.external_id)
      {:ok, _} = RateCounter.new(events_per_second_rate)
      GenCounter.add(events_per_second_rate.id, tenant.max_events_per_second * 60 + 1)
      {:ok, %{limit: %{triggered: true}}} = RateCounterHelper.tick!(events_per_second_rate)

      logs =
        capture_log(fn ->
          start_supervised!(
            {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
            restart: :transient
          )

          topic = random_string()
          tenant_topic = Tenants.tenant_topic(tenant.external_id, topic, false)
          assert :ok = Endpoint.subscribe(tenant_topic)

          message_fixture(tenant, %{
            "event" => "INSERT",
            "topic" => topic,
            "private" => true,
            "payload" => %{"value" => random_string()}
          })

          refute_receive _any, 500
        end)

      assert logs =~ "UnableToBroadcastChanges: :too_many_requests"
    end

    test "payload without id", %{tenant: tenant, db_conn: db_conn} do
      start_link_supervised!(
        {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
        restart: :transient
      )

      topic = random_string()
      tenant_topic = Tenants.tenant_topic(tenant.external_id, topic, false)
      subscribe(tenant_topic, topic)

      value = "something"
      event = "INSERT"

      Postgrex.query!(
        db_conn,
        "SELECT realtime.send (json_build_object ('value', $1 :: text)::jsonb, $2 :: text, $3 :: text, TRUE::bool);",
        [value, event, topic]
      )

      {:ok, [%{id: id}]} = Repo.all(db_conn, from(m in Message), Message)

      assert_receive {:socket_push, :text, data}, 500
      message = data |> IO.iodata_to_binary() |> Jason.decode!()

      assert %{
               "event" => "broadcast",
               "payload" => %{
                 "event" => "INSERT",
                 "meta" => %{"id" => ^id},
                 "payload" => payload,
                 "type" => "broadcast"
               },
               "ref" => nil,
               "topic" => ^topic
             } = message

      assert payload == %{
               "value" => "something",
               "id" => id
             }
    end

    test "binary payload is replicated as UserBroadcast with binary encoding", %{tenant: tenant, db_conn: db_conn} do
      start_link_supervised!(
        {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
        restart: :transient
      )

      topic = random_string()
      tenant_topic = Tenants.tenant_topic(tenant.external_id, topic, false)
      assert :ok = Endpoint.subscribe(tenant_topic)

      Realtime.Tenants.create_messages_partitions(db_conn)

      binary = <<0xDE, 0xAD, 0xBE, 0xEF, 0x00, 0xFF>>
      event = "INSERT"

      Postgrex.query!(
        db_conn,
        "SELECT realtime.send_binary($1::bytea, $2::text, $3::text, TRUE::bool);",
        [binary, event, topic]
      )

      assert_receive %RealtimeWeb.Socket.UserBroadcast{
                       user_event: ^event,
                       user_payload_encoding: :binary,
                       user_payload: ^binary,
                       metadata: %{"id" => _id}
                     },
                     500
    end

    test "binary payload that exceeds payload size is not broadcast and logs error", %{tenant: tenant, db_conn: db_conn} do
      logs =
        capture_log(fn ->
          start_supervised!(
            {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
            restart: :transient
          )

          topic = random_string()
          tenant_topic = Tenants.tenant_topic(tenant.external_id, topic, false)
          assert :ok = Endpoint.subscribe(tenant_topic)

          Realtime.Tenants.create_messages_partitions(db_conn)

          binary = :binary.copy(<<0>>, tenant.max_payload_size_in_kb * 1000 + 1000)
          event = "INSERT"

          Postgrex.query!(
            db_conn,
            "SELECT realtime.send_binary($1::bytea, $2::text, $3::text, TRUE::bool);",
            [binary, event, topic]
          )

          refute_receive _any, 500
        end)

      assert logs =~ "UnableToBroadcastChanges: :payload_size_exceeded"
    end

    test "empty binary payload is replicated as UserBroadcast with binary encoding", %{tenant: tenant, db_conn: db_conn} do
      start_link_supervised!(
        {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
        restart: :transient
      )

      topic = random_string()
      tenant_topic = Tenants.tenant_topic(tenant.external_id, topic, false)
      assert :ok = Endpoint.subscribe(tenant_topic)

      Realtime.Tenants.create_messages_partitions(db_conn)

      event = "INSERT"

      Postgrex.query!(
        db_conn,
        "SELECT realtime.send_binary($1::bytea, $2::text, $3::text, TRUE::bool);",
        [<<>>, event, topic]
      )

      assert_receive %RealtimeWeb.Socket.UserBroadcast{
                       user_event: ^event,
                       user_payload_encoding: :binary,
                       user_payload: <<>>,
                       metadata: %{"id" => _id}
                     },
                     500
    end

    test "rejects insert with both payload and binary_payload set", %{db_conn: db_conn} do
      Realtime.Tenants.create_messages_partitions(db_conn)

      assert {:error, %Postgrex.Error{postgres: %{code: :check_violation, constraint: "messages_payload_exclusive"}}} =
               Postgrex.query(
                 db_conn,
                 """
                 INSERT INTO realtime.messages (payload, binary_payload, event, topic, private, extension)
                 VALUES ($1::jsonb, $2::bytea, 'evt', $3::text, false, 'broadcast')
                 """,
                 [%{"value" => "x"}, <<1, 2, 3>>, random_string()]
               )
    end

    test "payload including id", %{tenant: tenant, db_conn: db_conn} do
      start_link_supervised!(
        {ReplicationConnection, %ReplicationConnection{tenant_id: tenant.external_id, monitored_pid: self()}},
        restart: :transient
      )

      topic = random_string()
      tenant_topic = Tenants.tenant_topic(tenant.external_id, topic, false)
      subscribe(tenant_topic, topic)

      id = "123456"
      value = "something"
      event = "INSERT"

      Postgrex.query!(
        db_conn,
        "SELECT realtime.send (json_build_object ('value', $1 :: text, 'id', $2 :: text)::jsonb, $3 :: text, $4 :: text, TRUE::bool);",
        [value, id, event, topic]
      )

      {:ok, [%{id: message_id}]} = Repo.all(db_conn, from(m in Message), Message)

      assert_receive {:socket_push, :text, data}, 500
      message = data |> IO.iodata_to_binary() |> Jason.decode!()

      assert %{
               "event" => "broadcast",
               "payload" => %{
                 "meta" => %{"id" => ^message_id},
                 "event" => "INSERT",
                 "payload" => %{"value" => "something", "id" => ^id},
                 "type" => "broadcast"
               },
               "ref" => nil,
               "topic" => ^topic
             } = message
    end

    test "fails on existing replication slot", %{tenant: tenant} do
      {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)
      name = @replication_slot_name

      create_replication_slot(db_conn, name, plugin: "test_decoding")

      assert {:error, {:shutdown, :replication_slot_in_use}} =
               ReplicationConnection.start(tenant, self())

      Postgrex.query!(db_conn, "SELECT pg_drop_replication_slot($1)", [name])
    end

    test "times out when init takes too long", %{tenant: tenant} do
      assert {:error, :replication_connection_timeout} = ReplicationConnection.start(tenant, self(), 0)
    end

    test "handle standby connections exceeds max_wal_senders", %{tenant: tenant} do
      {:ok, settings} = Database.from_tenant(tenant, "realtime_test", :stop)
      opts = Database.opts(settings)
      parent = self()

      {:ok, table_conn} = Database.connect(tenant, "realtime_test", :stop)

      # Enough connections to occupy every WAL sender, read from the server
      # rather than hardcoded: the budget differs per image, and a Multigres
      # cluster spends some of it on its own replication.
      %{rows: [[max_wal_senders]]} = Postgrex.query!(table_conn, "SELECT current_setting('max_wal_senders')::int", [])
      GenServer.stop(table_conn)

      pids =
        for i <- 0..max_wal_senders do
          replication_slot_opts =
            %PostgresReplication{
              connection_opts: opts,
              table: "test",
              output_plugin: "pgoutput",
              output_plugin_options: [proto_version: "1", publication_names: "test_#{i}_publication"],
              handler_module: Replication.TestHandler,
              publication_name: "test_#{i}_publication",
              replication_slot_name: "test_#{i}_slot"
            }

          spawn(fn ->
            {:ok, pid} = PostgresReplication.start_link(replication_slot_opts)
            send(parent, :ready)

            receive do
              :stop -> Process.exit(pid, :kill)
            end
          end)
        end

      on_exit(fn ->
        Enum.each(pids, &send(&1, :stop))
        Process.sleep(2000)
      end)

      assert_receive :ready, 5000
      assert_receive :ready, 5000
      assert_receive :ready, 5000
      assert_receive :ready, 5000

      assert {:error, :max_wal_senders_reached} = ReplicationConnection.start(tenant, self())
    end

    test "handles WAL pressure gracefully", %{tenant: tenant} do
      {:ok, replication_pid} = ReplicationConnection.start(tenant, self())

      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)
      on_exit(fn -> Process.exit(conn, :normal) end)

      large_payload = String.duplicate("x", 10 * 1024 * 1024)

      for i <- 1..5 do
        message_fixture_with_conn(tenant, conn, %{
          "topic" => "stress_#{i}",
          "private" => true,
          "event" => "INSERT",
          "payload" => %{"data" => large_payload}
        })
      end

      assert Process.alive?(replication_pid)
    end
  end

  describe "publication validation steps" do
    test "if proper tables are included, starts replication", %{tenant: tenant, db_conn: db_conn} do
      publication_name = "supabase_realtime_messages_publication"

      enable_broadcast_persistence_flag!(tenant)
      Postgrex.query!(db_conn, "DROP PUBLICATION IF EXISTS #{publication_name}", [])
      create_messages_publication(db_conn, publication_name)

      logs =
        capture_log(fn ->
          {:ok, pid} = ReplicationConnection.start(tenant, self())

          assert_replication_started(db_conn, @replication_slot_name)
          assert Process.alive?(pid)
          assert_publication_contains_only_messages(db_conn, publication_name)

          Process.exit(pid, :shutdown)
        end)

      refute logs =~ "Recreating"
    end

    test "keeps publication untouched when broadcast persistence is disabled", %{tenant: tenant, db_conn: db_conn} do
      publication_name = "supabase_realtime_messages_publication"

      Postgrex.query!(db_conn, "DROP PUBLICATION IF EXISTS #{publication_name}", [])
      Postgrex.query!(db_conn, "CREATE PUBLICATION #{publication_name} FOR TABLE realtime.messages", [])

      logs =
        capture_log(fn ->
          {:ok, pid} = ReplicationConnection.start(tenant, self())

          assert_replication_started(db_conn, @replication_slot_name)

          assert %{rows: [[true, true, true, true, false]]} =
                   Postgrex.query!(
                     db_conn,
                     "SELECT pubinsert, pubupdate, pubdelete, pubtruncate, pubviaroot FROM pg_publication WHERE pubname = $1",
                     [publication_name]
                   )

          Process.exit(pid, :shutdown)
        end)

      refute logs =~ "Recreating"
    end

    @tag :requires_pg_150000
    test "creates publication that filters out messages sent over WebSocket and still allows writes", %{
      tenant: tenant,
      db_conn: db_conn
    } do
      publication_name = "supabase_realtime_messages_publication"

      enable_broadcast_persistence_flag!(tenant)
      Postgrex.query!(db_conn, "DROP PUBLICATION IF EXISTS #{publication_name}", [])

      capture_log(fn ->
        {:ok, pid} = ReplicationConnection.start(tenant, self())

        assert_replication_started(db_conn, @replication_slot_name)

        assert %{rows: [["realtime", "messages", "(NOT skip_broadcast)", true, false, false, false, true]]} =
                 publication_options(db_conn, publication_name)

        message =
          message_fixture(tenant, %{
            "topic" => random_string(),
            "private" => true,
            "event" => "INSERT",
            "payload" => %{"value" => random_string()}
          })

        assert {:ok, %{num_rows: 1}} =
                 Postgrex.query(db_conn, "UPDATE realtime.messages SET event = 'UPDATE' WHERE id::text = $1", [
                   message.id
                 ])

        assert {:ok, %{num_rows: 1}} =
                 Postgrex.query(db_conn, "DELETE FROM realtime.messages WHERE id::text = $1", [message.id])

        Process.exit(pid, :shutdown)
      end)
    end

    @tag :requires_pg_150000
    test "recreates publication without a row filter", %{tenant: tenant, db_conn: db_conn} do
      publication_name = "supabase_realtime_messages_publication"

      enable_broadcast_persistence_flag!(tenant)
      Postgrex.query!(db_conn, "DROP PUBLICATION IF EXISTS #{publication_name}", [])
      Postgrex.query!(db_conn, "CREATE PUBLICATION #{publication_name} FOR TABLE realtime.messages", [])

      logs =
        capture_log(fn ->
          {:ok, pid} = ReplicationConnection.start(tenant, self())

          assert_replication_started(db_conn, @replication_slot_name)

          assert %{rows: [["realtime", "messages", "(NOT skip_broadcast)", true, false, false, false, true]]} =
                   publication_options(db_conn, publication_name)

          Process.exit(pid, :shutdown)
        end)

      assert logs =~ "Recreating"
    end

    test "disconnects when the publication cannot be created", %{tenant: tenant, db_conn: db_conn} do
      publication_name = "supabase_realtime_messages_publication"

      # No publication yet (forces the CREATE PUBLICATION path) and no table to publish,
      # so `CREATE PUBLICATION ... FOR TABLE realtime.messages` fails with undefined_table.
      Postgrex.query!(db_conn, "DROP PUBLICATION IF EXISTS #{publication_name}", [])
      Postgrex.query!(db_conn, "DROP TABLE IF EXISTS realtime.messages CASCADE", [])

      capture_log(fn ->
        assert {:error, "Error creating publication:" <> _} = ReplicationConnection.start(tenant, self())
      end)
    end

    test "disconnects when the publication cannot be recreated", %{tenant: tenant, db_conn: db_conn} do
      publication_name = "supabase_realtime_messages_publication"

      # Publication exists but with the wrong table, so validation triggers the
      # `DROP ...; CREATE ...` recreate path. With realtime.messages gone, the CREATE half
      # of that multi-statement fails, exercising the list-of-results error branch.
      Postgrex.query!(db_conn, "DROP PUBLICATION IF EXISTS #{publication_name}", [])
      Postgrex.query!(db_conn, "CREATE TABLE IF NOT EXISTS public.wrong_table (id int)", [])
      Postgrex.query!(db_conn, "CREATE PUBLICATION #{publication_name} FOR TABLE public.wrong_table", [])
      Postgrex.query!(db_conn, "DROP TABLE IF EXISTS realtime.messages CASCADE", [])

      logs =
        capture_log(fn ->
          assert {:error, "Error creating publication:" <> _} = ReplicationConnection.start(tenant, self())
        end)

      assert logs =~ "Recreating"
    end

    test "if includes unexpected tables, recreates publication", %{tenant: tenant, db_conn: db_conn} do
      publication_name = "supabase_realtime_messages_publication"

      Postgrex.query!(db_conn, "DROP PUBLICATION IF EXISTS #{publication_name}", [])
      Postgrex.query!(db_conn, "CREATE TABLE IF NOT EXISTS public.wrong_table (id int)", [])
      Postgrex.query!(db_conn, "CREATE PUBLICATION #{publication_name} FOR TABLE public.wrong_table", [])

      logs =
        capture_log(fn ->
          {:ok, pid} = ReplicationConnection.start(tenant, self())

          assert_replication_started(db_conn, @replication_slot_name)
          assert Process.alive?(pid)
          assert_publication_contains_only_messages(db_conn, publication_name)

          Process.exit(pid, :shutdown)
        end)

      assert logs =~ "Recreating"
    end

    test "recreates publication if it has no tables", %{tenant: tenant, db_conn: db_conn} do
      publication_name = "supabase_realtime_messages_publication"

      Postgrex.query!(db_conn, "DROP PUBLICATION IF EXISTS #{publication_name}", [])
      Postgrex.query!(db_conn, "CREATE PUBLICATION #{publication_name}", [])

      logs =
        capture_log(fn ->
          {:ok, pid} = ReplicationConnection.start(tenant, self())

          assert_replication_started(db_conn, @replication_slot_name)
          assert Process.alive?(pid)
          assert_publication_contains_only_messages(db_conn, publication_name)

          Process.exit(pid, :shutdown)
        end)

      assert logs =~ "Recreating"
    end

    test "recreates publication if it has expected tables and unexpected tables under same publication", %{
      tenant: tenant,
      db_conn: db_conn
    } do
      publication_name = "supabase_realtime_messages_publication"

      Postgrex.query!(db_conn, "DROP PUBLICATION IF EXISTS #{publication_name}", [])
      Postgrex.query!(db_conn, "CREATE TABLE IF NOT EXISTS public.extra_table (id int)", [])

      Postgrex.query!(
        db_conn,
        "CREATE PUBLICATION #{publication_name} FOR TABLE realtime.messages, public.extra_table",
        []
      )

      logs =
        capture_log(fn ->
          {:ok, pid} = ReplicationConnection.start(tenant, self())

          assert_replication_started(db_conn, @replication_slot_name)
          assert Process.alive?(pid)
          assert_publication_contains_only_messages(db_conn, publication_name)

          Process.exit(pid, :shutdown)
        end)

      assert logs =~ "Recreating"
    end
  end

  describe "handle_result/2 for step :start_replication_slot" do
    @describetag without_db: true
    test "returns disconnect when error has postgres map with message" do
      error = %Postgrex.Error{
        postgres: %{
          code: :undefined_table,
          message: "relation \"realtime.messages\" does not exist"
        }
      }

      state = %ReplicationConnection{step: :start_replication_slot}

      assert {:disconnect, "Error starting replication: relation \"realtime.messages\" does not exist"} =
               ReplicationConnection.handle_result(error, state)
    end

    test "returns disconnect when error has top-level message and no postgres map" do
      error = %Postgrex.Error{message: "connection closed"}
      state = %ReplicationConnection{step: :start_replication_slot}

      assert {:disconnect, "Error starting replication: connection closed"} =
               ReplicationConnection.handle_result(error, state)
    end

    test "returns disconnect when results list contains a Postgrex.Error" do
      error = %Postgrex.Error{message: "something went wrong"}
      state = %ReplicationConnection{step: :start_replication_slot}

      assert {:disconnect, "Error starting replication: something went wrong"} =
               ReplicationConnection.handle_result([error], state)
    end
  end

  describe "whereis/1" do
    test "returns pid if exists", %{tenant: tenant} do
      {:ok, pid} = ReplicationConnection.start(tenant, self())
      assert ReplicationConnection.whereis(tenant.external_id) == pid
      Process.exit(pid, :shutdown)
    end

    @tag without_db: true
    test "returns nil if not exists" do
      assert ReplicationConnection.whereis(random_string()) == nil
    end
  end

  def handle_telemetry(event, measures, metadata, pid: pid), do: send(pid, {event, measures, metadata})

  describe "handle_data/2 for KeepAlive" do
    @describetag without_db: true
    test "always sends standby_status when reply is :later" do
      wal_end = 1_000_000
      # KeepAlive binary: ?k + wal_end(64) + clock(64) + reply(8), reply=0 means :later
      keep_alive = <<?k, wal_end::64, 0::64, 0::8>>
      state = %ReplicationConnection{tenant_id: "test", step: :streaming}

      assert {:noreply, message, ^state} = ReplicationConnection.handle_data(keep_alive, state)

      assert [<<?r, received::64, flushed::64, applied::64, _clock::64, reply_byte::8>>] = message
      assert received == wal_end + 1
      assert flushed == wal_end + 1
      assert applied == wal_end + 1
      # :later maps to reply byte 0
      assert reply_byte == 0
    end

    test "sends standby_status when reply is :now" do
      wal_end = 2_000_000
      keep_alive = <<?k, wal_end::64, 0::64, 1::8>>
      state = %ReplicationConnection{tenant_id: "test", step: :streaming}

      assert {:noreply, message, ^state} = ReplicationConnection.handle_data(keep_alive, state)

      assert [<<?r, received::64, flushed::64, applied::64, _clock::64, reply_byte::8>>] = message
      assert received == wal_end + 1
      assert flushed == wal_end + 1
      assert applied == wal_end + 1
      # :now maps to reply byte 1
      assert reply_byte == 1
    end
  end

  describe "telemetry events" do
    setup do
      :telemetry.detach(__MODULE__)

      :telemetry.attach(
        __MODULE__,
        [:realtime, :tenants, :broadcast_from_database],
        &__MODULE__.handle_telemetry/4,
        pid: self()
      )
    end

    test "receives telemetry event", %{tenant: %{external_id: external_id} = tenant} do
      start_link_supervised!(
        {ReplicationConnection, %ReplicationConnection{tenant_id: external_id, monitored_pid: self()}},
        restart: :transient
      )

      topic = random_string()
      tenant_topic = Tenants.tenant_topic(external_id, topic, false)
      subscribe(tenant_topic, topic)

      message_fixture(tenant, %{
        "topic" => topic,
        "private" => true,
        "event" => "INSERT",
        "payload" => %{"value" => random_string()}
      })

      assert_receive {:socket_push, :text, data}, 500
      message = data |> IO.iodata_to_binary() |> Jason.decode!()

      assert %{"event" => "broadcast", "payload" => _, "ref" => nil, "topic" => ^topic} = message

      assert_receive {[:realtime, :tenants, :broadcast_from_database],
                      %{latency_committed_at: latency_committed_at, latency_inserted_at: latency_inserted_at},
                      %{tenant: ^external_id}}

      assert latency_committed_at
      assert latency_inserted_at
    end
  end

  defp subscribe(tenant_topic, topic) do
    fastlane =
      RealtimeWeb.RealtimeChannel.MessageDispatcher.fastlane_metadata(
        self(),
        Phoenix.Socket.V1.JSONSerializer,
        topic,
        :warning,
        "tenant_id"
      )

    Endpoint.subscribe(tenant_topic, metadata: fastlane)
  end

  defp assert_process_down(pid, timeout \\ 100) do
    ref = Process.monitor(pid)
    assert_receive {:DOWN, ^ref, :process, ^pid, reason}, timeout
    reason
  end

  defp message_fixture_with_conn(_tenant, conn, override) do
    create_attrs = %{
      "topic" => random_string(),
      "extension" => "broadcast"
    }

    override = override |> Enum.map(fn {k, v} -> {"#{k}", v} end) |> Map.new()

    {:ok, message} =
      create_attrs
      |> Map.merge(override)
      |> TenantConnection.create_message(conn)

    message
  end

  # Enables the `broadcast_persistence` flag for real: the flag is created and pushed into the local
  # FeatureFlags cache so the replication connection process reads it synchronously, and torn down
  # afterwards so it does not leak into other tests via the shared in-memory cache.
  defp enable_broadcast_persistence_flag!(tenant) do
    {:ok, flag} = Api.upsert_feature_flag(%{name: "broadcast_persistence", enabled: false})
    FeatureFlags.Cache.update_cache(flag)
    {:ok, tenant} = FeatureFlags.set_tenant_flag("broadcast_persistence", tenant.external_id, true)
    Realtime.Tenants.Cache.update_cache(tenant)
    on_exit(fn -> FeatureFlags.Cache.invalidate_cache("broadcast_persistence") end)
  end

  defp create_messages_publication(db_conn, publication_name) do
    %{rows: [[server_version_num]]} = Postgrex.query!(db_conn, "SELECT current_setting('server_version_num')::int", [])

    row_filter = if server_version_num >= 150_000, do: " WHERE (NOT skip_broadcast)", else: ""

    Postgrex.query!(
      db_conn,
      "CREATE PUBLICATION #{publication_name} FOR TABLE realtime.messages#{row_filter} WITH (publish = 'insert', publish_via_partition_root = true)",
      []
    )
  end

  defp publication_options(db_conn, publication_name) do
    Postgrex.query!(
      db_conn,
      """
      SELECT t.schemaname, t.tablename, t.rowfilter, p.pubinsert, p.pubupdate, p.pubdelete, p.pubtruncate, p.pubviaroot
      FROM pg_publication_tables t
      JOIN pg_publication p ON p.pubname = t.pubname
      WHERE t.pubname = $1
      """,
      [publication_name]
    )
  end

  defp assert_publication_contains_only_messages(db_conn, publication_name) do
    %{rows: rows} =
      Postgrex.query!(
        db_conn,
        "SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = $1",
        [publication_name]
      )

    valid_tables =
      Enum.all?(rows, fn [schema, table] ->
        schema == "realtime" and (table == "messages" or String.starts_with?(table, "messages_"))
      end)

    assert valid_tables, "Expected only realtime.messages or its partitions, got: #{inspect(rows)}"
  end

  defp assert_replication_started(db_conn, slot_name, timeout_ms \\ 100, interval_ms \\ 10) do
    case_wait Postgrex.query!(db_conn, "SELECT active FROM pg_replication_slots WHERE slot_name = $1", [
                slot_name
              ]),
              timeout: timeout_ms,
              interval: interval_ms do
      %{rows: [[true]]} -> :ok
    else
      %{rows: rows} -> flunk("Replication slot #{slot_name} did not become active. Last rows: #{inspect(rows)}")
    end
  end
end
