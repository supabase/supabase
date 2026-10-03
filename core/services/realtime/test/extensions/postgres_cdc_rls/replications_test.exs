defmodule Extensions.PostgresCdcRls.ReplicationsTest do
  use Realtime.DataCase, async: true

  alias Extensions.PostgresCdcRls.Replications
  alias Extensions.PostgresCdcRls.Subscriptions
  alias Realtime.Database

  setup do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    {:ok, conn} = Database.connect(tenant, "realtime_rls", :stop)
    Integrations.setup_postgres_changes(conn)
    %{conn: conn, tenant: tenant}
  end

  describe "synchronous_standby/1" do
    @tag :requires_docker_backend
    test "reports no synchronous standby when none is named", %{conn: conn} do
      assert {:ok, false} = Replications.synchronous_standby(conn)
    end

    test "returns the error when the check fails", %{conn: conn} do
      Postgrex.transaction(conn, fn tx ->
        assert {:error, _} = Postgrex.query(tx, "SELECT 1/0", [])

        assert {:error, %Postgrex.Error{postgres: %{code: :in_failed_sql_transaction}}} =
                 Replications.synchronous_standby(tx)
      end)
    end
  end

  describe "prepare_replication/2" do
    test "creates a replication slot", %{conn: conn} do
      slot_name = "test_slot_#{System.unique_integer([:positive])}"

      assert {:ok, %Postgrex.Result{}} = Replications.prepare_replication(conn, slot_name)

      assert {:ok, %Postgrex.Result{num_rows: 1}} =
               Postgrex.query(conn, "select 1 from pg_replication_slots where slot_name = $1", [slot_name])
    end

    test "is idempotent when slot already exists", %{conn: conn} do
      slot_name = "test_slot_#{System.unique_integer([:positive])}"

      assert {:ok, _} = Replications.prepare_replication(conn, slot_name)
      assert {:ok, _} = Replications.prepare_replication(conn, slot_name)
    end
  end

  describe "terminate_backend/2" do
    test "returns slot_not_found when slot does not exist", %{conn: conn} do
      assert {:error, :slot_not_found} = Replications.terminate_backend(conn, "nonexistent_slot")
    end

    test "returns error when connection is in a failed transaction", %{tenant: tenant} do
      {:ok, bad_conn} = Realtime.Database.connect(tenant, "realtime_rls", :stop)

      Postgrex.transaction(bad_conn, fn trans_conn ->
        # Put the transaction in failed state
        Postgrex.query(trans_conn, "SELECT 1/0", [])
        # Subsequent queries return {:error, %Postgrex.Error{}} due to failed transaction
        assert {:error, %Postgrex.Error{}} = Replications.terminate_backend(trans_conn, "any_slot")
        # Return error to trigger rollback
        {:error, :rollback}
      end)

      GenServer.stop(bad_conn)
    end

    test "returns slot_not_found when slot exists but has no active backend", %{conn: conn, tenant: tenant} do
      slot_name = "test_slot_#{System.unique_integer([:positive])}"

      # The slot has to outlive the connection that made it: a temporary one would go with
      # `slot_conn` below, and `terminate_backend` would report :slot_not_found because the
      # slot was gone rather than because it had no backend.
      {:ok, slot_conn} = Realtime.Database.connect(tenant, "realtime_rls", :stop)
      create_replication_slot(slot_conn, slot_name, plugin: "pgoutput", temporary: false)
      GenServer.stop(slot_conn)

      assert {:error, :slot_not_found} = Replications.terminate_backend(conn, slot_name)
    end
  end

  describe "get_pg_stat_activity_diff/2" do
    test "returns error when pid is not in pg_stat_activity", %{conn: conn} do
      assert {:error, :pid_not_found} = Replications.get_pg_stat_activity_diff(conn, 0)
    end

    test "returns diff when pid is found in pg_stat_activity", %{conn: conn} do
      {:ok, %Postgrex.Result{rows: [[backend_pid]]}} = Postgrex.query(conn, "SELECT pg_backend_pid()", [])

      result = Replications.get_pg_stat_activity_diff(conn, backend_pid)

      assert {:ok, diff} = result
      assert is_integer(diff)
    end
  end

  describe "list_changes/5" do
    @publication "supabase_realtime_test"

    test "slot empty: returns only the sentinel row with slot_changes_count of 0", %{conn: conn} do
      slot_name = "test_slot_#{System.unique_integer([:positive])}"

      {:ok, _} = Replications.prepare_replication(conn, slot_name)

      assert {:ok, %Postgrex.Result{rows: rows}} =
               Replications.list_changes(conn,
                 slot_name: slot_name,
                 publication: @publication,
                 max_changes: 100,
                 max_record_bytes: 1_048_576
               )

      assert [sentinel] = rows
      [nil, nil, nil, "[]", "{}", "{}", nil, nil, nil, slot_changes_count] = sentinel
      assert slot_changes_count == 0
    end

    test "slot has changes visible to subscriber: returns real row and slot_changes_count of 1", %{conn: conn} do
      slot_name = "test_slot_#{System.unique_integer([:positive])}"

      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{"event" => "*", "schema" => "public", "table" => "test"})

      Subscriptions.create(
        conn,
        @publication,
        [%{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}],
        self(),
        self()
      )

      {:ok, _} = Replications.prepare_replication(conn, slot_name)

      Postgrex.query!(conn, "INSERT INTO public.test (details) VALUES ('hello')", [])

      assert {:ok, %Postgrex.Result{rows: rows}} =
               Replications.list_changes(conn,
                 slot_name: slot_name,
                 publication: @publication,
                 max_changes: 100,
                 max_record_bytes: 1_048_576
               )

      assert [row] = rows

      assert [
               "INSERT",
               "public",
               "test",
               _columns,
               _record,
               _old_record,
               _commit_timestamp,
               _sub_ids,
               _errors,
               slot_changes_count
             ] = row

      assert slot_changes_count == 1
    end

    test "slot has changes but subscriber does not match the INSERT: returns only the sentinel row with slot_changes_count of 1",
         %{conn: conn} do
      slot_name = "test_slot_#{System.unique_integer([:positive])}"

      {:ok, subscription_params} =
        Subscriptions.parse_subscription_params(%{"event" => "UPDATE", "schema" => "public", "table" => "test"})

      Subscriptions.create(
        conn,
        @publication,
        [%{claims: %{"role" => "anon"}, id: UUID.uuid1(), subscription_params: subscription_params}],
        self(),
        self()
      )

      {:ok, _} = Replications.prepare_replication(conn, slot_name)

      Postgrex.query!(conn, "INSERT INTO public.test (details) VALUES ('hello')", [])

      assert {:ok, %Postgrex.Result{rows: rows}} =
               Replications.list_changes(conn,
                 slot_name: slot_name,
                 publication: @publication,
                 max_changes: 100,
                 max_record_bytes: 1_048_576
               )

      assert [sentinel] = rows
      [nil, nil, nil, "[]", "{}", "{}", nil, nil, nil, slot_changes_count] = sentinel
      assert slot_changes_count == 1
    end

    @tag :requires_direct_connection
    test "caches the prepared statement and reuses it across calls", %{conn: conn} do
      slot_name = "test_slot_#{System.unique_integer([:positive])}"

      {:ok, _} = Replications.prepare_replication(conn, slot_name)

      assert {:ok, _} =
               Replications.list_changes(conn,
                 slot_name: slot_name,
                 publication: @publication,
                 max_changes: 100,
                 max_record_bytes: 1_048_576
               )

      assert {:ok, _} =
               Replications.list_changes(conn,
                 slot_name: slot_name,
                 publication: @publication,
                 max_changes: 100,
                 max_record_bytes: 1_048_576
               )

      # pg_prepared_statements is session-scoped and the "realtime_rls" pool has a
      # single connection, so this query observes the same backend session that ran
      # list_changes. It must hold exactly one named statement (nothing else on this
      # connection caches), executed once per list_changes call above.
      assert {:ok, %Postgrex.Result{rows: rows}} =
               Postgrex.query(
                 conn,
                 "SELECT name, generic_plans + custom_plans FROM pg_prepared_statements",
                 []
               )

      assert [["realtime_list_changes", 2]] = rows
    end

    @tag :requires_direct_connection
    test "reads with list_changes_sync where a commit can wait for a synchronous standby", %{conn: conn} do
      slot_name = "test_slot_#{System.unique_integer([:positive])}"
      {:ok, _} = Replications.prepare_replication(conn, slot_name)

      for synchronous_standby <- [false, true, false, true, false] do
        assert {:ok, _} =
                 Replications.list_changes(conn,
                   slot_name: slot_name,
                   publication: @publication,
                   max_changes: 100,
                   max_record_bytes: 1_048_576,
                   synchronous_standby: synchronous_standby
                 )
      end

      assert {:ok, %Postgrex.Result{rows: rows}} =
               Postgrex.query(
                 conn,
                 "SELECT name, generic_plans + custom_plans FROM pg_prepared_statements ORDER BY name",
                 []
               )

      assert [["realtime_list_changes", 3], ["realtime_list_changes_sync", 2]] = rows
    end

    test "slot has changes but no subscribers: returns only the sentinel row with slot_changes_count of 1", %{
      conn: conn
    } do
      slot_name = "test_slot_#{System.unique_integer([:positive])}"

      {:ok, _} = Replications.prepare_replication(conn, slot_name)

      Postgrex.query!(conn, "INSERT INTO public.test (details) VALUES ('hello'), ('hithere')", [])

      assert {:ok, %Postgrex.Result{rows: rows}} =
               Replications.list_changes(conn,
                 slot_name: slot_name,
                 publication: @publication,
                 max_changes: 100,
                 max_record_bytes: 1_048_576
               )

      assert [sentinel] = rows
      [nil, nil, nil, "[]", "{}", "{}", nil, nil, nil, slot_changes_count] = sentinel
      assert slot_changes_count == 2
    end
  end

  describe "drop_replication_slot/2" do
    test "returns slot_not_found when slot does not exist", %{conn: conn} do
      assert {:error, :slot_not_found} =
               Replications.drop_replication_slot(conn, "nonexistent_slot_#{:rand.uniform(999_999)}")
    end

    test "drops an existing inactive slot", %{conn: conn} do
      slot_name = "test_drop_slot_#{:rand.uniform(999_999)}"

      create_replication_slot(conn, slot_name, plugin: "wal2json")

      assert {:ok, :dropped} = Replications.drop_replication_slot(conn, slot_name)

      %{rows: [[count]]} =
        Postgrex.query!(conn, "SELECT count(*)::int FROM pg_replication_slots WHERE slot_name = $1", [slot_name])

      assert count == 0
    end
  end

  describe "list_changes for schemas and tables with special characters" do
    defp run_list_changes(conn, schema, table) do
      pub = "supabase_realtime_test"
      slot = "lc_#{:rand.uniform(9_999_999)}"

      # quote identifiers
      %{rows: [[quoted_schema, qualified]]} =
        Postgrex.query!(
          conn,
          "SELECT format('%I', $1::text), format('%I.%I', $1::text, $2::text)",
          [schema, table]
        )

      Postgrex.query!(conn, "CREATE SCHEMA IF NOT EXISTS #{quoted_schema}", [])
      Postgrex.query!(conn, "DROP TABLE IF EXISTS #{qualified}", [])
      Postgrex.query!(conn, "CREATE TABLE #{qualified} (name text PRIMARY KEY)", [])
      Postgrex.query!(conn, "GRANT ALL ON TABLE #{qualified} TO anon", [])
      Postgrex.query!(conn, "GRANT ALL ON TABLE #{qualified} TO authenticated", [])

      {:ok, _} = Replications.prepare_replication(conn, slot)

      {:ok, sub_params} =
        Subscriptions.parse_subscription_params(%{"schema" => schema, "table" => table})

      params_list = [
        %{claims: %{"role" => "anon"}, id: Ecto.UUID.generate(), subscription_params: sub_params}
      ]

      assert {:ok, _} = Subscriptions.create(conn, pub, params_list, self(), self())

      Postgrex.query!(conn, "INSERT INTO #{qualified} VALUES ('list_changes_test')", [])

      try do
        Replications.list_changes(conn,
          slot_name: slot,
          publication: pub,
          max_changes: 100,
          max_record_bytes: 1_048_576
        )
      after
        drop_replication_slot(conn, slot)
        Postgrex.query(conn, "DROP TABLE IF EXISTS #{qualified}", [])

        if schema != "public",
          do: Postgrex.query(conn, "DROP SCHEMA IF EXISTS #{quoted_schema} CASCADE", [])
      end
    end

    defp insert_row_for({:ok, %Postgrex.Result{rows: rows}}, expected_table) do
      Enum.find(rows, fn
        ["INSERT", _schema, ^expected_table, _cols, record | _] ->
          record == ~s|{"name": "list_changes_test"}|

        _ ->
          false
      end)
    end

    test "space", %{conn: conn} do
      result = run_list_changes(conn, "public", "my table")
      assert insert_row_for(result, "my table")
    end

    test "comma", %{conn: conn} do
      result = run_list_changes(conn, "public", "my,table")
      assert insert_row_for(result, "my,table")
    end

    test "dot", %{conn: conn} do
      result = run_list_changes(conn, "public", "my.table")
      assert insert_row_for(result, "my.table")
    end

    test "tab", %{conn: conn} do
      result = run_list_changes(conn, "public", "tab\there")
      assert insert_row_for(result, "tab\there")
    end

    test "double-quote", %{conn: conn} do
      result = run_list_changes(conn, "public", ~s|my"table|)
      assert insert_row_for(result, ~s|my"table|)
    end

    test "backslash", %{conn: conn} do
      result = run_list_changes(conn, "public", "my\\table")
      assert insert_row_for(result, "my\\table")
    end

    test "emoji", %{conn: conn} do
      result = run_list_changes(conn, "public", "[my_table] 🟠")
      assert insert_row_for(result, "[my_table] 🟠")
    end

    test "schema and table with spaces", %{conn: conn} do
      result = run_list_changes(conn, "my schema", "my table")
      assert insert_row_for(result, "my table")
    end

    test "schema and table with special cases", %{conn: conn} do
      result = run_list_changes(conn, ~s|test "schema|, ~s|test " with 'quotes'|)
      assert insert_row_for(result, ~s|test " with 'quotes'|)
    end
  end
end
