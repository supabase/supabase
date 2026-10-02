defmodule Realtime.Integration.RtChannel.PostgresChangesTest do
  use RealtimeWeb.ConnCase,
    async: true,
    parameterize: [
      %{serializer: Phoenix.Socket.V1.JSONSerializer},
      %{serializer: RealtimeWeb.Socket.V2Serializer}
    ]

  import ExUnit.CaptureLog
  import Generators

  alias Extensions.PostgresCdcRls
  alias Extensions.PostgresCdcRls.ReplicationPoller
  alias Phoenix.Socket.Message
  alias Postgrex
  alias Realtime.Database
  alias Realtime.Integration.WebsocketClient

  @moduletag :capture_log

  setup [:checkout_tenant_connect_and_setup_postgres_changes]

  describe "insert" do
    test "handle insert", %{tenant: tenant, serializer: serializer} do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"
      config = %{postgres_changes: [%{event: "INSERT", schema: "public"}]}

      WebsocketClient.join(socket, topic, %{config: config})
      sub_id = :erlang.phash2(%{"event" => "INSERT", "schema" => "public"})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{
                         "response" => %{
                           "postgres_changes" => [
                             %{"event" => "INSERT", "id" => ^sub_id, "schema" => "public"}
                           ]
                         },
                         "status" => "ok"
                       },
                       topic: ^topic
                     },
                     200

      assert_receive %Message{
                       event: "system",
                       payload: %{
                         "channel" => "any",
                         "extension" => "postgres_changes",
                         "message" => "Subscribed to PostgreSQL",
                         "status" => "ok"
                       },
                       ref: nil,
                       topic: ^topic
                     },
                     8000

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      %{rows: [[id]]} =
        Postgrex.query!(conn, "insert into test (details) values ('test') returning id", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "columns" => [
                             %{"name" => "id", "type" => "int4"},
                             %{"name" => "details", "type" => "text"},
                             %{"name" => "binary_data", "type" => "bytea"}
                           ],
                           "commit_timestamp" => _ts,
                           "errors" => nil,
                           "record" => %{"details" => "test", "id" => ^id},
                           "schema" => "public",
                           "table" => "test",
                           "type" => "INSERT"
                         },
                         "ids" => [^sub_id]
                       },
                       ref: nil,
                       topic: "realtime:any"
                     },
                     500
    end
  end

  describe "wait for subscription" do
    test "a write straight after the join reply is not missed", %{tenant: tenant, serializer: serializer} do
      assert_cdc_stopped(tenant)

      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"

      config = %{
        postgres_changes: [%{event: "INSERT", schema: "public"}],
        postgres_changes_options: %{wait: true, timeout: 15_000}
      }

      WebsocketClient.join(socket, topic, %{config: config})
      sub_id = :erlang.phash2(%{"event" => "INSERT", "schema" => "public"})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{
                         "response" => %{
                           "postgres_changes" => [%{"event" => "INSERT", "id" => ^sub_id, "schema" => "public"}]
                         },
                         "status" => "ok"
                       },
                       topic: ^topic
                     },
                     20_000

      assert_receive %Message{
                       event: "system",
                       payload: %{
                         "channel" => "any",
                         "extension" => "postgres_changes",
                         "message" => "Subscribed to PostgreSQL",
                         "status" => "ok"
                       },
                       ref: nil,
                       topic: ^topic
                     },
                     500

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      [{poller_pid, _}] = Registry.lookup(ReplicationPoller.Registry, tenant.external_id)
      wait_for_poller_oids(poller_pid)

      %{rows: [[id]]} = Postgrex.query!(conn, "insert into test (details) values ('test') returning id", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{"record" => %{"details" => "test", "id" => ^id}, "type" => "INSERT"},
                         "ids" => [^sub_id]
                       },
                       ref: nil,
                       topic: ^topic
                     },
                     2000
    end

    test "join is rejected when the subscription params are malformed", %{tenant: tenant, serializer: serializer} do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"

      config = %{
        postgres_changes: [%{event: "INSERT", schema: "public", table: "test", filter: "wrong"}],
        postgres_changes_options: %{wait: true, timeout: 15_000}
      }

      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{"status" => "error", "response" => %{"reason" => reason}},
                       topic: ^topic
                     },
                     20_000

      assert reason =~ "RealtimeDisabledForConfiguration"
      assert reason =~ "Error parsing `filter` params"
    end
  end

  describe "bytea column" do
    test "handle insert with bytea data without double-encoding", %{
      tenant: tenant,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"
      config = %{postgres_changes: [%{event: "INSERT", schema: "public"}]}

      WebsocketClient.join(socket, topic, %{config: config})
      sub_id = :erlang.phash2(%{"event" => "INSERT", "schema" => "public"})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{"status" => "ok"},
                       topic: ^topic
                     },
                     200

      assert_receive %Message{
                       event: "system",
                       payload: %{
                         "channel" => "any",
                         "extension" => "postgres_changes",
                         "message" => "Subscribed to PostgreSQL",
                         "status" => "ok"
                       },
                       ref: nil,
                       topic: ^topic
                     },
                     8000

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      binary_value = <<1, 2, 3, 4, 5>>

      %{rows: [[_id]]} =
        Postgrex.query!(
          conn,
          "insert into test (details, binary_data) values ('test', $1) returning id",
          [binary_value]
        )

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "record" => record,
                           "type" => "INSERT"
                         },
                         "ids" => [^sub_id]
                       },
                       ref: nil,
                       topic: "realtime:any"
                     },
                     500

      # The bytea value should be the hex string as provided by wal2json
      assert record["binary_data"] == "0102030405"
    end
  end

  describe "update" do
    test "handle update", %{tenant: tenant, serializer: serializer} do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"
      config = %{postgres_changes: [%{event: "UPDATE", schema: "public"}]}

      WebsocketClient.join(socket, topic, %{config: config})
      sub_id = :erlang.phash2(%{"event" => "UPDATE", "schema" => "public"})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{
                         "response" => %{
                           "postgres_changes" => [
                             %{"event" => "UPDATE", "id" => ^sub_id, "schema" => "public"}
                           ]
                         },
                         "status" => "ok"
                       },
                       ref: "1",
                       topic: ^topic
                     },
                     200

      assert_receive %Message{
                       event: "system",
                       payload: %{
                         "channel" => "any",
                         "extension" => "postgres_changes",
                         "message" => "Subscribed to PostgreSQL",
                         "status" => "ok"
                       },
                       ref: nil,
                       topic: ^topic
                     },
                     8000

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      %{rows: [[id]]} =
        Postgrex.query!(conn, "insert into test (details) values ('test') returning id", [])

      Postgrex.query!(conn, "update test set details = 'test' where id = #{id}", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "columns" => [
                             %{"name" => "id", "type" => "int4"},
                             %{"name" => "details", "type" => "text"},
                             %{"name" => "binary_data", "type" => "bytea"}
                           ],
                           "commit_timestamp" => _ts,
                           "errors" => nil,
                           "old_record" => %{"id" => ^id},
                           "record" => %{"details" => "test", "id" => ^id},
                           "schema" => "public",
                           "table" => "test",
                           "type" => "UPDATE"
                         },
                         "ids" => [^sub_id]
                       },
                       ref: nil,
                       topic: "realtime:any"
                     },
                     500
    end
  end

  describe "delete" do
    test "handle delete", %{tenant: tenant, serializer: serializer} do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"
      config = %{postgres_changes: [%{event: "DELETE", schema: "public"}]}

      WebsocketClient.join(socket, topic, %{config: config})
      sub_id = :erlang.phash2(%{"event" => "DELETE", "schema" => "public"})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{
                         "response" => %{
                           "postgres_changes" => [
                             %{"event" => "DELETE", "id" => ^sub_id, "schema" => "public"}
                           ]
                         },
                         "status" => "ok"
                       },
                       ref: "1",
                       topic: ^topic
                     },
                     200

      assert_receive %Message{
                       event: "system",
                       payload: %{
                         "channel" => "any",
                         "extension" => "postgres_changes",
                         "message" => "Subscribed to PostgreSQL",
                         "status" => "ok"
                       },
                       ref: nil,
                       topic: ^topic
                     },
                     8000

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      %{rows: [[id]]} =
        Postgrex.query!(conn, "insert into test (details) values ('test') returning id", [])

      Postgrex.query!(conn, "delete from test where id = #{id}", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "columns" => [
                             %{"name" => "id", "type" => "int4"},
                             %{"name" => "details", "type" => "text"},
                             %{"name" => "binary_data", "type" => "bytea"}
                           ],
                           "commit_timestamp" => _ts,
                           "errors" => nil,
                           "old_record" => %{"id" => ^id},
                           "schema" => "public",
                           "table" => "test",
                           "type" => "DELETE"
                         },
                         "ids" => [^sub_id]
                       },
                       ref: nil,
                       topic: "realtime:any"
                     },
                     500
    end
  end

  describe "wildcard" do
    test "handle wildcard", %{tenant: tenant, serializer: serializer} do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"
      config = %{postgres_changes: [%{event: "*", schema: "public"}]}

      WebsocketClient.join(socket, topic, %{config: config})
      sub_id = :erlang.phash2(%{"event" => "*", "schema" => "public"})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{
                         "response" => %{
                           "postgres_changes" => [
                             %{"event" => "*", "id" => ^sub_id, "schema" => "public"}
                           ]
                         },
                         "status" => "ok"
                       },
                       ref: "1",
                       topic: ^topic
                     },
                     200

      assert_receive %Message{
                       event: "system",
                       payload: %{
                         "channel" => "any",
                         "extension" => "postgres_changes",
                         "message" => "Subscribed to PostgreSQL",
                         "status" => "ok"
                       },
                       ref: nil,
                       topic: ^topic
                     },
                     8000

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      %{rows: [[id]]} =
        Postgrex.query!(conn, "insert into test (details) values ('test') returning id", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "columns" => [
                             %{"name" => "id", "type" => "int4"},
                             %{"name" => "details", "type" => "text"},
                             %{"name" => "binary_data", "type" => "bytea"}
                           ],
                           "commit_timestamp" => _ts,
                           "errors" => nil,
                           "record" => %{"id" => ^id},
                           "schema" => "public",
                           "table" => "test",
                           "type" => "INSERT"
                         },
                         "ids" => [^sub_id]
                       },
                       ref: nil,
                       topic: "realtime:any"
                     },
                     500

      Postgrex.query!(conn, "update test set details = 'test' where id = #{id}", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "columns" => [
                             %{"name" => "id", "type" => "int4"},
                             %{"name" => "details", "type" => "text"},
                             %{"name" => "binary_data", "type" => "bytea"}
                           ],
                           "commit_timestamp" => _ts,
                           "errors" => nil,
                           "old_record" => %{"id" => ^id},
                           "record" => %{"details" => "test", "id" => ^id},
                           "schema" => "public",
                           "table" => "test",
                           "type" => "UPDATE"
                         },
                         "ids" => [^sub_id]
                       },
                       ref: nil,
                       topic: "realtime:any"
                     },
                     500

      Postgrex.query!(conn, "delete from test where id = #{id}", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "columns" => [
                             %{"name" => "id", "type" => "int4"},
                             %{"name" => "details", "type" => "text"},
                             %{"name" => "binary_data", "type" => "bytea"}
                           ],
                           "commit_timestamp" => _ts,
                           "errors" => nil,
                           "old_record" => %{"id" => ^id},
                           "schema" => "public",
                           "table" => "test",
                           "type" => "DELETE"
                         },
                         "ids" => [^sub_id]
                       },
                       ref: nil,
                       topic: "realtime:any"
                     },
                     500
    end
  end

  describe "select column filtering" do
    test "subscribe with select filters payload columns — INSERT", %{
      tenant: tenant,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"

      config = %{
        postgres_changes: [
          %{event: "INSERT", schema: "public", table: "test", select: ["details"]}
        ]
      }

      WebsocketClient.join(socket, topic, %{config: config})
      sub_id = :erlang.phash2(%{"event" => "INSERT", "schema" => "public", "table" => "test", "select" => ["details"]})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic},
                     200

      assert_receive %Message{
                       event: "system",
                       payload: %{
                         "extension" => "postgres_changes",
                         "message" => "Subscribed to PostgreSQL",
                         "status" => "ok"
                       },
                       topic: ^topic
                     },
                     8000

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      %{rows: [[id]]} =
        Postgrex.query!(conn, "insert into test (details) values ('hello') returning id", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "columns" => columns,
                           "record" => record,
                           "type" => "INSERT"
                         },
                         "ids" => [^sub_id]
                       },
                       topic: ^topic
                     },
                     500

      # PK always included even when not in select
      assert record["id"] == id
      assert record["details"] == "hello"
      # binary_data not in select — must be absent
      refute Map.has_key?(record, "binary_data")
      # columns metadata only shows selected + PK columns
      column_names = Enum.map(columns, & &1["name"])
      assert "id" in column_names
      assert "details" in column_names
      refute "binary_data" in column_names
    end

    test "subscribe with an empty select delivers primary keys only — INSERT", %{
      tenant: tenant,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"

      config = %{
        postgres_changes: [
          %{event: "INSERT", schema: "public", table: "test", select: []}
        ]
      }

      WebsocketClient.join(socket, topic, %{config: config})
      sub_id = :erlang.phash2(%{"event" => "INSERT", "schema" => "public", "table" => "test", "select" => []})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic},
                     200

      assert_receive %Message{
                       event: "system",
                       payload: %{
                         "extension" => "postgres_changes",
                         "message" => "Subscribed to PostgreSQL",
                         "status" => "ok"
                       },
                       topic: ^topic
                     },
                     8000

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      %{rows: [[id]]} =
        Postgrex.query!(conn, "insert into test (details) values ('hello') returning id", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "columns" => columns,
                           "record" => record,
                           "type" => "INSERT"
                         },
                         "ids" => [^sub_id]
                       },
                       topic: ^topic
                     },
                     500

      # An empty select means primary keys only: the PK is present and every
      # non-pkey column is excluded (distinct from omitting select, which delivers
      # all columns).
      assert record["id"] == id
      refute Map.has_key?(record, "details")
      refute Map.has_key?(record, "binary_data")
      # columns metadata reflects the same: only the PK column is present
      assert Enum.map(columns, & &1["name"]) == ["id"]
    end

    test "subscribe with select filters payload columns — UPDATE", %{
      tenant: tenant,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"

      config = %{
        postgres_changes: [
          %{event: "UPDATE", schema: "public", table: "test", select: ["details"]}
        ]
      }

      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic},
                     200

      assert_receive %Message{
                       event: "system",
                       payload: %{"extension" => "postgres_changes", "status" => "ok"},
                       topic: ^topic
                     },
                     8000

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      %{rows: [[id]]} =
        Postgrex.query!(conn, "insert into test (details) values ('before') returning id", [])

      Postgrex.query!(conn, "update test set details = 'after' where id = #{id}", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "record" => record,
                           "old_record" => old_record,
                           "type" => "UPDATE"
                         }
                       },
                       topic: ^topic
                     },
                     500

      # new record: only selected + PK
      assert record["id"] == id
      assert record["details"] == "after"
      refute Map.has_key?(record, "binary_data")

      # old_record: only selected + PK
      assert old_record["id"] == id
      refute Map.has_key?(old_record, "binary_data")
    end

    test "subscribe with select filters payload columns — DELETE", %{
      tenant: tenant,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"

      config = %{
        postgres_changes: [
          %{event: "DELETE", schema: "public", table: "test", select: ["details"]}
        ]
      }

      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic},
                     200

      assert_receive %Message{
                       event: "system",
                       payload: %{"extension" => "postgres_changes", "status" => "ok"},
                       topic: ^topic
                     },
                     8000

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      %{rows: [[id]]} =
        Postgrex.query!(conn, "insert into test (details) values ('bye') returning id", [])

      Postgrex.query!(conn, "delete from test where id = #{id}", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "old_record" => old_record,
                           "type" => "DELETE"
                         }
                       },
                       topic: ^topic
                     },
                     500

      # old_record filtered to selected + PK
      assert old_record["id"] == id
      refute Map.has_key?(old_record, "binary_data")
    end

    test "subscribe without select receives full payload — backward compat", %{
      tenant: tenant,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"
      config = %{postgres_changes: [%{event: "INSERT", schema: "public", table: "test"}]}

      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic},
                     200

      assert_receive %Message{
                       event: "system",
                       payload: %{"extension" => "postgres_changes", "status" => "ok"},
                       topic: ^topic
                     },
                     8000

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      %{rows: [[id]]} =
        Postgrex.query!(conn, "insert into test (details) values ('full') returning id", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "columns" => columns,
                           "record" => record,
                           "type" => "INSERT"
                         }
                       },
                       topic: ^topic
                     },
                     500

      # All columns present
      assert record["id"] == id
      assert record["details"] == "full"
      column_names = Enum.map(columns, & &1["name"])
      assert "id" in column_names
      assert "details" in column_names
      assert "binary_data" in column_names
    end

    test "select with filter only delivers matching rows with filtered columns", %{
      tenant: tenant,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"

      config = %{
        postgres_changes: [
          %{
            event: "INSERT",
            schema: "public",
            table: "test",
            filter: "details=eq.match",
            select: ["details"]
          }
        ]
      }

      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic},
                     200

      assert_receive %Message{
                       event: "system",
                       payload: %{"extension" => "postgres_changes", "status" => "ok"},
                       topic: ^topic
                     },
                     8000

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      # Non-matching row — should not be received
      Postgrex.query!(conn, "insert into test (details) values ('no-match') returning id", [])

      refute_receive %Message{event: "postgres_changes", topic: ^topic}, 300

      # Matching row
      %{rows: [[id]]} =
        Postgrex.query!(conn, "insert into test (details) values ('match') returning id", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "record" => record,
                           "type" => "INSERT"
                         }
                       },
                       topic: ^topic
                     },
                     500

      assert record["id"] == id
      assert record["details"] == "match"
      refute Map.has_key?(record, "binary_data")
    end

    test "payload size is reduced when using select — performance proxy", %{
      tenant: tenant,
      serializer: serializer
    } do
      large_value = String.duplicate("x", 2048)

      # Subscriber with select — only id (start this first to boot the CDC manager)
      {socket_select, _} = get_connection(tenant, serializer)
      topic_select = "realtime:select"

      WebsocketClient.join(socket_select, topic_select, %{
        config: %{postgres_changes: [%{event: "INSERT", schema: "public", table: "test", select: ["id"]}]}
      })

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic_select},
                     200

      assert_receive %Message{
                       event: "system",
                       payload: %{"extension" => "postgres_changes", "status" => "ok"},
                       topic: ^topic_select
                     },
                     8000

      # Manager is now running — add the large_text column
      {:ok, _, setup_conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)
      Postgrex.query!(setup_conn, "alter table test add column if not exists large_text text", [])

      # Subscriber without select — full payload
      {socket_full, _} = get_connection(tenant, serializer)
      topic_full = "realtime:full"

      WebsocketClient.join(socket_full, topic_full, %{
        config: %{postgres_changes: [%{event: "INSERT", schema: "public", table: "test"}]}
      })

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic_full},
                     200

      assert_receive %Message{
                       event: "system",
                       payload: %{"extension" => "postgres_changes", "status" => "ok"},
                       topic: ^topic_full
                     },
                     8000

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)
      Postgrex.query!(conn, "insert into test (details, large_text) values ('hi', $1)", [large_value])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{"data" => full_data},
                       topic: ^topic_full
                     } = full_msg,
                     500

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{"data" => select_data},
                       topic: ^topic_select
                     } = select_msg,
                     500

      full_size = full_msg |> :erlang.term_to_binary() |> byte_size()
      select_size = select_msg |> :erlang.term_to_binary() |> byte_size()

      assert select_size < full_size
      assert Map.has_key?(full_data["record"], "large_text")
      refute Map.has_key?(select_data["record"], "large_text")
    end
  end

  describe "error handling" do
    test "error subscribing", %{tenant: tenant, serializer: serializer} do
      {:ok, conn} = Database.connect(tenant, "realtime_test")

      {:ok, _} =
        Database.transaction(conn, fn db_conn ->
          Postgrex.query!(db_conn, "drop publication if exists supabase_realtime_test")
        end)

      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"
      config = %{postgres_changes: [%{event: "INSERT", schema: "public"}]}

      log =
        capture_log(fn ->
          WebsocketClient.join(socket, topic, %{config: config})

          assert_receive %Message{
                           event: "system",
                           payload: %{
                             "channel" => "any",
                             "extension" => "postgres_changes",
                             "message" =>
                               "Unable to subscribe to changes with given parameters. Please check Realtime is enabled for the given connect parameters: [event: INSERT, schema: public, table: *, filters: [], select: nil]",
                             "status" => "error"
                           },
                           ref: nil,
                           topic: ^topic
                         },
                         8000
        end)

      assert log =~ "RealtimeDisabledForConfiguration"
      assert log =~ "Unable to subscribe to changes with given parameters"
    end

    test "a joined channel re-subscribes after the cdc tree goes down", %{tenant: tenant, serializer: serializer} do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"
      config = %{postgres_changes: [%{event: "INSERT", schema: "public"}]}
      sub_id = :erlang.phash2(%{"event" => "INSERT", "schema" => "public"})

      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 200

      assert_receive %Message{
                       event: "system",
                       payload: %{"extension" => "postgres_changes", "status" => "ok"},
                       topic: ^topic
                     },
                     8000

      assert_cdc_stopped(tenant)

      assert_receive %Message{
                       event: "system",
                       payload: %{"extension" => "postgres_changes", "status" => "ok"},
                       topic: ^topic
                     },
                     20_000

      {:ok, _, conn} = PostgresCdcRls.get_manager_conn(tenant.external_id)

      %{rows: [[id]]} =
        Postgrex.query!(conn, "insert into test (details) values ('after down') returning id", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{"record" => %{"details" => "after down", "id" => ^id}, "type" => "INSERT"},
                         "ids" => [^sub_id]
                       },
                       ref: nil,
                       topic: ^topic
                     },
                     2000
    end

    test "handle nil postgres changes params as empty param changes", %{
      tenant: tenant,
      serializer: serializer
    } do
      {socket, _} = get_connection(tenant, serializer)
      topic = "realtime:any"
      config = %{postgres_changes: [nil]}

      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic},
                     200

      refute_receive %Message{
                       event: "system",
                       payload: %{
                         "channel" => "any",
                         "extension" => "postgres_changes",
                         "message" => "Subscribed to PostgreSQL",
                         "status" => "ok"
                       },
                       ref: nil,
                       topic: ^topic
                     },
                     1000
    end
  end

  defp assert_cdc_stopped(tenant) do
    PostgresCdcRls.handle_stop(tenant.external_id, 5000)
    assert_eventually PostgresCdcRls.get_manager_conn(tenant.external_id) == {:error, nil}
  end

  # The subscription reply only reflects the SubscriptionManager being ready — the
  # ReplicationPoller creates its logical slot independently, so poll until it's done.
  defp wait_for_poller_oids(poller_pid) do
    case_wait :sys.get_state(poller_pid) do
      %{oids: oids} = state when map_size(oids) > 0 -> state
    else
      state -> flunk("ReplicationPoller oids never populated. Last state: #{inspect(state)}")
    end
  end
end
