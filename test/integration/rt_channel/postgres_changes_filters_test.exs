defmodule Realtime.Integration.RtChannel.PostgresChangesFiltersTest do
  # Filter matching happens database-side and is independent of the websocket serializer, so
  # unlike the rest of PostgresChangesTest these run under a single serializer. The encode/decode
  # path for postgres_changes payloads stays covered by the parameterized tests in
  # Realtime.Integration.RtChannel.PostgresChangesTest.

  use RealtimeWeb.ConnCase, async: true

  import Generators

  alias Extensions.PostgresCdcRls
  alias Phoenix.Socket.Message
  alias Postgrex
  alias Realtime.Integration.WebsocketClient
  alias Realtime.Tenants.Connect

  @moduletag :capture_log

  @serializer RealtimeWeb.Socket.V2Serializer

  setup_all do
    # Unboxed (non-sandboxed) so the single tenant is visible across every test process.
    tenant = TestTenantDb.checkout_tenant_unboxed(run_migrations: true)
    {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
    assert Connect.ready?(tenant.external_id)
    setup_postgres_changes(db_conn)

    # Full replica identity so the DELETE old tuple carries `details`; otherwise a filter on a
    # non-PK column can't be evaluated on delete (the old tuple would only hold the primary key).
    Postgrex.query!(db_conn, "alter table test replica identity full", [])

    %{tenant: tenant}
  end

  describe "filters" do
    test "eq filter matches on insert, update and delete", %{tenant: tenant} do
      assert_filter_delivers(tenant, "details=eq.hello", "hello")
    end

    test "neq filter matches on insert, update and delete", %{tenant: tenant} do
      assert_filter_delivers(tenant, "details=neq.other", "hello")
    end

    test "lt filter matches on insert, update and delete", %{tenant: tenant} do
      assert_filter_delivers(tenant, "details=lt.m", "a")
    end

    test "lte filter matches on insert, update and delete", %{tenant: tenant} do
      assert_filter_delivers(tenant, "details=lte.m", "m")
    end

    test "gt filter matches on insert, update and delete", %{tenant: tenant} do
      assert_filter_delivers(tenant, "details=gt.a", "z")
    end

    test "gte filter matches on insert, update and delete", %{tenant: tenant} do
      assert_filter_delivers(tenant, "details=gte.z", "z")
    end

    test "in filter matches on insert, update and delete", %{tenant: tenant} do
      assert_filter_delivers(tenant, "details=in.(hello,world)", "hello")
    end

    test "like filter matches on insert, update and delete", %{tenant: tenant} do
      assert_filter_delivers(tenant, "details=like.hel%", "hello")
    end

    test "ilike filter matches on insert, update and delete", %{tenant: tenant} do
      assert_filter_delivers(tenant, "details=ilike.HEL%", "hello")
    end

    test "is filter matches on insert, update and delete", %{tenant: tenant} do
      assert_filter_delivers(tenant, "details=is.null", nil)
    end

    test "match filter matches on insert, update and delete", %{tenant: tenant} do
      assert_filter_delivers(tenant, "details=match.^hel", "hello")
    end

    test "imatch filter matches on insert, update and delete", %{tenant: tenant} do
      assert_filter_delivers(tenant, "details=imatch.^HEL", "hello")
    end

    test "isdistinct filter matches on insert, update and delete", %{tenant: tenant} do
      assert_filter_delivers(tenant, "details=isdistinct.other", "hello")
    end

    test "delivers row matching all filters", %{tenant: tenant} do
      {socket, _} = get_connection(tenant, @serializer)
      topic = "realtime:any"

      # details=eq.match AND id=gt.0 — all rows have id > 0 (auto-increment from 1),
      # so the second condition is always true, making details=eq.match the effective selector.
      filter = "details=eq.match,id=gt.0"

      config = %{
        postgres_changes: [%{event: "INSERT", schema: "public", table: "test", filter: filter}]
      }

      WebsocketClient.join(socket, topic, %{config: config})

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

      %{rows: [[matching_id]]} =
        Postgrex.query!(conn, "insert into test (details) values ('match') returning id", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{
                         "data" => %{
                           "record" => %{"id" => ^matching_id, "details" => "match"},
                           "type" => "INSERT"
                         }
                       },
                       ref: nil,
                       topic: ^topic
                     },
                     500
    end

    test "ignores row matching only one filter", %{tenant: tenant} do
      {socket, _} = get_connection(tenant, @serializer)
      topic = "realtime:any"

      # details=eq.match AND id=gt.0 — all rows have id > 0 (auto-increment from 1),
      # so the second condition is always true, making details=eq.match the effective selector.
      filter = "details=eq.match,id=gt.0"

      config = %{
        postgres_changes: [%{event: "INSERT", schema: "public", table: "test", filter: filter}]
      }

      WebsocketClient.join(socket, topic, %{config: config})

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

      # Row matching only the second filter (id>0) but not the first (details!='match') — should be ignored
      Postgrex.query!(conn, "insert into test (details) values ('no-match') returning id", [])

      refute_receive %Message{
                       event: "postgres_changes",
                       payload: %{"data" => %{"type" => "INSERT"}},
                       topic: ^topic
                     },
                     500
    end

    test "not negates a filter, excluding the matched value", %{tenant: tenant} do
      {socket, _} = get_connection(tenant, @serializer)
      topic = "realtime:any"

      config = %{
        postgres_changes: [%{event: "INSERT", schema: "public", table: "test", filter: "details=not.eq.skip"}]
      }

      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 200

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

      Postgrex.query!(conn, "insert into test (details) values ('skip')", [])

      refute_receive %Message{
                       event: "postgres_changes",
                       payload: %{"data" => %{"record" => %{"details" => "skip"}}},
                       topic: ^topic
                     },
                     500

      %{rows: [[id]]} = Postgrex.query!(conn, "insert into test (details) values ('keep') returning id", [])

      assert_receive %Message{
                       event: "postgres_changes",
                       payload: %{"data" => %{"record" => %{"id" => ^id, "details" => "keep"}, "type" => "INSERT"}},
                       topic: ^topic
                     },
                     500
    end
  end

  defp assert_filter_delivers(tenant, filter, value) do
    {socket, _} = get_connection(tenant, @serializer)
    topic = "realtime:any"
    config = %{postgres_changes: [%{event: "*", schema: "public", table: "test", filter: filter}]}

    WebsocketClient.join(socket, topic, %{config: config})

    assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^topic}, 200

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

    %{rows: [[id]]} = Postgrex.query!(conn, "insert into test (details) values ($1) returning id", [value])

    assert_receive %Message{
                     event: "postgres_changes",
                     payload: %{"data" => %{"record" => %{"id" => ^id}, "type" => "INSERT"}},
                     topic: ^topic
                   },
                   500

    Postgrex.query!(conn, "update test set details = $1 where id = $2", [value, id])

    assert_receive %Message{
                     event: "postgres_changes",
                     payload: %{"data" => %{"record" => %{"id" => ^id}, "type" => "UPDATE"}},
                     topic: ^topic
                   },
                   500

    Postgrex.query!(conn, "delete from test where id = $1", [id])

    assert_receive %Message{
                     event: "postgres_changes",
                     payload: %{"data" => %{"old_record" => %{"id" => ^id}, "type" => "DELETE"}},
                     topic: ^topic
                   },
                   500
  end
end
