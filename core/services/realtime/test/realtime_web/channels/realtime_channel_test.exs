defmodule RealtimeWeb.RealtimeChannelTest do
  use RealtimeWeb.ChannelCase, async: true
  use Mimic

  setup :set_mimic_from_context

  import ExUnit.CaptureLog
  import WaitForIt

  alias Phoenix.Channel.Server
  alias Phoenix.Socket

  alias Realtime.Tenants.Authorization
  alias Realtime.Tenants.Connect
  alias Realtime.RateCounter
  alias Realtime.Tenants
  alias RealtimeWeb.UserSocket

  setup do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    {:ok, db_conn} = Realtime.Database.connect(tenant, "realtime_test", :stop)
    Integrations.setup_postgres_changes(db_conn)
    GenServer.stop(db_conn)
    Realtime.Tenants.Cache.update_cache(tenant)
    {:ok, tenant: tenant}
  end

  setup :rls_context

  describe "join - tenant not found" do
    test "sends disconnect to transport_pid and logs TenantNotFound", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      stub(Realtime.Tenants.Cache, :fetch_tenant_by_external_id, fn _id ->
        {:error, :tenant_not_found}
      end)

      log =
        capture_log(fn ->
          assert {:error, _} = subscribe_and_join(socket, "realtime:test", %{})
        end)

      assert log =~ "TenantNotFound"
      assert_received %Phoenix.Socket.Broadcast{event: "disconnect"}
    end
  end

  describe "process flags" do
    test "max heap size is set for both transport and channel processes", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      assert Process.info(socket.transport_pid, :max_heap_size) ==
               {:max_heap_size, %{error_logger: true, include_shared_binaries: false, kill: true, size: 6_250_000}}

      assert {:ok, _, socket} = subscribe_and_join(socket, "realtime:test", %{})

      assert Process.info(socket.channel_pid, :max_heap_size) ==
               {:max_heap_size, %{error_logger: true, include_shared_binaries: false, kill: true, size: 6_250_000}}
    end

    # We don't test the socket because on unit tests Phoenix is not setting the fullsweep_after config
    test "fullsweep_after is set on channel process", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      assert {:ok, _, socket} = subscribe_and_join(socket, "realtime:test", %{})

      assert Process.info(socket.channel_pid, :fullsweep_after) == {:fullsweep_after, 20}
    end
  end

  describe "postgres changes" do
    test "subscribes to inserts", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      config = %{
        "postgres_changes" => [%{"event" => "INSERT", "schema" => "public", "table" => "test"}]
      }

      assert {:ok, reply, _socket} = subscribe_and_join(socket, "realtime:test", %{"config" => config})

      assert %{postgres_changes: [%{:id => sub_id, "event" => "INSERT", "schema" => "public", "table" => "test"}]} =
               reply

      assert_push "system",
                  %{message: "Subscribed to PostgreSQL", status: "ok", extension: "postgres_changes", channel: "test"},
                  5000

      {:ok, conn} = Connect.lookup_or_start_connection(tenant.external_id)
      %{rows: [[id]]} = Postgrex.query!(conn, "insert into test (details) values ('test') returning id", [])

      assert_push "postgres_changes", %{data: data, ids: [^sub_id]}, 500

      # we encode and decode because the data is a Jason.Fragment
      assert %{
               "table" => "test",
               "type" => "INSERT",
               "record" => %{"details" => "test", "id" => ^id, "binary_data" => nil},
               "columns" => [
                 %{"name" => "id", "type" => "int4"},
                 %{"name" => "details", "type" => "text"},
                 %{"name" => "binary_data", "type" => "bytea"}
               ],
               "errors" => nil,
               "schema" => "public",
               "commit_timestamp" => _
             } = Jason.encode!(data) |> Jason.decode!()

      refute_receive %Socket.Message{}
      refute_receive %Socket.Reply{}
    end

    test "multiple subscriptions", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      config = %{
        "postgres_changes" => [
          %{"event" => "INSERT", "schema" => "public", "table" => "test"},
          %{"event" => "DELETE", "schema" => "public", "table" => "test"}
        ]
      }

      assert {:ok, reply, _socket} = subscribe_and_join(socket, "realtime:test", %{"config" => config})

      assert %{
               postgres_changes: [
                 %{:id => insert_sub_id, "event" => "INSERT", "schema" => "public", "table" => "test"},
                 %{
                   :id => delete_sub_id,
                   "event" => "DELETE",
                   "schema" => "public",
                   "table" => "test"
                 }
               ]
             } =
               reply

      assert_push "system",
                  %{message: "Subscribed to PostgreSQL", status: "ok", extension: "postgres_changes", channel: "test"},
                  5000

      {:ok, conn} = Connect.lookup_or_start_connection(tenant.external_id)
      # Insert, update and delete but update should not be received
      %{rows: [[id]]} = Postgrex.query!(conn, "insert into test (details) values ('test') returning id", [])
      Postgrex.query!(conn, "update test set details = 'test' where id = $1", [id])
      Postgrex.query!(conn, "delete from test where id = $1", [id])

      assert_push "postgres_changes", %{data: data, ids: [^insert_sub_id]}, 500

      # we encode and decode because the data is a Jason.Fragment
      assert %{
               "table" => "test",
               "type" => "INSERT",
               "record" => %{"details" => "test", "id" => ^id},
               "columns" => [
                 %{"name" => "id", "type" => "int4"},
                 %{"name" => "details", "type" => "text"},
                 %{"name" => "binary_data", "type" => "bytea"}
               ],
               "errors" => nil,
               "schema" => "public",
               "commit_timestamp" => _
             } = Jason.encode!(data) |> Jason.decode!()

      assert_push "postgres_changes", %{data: data, ids: [^delete_sub_id]}, 500

      # we encode and decode because the data is a Jason.Fragment
      assert %{
               "table" => "test",
               "type" => "DELETE",
               "old_record" => %{"id" => ^id},
               "columns" => [
                 %{"name" => "id", "type" => "int4"},
                 %{"name" => "details", "type" => "text"},
                 %{"name" => "binary_data", "type" => "bytea"}
               ],
               "errors" => nil,
               "schema" => "public",
               "commit_timestamp" => _
             } = Jason.encode!(data) |> Jason.decode!()

      refute_receive _any
    end

    test "malformed subscription params", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      config = %{
        "postgres_changes" => [%{"event" => "*", "schema" => "public", "table" => "test", "filter" => "wrong"}]
      }

      assert {:ok, reply, socket} = subscribe_and_join(socket, "realtime:test", %{"config" => config})

      assert %{postgres_changes: [%{"event" => "*", "schema" => "public", "table" => "test"}]} = reply

      assert_push "system",
                  %{
                    message: "Error parsing `filter` params: [\"wrong\"]",
                    status: "error",
                    extension: "postgres_changes",
                    channel: "test"
                  },
                  3000

      socket = Server.socket(socket.channel_pid)

      # It won't re-subscribe
      assert socket.assigns.pg_sub_ref == nil
    end

    test "invalid subscription table does not exist", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      config = %{
        "postgres_changes" => [%{"event" => "*", "schema" => "public", "table" => "doesnotexist"}]
      }

      assert {:ok, reply, socket} = subscribe_and_join(socket, "realtime:test", %{"config" => config})

      assert %{postgres_changes: [%{"event" => "*", "schema" => "public", "table" => "doesnotexist"}]} = reply

      assert_push "system",
                  %{
                    message:
                      "Unable to subscribe to changes with given parameters. Please check Realtime is enabled for the given connect parameters: [event: *, schema: public, table: doesnotexist, filters: [], select: nil]",
                    status: "error",
                    extension: "postgres_changes",
                    channel: "test"
                  },
                  5000

      socket = Server.socket(socket.channel_pid)

      # It won't re-subscribe
      assert socket.assigns.pg_sub_ref == nil
    end

    test "invalid subscription column does not exist", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      config = %{
        "postgres_changes" => [
          %{"event" => "*", "schema" => "public", "table" => "test", "filter" => "notacolumn=eq.123"}
        ]
      }

      assert {:ok, reply, socket} = subscribe_and_join(socket, "realtime:test", %{"config" => config})

      assert %{postgres_changes: [%{"event" => "*", "schema" => "public", "table" => "test"}]} = reply

      assert_push "system",
                  %{
                    message:
                      "Unable to subscribe to changes with given parameters. An exception happened so please check your connect parameters: [event: *, schema: public, table: test, filters: [{\"notacolumn\", \"eq\", \"123\", false}], select: nil]. Exception: ERROR P0001 (raise_exception) invalid column for filter notacolumn",
                    status: "error",
                    extension: "postgres_changes",
                    channel: "test"
                  },
                  5000

      socket = Server.socket(socket.channel_pid)

      # It won't re-subscribe
      assert socket.assigns.pg_sub_ref == nil
    end

    test "connection error", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      config = %{
        "postgres_changes" => [%{"event" => "*", "schema" => "public", "table" => "test"}]
      }

      conn = spawn(fn -> :ok end)
      # Let's set the subscription manager conn to be a pid that is no more

      assert {:ok, reply, socket} = subscribe_and_join(socket, "realtime:test", %{"config" => config})

      assert %{postgres_changes: [%{"event" => "*", "schema" => "public", "table" => "test"}]} = reply

      assert_push "system",
                  %{
                    message: "Subscribed to PostgreSQL",
                    status: "ok",
                    extension: "postgres_changes",
                    channel: "test"
                  },
                  5000

      {:ok, manager_pid, _conn} = Extensions.PostgresCdcRls.get_manager_conn(tenant.external_id)
      Extensions.PostgresCdcRls.update_meta(tenant.external_id, manager_pid, conn)

      assert {:ok, _reply, socket} = subscribe_and_join(socket, "realtime:test_fail", %{"config" => config})

      assert_push "system",
                  %{message: message, status: "error", extension: "postgres_changes", channel: "test_fail"},
                  5000

      assert message =~ "{:error, \"Too many database timeouts\"}"
      socket = Server.socket(socket.channel_pid)

      # It will try again in the future
      assert socket.assigns.pg_sub_ref != nil
    end

    test "wait rejects the join when the subscription is not established in time", %{tenant: tenant} do
      expect(Extensions.PostgresCdcRls, :handle_connect, 2, fn _ -> nil end)

      assert {:error,
              %{
                reason:
                  "PostgresChangesSubscribeTimeout: Timed out after 100ms waiting for the postgres_changes subscription"
              }} = join_waiting_for_postgres_changes(tenant, %{"wait" => true, "timeout" => 100})
    end

    test "does not count a channel whose postgres_changes join is rejected", %{tenant: tenant} do
      expect(Extensions.PostgresCdcRls, :handle_connect, 2, fn _ -> nil end)

      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      assert {:error, %{reason: "PostgresChangesSubscribeTimeout: " <> _}} =
               subscribe_and_join(socket, "realtime:test", %{
                 "config" => %{
                   "postgres_changes" => [%{"event" => "INSERT", "schema" => "public"}],
                   "postgres_changes_options" => %{"wait" => true, "timeout" => 100}
                 }
               })

      assert Process.alive?(socket.transport_pid)
      refute Realtime.UsersCounter.already_counted?(socket.transport_pid, tenant.external_id)
    end

    test "wait does not start a connect attempt once the timeout has passed", %{tenant: tenant} do
      expect(Extensions.PostgresCdcRls, :handle_connect, fn _ ->
        Process.sleep(300)
        nil
      end)

      assert {:error, %{reason: "PostgresChangesSubscribeTimeout: " <> _}} =
               join_waiting_for_postgres_changes(tenant, %{"wait" => true, "timeout" => 200})
    end

    test "wait lets an in-flight subscription attempt finish before rejecting the join", %{tenant: tenant} do
      test_pid = self()
      stub(Extensions.PostgresCdcRls, :handle_connect, fn _ -> {:ok, {test_pid, test_pid}} end)

      expect(Extensions.PostgresCdcRls, :handle_after_connect, fn _, _, _, _ ->
        Process.sleep(300)
        {:error, :boom}
      end)

      {elapsed, result} =
        :timer.tc(
          fn -> join_waiting_for_postgres_changes(tenant, %{"wait" => true, "timeout" => 200}) end,
          :millisecond
        )

      assert {:error, %{reason: "PostgresChangesSubscribeTimeout: " <> _}} = result
      assert elapsed >= 300
    end

    test "wait retries a transient subscribe failure until it succeeds", %{tenant: tenant} do
      expect(Extensions.PostgresCdcRls, :handle_after_connect, fn _, _, _, _ ->
        {:error, "Too many database timeouts"}
      end)

      expect(Extensions.PostgresCdcRls, :handle_after_connect, fn _, _, _, _ -> {:ok, []} end)

      assert {:ok, _reply, _socket} = join_waiting_for_postgres_changes(tenant, %{"wait" => true, "timeout" => 5_000})
    end

    test "wait does not gate a join without postgres_changes bindings", %{tenant: tenant} do
      reject(&Extensions.PostgresCdcRls.handle_connect/1)

      assert {:ok, %{postgres_changes: []}, _socket} =
               join_waiting_for_postgres_changes(tenant, %{"wait" => true, "timeout" => 100}, [])
    end

    test "join is not gated when wait is not requested", %{tenant: tenant} do
      reject(&Extensions.PostgresCdcRls.handle_connect/1)

      assert {:ok, _reply, _socket} = join_waiting_for_postgres_changes(tenant, %{"wait" => false})
    end
  end

  describe "broadcast" do
    @describetag policies: [:authenticated_all_topic_read]

    test "broadcast map payload", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      config = %{
        "broadcast" => %{"self" => true}
      }

      assert {:ok, _, socket} = subscribe_and_join(socket, "realtime:test", %{"config" => config})

      push(socket, "broadcast", %{"event" => "my_event", "payload" => %{"hello" => "world"}})

      assert_receive %Phoenix.Socket.Message{
        topic: "realtime:test",
        event: "broadcast",
        payload: %{"event" => "my_event", "payload" => %{"hello" => "world"}}
      }
    end

    test "broadcast non-map payload", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      config = %{
        "broadcast" => %{"self" => true}
      }

      assert {:ok, _, socket} = subscribe_and_join(socket, "realtime:test", %{"config" => config})

      push(socket, "broadcast", "not a map")

      assert_receive %Phoenix.Socket.Message{
        topic: "realtime:test",
        event: "broadcast",
        payload: "not a map"
      }
    end

    test "wrong replay params", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      config = %{
        "private" => true,
        "broadcast" => %{
          "replay" => %{"limit" => "not a number", "since" => :erlang.system_time(:millisecond) - 5 * 60000}
        }
      }

      assert {:error, %{reason: "UnableToReplayMessages: Replay params are not valid"}} =
               subscribe_and_join(socket, "realtime:test", %{"config" => config})

      config = %{
        "private" => true,
        "broadcast" => %{
          "replay" => %{"limit" => 1, "since" => "not a number"}
        }
      }

      assert {:error, %{reason: "UnableToReplayMessages: Replay params are not valid"}} =
               subscribe_and_join(socket, "realtime:test", %{"config" => config})
    end

    test "replay params fall back to the schema defaults when omitted", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      %{id: message_id} =
        message_fixture(tenant, %{
          "private" => true,
          "inserted_at" => NaiveDateTime.utc_now() |> NaiveDateTime.shift(minute: -1),
          "event" => "only",
          "extension" => "broadcast",
          "topic" => "test",
          "payload" => %{"value" => "only"}
        })

      # An empty replay map is valid and defaults to schema
      config = %{"private" => true, "broadcast" => %{"replay" => %{}}}

      assert {:ok, _, %Socket{}} = subscribe_and_join(socket, "realtime:test", %{"config" => config})

      assert_receive %Phoenix.Socket.Message{
        event: "broadcast",
        payload: %{"event" => "only", "meta" => %{"id" => ^message_id, "replayed" => true}}
      }
    end

    test "replay limit defaults to the schema default when only since is given", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      for i <- 1..3 do
        message_fixture(tenant, %{
          "private" => true,
          "inserted_at" => NaiveDateTime.utc_now() |> NaiveDateTime.shift(minute: -i),
          "event" => "event_#{i}",
          "extension" => "broadcast",
          "topic" => "test",
          "payload" => %{"value" => i}
        })
      end

      # `since` is an epoch timestamp in milliseconds, so all three messages are within the window.
      five_minutes_ago = DateTime.utc_now() |> DateTime.shift(minute: -5) |> DateTime.to_unix(:millisecond)

      config = %{"private" => true, "broadcast" => %{"replay" => %{"since" => five_minutes_ago}}}

      assert {:ok, _, %Socket{}} = subscribe_and_join(socket, "realtime:test", %{"config" => config})

      # All three are under the default limit, so all three replay.
      for event <- ["event_3", "event_2", "event_1"] do
        assert_receive %Phoenix.Socket.Message{
          event: "broadcast",
          payload: %{"event" => ^event, "meta" => %{"replayed" => true}}
        }
      end
    end

    test "failure to replay", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      config = %{
        "private" => true,
        "broadcast" => %{
          "replay" => %{"limit" => 12, "since" => :erlang.system_time(:millisecond) - 5 * 60000}
        }
      }

      Authorization
      |> expect(:get_read_authorizations, fn _, _, _, _ ->
        {:ok,
         %Authorization.Policies{
           broadcast: %Authorization.Policies.BroadcastPolicies{read: true, write: nil}
         }}
      end)

      # Broken database connection
      conn = spawn(fn -> :ok end)
      Connect.lookup_or_start_connection(tenant.external_id)
      {:ok, _} = :syn.update_registry(Connect, tenant.external_id, fn _pid, meta -> %{meta | conn: conn} end)

      assert {:error, %{reason: "UnableToReplayMessages: Realtime was unable to replay messages"}} =
               subscribe_and_join(socket, "realtime:test", %{"config" => config})
    end

    test "replay messages on public topic not allowed", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      config = %{
        "broadcast" => %{"replay" => %{"limit" => 2, "since" => :erlang.system_time(:millisecond) - 5 * 60000}}
      }

      assert {
               :error,
               %{reason: "UnableToReplayMessages: Replay is not allowed for public channels"}
             } = subscribe_and_join(socket, "realtime:test", %{"config" => config})

      refute_receive %Socket.Message{}
      refute_receive %Socket.Reply{}
    end

    @tag policies: [:authenticated_all_topic_read]
    test "replay messages on private topic", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      # Old message
      message_fixture(tenant, %{
        "private" => true,
        "inserted_at" => NaiveDateTime.utc_now() |> NaiveDateTime.add(-1, :day),
        "event" => "old",
        "extension" => "broadcast",
        "topic" => "test",
        "payload" => %{"value" => "old"}
      })

      %{id: message1_id} =
        message_fixture(tenant, %{
          "private" => true,
          "inserted_at" => NaiveDateTime.utc_now() |> NaiveDateTime.add(-1, :minute),
          "event" => "first",
          "extension" => "broadcast",
          "topic" => "test",
          "payload" => %{"value" => "first"}
        })

      %{id: message2_id} =
        message_fixture(tenant, %{
          "private" => true,
          "inserted_at" => NaiveDateTime.utc_now() |> NaiveDateTime.add(-2, :minute),
          "event" => "second",
          "extension" => "broadcast",
          "topic" => "test",
          "payload" => %{"value" => "second"}
        })

      # This one should not be received because of the limit
      message_fixture(tenant, %{
        "private" => true,
        "inserted_at" => NaiveDateTime.utc_now() |> NaiveDateTime.add(-3, :minute),
        "event" => "third",
        "extension" => "broadcast",
        "topic" => "test",
        "payload" => %{"value" => "third"}
      })

      config = %{
        "private" => true,
        "broadcast" => %{"replay" => %{"limit" => 2, "since" => :erlang.system_time(:millisecond) - 5 * 60000}}
      }

      assert {:ok, _, %Socket{}} = subscribe_and_join(socket, "realtime:test", %{"config" => config})

      assert_receive %Socket.Message{
        topic: "realtime:test",
        event: "broadcast",
        payload: %{
          "event" => "first",
          "meta" => %{"id" => ^message1_id, "replayed" => true},
          "payload" => %{"value" => "first"},
          "type" => "broadcast"
        }
      }

      assert_receive %Socket.Message{
        topic: "realtime:test",
        event: "broadcast",
        payload: %{
          "event" => "second",
          "meta" => %{"id" => ^message2_id, "replayed" => true},
          "payload" => %{"value" => "second"},
          "type" => "broadcast"
        }
      }

      refute_receive %Socket.Message{}
    end

    test "private broadcast but Connect had an RPC error", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert %Socket{channel_pid: channel_pid} =
               socket = subscribe_and_join!(socket, "realtime:test", %{"config" => %{"private" => true}})

      log =
        capture_log(fn ->
          expect(Connect, :lookup_or_start_connection, fn _ -> {:error, :rpc_error, :timeout} end)
          allow(Connect, self(), channel_pid)

          push(socket, "broadcast", %{"event" => "my_event", "payload" => %{"hello" => "world"}})

          # Waits for the channel to handle the broadcast
          :sys.get_state(channel_pid)
        end)

      assert log =~ "UnableToHandleBroadcast: :timeout"
      assert Process.alive?(channel_pid)
    end
  end

  describe "presence" do
    test "presence state event is counted", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert {:ok, _, %Socket{} = socket} =
               subscribe_and_join(socket, "realtime:test", %{"config" => %{"presence" => %{"enabled" => true}}})

      assert_receive %Socket.Message{topic: "realtime:test", event: "presence_state", payload: %{}}

      tenant_id = tenant.external_id

      assert {:ok, %RateCounter{id: {:channel, :presence_events, ^tenant_id}, bucket: bucket}} =
               RateCounterHelper.tick!(socket.assigns.presence_rate_counter)

      # presence_state
      assert Enum.sum(bucket) == 1
    end

    test "client rate limit blocks calls over the limit and shuts down channel", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      config = %{"config" => %{"presence" => %{"enabled" => true, "key" => "user_id"}}}
      assert {:ok, _, %Socket{channel_pid: channel_pid} = socket} = subscribe_and_join(socket, "realtime:test", config)

      assert_receive %Socket.Message{topic: "realtime:test", event: "presence_state", payload: %{}}

      # Make 5 presence calls (at the default limit)
      for i <- 1..5 do
        ref = push(socket, "presence", %{"type" => "presence", "event" => "TRACK", "payload" => %{"call" => i}})
        assert_receive %Socket.Reply{ref: ^ref, status: :ok}, 500
      end

      assert capture_log(fn ->
               # 6th call should cause channel shutdown
               push(socket, "presence", %{"type" => "presence", "event" => "TRACK", "payload" => %{"call" => 6}})

               assert_receive %Socket.Message{
                                topic: "realtime:test",
                                event: "system",
                                payload: %{
                                  message: "Client presence rate limit exceeded",
                                  status: "error",
                                  extension: "system",
                                  channel: "test"
                                }
                              },
                              500
             end) =~ "ClientPresenceRateLimitReached"

      assert_process_down(channel_pid)
    end

    test "client rate limits are independent per connection", %{tenant: tenant} do
      jwt1 = Generators.generate_jwt_token(tenant)
      jwt2 = Generators.generate_jwt_token(tenant)

      {:ok, %Socket{} = socket1} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt1))
      {:ok, %Socket{} = socket2} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt2))

      config = %{"config" => %{"presence" => %{"key" => "user_id"}}}

      assert {:ok, _, %Socket{channel_pid: channel_pid1} = socket1} =
               subscribe_and_join(socket1, "realtime:test1", config)

      assert {:ok, _, %Socket{} = socket2} = subscribe_and_join(socket2, "realtime:test2", config)

      # Exhaust rate limit for socket1
      for i <- 1..5 do
        ref = push(socket1, "presence", %{"type" => "presence", "event" => "TRACK", "payload" => %{"call" => i}})
        assert_receive %Socket.Reply{ref: ^ref, status: :ok}, 500
      end

      # socket1's 6th call should cause shutdown
      push(socket1, "presence", %{"type" => "presence", "event" => "TRACK", "payload" => %{"call" => 6}})

      assert_receive %Socket.Message{
                       topic: "realtime:test1",
                       event: "system",
                       payload: %{
                         message: "Client presence rate limit exceeded",
                         status: "error",
                         extension: "system",
                         channel: "test1"
                       }
                     },
                     500

      assert_process_down(channel_pid1)

      # socket2 should still work (independent rate limit)
      ref = push(socket2, "presence", %{"type" => "presence", "event" => "TRACK", "payload" => %{"call" => 1}})
      assert_receive %Socket.Reply{ref: ^ref, status: :ok}, 500
    end

    test "presence track closes on high payload size", %{tenant: tenant} do
      topic = "realtime:test"
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert {:ok, _, %Socket{} = socket} =
               subscribe_and_join(socket, topic, %{"config" => %{"presence" => %{"enabled" => true}}})

      assert_receive %Phoenix.Socket.Message{topic: "realtime:test", event: "presence_state"}, 500

      payload = %{
        type: "presence",
        event: "TRACK",
        payload: %{name: "realtime_presence_96", t: 1814.7000000029802, content: String.duplicate("a", 3_500_000)}
      }

      push(socket, "presence", payload)

      assert_receive %Phoenix.Socket.Message{
                       event: "system",
                       payload: %{
                         extension: "system",
                         message: "Track message size exceeded",
                         status: "error"
                       },
                       topic: ^topic
                     },
                     500
    end

    test "presence track with non-map payload replies with error and keeps socket alive", %{tenant: tenant} do
      topic = "realtime:test"
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert {:ok, _, %Socket{} = socket} =
               subscribe_and_join(socket, topic, %{"config" => %{"presence" => %{"enabled" => true}}})

      assert_receive %Phoenix.Socket.Message{topic: "realtime:test", event: "presence_state"}, 500

      ref = push(socket, "presence", %{"type" => "presence", "event" => "TRACK", "payload" => "not a map"})

      assert_receive %Socket.Reply{
                       ref: ^ref,
                       status: :error,
                       payload: %{reason: "Presence track payload must be a map"}
                     },
                     500

      ref = push(socket, "presence", %{"type" => "presence", "event" => "TRACK", "payload" => %{"user" => "a"}})
      assert_receive %Socket.Reply{ref: ^ref, status: :ok}, 500
    end

    test "presence track with same payload does nothing", %{tenant: tenant} do
      topic = "realtime:test"
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert {:ok, _, %Socket{} = socket} =
               subscribe_and_join(socket, topic, %{config: %{presence: %{enabled: true, key: "my_key"}}})

      assert_receive %Phoenix.Socket.Message{topic: "realtime:test", event: "presence_state"}, 500

      payload = %{type: "presence", event: "TRACK", payload: %{"hello" => "world"}}

      push(socket, "presence", payload)

      assert_receive %Socket.Reply{payload: %{}, topic: "realtime:test", status: :ok}, 500

      assert_receive %Socket.Message{
                       payload: %{
                         joins: %{"my_key" => %{metas: [%{:phx_ref => _, "hello" => "world"}]}},
                         leaves: %{}
                       },
                       topic: "realtime:test",
                       event: "presence_diff"
                     },
                     500

      push(socket, "presence", payload)

      assert_receive %Socket.Reply{payload: %{}, topic: "realtime:test", status: :ok}, 500
      # no presence_diff this time

      refute_receive %Socket.Message{}
      refute_receive %Socket.Reply{}
    end

    test "presence is disabled when tenant has presence_enabled false and client does not override", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      assert {:ok, _, %Socket{} = socket} = subscribe_and_join(socket, "realtime:test", %{})

      refute_receive %Socket.Message{event: "presence_state"}, 200
      assert socket.assigns.presence_enabled? == false
    end

    test "presence is enabled when client explicitly enables it even if tenant flag is false", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      config = %{"config" => %{"presence" => %{"enabled" => true}}}

      assert {:ok, _, %Socket{} = socket} = subscribe_and_join(socket, "realtime:test", config)

      assert_receive %Socket.Message{event: "presence_state"}, 500
      assert socket.assigns.presence_enabled? == true
    end

    test "presence defaults to tenant flag when client does not specify", %{tenant: tenant} do
      {:ok, tenant} =
        Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{"presence_enabled" => true})

      Realtime.Tenants.Cache.update_cache(tenant)

      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      assert {:ok, _, %Socket{} = socket} = subscribe_and_join(socket, "realtime:test", %{})

      assert_receive %Socket.Message{event: "presence_state"}, 500
      assert socket.assigns.presence_enabled? == true
    end

    @tag policies: [:authenticated_all_topic_read]
    test "private presence track but Connect had an RPC error", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      config = %{"config" => %{"private" => true, "presence" => %{"enabled" => true}}}
      assert %Socket{channel_pid: channel_pid} = socket = subscribe_and_join!(socket, "realtime:test", config)

      assert_receive %Socket.Message{topic: "realtime:test", event: "presence_state"}, 500

      log =
        capture_log(fn ->
          expect(Connect, :lookup_or_start_connection, fn _ -> {:error, :rpc_error, :timeout} end)
          allow(Connect, self(), channel_pid)

          ref = push(socket, "presence", %{"type" => "presence", "event" => "TRACK", "payload" => %{"user" => "a"}})
          assert_receive %Socket.Reply{ref: ^ref, status: :error}, 500
        end)

      assert log =~ "UnableToHandlePresence: :timeout"
      assert Process.alive?(channel_pid)
    end
  end

  describe "unexpected errors" do
    test "unexpected error on Connect", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      expect(Connect, :lookup_or_start_connection, fn _ ->
        {:error, "Realtime was unable to connect to the project database"}
      end)

      assert capture_log(fn ->
               assert {:error, %{reason: "Unknown Error on Channel"}} =
                        subscribe_and_join(socket, "realtime:test", %{})
             end) =~ "UnknownErrorOnChannel: Realtime was unable to connect to the project database"
    end

    test "unexpected error while setting policies logs UnknownErrorOnChannel", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      expect(Authorization, :get_read_authorizations, fn _, _, _, _ ->
        {:error, "unexpected error"}
      end)

      assert capture_log(fn ->
               assert {:error, %{reason: "Unknown Error on Channel"}} =
                        subscribe_and_join(socket, "realtime:test", %{"config" => %{"private" => true}})
             end) =~ "UnknownErrorOnChannel"
    end

    test "struct error while setting policies logs UnableToSetPolicies", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      expect(Authorization, :get_read_authorizations, fn _, _, _, _ ->
        {:error, %DBConnection.ConnectionError{message: "unexpected error", reason: :error, severity: :error}}
      end)

      assert capture_log(fn ->
               assert {:error, %{reason: "Realtime was unable to connect to the project database"}} =
                        subscribe_and_join(socket, "realtime:test", %{"config" => %{"private" => true}})
             end) =~ "UnableToSetPolicies"
    end

    test "query canceled during join logs QueryCanceled", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      expect(Authorization, :get_read_authorizations, fn _, _, _, _ ->
        {:error, :query_canceled,
         %Postgrex.Error{postgres: %{code: :query_canceled, message: "canceling statement due to user request"}}}
      end)

      assert capture_log(fn ->
               assert {:error, _} =
                        subscribe_and_join(socket, "realtime:test", %{"config" => %{"private" => true}})
             end) =~ "QueryCanceled"
    end

    test "missing partition during join logs MissingPartition", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      expect(Authorization, :get_read_authorizations, fn _, _, _, _ -> {:error, :missing_partition} end)

      assert capture_log(fn ->
               assert {:error, _} =
                        subscribe_and_join(socket, "realtime:test", %{"config" => %{"private" => true}})
             end) =~ "MissingPartition"
    end
  end

  describe "maximum number of channels per client" do
    test "logs error once when last channel slot is taken", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "error"}, conn_opts(tenant, jwt))

      Realtime.Tenants.Cache.update_cache(%{tenant | max_channels_per_client: 1})

      log =
        capture_log(fn ->
          assert {:ok, _, _} = subscribe_and_join(socket, "realtime:test", %{})
        end)

      assert log =~ "ChannelRateLimitReached"
    end

    test "does not log when channel limit is already exceeded", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      Realtime.Tenants.Cache.update_cache(%{tenant | max_channels_per_client: 1})

      capture_log(fn -> subscribe_and_join(socket, "realtime:test", %{}) end)

      log =
        capture_log(fn ->
          assert {:error, %{reason: "ChannelRateLimitReached: Too many channels"}} =
                   subscribe_and_join(socket, "realtime:test2", %{})
        end)

      refute log =~ "ChannelRateLimitReached"
    end
  end

  describe "concurrent connection counting" do
    test "a connected socket is not counted until it joins a channel", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      refute Realtime.UsersCounter.already_counted?(socket.transport_pid, tenant.external_id)
      assert Realtime.UsersCounter.tenant_users(tenant.external_id, node()) == 0

      assert {:ok, _, %Socket{}} = subscribe_and_join(socket, "realtime:test", %{})

      assert Realtime.UsersCounter.already_counted?(socket.transport_pid, tenant.external_id)
      assert Realtime.UsersCounter.tenant_users(tenant.external_id, node()) == 1
    end

    test "a socket that joins multiple channels is counted once", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert {:ok, _, %Socket{}} = subscribe_and_join(socket, "realtime:test1", %{})
      assert {:ok, _, %Socket{}} = subscribe_and_join(socket, "realtime:test2", %{})
      assert {:ok, _, %Socket{}} = subscribe_and_join(socket, "realtime:test3", %{})

      assert Realtime.UsersCounter.tenant_users(tenant.external_id, node()) == 1
    end
  end

  describe "maximum number of events per second" do
    test "applies a raised limit once the rate counter restarts", %{tenant: tenant} do
      {:ok, tenant} = Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{max_events_per_second: 1})

      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))
      assert {:ok, _, %Socket{} = socket} = subscribe_and_join(socket, "realtime:test", %{})
      rate_counter_id = Tenants.events_per_second_key(tenant)

      {:ok, _} = Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{max_events_per_second: 1_000})

      # The update stops the RateCounter; the next get/1 starts a new one once its cache entry expires
      wait!(Cachex.get(RateCounter, rate_counter_id) == {:ok, nil}, timeout: 3_000, interval: 50)

      # The dispatcher sending :check_rate_counter is what gets the RateCounter again
      send(socket.channel_pid, :check_rate_counter)
      :sys.get_state(socket.channel_pid)

      Realtime.GenCounter.add(rate_counter_id, 100)

      assert {:ok, %RateCounter{limit: %{value: 1_000, triggered: false}}} =
               RateCounterHelper.tick!(Tenants.events_per_second_rate(tenant.external_id, 1_000))

      send(socket.channel_pid, :check_rate_counter)
      :sys.get_state(socket.channel_pid)

      refute_push "system", %{message: "Too many messages per second"}
      assert Process.alive?(socket.channel_pid)
    end
  end

  describe "maximum number of connected clients per tenant" do
    test "not reached", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      Realtime.Tenants.Cache.update_cache(%{tenant | max_concurrent_users: 1})

      assert {:ok, _, %Socket{}} = subscribe_and_join(socket, "realtime:test", %{})
    end

    test "reached after connecting", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      Realtime.Tenants.Cache.update_cache(%{tenant | max_concurrent_users: 1})

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      Realtime.UsersCounter.add(pid, tenant.external_id)

      assert {:error, %{reason: "ConnectionRateLimitReached: Too many connected users"}} =
               subscribe_and_join(socket, "realtime:test", %{})

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      Realtime.UsersCounter.add(pid, tenant.external_id)

      assert {:error, %{reason: "ConnectionRateLimitReached: Too many connected users"}} =
               subscribe_and_join(socket, "realtime:test", %{})
    end

    test "reached before connecting", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)

      Realtime.Tenants.Cache.update_cache(%{tenant | max_concurrent_users: 1})

      Realtime.UsersCounter.add(self(), tenant.external_id)

      {:error, :too_many_connections} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))
    end
  end

  describe "Muster join" do
    test "joins the Muster scope when the feature flag is enabled for the tenant", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      expect(Realtime.FeatureFlags, :enabled?, fn "use_muster_channel_join", tenant_id ->
        tenant_id == tenant.external_id
      end)

      expect(Forum.Muster, :local_member?, fn _scope, _tenant_id, _pid -> false end)

      expect(Forum.Muster, :join, fn _scope, tenant_id, pid ->
        assert tenant_id == tenant.external_id
        assert pid == socket.transport_pid
        :ok
      end)

      assert {:ok, _, %Socket{}} = subscribe_and_join(socket, "realtime:test", %{})
    end

    test "does not join the Muster scope when the feature flag is disabled", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      expect(Realtime.FeatureFlags, :enabled?, fn "use_muster_channel_join", _tenant_id -> false end)
      reject(&Forum.Muster.local_member?/3)
      reject(&Forum.Muster.join/3)

      assert {:ok, _, %Socket{}} = subscribe_and_join(socket, "realtime:test", %{})
    end

    test "does not join again when the transport_pid is already a local member", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))

      expect(Realtime.FeatureFlags, :enabled?, fn "use_muster_channel_join", _tenant_id -> true end)
      expect(Forum.Muster, :local_member?, fn _scope, _tenant_id, _pid -> true end)
      reject(&Forum.Muster.join/3)

      assert {:ok, _, %Socket{}} = subscribe_and_join(socket, "realtime:test", %{})
    end

    test "join fails when Muster.join raises", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "error"}, conn_opts(tenant, jwt))

      expect(Realtime.FeatureFlags, :enabled?, fn "use_muster_channel_join", _tenant_id -> true end)
      expect(Forum.Muster, :local_member?, fn _scope, _tenant_id, _pid -> false end)
      expect(Forum.Muster, :join, fn _scope, _tenant_id, _pid -> raise "boom" end)

      log =
        capture_log(fn ->
          assert {:error, %{reason: reason}} = subscribe_and_join(socket, "realtime:test", %{})
          assert reason =~ "MusterJoinError"
        end)

      assert log =~ "MusterJoinError"
    end

    test "join fails when Muster.join exits", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "error"}, conn_opts(tenant, jwt))

      expect(Realtime.FeatureFlags, :enabled?, fn "use_muster_channel_join", _tenant_id -> true end)
      expect(Forum.Muster, :local_member?, fn _scope, _tenant_id, _pid -> false end)
      expect(Forum.Muster, :join, fn _scope, _tenant_id, _pid -> exit(:boom) end)

      log =
        capture_log(fn ->
          assert {:error, %{reason: reason}} = subscribe_and_join(socket, "realtime:test", %{})
          assert reason =~ "MusterJoinError"
        end)

      assert log =~ "MusterJoinError"
    end

    test "join fails when Muster.join times out", %{tenant: tenant} do
      # @muster_join_await_ms (4s) is a private constant, not overridable from
      # tests, so this pays the real timeout in wall-clock time rather than
      # shrinking it.
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "error"}, conn_opts(tenant, jwt))

      expect(Realtime.FeatureFlags, :enabled?, fn "use_muster_channel_join", _tenant_id -> true end)
      expect(Forum.Muster, :local_member?, fn _scope, _tenant_id, _pid -> false end)
      expect(Forum.Muster, :join, fn _scope, _tenant_id, _pid -> Process.sleep(4_200) end)

      log =
        capture_log(fn ->
          assert {:error, %{reason: reason}} = subscribe_and_join(socket, "realtime:test", %{})
          assert reason =~ "MusterJoinError"
          assert reason =~ "timed out"
        end)

      assert log =~ "MusterJoinError"
      assert log =~ "timed out"
    end
  end

  describe "access_token" do
    # RS256 token with header kid "key-id-1"
    @rsa_token "TEST_JWT_REDACTED"

    test "shuts down with JwtSignerError when refresh token kid has no matching JWK", %{tenant: tenant} do
      jwks = %{"keys" => [%{"kty" => "RSA", "kid" => "some_other_kid"}]}
      {:ok, tenant} = Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{jwt_jwks: jwks})
      Realtime.Tenants.Cache.update_cache(tenant)

      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))
      socket = subscribe_and_join!(socket, "realtime:test", %{})

      log =
        capture_log(fn ->
          push(socket, "access_token", %{"access_token" => @rsa_token})
          assert_process_down(socket.channel_pid)
        end)

      assert log =~ "JwtSignerError"
      assert log =~ "key-id-1"
    end

    @tag policies: [:authenticated_all_topic_read]
    test "new valid access_token", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert socket =
               subscribe_and_join!(socket, "realtime:test", %{
                 "config" => %{"private" => true, "presence" => %{"enabled" => true}}
               })

      old_confirm_ref = socket.assigns.confirm_token_ref

      assert socket.assigns.policies == %Realtime.Tenants.Authorization.Policies{
               broadcast: %Realtime.Tenants.Authorization.Policies.BroadcastPolicies{read: true, write: nil},
               presence: %Realtime.Tenants.Authorization.Policies.PresencePolicies{read: true, write: nil}
             }

      new_token =
        Generators.generate_jwt_token(tenant, %{
          exp: System.system_time(:second) + 10_000,
          role: "authenticated",
          sub: "123"
        })

      assert new_token != jwt

      push(socket, "access_token", %{"access_token" => new_token})

      socket = Server.socket(socket.channel_pid)

      assert socket.assigns.access_token == new_token
      assert socket.assigns.confirm_token_ref != old_confirm_ref
    end

    @tag policies: [:authenticated_all_topic_read]
    test "new valid access_token and policy has changed", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert socket =
               subscribe_and_join!(socket, "realtime:test", %{
                 "config" => %{"private" => true, "presence" => %{"enabled" => true}}
               })

      assert socket.assigns.policies == %Realtime.Tenants.Authorization.Policies{
               broadcast: %Realtime.Tenants.Authorization.Policies.BroadcastPolicies{read: true, write: nil},
               presence: %Realtime.Tenants.Authorization.Policies.PresencePolicies{read: true, write: nil}
             }

      new_token =
        Generators.generate_jwt_token(tenant, %{
          exp: System.system_time(:second) + 10_000,
          role: "authenticated",
          sub: "123"
        })

      assert new_token != jwt

      # RLS policies removed so it should now fail
      {:ok, db_conn} = Realtime.Database.connect(tenant, "realtime_test")
      clean_table(db_conn, "realtime", "messages")

      push(socket, "access_token", %{"access_token" => new_token})

      # Channel closes
      assert_process_down(socket.channel_pid)
    end

    @tag policies: [:authenticated_all_topic_read]
    test "disconnects when only presence read permission is revoked on new access_token", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert socket =
               subscribe_and_join!(socket, "realtime:test", %{
                 "config" => %{"private" => true, "presence" => %{"enabled" => true}}
               })

      assert socket.assigns.policies == %Realtime.Tenants.Authorization.Policies{
               broadcast: %Realtime.Tenants.Authorization.Policies.BroadcastPolicies{read: true, write: nil},
               presence: %Realtime.Tenants.Authorization.Policies.PresencePolicies{read: true, write: nil}
             }

      new_token =
        Generators.generate_jwt_token(tenant, %{
          exp: System.system_time(:second) + 10_000,
          role: "authenticated",
          sub: "123"
        })

      assert new_token != jwt

      # Replace policies so broadcast read is still allowed but presence read is revoked
      {:ok, db_conn} = Realtime.Database.connect(tenant, "realtime_test")
      clean_table(db_conn, "realtime", "messages")
      create_rls_policies(db_conn, [:authenticated_read_broadcast], %{topic: "test"})

      push(socket, "access_token", %{"access_token" => new_token})

      assert_push "system", %{
        extension: "system",
        status: "error",
        message: "You no longer have permission to read from this Channel topic: test"
      }

      # Channel closes
      assert_process_down(socket.channel_pid)
    end

    test "new valid access_token but Connect timed out", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert %Socket{channel_pid: channel_pid} = socket = subscribe_and_join!(socket, "realtime:test", %{})

      new_token =
        Generators.generate_jwt_token(tenant, %{
          exp: System.system_time(:second) + 10_000,
          role: "authenticated",
          sub: "123"
        })

      assert new_token != jwt

      log =
        capture_log(fn ->
          expect(Connect, :lookup_or_start_connection, fn _ -> {:error, :rpc_error, :timeout} end)
          allow(Connect, self(), channel_pid)

          push(socket, "access_token", %{"access_token" => new_token})

          # Channel closes
          assert_process_down(channel_pid)
        end)

      assert log =~ "Node request timeout"
    end

    test "new valid access_token but Connect had an error", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert %Socket{channel_pid: channel_pid} = socket = subscribe_and_join!(socket, "realtime:test", %{})

      new_token =
        Generators.generate_jwt_token(tenant, %{
          exp: System.system_time(:second) + 10_000,
          role: "authenticated",
          sub: "123"
        })

      assert new_token != jwt

      log =
        capture_log(fn ->
          expect(Connect, :lookup_or_start_connection, fn _ -> {:error, :rpc_error, {:EXIT, :actual_error}} end)
          allow(Connect, self(), channel_pid)

          push(socket, "access_token", %{"access_token" => new_token})

          # Channel closes
          assert_process_down(channel_pid)
        end)

      assert log =~ "RPC call error: {:EXIT, :actual_error}"
    end

    test "new broken access_token", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert %Socket{channel_pid: channel_pid} = socket = subscribe_and_join!(socket, "realtime:test", %{})

      new_token = "not even a JWT"

      push(socket, "access_token", %{"access_token" => new_token})

      # Channel closes
      assert_process_down(channel_pid)

      assert_receive %Socket.Message{
        topic: "realtime:test",
        event: "system",
        payload: %{
          message: "The token provided is not a valid JWT",
          status: "error",
          extension: "system",
          channel: "test"
        }
      }

      # Socket also closes...
      assert_receive {:socket_close, ^channel_pid, :normal}
    end

    test "new JWT missing role claim", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert %Socket{channel_pid: channel_pid} = socket = subscribe_and_join!(socket, "realtime:test", %{})

      new_token = Generators.generate_jwt_token(tenant, %{exp: System.system_time(:second) + 10_000})

      push(socket, "access_token", %{"access_token" => new_token})

      # Channel closes
      assert_process_down(channel_pid)

      assert_receive %Socket.Message{
        topic: "realtime:test",
        event: "system",
        payload: %{
          message: "Fields `role` and `exp` are required in JWT",
          status: "error",
          extension: "system",
          channel: "test"
        }
      }

      # Socket also closes...
      assert_receive {:socket_close, ^channel_pid, :normal}
    end

    test "new JWT missing exp claim", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert %Socket{channel_pid: channel_pid} = socket = subscribe_and_join!(socket, "realtime:test", %{})

      new_token = Generators.generate_jwt_token(tenant, %{role: "authenticated"})

      push(socket, "access_token", %{"access_token" => new_token})

      # Channel closes
      assert_process_down(channel_pid)

      assert_receive %Socket.Message{
        topic: "realtime:test",
        event: "system",
        payload: %{
          message: "Fields `role` and `exp` are required in JWT",
          status: "error",
          extension: "system",
          channel: "test"
        }
      }

      # Socket also closes...
      assert_receive {:socket_close, ^channel_pid, :normal}
    end

    test "new expired JWT", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert %Socket{channel_pid: channel_pid} = socket = subscribe_and_join!(socket, "realtime:test", %{})

      new_token =
        Generators.generate_jwt_token(tenant, %{role: "authenticated", exp: System.system_time(:second) - 1000})

      push(socket, "access_token", %{"access_token" => new_token})

      # Channel closes
      assert_process_down(channel_pid)

      assert_receive %Socket.Message{
        topic: "realtime:test",
        event: "system",
        payload: %{
          message: message,
          status: "error",
          extension: "system",
          channel: "test"
        }
      }

      assert message =~ ~r{Token has expired \d+ seconds ago}

      # Socket also closes...
      assert_receive {:socket_close, ^channel_pid, :normal}
    end
  end

  describe "confirm token" do
    test "token has expired", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant, %{role: "authenticated", exp: System.system_time(:second) + 2})
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert %Socket{channel_pid: channel_pid} = subscribe_and_join!(socket, "realtime:test", %{})

      Process.sleep(2000)
      send(channel_pid, :confirm_token)

      # Channel closes
      assert_process_down(channel_pid)

      assert_receive %Socket.Message{
                       topic: "realtime:test",
                       event: "system",
                       payload: %{
                         message: "Token has expired" <> _,
                         status: "error",
                         extension: "system",
                         channel: "test"
                       }
                     },
                     1000
    end

    test "shuts down cleanly with JwtSignerError when the signer can no longer be generated", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))
      %Socket{channel_pid: channel_pid} = subscribe_and_join!(socket, "realtime:test", %{})

      log =
        capture_log(fn ->
          # The periodic re-confirmation re-validates the token; simulate the JWK backing the
          # token's kid disappearing, which makes authorization fail to build a signer.
          expect(RealtimeWeb.ChannelsAuthorization, :authorize_conn, fn _, _, _ ->
            {:error, {:error_generating_signer, "key-id-1"}}
          end)

          allow(RealtimeWeb.ChannelsAuthorization, self(), channel_pid)

          send(channel_pid, :confirm_token)
          assert_process_down(channel_pid)
        end)

      assert log =~ "JwtSignerError"

      # A clean shutdown (not a crash) pushes a system error message and closes normally.
      assert_receive %Socket.Message{
        topic: "realtime:test",
        event: "system",
        payload: %{
          message: message,
          status: "error",
          extension: "system",
          channel: "test"
        }
      }

      assert message =~ "Failed to generate JWT signer for key ID (kid)"
      assert message =~ "key-id-1"

      assert_receive {:socket_close, ^channel_pid, :normal}
    end
  end

  describe "access_token throttling" do
    # The window is configured for the test env and only ever read, never mutated, so these stay async
    test "first refresh of a channel is applied immediately", %{tenant: tenant} do
      socket = join_public_channel(tenant)
      token = distinct_token(tenant, "first")

      push(socket, "access_token", %{"access_token" => token})

      assigns = Server.socket(socket.channel_pid).assigns
      assert assigns.access_token == token
      assert assigns.pending_access_token == nil
    end

    test "holds refreshes arriving inside the window and applies the newest when it closes", %{tenant: tenant} do
      socket = join_public_channel(tenant)

      # Consumes the free first refresh and opens the window
      first = distinct_token(tenant, "first")
      push(socket, "access_token", %{"access_token" => first})
      assert Server.socket(socket.channel_pid).assigns.access_token == first

      second = distinct_token(tenant, "second")
      third = distinct_token(tenant, "third")

      log =
        capture_log(fn ->
          push(socket, "access_token", %{"access_token" => second})
          push(socket, "access_token", %{"access_token" => third})

          # Both were coalesced into the pending slot, newest wins, and neither was verified
          assigns = Server.socket(socket.channel_pid).assigns
          assert assigns.access_token == first
          assert assigns.pending_access_token == third

          assert eventually(fn ->
                   assigns = Server.socket(socket.channel_pid).assigns
                   assigns.access_token == third and assigns.pending_access_token == nil
                 end)
        end)

      # Warned once for the window, not once per message
      assert log =~ "AccessTokenRefreshThrottled"
      assert log |> String.split("Token refresh throttled") |> length() == 2
    end

    test "rotating between two valid tokens costs one verification per window", %{tenant: tenant} do
      socket = join_public_channel(tenant)
      channel_pid = socket.channel_pid

      stub(RealtimeWeb.ChannelsAuthorization, :authorize_conn, fn _token, _, _ ->
        {:ok, %{"role" => "authenticated", "exp" => System.system_time(:second) + 10_000, "sub" => "rotating"}}
      end)

      allow(RealtimeWeb.ChannelsAuthorization, self(), channel_pid)

      token_a = distinct_token(tenant, "a")
      token_b = distinct_token(tenant, "b")

      capture_log(fn ->
        # First refresh is free, and makes token_a the verified token
        push(socket, "access_token", %{"access_token" => token_a})
        assert Server.socket(channel_pid).assigns.access_token == token_a
        assert newly_verified_tokens() == [token_a]

        # Rotate hard: token_a matches the verified token, token_b matches the pending one,
        # so none of these reach the verifier
        for _ <- 1..25 do
          push(socket, "access_token", %{"access_token" => token_b})
          push(socket, "access_token", %{"access_token" => token_a})
        end

        assert Server.socket(channel_pid).assigns.pending_access_token == token_b
        assert newly_verified_tokens() == []

        # Exactly one more verification once the window closes
        assert eventually(fn -> Server.socket(channel_pid).assigns.access_token == token_b end)
        assert newly_verified_tokens() == [token_b]
      end)
    end

    test "held refresh is applied when the current token is about to expire", %{tenant: tenant} do
      socket = join_public_channel(tenant)
      channel_pid = socket.channel_pid
      fresh = distinct_token(tenant, "fresh")

      expired =
        Generators.generate_jwt_token(tenant, %{
          exp: System.system_time(:second) - 1,
          role: "authenticated",
          sub: "expired"
        })

      # The state the throttle produces near expiry: current token at its exp, newest refresh still
      # held. Injected rather than timed, so the window timer plays no part in the outcome.
      :sys.replace_state(channel_pid, fn socket ->
        %{socket | assigns: %{socket.assigns | access_token: expired, pending_access_token: fresh}}
      end)

      send(channel_pid, :confirm_token)

      # Queued behind :confirm_token, so this observes the state after it ran. Without the backstop
      # clause the expired token is re-verified and the channel shuts down, surfacing here as a
      # GenServer.call exit rather than a failed assertion.
      assert Server.socket(channel_pid).assigns.access_token == fresh
      assert Server.socket(channel_pid).assigns.pending_access_token == nil
      assert Process.alive?(channel_pid)
    end
  end

  describe "access_token validations" do
    test "access_token has exp and iat in decimal format", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant)

      jwt =
        Generators.generate_jwt_token(tenant, %{
          role: "authenticated",
          exp: System.system_time(:second) + 100.99,
          iat: System.system_time(:second) - 100.99
        })

      assert {:ok, socket} = connect(UserSocket, %{}, conn_opts(tenant, api_key))

      assert {:ok, _, _} = subscribe_and_join(socket, "realtime:test", %{"access_token" => jwt})
    end

    test "access_token has expired", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant)
      jwt = Generators.generate_jwt_token(tenant, %{role: "authenticated", exp: System.system_time(:second) - 1})

      assert {:ok, socket} = connect(UserSocket, %{}, conn_opts(tenant, api_key))

      assert {:error, %{reason: "InvalidJWTToken: Token has expired " <> _}} =
               subscribe_and_join(socket, "realtime:test", %{"access_token" => jwt})
    end

    test "access_token has expired log_level=warning", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant)
      jwt = Generators.generate_jwt_token(tenant, %{role: "authenticated", exp: System.system_time(:second) - 1})

      assert {:ok, socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

      assert {:error, %{reason: "InvalidJWTToken: Token has expired " <> _}} =
               subscribe_and_join(socket, "realtime:test", %{"access_token" => jwt})
    end

    test "access_token missing exp claim on join", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant)
      jwt = Generators.generate_jwt_token(tenant, %{role: "authenticated"})

      assert {:ok, socket} = connect(UserSocket, %{}, conn_opts(tenant, api_key))

      assert {:error, %{reason: "InvalidJWTToken: Fields `role` and `exp` are required in JWT"}} =
               subscribe_and_join(socket, "realtime:test", %{"access_token" => jwt})
    end

    test "access_token missing exp claim on join log_level=warning", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant)
      jwt = Generators.generate_jwt_token(tenant, %{role: "authenticated"})

      assert {:ok, socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

      assert {:error, %{reason: "InvalidJWTToken: Fields `role` and `exp` are required in JWT"}} =
               subscribe_and_join(socket, "realtime:test", %{"access_token" => jwt})
    end

    test "access_token missing role claim on join", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant)
      jwt = Generators.generate_jwt_token(tenant, %{exp: System.system_time(:second) + 1000})

      assert {:ok, socket} = connect(UserSocket, %{}, conn_opts(tenant, api_key))

      assert {:error, %{reason: "InvalidJWTToken: Fields `role` and `exp` are required in JWT"}} =
               subscribe_and_join(socket, "realtime:test", %{"access_token" => jwt})
    end

    test "access_token missing role claim on join log_level=warning", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant)
      jwt = Generators.generate_jwt_token(tenant, %{exp: System.system_time(:second) + 1000})

      assert {:ok, socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

      assert {:error, %{reason: "InvalidJWTToken: Fields `role` and `exp` are required in JWT"}} =
               subscribe_and_join(socket, "realtime:test", %{"access_token" => jwt})
    end

    test "missing claims returns error no logs", %{tenant: tenant} do
      sub = random_string()
      iss = "https://#{random_string()}.com"
      exp = System.system_time(:second) + 10_000

      api_key = Generators.generate_jwt_token(tenant)
      jwt = Generators.generate_jwt_token(tenant, %{exp: exp, sub: sub, iss: iss})

      assert {:ok, socket} = connect(UserSocket, %{}, conn_opts(tenant, api_key))

      log =
        capture_log(fn ->
          assert {:error, %{reason: "InvalidJWTToken: Fields `role` and `exp` are required in JWT"}} =
                   subscribe_and_join(socket, "realtime:test", %{"access_token" => jwt})
        end)

      refute log =~ "InvalidJWTToken: Fields `role` and `exp` are required in JWT"
    end

    test "missing claims returns a error with token exp, iss and sub in metadata if available log_level=warning", %{
      tenant: tenant
    } do
      sub = random_string()
      iss = "https://#{random_string()}.com"
      exp = System.system_time(:second) + 10_000

      api_key = Generators.generate_jwt_token(tenant)
      jwt = Generators.generate_jwt_token(tenant, %{exp: exp, sub: sub, iss: iss})

      assert {:ok, socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

      log =
        capture_log(fn ->
          assert {:error, %{reason: "InvalidJWTToken: Fields `role` and `exp` are required in JWT"}} =
                   subscribe_and_join(socket, "realtime:test", %{"access_token" => jwt})
        end)

      assert log =~ "InvalidJWTToken: Fields `role` and `exp` are required in JWT"
      assert log =~ "sub=#{sub}"
      assert log =~ "iss=#{iss}"
      assert log =~ "exp=#{exp}"
    end

    test "expired jwt returns error no logs", %{tenant: tenant} do
      sub = random_string()

      api_key = Generators.generate_jwt_token(tenant)

      jwt =
        Generators.generate_jwt_token(tenant, %{role: "authenticated", exp: System.system_time(:second) - 1, sub: sub})

      assert {:ok, socket} = connect(UserSocket, %{}, conn_opts(tenant, api_key))

      log =
        capture_log(fn ->
          assert {:error, %{reason: "InvalidJWTToken: Token has expired " <> _}} =
                   subscribe_and_join(socket, "realtime:test", %{"access_token" => jwt})
        end)

      refute log =~ "InvalidJWTToken: Token has expired"
    end

    test "expired jwt returns a error with sub data if available log_level=warning", %{tenant: tenant} do
      sub = random_string()

      api_key = Generators.generate_jwt_token(tenant)

      jwt =
        Generators.generate_jwt_token(tenant, %{role: "authenticated", exp: System.system_time(:second) - 1, sub: sub})

      assert {:ok, socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

      log =
        capture_log(fn ->
          assert {:error, %{reason: "InvalidJWTToken: Token has expired " <> _}} =
                   subscribe_and_join(socket, "realtime:test", %{"access_token" => jwt})
        end)

      assert log =~ "InvalidJWTToken: Token has expired"
      assert log =~ "sub=#{sub}"
    end
  end

  describe "API Key validations" do
    test "x-api-key header has not expired", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

      assert {:ok, _, %Socket{}} = subscribe_and_join(socket, "realtime:test", %{})
    end

    test "apikey param has not expired", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant)

      conn_opts = [
        connect_info: %{
          uri: URI.parse("https://#{tenant.external_id}.localhost:4000/socket/websocket"),
          x_headers: []
        }
      ]

      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning", "apikey" => api_key}, conn_opts)

      assert {:ok, _, %Socket{} = socket} = subscribe_and_join(socket, "realtime:test", %{})
      assert socket.assigns.access_token == api_key
    end

    test "join with access_token starting with sb_", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

      assert {:ok, _, %Socket{} = socket} =
               subscribe_and_join(socket, "realtime:test", %{"access_token" => "sb_something"})

      assert socket.assigns.access_token == api_key
    end

    test "join with user_token starting with sb_", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

      assert {:ok, _, %Socket{} = socket} =
               subscribe_and_join(socket, "realtime:test", %{"user_token" => "sb_something"})

      assert socket.assigns.access_token == api_key
    end

    test "join with access_token", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant)
      access_token = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

      assert {:ok, _, %Socket{} = socket} =
               subscribe_and_join(socket, "realtime:test", %{"access_token" => access_token})

      assert socket.assigns.access_token == access_token
    end

    test "join with user_token", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant)
      user_token = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

      assert {:ok, _, %Socket{} = socket} =
               subscribe_and_join(socket, "realtime:test", %{"user_token" => user_token})

      assert socket.assigns.access_token == user_token
    end

    test "api_key has expired", %{tenant: tenant} do
      assert capture_log(fn ->
               api_key =
                 Generators.generate_jwt_token(tenant, %{role: "authenticated", exp: System.system_time(:second)})

               assert {:error, :expired_token} =
                        connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

               Process.sleep(300)
             end) =~ "InvalidJWTToken: Token has expired"

      api_key = Generators.generate_jwt_token(tenant, %{role: "authenticated", exp: System.system_time(:second) - 1})

      assert capture_log(fn ->
               assert {:error, :expired_token} =
                        connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))
             end) =~ "InvalidJWTToken: Token has expired"
    end

    test "missing role claims returns a error", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant, %{exp: System.system_time(:second) + 1000})

      log =
        capture_log(fn ->
          assert {:error, :missing_claims} =
                   connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))
        end)

      assert log =~ "InvalidJWTToken: Fields `role` and `exp` are required in JWT"
    end

    test "missing exp claims returns a error", %{tenant: tenant} do
      api_key = Generators.generate_jwt_token(tenant, %{role: "authenticated"})

      log =
        capture_log(fn ->
          assert {:error, :missing_claims} =
                   connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))
        end)

      assert log =~ "InvalidJWTToken: Fields `role` and `exp` are required in JWT"
    end

    test "missing claims returns a error with token exp, iss and sub in metadata if available", %{tenant: tenant} do
      sub = random_string()
      iss = "https://#{random_string()}.com"
      exp = System.system_time(:second) + 10_000

      api_key = Generators.generate_jwt_token(tenant, %{exp: exp, sub: sub, iss: iss})

      log =
        capture_log(fn ->
          assert {:error, :missing_claims} =
                   connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

          Process.sleep(300)
        end)

      assert log =~ "InvalidJWTToken: Fields `role` and `exp` are required in JWT"
      assert log =~ "sub=#{sub}"
      assert log =~ "iss=#{iss}"
      assert log =~ "exp=#{exp}"
    end

    test "expired api_key returns a error with sub data if available", %{tenant: tenant} do
      sub = random_string()

      api_key =
        Generators.generate_jwt_token(tenant, %{role: "authenticated", exp: System.system_time(:second) - 1, sub: sub})

      log =
        capture_log(fn ->
          assert {:error, :expired_token} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

          Process.sleep(300)
        end)

      assert log =~ "InvalidJWTToken: Token has expired"
      assert log =~ "sub=#{sub}"
    end

    test "api_key for a tenant that only has a JWKS returns an error", %{tenant: tenant} do
      jwks = %{"keys" => [%{"kty" => "RSA", "kid" => "some_other_kid"}]}

      {:ok, tenant} =
        Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{jwt_secret: nil, jwt_jwks: jwks})

      Realtime.Tenants.Cache.update_cache(tenant)

      api_key =
        Generators.generate_jwt_token("another secret", %{
          role: "authenticated",
          exp: System.system_time(:second) + 100_000
        })

      log =
        capture_log(fn ->
          assert {:error, {:error, :error_generating_signer}} =
                   connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, api_key))

          Process.sleep(300)
        end)

      assert log =~ "ErrorConnectingToWebsocket"
    end
  end

  describe "tenant that only has JWKS" do
    @oct_kid "oct-key-1"
    @oct_secret "jwks-only-tenant-secret"

    setup %{tenant: tenant} do
      jwks = %{"keys" => [%{"kty" => "oct", "kid" => @oct_kid, "k" => Base.url_encode64(@oct_secret, padding: false)}]}

      {:ok, tenant} =
        Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{jwt_secret: nil, jwt_jwks: jwks})

      Realtime.Tenants.Cache.update_cache(tenant)

      %{tenant: tenant}
    end

    test "connects, joins and refreshes its access_token with JWKS-signed tokens", %{tenant: tenant} do
      assert tenant.jwt_secret == nil

      {:ok, %Socket{} = socket} =
        connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, oct_token("connect")))

      %Socket{channel_pid: channel_pid} = socket = subscribe_and_join!(socket, "realtime:test", %{})

      new_token = oct_token("refresh")
      push(socket, "access_token", %{"access_token" => new_token})
      assert Server.socket(channel_pid).assigns.access_token == new_token

      # The periodic re-confirmation also verifies against the JWKS alone
      send(channel_pid, :confirm_token)
      assert Server.socket(channel_pid).assigns.access_token == new_token
      assert Process.alive?(channel_pid)
    end

    test "shuts down with JwtSignerError when refreshed with an HS256 token without kid", %{tenant: tenant} do
      {:ok, %Socket{} = socket} =
        connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, oct_token("connect")))

      %Socket{channel_pid: channel_pid} = socket = subscribe_and_join!(socket, "realtime:test", %{})

      log =
        capture_log(fn ->
          push(socket, "access_token", %{"access_token" => Generators.generate_jwt_token("another secret")})
          assert_process_down(channel_pid)
        end)

      assert log =~ "JwtSignerError"

      assert_receive %Socket.Message{
        event: "system",
        payload: %{message: "Failed to generate JWT signer, check your JWT secret or JWKS configuration"}
      }
    end

    test "shuts down with JwtSignerError when re-confirmation cannot generate a signer", %{tenant: tenant} do
      {:ok, %Socket{} = socket} =
        connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, oct_token("connect")))

      %Socket{channel_pid: channel_pid} = subscribe_and_join!(socket, "realtime:test", %{})

      log =
        capture_log(fn ->
          expect(RealtimeWeb.ChannelsAuthorization, :authorize_conn, fn _, _, _ ->
            {:error, :error_generating_signer}
          end)

          allow(RealtimeWeb.ChannelsAuthorization, self(), channel_pid)

          send(channel_pid, :confirm_token)
          assert_process_down(channel_pid)
        end)

      assert log =~ "JwtSignerError"

      assert_receive %Socket.Message{
        event: "system",
        payload: %{message: "Failed to generate JWT signer, check your JWT secret or JWKS configuration"}
      }
    end
  end

  describe "checks tenant db connectivity" do
    test "successful connection proceeds with join", %{tenant: tenant} do
      jwt = Generators.generate_jwt_token(tenant)

      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))
      assert {:ok, _, %Socket{}} = subscribe_and_join(socket, "realtime:test", %{})
    end

    test "unsuccessful connection halts join", %{tenant: tenant} do
      extension = %{
        "type" => "postgres_cdc_rls",
        "settings" => %{
          "db_host" => "127.0.0.1",
          "db_name" => "false",
          "db_user" => "false",
          "db_password" => "false",
          "poll_interval" => 100,
          "poll_max_changes" => 100,
          "poll_max_record_bytes" => 1_048_576,
          "region" => "us-east-1",
          "ssl_enforced" => false
        }
      }

      {:ok, tenant} = update_extension(tenant, extension)
      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert {:error, %{reason: "UnableToConnectToProject: Realtime was unable to connect to the project database"}} =
               subscribe_and_join(socket, "realtime:test", %{"config" => %{"private" => true}})
    end

    test "lack of connections halts join", %{tenant: tenant} do
      extension =
        %{
          "type" => "postgres_cdc_rls",
          "settings" => %{
            "db_host" => "127.0.0.1",
            "db_name" => "postgres",
            "db_user" => "supabase_admin",
            "db_password" => "postgres",
            "poll_interval" => 100,
            "poll_max_changes" => 100,
            "poll_max_record_bytes" => 1_048_576,
            "region" => "us-east-1",
            "ssl_enforced" => false,
            "db_pool" => 100,
            "subcriber_pool_size" => 100,
            "subs_pool_size" => 100
          }
        }

      {:ok, tenant} = update_extension(tenant, extension)

      jwt = Generators.generate_jwt_token(tenant)
      {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))

      assert {:error,
              %{reason: "DatabaseLackOfConnections: Database can't accept more connections, Realtime won't connect"}} =
               subscribe_and_join(socket, "realtime:test", %{"config" => %{"private" => true}})
    end
  end

  defp conn_opts(tenant, token) do
    [
      connect_info: %{
        uri: URI.parse("https://#{tenant.external_id}.localhost:4000/socket/websocket"),
        x_headers: [{"x-api-key", token}]
      }
    ]
  end

  defp join_waiting_for_postgres_changes(tenant, options, changes \\ [%{"event" => "INSERT", "schema" => "public"}]) do
    jwt = Generators.generate_jwt_token(tenant)
    {:ok, %Socket{} = socket} = connect(UserSocket, %{}, conn_opts(tenant, jwt))
    config = %{"postgres_changes" => changes, "postgres_changes_options" => options}

    subscribe_and_join(socket, "realtime:test", %{"config" => config})
  end

  defp update_extension(tenant, extension) do
    db_port = Realtime.Crypto.decrypt!(hd(tenant.extensions).settings["db_port"])

    extensions = [
      put_in(extension, ["settings", "db_port"], db_port)
    ]

    with {:ok, tenant} <- Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{extensions: extensions}) do
      Realtime.Tenants.Cache.update_cache(tenant)
      {:ok, tenant}
    end
  end

  defp assert_process_down(pid) do
    ref = Process.monitor(pid)
    assert_receive {:DOWN, ^ref, :process, ^pid, _reason}
  end

  defp join_public_channel(tenant) do
    jwt = Generators.generate_jwt_token(tenant)
    {:ok, %Socket{} = socket} = connect(UserSocket, %{"log_level" => "warning"}, conn_opts(tenant, jwt))
    subscribe_and_join!(socket, "realtime:test", %{})
  end

  # Tokens passed to the verifier since the last call, oldest first. Mimic's call log is drained by
  # reading it, so each call reports only what was verified since the previous one.
  defp newly_verified_tokens do
    RealtimeWeb.ChannelsAuthorization
    |> Mimic.calls(:authorize_conn, 3)
    |> Enum.map(fn [token | _] -> token end)
  end

  defp oct_token(sub) do
    signer = Joken.Signer.create("HS256", @oct_secret, %{"kid" => @oct_kid})
    claims = %{"role" => "authenticated", "sub" => sub, "exp" => System.system_time(:second) + 10_000}
    Joken.generate_and_sign!(%{}, claims, signer)
  end

  # The throttle only treats a token as a new refresh if it differs from the current and held ones,
  # so each one needs a distinct `sub`.
  defp distinct_token(tenant, sub) do
    Generators.generate_jwt_token(tenant, %{
      exp: System.system_time(:second) + 10_000,
      role: "authenticated",
      sub: sub
    })
  end

  defp rls_context(%{tenant: tenant, policies: policies}) do
    {:ok, conn} = Realtime.Database.connect(tenant, "realtime_test", :stop)
    create_rls_policies(conn, policies, %{topic: "realtime:test"})
    :ok
  end

  defp rls_context(_), do: :ok
end
