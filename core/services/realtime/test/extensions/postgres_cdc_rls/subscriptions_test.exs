defmodule Extensions.PostgresCdcRls.SubscriptionsTest do
  use RealtimeWeb.ChannelCase, async: true

  doctest Extensions.PostgresCdcRls.Subscriptions, import: true

  import ExUnit.CaptureLog

  alias Extensions.PostgresCdcRls.Subscriptions
  alias Realtime.Database

  setup :maybe_checkout_tenant

  # Pure-parse and dead-connection tests build their own pid (or none) and never touch the
  # context conn/tenant, so they skip the expensive tenant checkout + postgres_changes setup.
  defp maybe_checkout_tenant(%{without_db: true}), do: :ok

  defp maybe_checkout_tenant(context) do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)

    {:ok, db_settings} = Database.from_tenant(tenant, "realtime_rls")

    # Allow individual tests to override the pool queue settings.
    pool_opts = Map.get(context, :pool_queue, [])

    {:ok, conn} =
      db_settings
      |> Map.from_struct()
      |> Keyword.new()
      |> Keyword.merge(pool_opts)
      |> Postgrex.start_link()

    Integrations.setup_postgres_changes(conn)
    Subscriptions.delete_all(conn)
    assert %Postgrex.Result{rows: [[0]]} = Postgrex.query!(conn, "select count(*) from realtime.subscription", [])

    %{conn: conn, tenant: tenant}
  end

  describe "filters: parsing" do
    @describetag without_db: true

    test "user can combine two range conditions to create a bounded filter" do
      assert {:ok, {"*", "public", "test", filters, _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "id=gt.0,id=lt.100"
               })

      assert [{"id", "gt", "0", false}, {"id", "lt", "100", false}] = Enum.sort(filters)
    end

    test "user gets a clear error when one filter in a multi-filter expression is unsupported" do
      assert {:error, msg} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "id=gt.0,id=foo.100"
               })

      assert msg =~ "Error parsing `filter` params"
    end

    test "user can omit the filter value entirely to subscribe to all rows" do
      assert {:ok, {"*", "public", "test", [], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ""
               })
    end

    test "user can filter by a single equality condition" do
      assert {:ok, {"*", "public", "test", [{"id", "eq", "5", false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "id=eq.5"
               })
    end

    test "user can combine an in-list filter with an equality filter" do
      assert {:ok, {"*", "public", "test", filters, _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "id=in.(1,2,3),details=eq.active"
               })

      assert [{"details", "eq", "active", false}, {"id", "in", "{1,2,3}", false}] = Enum.sort(filters)
    end

    test "user can use an in-list filter with multi-word string values alongside another filter" do
      assert {:ok, {"*", "public", "test", filters, _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "name=in.(red,blue),quantity=gt.0"
               })

      assert [{"name", "in", "{red,blue}", false}, {"quantity", "gt", "0", false}] = filters
    end

    test "user can place an in-list filter after a range filter" do
      assert {:ok, {"*", "public", "test", filters, _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "quantity=gt.0,name=in.(red,blue)"
               })

      assert [{"quantity", "gt", "0", false}, {"name", "in", "{red,blue}", false}] = filters
    end

    test "user can combine two in-list filters each with multiple values" do
      assert {:ok, {"*", "public", "test", filters, _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "name=in.(red,blue,green),status=in.(active,inactive)"
               })

      assert [{"name", "in", "{red,blue,green}", false}, {"status", "in", "{active,inactive}", false}] = filters
    end

    test "user can use filter values that contain a closing parenthesis character" do
      assert {:ok, {"*", "public", "test", filters, _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "a=eq.x),b=eq.y),c=eq.z"
               })

      assert [{"a", "eq", "x)", false}, {"b", "eq", "y)", false}, {"c", "eq", "z", false}] = filters
    end

    test "filter values keep quotes and other special characters verbatim" do
      assert {:ok, {"*", "public", "test", [{"name", "eq", ~s|O'Brien "x"|, false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~s|name=eq.O'Brien "x"|
               })

      assert {:ok, {"*", "public", "test", [{"name", "neq", "a'b", true}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "name=not.neq.a'b"
               })

      assert {:ok, {"*", "public", "test", [{"name", "in", "{O'Brien,Smith}", false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "name=in.(O'Brien,Smith)"
               })
    end

    test "a double-quoted value can contain a literal comma without splitting the filter" do
      assert {:ok, {"*", "public", "test", [{"name", "eq", "a,b", false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~s|name=eq."a,b"|
               })
    end

    test "a double-quoted value does not split a multi-filter expression on its inner comma" do
      assert {:ok, {"*", "public", "test", filters, _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~s|name=eq."a,b",id=gt.0|
               })

      assert [{"name", "eq", "a,b", false}, {"id", "gt", "0", false}] = filters
    end

    test "double quotes let a value contain other reserved characters (period, colon, parens)" do
      assert {:ok, {"*", "public", "test", [{"name", "eq", "a.b:c(d)", false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~s|name=eq."a.b:c(d)"|
               })
    end

    test "an escaped double quote inside a quoted value becomes a literal quote" do
      assert {:ok, {"*", "public", "test", [{"name", "eq", ~s|she said "hi"|, false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~s|name=eq."she said \\"hi\\""|
               })
    end

    test "an escaped backslash inside a quoted value becomes a single backslash" do
      assert {:ok, {"*", "public", "test", [{"path", "eq", ~S|C:\tmp|, false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~S|path=eq."C:\\tmp"|
               })
    end

    test "a quoted value combines with the not. negation prefix" do
      assert {:ok, {"*", "public", "test", [{"name", "neq", "a,b", true}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~s|name=not.neq."a,b"|
               })
    end

    test "a backslash inside a quoted value escapes the next character, whatever it is" do
      assert {:ok, {"*", "public", "test", [{"path", "eq", "C:new", false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~S|path=eq."C:\new"|
               })
    end

    test "an empty quoted value matches the empty string" do
      assert {:ok, {"*", "public", "test", [{"name", "eq", "", false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~s|name=eq.""|
               })
    end

    test "whitespace inside a quoted value is preserved verbatim" do
      assert {:ok, {"*", "public", "test", [{"name", "eq", " a ", false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~s|name=eq." a "|
               })
    end

    test "in-list elements can be double-quoted to contain commas" do
      assert {:ok, {"*", "public", "test", [{"tags", "in", ~s|{"a,b",c}|, false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~s|tags=in.("a,b",c)|
               })
    end

    test "multiple in-list elements can each be double-quoted" do
      assert {:ok, {"*", "public", "test", [{"tags", "in", ~s|{"a,b","c,d"}|, false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~s|tags=in.("a,b","c,d")|
               })
    end

    test "an unterminated quoted value falls back to a literal value (PostgREST behaviour)" do
      assert {:ok, {"*", "public", "test", [{"name", "eq", ~s|"unterminated|, false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~s|name=eq."unterminated|
               })
    end

    test "characters after a closing quote make the whole value literal (PostgREST backtracks)" do
      assert {:ok, {"*", "public", "test", [{"name", "eq", ~s|"ab"cd|, false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~s|name=eq."ab"cd|
               })
    end

    test "a double quote that is not at the start of a value does not protect a following comma" do
      assert {:ok, {"*", "public", "test", filters, _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ~s|desc=eq.5" tall,id=gt.0|
               })

      assert [{"desc", "eq", ~s|5" tall|, false}, {"id", "gt", "0", false}] = filters
    end

    test "user gets a clear error when the filter string ends with a stray comma" do
      assert {:error, msg} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "id=gt.0,"
               })

      assert msg =~ "empty segments"
    end

    test "user gets a clear error when the filter string starts with a stray comma" do
      assert {:error, msg} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => ",id=gt.0"
               })

      assert msg =~ "empty segments"
    end

    test "user gets a clear error when two commas appear back-to-back in a filter string" do
      assert {:error, msg} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "a=eq.1,,b=eq.2"
               })

      assert msg =~ "empty segments"
    end

    test "whitespace-only filter string is treated the same as no filter" do
      assert {:ok, {"*", "public", "test", [], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "   "
               })
    end

    test "like/ilike/is/match/imatch/isdistinct operators parse into filters" do
      assert {:ok, {"*", "public", "test", [{"details", "like", "hel%", false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "details=like.hel%"
               })

      assert {:ok, {"*", "public", "test", [{"flag", "is", "true", false}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "flag=is.true"
               })
    end

    test "the not. prefix sets the negate flag" do
      assert {:ok, {"*", "public", "test", [{"id", "eq", "5", true}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "id=not.eq.5"
               })

      assert {:ok, {"*", "public", "test", [{"details", "like", "hel%", true}], _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "details=not.like.hel%"
               })
    end

    test "operators can be combined in a single filter expression" do
      assert {:ok, {"*", "public", "test", filters, _}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "test",
                 "filter" => "id=eq.5,id=in.(1,2)"
               })

      assert [{"id", "eq", "5", false}, {"id", "in", "{1,2}", false}] = Enum.sort(filters)
    end

    test "user gets an error when filter param is not a string" do
      {:error, msg} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "images",
          "filter" => [123]
        })

      assert msg =~ "No subscription params provided"
    end
  end

  describe "filters: persisting to the subscription row" do
    test "filters are stored in the filters column", %{conn: conn} do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "filter" => "details=like.hel%"
        })

      params_list = [%{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}]

      assert {:ok, [%Postgrex.Result{}]} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())

      assert %Postgrex.Result{rows: [[[{"details", "like", "hel%", false}]]]} =
               Postgrex.query!(conn, "select filters from realtime.subscription", [])
    end

    test "create with filter on valid column succeeds", %{conn: conn} do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "filter" => "id=eq.123"
        })

      params_list = [%{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}]

      assert {:ok, [%Postgrex.Result{}]} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())

      assert %Postgrex.Result{
               rows: [
                 [
                   "test",
                   [{"id", "eq", "123", false}],
                   "*"
                 ]
               ]
             } =
               Postgrex.query!(
                 conn,
                 "select entity::text, filters, action_filter from realtime.subscription",
                 []
               )
    end

    test "user can combine AND row filters which are all stored in the subscription", %{
      conn: conn
    } do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "filter" => "id=gt.0,id=lt.100"
        })

      params_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:ok, [%Postgrex.Result{}]} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())

      assert %Postgrex.Result{rows: [[filters]]} =
               Postgrex.query!(conn, "select filters from realtime.subscription", [])

      assert [_, _] = filters
    end

    test "user gets an error when filtering on a column that does not exist", %{conn: conn} do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "filter" => "subject=eq.hey"
        })

      subscription_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:error,
              {:subscription_insert_failed,
               "Unable to subscribe to changes with given parameters. An exception happened so please check your connect parameters: [event: *, schema: public, table: test, filters: [{\"subject\", \"eq\", \"hey\", false}], select: nil]. Exception: ERROR P0001 (raise_exception) invalid column for filter subject"}} =
               Subscriptions.create(conn, "supabase_realtime_test", subscription_list, self(), self())

      %Postgrex.Result{rows: [[0]]} =
        Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
    end

    test "user gets an error when filter value is incompatible with column type", %{conn: conn} do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "filter" => "id=eq.hey"
        })

      subscription_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:error,
              {:subscription_insert_failed,
               "Unable to subscribe to changes with given parameters. An exception happened so please check your connect parameters: [event: *, schema: public, table: test, filters: [{\"id\", \"eq\", \"hey\", false}], select: nil]. Exception: ERROR 22P02 (invalid_text_representation) invalid input syntax for type integer: \"hey\""}} =
               Subscriptions.create(conn, "supabase_realtime_test", subscription_list, self(), self())

      %Postgrex.Result{rows: [[0]]} =
        Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
    end
  end

  describe "filters: gating rows end to end (apply_rls)" do
    test "apply_rls honours a like filter end to end", %{conn: conn} do
      visible_id = UUID.uuid1()
      hidden_id = UUID.uuid1()
      slot_name = "test_apply_rls_like_#{:rand.uniform(999_999)}"

      for {id, filter} <- [{visible_id, "details=like.hel%"}, {hidden_id, "details=like.bye%"}] do
        {:ok, subscription_params} =
          Subscriptions.parse_subscription_params(%{
            "schema" => "public",
            "table" => "test",
            "filter" => filter
          })

        params_list = [%{claims: %{"role" => "anon"}, id: id, subscription_params: subscription_params}]

        assert {:ok, [%Postgrex.Result{}]} =
                 Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())
      end

      create_replication_slot(conn, slot_name, plugin: "wal2json")

      try do
        Postgrex.query!(conn, "insert into test (details) values ('hello')", [])

        %{rows: rows} =
          Postgrex.query!(
            conn,
            "select wal, subscription_ids from realtime.list_changes($1, $2, 100, 1048576)",
            ["supabase_realtime_test", slot_name]
          )

        all_sub_ids = rows |> Enum.flat_map(fn [_wal, sub_ids] -> sub_ids || [] end)

        assert UUID.string_to_binary!(visible_id) in all_sub_ids
        refute UUID.string_to_binary!(hidden_id) in all_sub_ids
      after
        drop_replication_slot(conn, slot_name)
      end
    end

    test "equality, range and negation operators gate rows end to end", %{conn: conn} do
      visible_eq = UUID.uuid1()
      visible_compose = UUID.uuid1()
      hidden_eq = UUID.uuid1()
      hidden_negate = UUID.uuid1()
      slot_name = "test_apply_rls_operators_#{:rand.uniform(999_999)}"

      subs = [
        {visible_eq, "id=eq.5"},
        {visible_compose, "id=gt.0,details=eq.hello"},
        {hidden_eq, "id=eq.6"},
        {hidden_negate, "id=not.eq.5"}
      ]

      for {id, filter} <- subs do
        {:ok, subscription_params} =
          Subscriptions.parse_subscription_params(%{
            "schema" => "public",
            "table" => "test",
            "filter" => filter
          })

        params_list = [%{claims: %{"role" => "anon"}, id: id, subscription_params: subscription_params}]

        assert {:ok, [%Postgrex.Result{}]} =
                 Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())
      end

      create_replication_slot(conn, slot_name, plugin: "wal2json")

      try do
        Postgrex.query!(conn, "insert into test (id, details) values (5, 'hello')", [])

        %{rows: rows} =
          Postgrex.query!(
            conn,
            "select wal, subscription_ids from realtime.list_changes($1, $2, 100, 1048576)",
            ["supabase_realtime_test", slot_name]
          )

        all_sub_ids = rows |> Enum.flat_map(fn [_wal, sub_ids] -> sub_ids || [] end)

        assert UUID.string_to_binary!(visible_eq) in all_sub_ids
        assert UUID.string_to_binary!(visible_compose) in all_sub_ids
        refute UUID.string_to_binary!(hidden_eq) in all_sub_ids
        refute UUID.string_to_binary!(hidden_negate) in all_sub_ids
      after
        drop_replication_slot(conn, slot_name)
      end
    end

    test "apply_rls handles filter values containing quotes and special characters", %{conn: conn} do
      obrien = ~s|O'Brien "x"|
      angelo = "D'Angelo"

      match_eq = UUID.uuid1()
      match_neg = UUID.uuid1()
      match_in = UUID.uuid1()
      miss_eq = UUID.uuid1()
      slot_name = "test_apply_rls_quotes_#{:rand.uniform(999_999)}"

      subs = [
        {match_eq, "details=eq.#{obrien}"},
        {match_neg, "details=not.eq.nomatch"},
        {match_in, "details=in.(#{angelo},Smith)"},
        {miss_eq, "details=eq.someone-else"}
      ]

      for {id, filter} <- subs do
        {:ok, subscription_params} =
          Subscriptions.parse_subscription_params(%{"schema" => "public", "table" => "test", "filter" => filter})

        params_list = [%{claims: %{"role" => "anon"}, id: id, subscription_params: subscription_params}]

        assert {:ok, [%Postgrex.Result{}]} =
                 Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())
      end

      create_replication_slot(conn, slot_name, plugin: "wal2json")

      try do
        Postgrex.query!(conn, "insert into test (details) values ($1)", [obrien])
        Postgrex.query!(conn, "insert into test (details) values ($1)", [angelo])

        %{rows: rows} =
          Postgrex.query!(
            conn,
            "select wal, subscription_ids from realtime.list_changes($1, $2, 100, 1048576)",
            ["supabase_realtime_test", slot_name]
          )

        all_sub_ids = rows |> Enum.flat_map(fn [_wal, sub_ids] -> sub_ids || [] end)

        assert UUID.string_to_binary!(match_eq) in all_sub_ids
        assert UUID.string_to_binary!(match_neg) in all_sub_ids
        assert UUID.string_to_binary!(match_in) in all_sub_ids
        refute UUID.string_to_binary!(miss_eq) in all_sub_ids
      after
        drop_replication_slot(conn, slot_name)
      end
    end
  end

  describe "subscribing to table changes" do
    test "user can subscribe to all events on all tables in a schema", %{conn: conn} do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{"event" => "*", "schema" => "public"})

      params_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:ok, [%Postgrex.Result{}]} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())

      assert %Postgrex.Result{rows: rows} =
               Postgrex.query!(conn, "select filters, action_filter from realtime.subscription", [])

      assert rows != []
      assert Enum.all?(rows, &match?([[], "*"], &1))
    end

    test "subscription works when role lacks usage permission", %{conn: conn, tenant: tenant} do
      {:ok, admin_settings} = Database.from_tenant(tenant, "realtime_test", :stop)

      {:ok, admin_conn} =
        Postgrex.start_link(
          hostname: admin_settings.hostname,
          port: admin_settings.port,
          database: admin_settings.database,
          username: "supabase_admin",
          password: admin_settings.password
        )

      Postgrex.query!(admin_conn, "CREATE SCHEMA IF NOT EXISTS vault", [])
      Postgrex.query!(admin_conn, "REVOKE USAGE ON SCHEMA vault FROM supabase_realtime_admin", [])

      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "filter" => "id=eq.1"
        })

      params_list = [%{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}]

      assert {:ok, [%Postgrex.Result{}]} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())
    end

    test "create succeeds when the connection cached a stale user_defined_filter arity", %{conn: conn, tenant: tenant} do
      # Regression for ErrorOnRpcCall :badarg when a Postgrex connection holds a stale composite
      # arity for realtime.user_defined_filter.
      #
      # Postgrex caches a composite's field list per connection at bootstrap and never refreshes
      # it when ALTER TYPE changes the type. After ReAddPostgrestFilterOps the type carries a 4th
      # `negate` attribute, but a connection that bootstrapped before the re-add still caches the
      # 3-field arity. Building the filter row server-side (in the INSERT) instead of binding a
      # composite tuple keeps the arity resolved by the server's current catalog, so the insert
      # must still succeed on such a connection.
      #
      # We reproduce the stale cache by dropping the attribute, opening a fresh connection (which
      # caches 3 fields), then adding it back to 4 fields before inserting.
      {:ok, admin_settings} = Database.from_tenant(tenant, "realtime_test", :stop)

      {:ok, admin_conn} =
        Postgrex.start_link(
          hostname: admin_settings.hostname,
          port: admin_settings.port,
          database: admin_settings.database,
          username: "supabase_admin",
          password: admin_settings.password
        )

      # OrioleDB can't ALTER TYPE a type an index depends on.
      %Postgrex.Result{rows: [[index_name, index_def]]} =
        Postgrex.query!(
          admin_conn,
          """
          SELECT i.indexrelid::regclass::text, pg_get_indexdef(i.indexrelid)
          FROM pg_index i
          WHERE i.indrelid = 'realtime.subscription'::regclass
            AND EXISTS (
              SELECT 1 FROM pg_attribute a
              WHERE a.attrelid = i.indrelid AND a.attname = 'filters' AND a.attnum = ANY(i.indkey)
            )
          """,
          []
        )

      Postgrex.query!(admin_conn, "DROP INDEX IF EXISTS #{index_name}", [])

      Postgrex.query!(
        admin_conn,
        "alter type realtime.user_defined_filter drop attribute negate cascade",
        []
      )

      {:ok, stale_conn} =
        admin_settings
        |> Map.from_struct()
        |> Keyword.new()
        |> Postgrex.start_link()

      # Postgrex loads a composite type's field info lazily on first encode/decode, so force the
      # fresh connection to cache the 3-field arity by decoding a 3-field value now.
      Postgrex.query!(stale_conn, "select row('x', 'eq', 'y')::realtime.user_defined_filter", [])

      Postgrex.query!(
        admin_conn,
        "alter type realtime.user_defined_filter add attribute negate boolean cascade",
        []
      )

      Postgrex.query!(admin_conn, index_def, [])

      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "filter" => "id=eq.123"
        })

      params_list = [%{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}]

      assert {:ok, [%Postgrex.Result{}]} =
               Subscriptions.create(stale_conn, "supabase_realtime_test", params_list, self(), self())

      # Read filters back as text: the shared Postgrex type cache still holds the stale 3-field
      # composite decoder, so casting to text avoids decoding through it while still proving the
      # row was inserted with the right 4-field filter (negate defaults to false → f).
      assert %Postgrex.Result{rows: [["test", ~s|{"(id,eq,123,f)"}|, "*"]]} =
               Postgrex.query!(
                 conn,
                 "select entity::text, filters::text, action_filter from realtime.subscription",
                 []
               )
    end

    @tag :requires_direct_connection
    test "caches the subscription insert statement and reuses it across calls", %{conn: conn} do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{"schema" => "public", "table" => "test"})

      for _ <- 1..2 do
        params_list = [%{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}]

        assert {:ok, [%Postgrex.Result{}]} =
                 Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())
      end

      # pg_prepared_statements is session-scoped and this pool has a single connection, so this
      # query observes the same backend session that ran the inserts. Only the cached insert holds
      # a named statement (nothing else on this connection caches), executed once per create above.
      assert {:ok, %Postgrex.Result{rows: rows}} =
               Postgrex.query(
                 conn,
                 "SELECT name, generic_plans + custom_plans FROM pg_prepared_statements",
                 []
               )

      assert [["realtime_subscription_insert", 2]] = rows
    end

    test "user can subscribe to only INSERT events", %{conn: conn} do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{"event" => "INSERT", "schema" => "public"})

      params_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:ok, [%Postgrex.Result{}]} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())

      assert %Postgrex.Result{rows: rows} =
               Postgrex.query!(conn, "select filters, action_filter from realtime.subscription", [])

      assert rows != []
      assert Enum.all?(rows, &match?([[], "INSERT"], &1))
    end

    test "user can subscribe to a specific table", %{conn: conn} do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{"schema" => "public", "table" => "test"})

      subscription_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:ok, [%Postgrex.Result{}]} =
               Subscriptions.create(conn, "supabase_realtime_test", subscription_list, self(), self())

      %Postgrex.Result{rows: [[1]]} =
        Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
    end

    test "create works for a table whose name contains a backslash", %{conn: conn, tenant: tenant} do
      on_exit(fn ->
        {:ok, db_settings} = Database.from_tenant(tenant, "realtime_rls")

        {:ok, cleanup_conn} =
          db_settings |> Map.from_struct() |> Keyword.new() |> Postgrex.start_link()

        Postgrex.query!(cleanup_conn, ~s|DROP TABLE IF EXISTS "my\\table"|, [])
      end)

      Postgrex.query!(conn, ~s|CREATE TABLE IF NOT EXISTS "my\\table" (id int)|, [])
      Postgrex.query!(conn, ~s|GRANT ALL ON "my\\table" TO anon|, [])

      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{"schema" => "public", "table" => "my\\table"})

      subscription_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:ok, [%Postgrex.Result{num_rows: 1}]} =
               Subscriptions.create(conn, "supabase_realtime_test", subscription_list, self(), self())
    end

    test "user gets an error when Realtime is not enabled for the publication", %{conn: conn} do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{"schema" => "public", "table" => "test"})

      subscription_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      Postgrex.query!(conn, "drop publication if exists supabase_realtime_test", [])

      assert {:error,
              {:subscription_insert_failed,
               "Unable to subscribe to changes with given parameters. Please check Realtime is enabled for the given connect parameters: [event: *, schema: public, table: test, filters: [], select: nil]"}} =
               Subscriptions.create(conn, "supabase_realtime_test", subscription_list, self(), self())

      %Postgrex.Result{rows: [[0]]} =
        Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
    end

    test "user gets an error when subscribing to a table that does not exist", %{conn: conn} do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "doesnotexist"
        })

      subscription_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:error,
              {:subscription_insert_failed,
               "Unable to subscribe to changes with given parameters. Please check Realtime is enabled for the given connect parameters: [event: *, schema: public, table: doesnotexist, filters: [], select: nil]"}} =
               Subscriptions.create(conn, "supabase_realtime_test", subscription_list, self(), self())

      %Postgrex.Result{rows: [[0]]} =
        Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
    end

    @tag without_db: true
    test "subscription creation fails gracefully when database connection is dead" do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{"schema" => "public", "table" => "test"})

      subscription_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      conn = spawn(fn -> :ok end)

      assert {:error, {:exit, _}} =
               Subscriptions.create(conn, "supabase_realtime_test", subscription_list, self(), self())
    end

    @tag pool_queue: [queue_target: 50, queue_interval: 100]
    test "subscription creation fails gracefully when the connection pool is exhausted", %{
      conn: conn
    } do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{"schema" => "public", "table" => "test"})

      # Just has to outlast the ~300ms the pool needs to shed the queued checkout.
      Task.start(fn -> Postgrex.query!(conn, "SELECT pg_sleep(5)", []) end)

      subscription_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:error, %DBConnection.ConnectionError{reason: :queue_timeout}} =
               Subscriptions.create(conn, "supabase_realtime_test", subscription_list, self(), self())
    end

    @tag without_db: true
    test "user gets an error when table param is not a string" do
      {:error, msg} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => %{"actually a" => "map"}
        })

      assert msg =~ "No subscription params provided"
    end

    @tag without_db: true
    test "user gets an error when schema param is not a string" do
      {:error, msg} =
        Subscriptions.parse_subscription_params(%{
          "table" => "images",
          "schema" => %{"actually a" => "map"}
        })

      assert msg =~ "No subscription params provided"
    end
  end

  describe "database timeouts" do
    test "an insert cancelled by a statement timeout is retryable, not a parameter error", %{conn: conn} do
      Postgrex.query!(conn, "SET statement_timeout = 200", [])
      install_slow_insert_trigger(conn)

      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{"schema" => "public", "table" => "test"})

      params_list = [%{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}]

      assert {:error, {:database_timeout, %Postgrex.Error{postgres: %{code: :query_canceled}}}} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())
    end

    defp install_slow_insert_trigger(conn) do
      Postgrex.query!(
        conn,
        """
          create or replace function realtime.slow_subscription_insert()
          returns trigger language plpgsql as $$
          begin perform pg_sleep(10); return new; end;
          $$;
        """,
        []
      )

      Postgrex.query!(
        conn,
        """
          create trigger slow_subscription_insert
          before insert on realtime.subscription
          for each row execute function realtime.slow_subscription_insert();
        """,
        []
      )
    end
  end

  describe "delete_all/1" do
    test "delete_all", %{conn: conn} do
      create_subscriptions(conn, 10)
      assert :ok = Subscriptions.delete_all(conn)
      assert %Postgrex.Result{rows: [[0]]} = Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
    end

    @tag without_db: true
    test "logs error when connection is unavailable" do
      conn = spawn(fn -> :ok end)

      log = capture_log(fn -> assert :ok = Subscriptions.delete_all(conn) end)
      assert log =~ "SubscriptionDeletionFailed"
    end

    test "does not log error when subscription table is dropped", %{conn: conn} do
      Postgrex.query!(conn, "drop table if exists realtime.subscription cascade", [])

      log = capture_log(fn -> assert :ok = Subscriptions.delete_all(conn) end)
      refute log =~ "SubscriptionDeletionFailed"
    end

    test "still logs other postgres deletion errors", %{conn: conn, tenant: tenant} do
      create_subscriptions(conn, 1)

      Postgrex.query!(
        conn,
        """
        create or replace function realtime.fail_subscription_delete()
        returns trigger language plpgsql as $$
        begin raise exception 'delete failed'; end;
        $$;
        """,
        []
      )

      Postgrex.query!(
        conn,
        """
        create trigger fail_subscription_delete
        before delete on realtime.subscription
        for each row execute function realtime.fail_subscription_delete();
        """,
        []
      )

      on_exit(fn ->
        {:ok, db_settings} = Database.from_tenant(tenant, "realtime_rls")
        {:ok, cleanup_conn} = db_settings |> Map.from_struct() |> Keyword.new() |> Postgrex.start_link()
        Postgrex.query(cleanup_conn, "drop trigger if exists fail_subscription_delete on realtime.subscription", [])
        Postgrex.query(cleanup_conn, "drop function if exists realtime.fail_subscription_delete()", [])
        GenServer.stop(cleanup_conn)
      end)

      log = capture_log(fn -> assert :ok = Subscriptions.delete_all(conn) end)
      assert log =~ "SubscriptionDeletionFailed"
    end
  end

  describe "delete/2" do
    test "returns ok without logging when subscription table is dropped", %{conn: conn} do
      Postgrex.query!(conn, "drop table if exists realtime.subscription cascade", [])

      log =
        capture_log(fn ->
          assert :ok = Subscriptions.delete(conn, UUID.string_to_binary!(UUID.uuid1()))
        end)

      refute log =~ "SubscriptionDeletionFailed"
    end

    test "delete", %{conn: conn} do
      id = UUID.uuid1()
      bin_id = UUID.string_to_binary!(id)

      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "filter" => "id=eq.hey"
        })

      subscription_list = [%{claims: %{"role" => "anon"}, id: id, subscription_params: subscription_params}]
      Subscriptions.create(conn, "supabase_realtime_test", subscription_list, self(), self())

      assert {:ok, %Postgrex.Result{}} = Subscriptions.delete(conn, bin_id)
      assert %Postgrex.Result{rows: [[0]]} = Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
    end

    @tag without_db: true
    test "logs error when connection is unavailable" do
      conn = spawn(fn -> :ok end)

      log = capture_log(fn -> assert {:error, _} = Subscriptions.delete(conn, UUID.uuid1()) end)
      assert log =~ "SubscriptionDeletionFailed"
    end
  end

  describe "delete_multi/2" do
    test "delete_multi", %{conn: conn} do
      Subscriptions.delete_all(conn)
      id1 = UUID.uuid1()
      id2 = UUID.uuid1()

      bin_id2 = UUID.string_to_binary!(id2)
      bin_id1 = UUID.string_to_binary!(id1)

      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "filter" => "id=eq.123"
        })

      subscription_list = [
        %{claims: %{"role" => "anon"}, id: id1, subscription_params: subscription_params},
        %{claims: %{"role" => "anon"}, id: id2, subscription_params: subscription_params}
      ]

      assert {:ok, _} = Subscriptions.create(conn, "supabase_realtime_test", subscription_list, self(), self())

      assert %Postgrex.Result{rows: [[2]]} = Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
      assert {:ok, %Postgrex.Result{}} = Subscriptions.delete_multi(conn, [bin_id1, bin_id2])
      assert %Postgrex.Result{rows: [[0]]} = Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
    end
  end

  describe "delete_all_if_table_exists/1" do
    test "delete_all_if_table_exists", %{conn: conn} do
      Subscriptions.delete_all(conn)
      create_subscriptions(conn, 10)

      assert :ok = Subscriptions.delete_all_if_table_exists(conn)
      assert %Postgrex.Result{rows: [[0]]} = Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
    end

    test "logs error when trigger raises on delete", %{conn: conn, tenant: tenant} do
      create_subscriptions(conn, 3)

      Postgrex.query!(
        conn,
        """
          create or replace function realtime.evil_delete_trigger()
          returns trigger language plpgsql as $$
          begin raise exception 'evil trigger'; end;
          $$;
        """,
        []
      )

      Postgrex.query!(
        conn,
        """
          create trigger evil_delete_trigger
          before delete on realtime.subscription
          for each row execute function realtime.evil_delete_trigger();
        """,
        []
      )

      on_exit(fn ->
        {:ok, db_settings} = Database.from_tenant(tenant, "realtime_rls")

        {:ok, cleanup_conn} =
          db_settings
          |> Map.from_struct()
          |> Keyword.new()
          |> Postgrex.start_link()

        Postgrex.query(cleanup_conn, "drop trigger if exists evil_delete_trigger on realtime.subscription", [])
        Postgrex.query(cleanup_conn, "drop function if exists realtime.evil_delete_trigger()", [])
        GenServer.stop(cleanup_conn)
      end)

      log = capture_log(fn -> Subscriptions.delete_all_if_table_exists(conn) end)
      assert log =~ "SubscriptionCleanupFailed"
    end

    @tag without_db: true
    test "logs error when connection is dead" do
      conn = spawn(fn -> :ok end)
      log = capture_log(fn -> Subscriptions.delete_all_if_table_exists(conn) end)
      assert log =~ "SubscriptionCleanupFailed"
    end
  end

  describe "fetch_publication_tables/2" do
    test "returns {:ok, tables} for an existing publication", %{conn: conn} do
      assert {:ok, tables} = Subscriptions.fetch_publication_tables(conn, "supabase_realtime_test")
      assert tables[{"*"}] != nil
    end

    test "returns {:ok, %{}} for a publication with no tables", %{conn: conn} do
      assert {:ok, %{}} = Subscriptions.fetch_publication_tables(conn, "non_existing_publication")
    end

    test "returns {:error, _} when the query fails", %{conn: conn} do
      GenServer.stop(conn)
      assert {:error, _reason} = Subscriptions.fetch_publication_tables(conn, "supabase_realtime_test")
    end
  end

  describe "existing subscriptions without column selection continue to receive full payloads" do
    @tag without_db: true
    test "omitting select returns all columns (no behavior change for existing clients)" do
      assert {:ok, {"*", "public", "messages", [], nil}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "messages"
               })
    end

    @tag without_db: true
    test "passing an empty select list means primary keys only (distinct from no select)" do
      assert {:ok, {"*", "public", "messages", [], []}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "messages",
                 "select" => []
               })
    end

    test "subscription without select stores NULL in the database (no column restriction)", %{
      conn: conn
    } do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{"schema" => "public", "table" => "test"})

      params_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:ok, [%Postgrex.Result{}]} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())

      assert %Postgrex.Result{rows: [[nil]]} =
               Postgrex.query!(conn, "select selected_columns from realtime.subscription", [])
    end

    test "apply_rls returns all columns in the payload when no column selection is set", %{
      conn: conn
    } do
      sub_id = UUID.uuid1()
      slot_name = "test_apply_rls_no_select_#{:rand.uniform(999_999)}"

      Postgrex.query!(
        conn,
        "insert into realtime.subscription (subscription_id, entity, claims) values ($1::text::uuid, 'public.test'::regclass, $2)",
        [sub_id, %{"role" => "anon"}]
      )

      create_replication_slot(conn, slot_name, plugin: "wal2json")

      try do
        Postgrex.query!(conn, "insert into test (details) values ('hello')", [])

        %{rows: rows} =
          Postgrex.query!(
            conn,
            "select wal, subscription_ids from realtime.list_changes($1, $2, 100, 1048576)",
            ["supabase_realtime_test", slot_name]
          )

        # apply_rls stores subscription_ids as binary UUIDs
        bin_sub_id = UUID.string_to_binary!(sub_id)
        matching = Enum.find(rows, fn [_wal, sub_ids] -> bin_sub_id in (sub_ids || []) end)
        assert matching != nil, "Expected sub_id in list_changes result. rows=#{inspect(rows)}"
        [wal_result, _] = matching
        assert Map.has_key?(wal_result["record"], "id")
        assert Map.has_key?(wal_result["record"], "details")
      after
        drop_replication_slot(conn, slot_name)
      end
    end

    test "subscription with an empty select stores '{}' in the database (primary keys only)", %{conn: conn} do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{"schema" => "public", "table" => "test", "select" => []})

      params_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:ok, [%Postgrex.Result{}]} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())

      # '{}' is preserved rather than collapsed to NULL, so it stays distinct from
      # "no select" (all columns)
      assert %Postgrex.Result{rows: [[[]]]} =
               Postgrex.query!(conn, "select selected_columns from realtime.subscription", [])
    end

    test "a NULL (all columns) and a '{}' (primary keys only) subscription for the same table coexist", %{conn: conn} do
      # A client can subscribe to the same table both without a select (all columns)
      # and with select: [] (primary keys only). Each postgres_changes entry gets its
      # own subscription_id (UUID.uuid1/0 in RealtimeChannel), so the two rows never
      # share the leading column of the unique index and are never merged by its
      # `coalesce(selected_columns, '{}')` expression, which otherwise treats NULL and
      # '{}' as equal. Guard that invariant here: if subscription_id ever stopped being
      # unique per entry, the coalesce would silently upsert one of these over the other.
      {:ok, all_columns_params} = Subscriptions.parse_subscription_params(%{"schema" => "public", "table" => "test"})

      {:ok, pkeys_only_params} =
        Subscriptions.parse_subscription_params(%{"schema" => "public", "table" => "test", "select" => []})

      params_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: all_columns_params},
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: pkeys_only_params}
      ]

      assert {:ok, [%Postgrex.Result{}, %Postgrex.Result{}]} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())

      # Two distinct rows survive: NULL (all columns) and '{}' (primary keys only).
      assert %Postgrex.Result{rows: [[nil], [[]]]} =
               Postgrex.query!(
                 conn,
                 "select selected_columns from realtime.subscription order by selected_columns nulls first",
                 []
               )
    end

    test "apply_rls returns only primary keys in the payload when select is empty", %{conn: conn} do
      sub_id = UUID.uuid1()
      slot_name = "test_apply_rls_empty_select_#{:rand.uniform(999_999)}"

      Postgrex.query!(
        conn,
        "insert into realtime.subscription (subscription_id, entity, claims, selected_columns) values ($1::text::uuid, 'public.test'::regclass, $2, '{}')",
        [sub_id, %{"role" => "anon"}]
      )

      create_replication_slot(conn, slot_name, plugin: "wal2json")

      try do
        Postgrex.query!(conn, "insert into test (details) values ('hello')", [])

        %{rows: rows} =
          Postgrex.query!(
            conn,
            "select wal, subscription_ids from realtime.list_changes($1, $2, 100, 1048576)",
            ["supabase_realtime_test", slot_name]
          )

        bin_sub_id = UUID.string_to_binary!(sub_id)
        matching = Enum.find(rows, fn [_wal, sub_ids] -> bin_sub_id in (sub_ids || []) end)
        assert matching != nil, "Expected sub_id in list_changes result. rows=#{inspect(rows)}"
        [wal_result, _] = matching
        # Only the primary key (id) is present; the non-pkey column is excluded
        assert Map.has_key?(wal_result["record"], "id")
        refute Map.has_key?(wal_result["record"], "details")
      after
        drop_replication_slot(conn, slot_name)
      end
    end
  end

  describe "subscribing with column selection (select param) - parse" do
    @describetag without_db: true

    test "user can pass a list of column names to limit the payload" do
      assert {:ok, {"*", "public", "messages", [], ["id", "details"]}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "messages",
                 "select" => ["id", "details"]
               })
    end

    test "passing a string to select is rejected with a clear error message" do
      assert {:error, msg} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "messages",
                 "select" => "id,details"
               })

      assert msg =~ "`select`"
    end

    test "non-binary entries in a select list are silently dropped" do
      assert {:ok, {"*", "public", "messages", [], ["id", "details"]}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "messages",
                 "select" => ["id", 123, "details", nil]
               })
    end

    test "passing any string value to select is rejected" do
      assert {:error, msg} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "messages",
                 "select" => ""
               })

      assert msg =~ "`select`"
    end

    test "user can combine column selection with a row filter" do
      assert {:ok, {"*", "public", "messages", [{"id", "eq", "5", false}], ["id", "details"]}} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "messages",
                 "filter" => "id=eq.5",
                 "select" => ["id", "details"]
               })
    end

    test "user gets an error when using select with a schema-only (wildcard table) subscription" do
      assert {:error, msg} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "select" => ["id"]
               })

      assert msg =~ "wildcard"
    end

    test "user gets an error when using select with an explicit wildcard table" do
      assert {:error, msg} =
               Subscriptions.parse_subscription_params(%{
                 "schema" => "public",
                 "table" => "*",
                 "select" => ["id"]
               })

      assert msg =~ "wildcard"
    end
  end

  describe "subscribing with column selection (select param) - create" do
    test "selected columns are stored in normalized (sorted) order in the database", %{
      conn: conn
    } do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "select" => ["details", "id"]
        })

      params_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:ok, [%Postgrex.Result{}]} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())

      assert %Postgrex.Result{rows: [[selected_columns]]} =
               Postgrex.query!(conn, "select selected_columns from realtime.subscription", [])

      assert ["details", "id"] = Enum.sort(selected_columns)
    end

    test "two subscriptions on the same table with different column selections are stored as separate rows",
         %{conn: conn} do
      id = UUID.uuid1()

      {:ok, params1} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "select" => ["id"]
        })

      {:ok, params2} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "select" => ["id", "details"]
        })

      params_list = [
        %{claims: %{"role" => "anon"}, id: id, subscription_params: params1},
        %{claims: %{"role" => "anon"}, id: id, subscription_params: params2}
      ]

      assert {:ok, [%Postgrex.Result{}, %Postgrex.Result{}]} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())

      assert %Postgrex.Result{rows: [[2]]} =
               Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
    end

    test "user gets an error when select references a column that does not exist", %{conn: conn} do
      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "select" => ["nonexistent_column"]
        })

      params_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:error, {:subscription_insert_failed, msg}} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())

      assert msg =~ "invalid column for select nonexistent_column"
    end

    test "user gets an error when select references a column the role cannot read", %{conn: conn} do
      Postgrex.query!(conn, "revoke select on public.test from anon", [])
      Postgrex.query!(conn, "grant select (id) on public.test to anon", [])

      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "select" => ["id", "details"]
        })

      params_list = [
        %{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}
      ]

      assert {:error, {:subscription_insert_failed, msg}} =
               Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())

      assert msg =~ "invalid column for select details"

      assert %Postgrex.Result{rows: [[0]]} =
               Postgrex.query!(conn, "select count(*) from realtime.subscription", [])
    end
  end

  describe "regression tests" do
    test "list_changes succeeds for custom roles without execution grants (issue #2001 with non-builtin role)",
         %{conn: conn, tenant: tenant} do
      {:ok, admin_settings} = Database.from_tenant(tenant, "realtime_test", :stop)

      {:ok, admin_conn} =
        Postgrex.start_link(
          hostname: admin_settings.hostname,
          port: admin_settings.port,
          database: admin_settings.database,
          username: "supabase_admin",
          password: admin_settings.password
        )

      Postgrex.query!(
        admin_conn,
        "revoke execute on function realtime.check_equality_op(realtime.equality_op, regtype, text, text, boolean) from public",
        []
      )

      Postgrex.query(admin_conn, "drop role if exists custom_app_role", [])
      Postgrex.query!(admin_conn, "create role custom_app_role nologin", [])
      Postgrex.query!(admin_conn, "grant custom_app_role to supabase_realtime_admin", [])
      Postgrex.query!(admin_conn, "grant all on table public.test to custom_app_role", [])
      Postgrex.query!(admin_conn, "alter table public.test enable row level security", [])

      Postgrex.query!(
        admin_conn,
        "create policy custom_app_role_all on public.test for all to custom_app_role using (true)",
        []
      )

      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{
          "schema" => "public",
          "table" => "test",
          "filter" => "id=eq.1"
        })

      # create 11 subscriptions to force the pre-fetch cursor (FOR loop) behaviour in apply_rls function
      assert {:ok, _} =
               create_subscriptions(conn, 11, role: "custom_app_role", subscription_params: subscription_params)

      slot_name = "test_custom_role_grant_#{:rand.uniform(999_999)}"

      create_replication_slot(conn, slot_name, plugin: "wal2json")

      Postgrex.query!(conn, "insert into test (id, details) values (1, 'hello')", [])

      assert {:ok, %Postgrex.Result{rows: rows}} =
               Postgrex.query(
                 conn,
                 "select wal, subscription_ids from realtime.list_changes($1, $2, 100, 1048576)",
                 ["supabase_realtime_test", slot_name]
               )

      sub_ids = rows |> Enum.flat_map(fn [_wal, sub_ids] -> sub_ids end)
      assert length(sub_ids) == 11

      drop_replication_slot(conn, slot_name)
    end
  end

  defp create_subscriptions(conn, num, opts \\ []) do
    role = Keyword.get(opts, :role, "anon")
    subscription_params = Keyword.get(opts, :subscription_params, {"*", "public", "*", [], nil})

    params_list =
      Enum.reduce(1..num, [], fn _i, acc ->
        [
          %{
            claims: %{
              "exp" => 1_974_176_791,
              "iat" => 1_658_600_791,
              "iss" => "supabase",
              "ref" => "127.0.0.1",
              "role" => role
            },
            id: UUID.uuid1(),
            subscription_params: subscription_params
          }
          | acc
        ]
      end)

    Subscriptions.create(conn, "supabase_realtime_test", params_list, self(), self())
  end
end
