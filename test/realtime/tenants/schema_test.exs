defmodule Realtime.Tenants.SchemaTest do
  # Validates the permissions on each Postgres major version supported by Realtime
  #
  # - tag `@describetag :requires_supautils_policy_grants` are the images supabase/postgres >= 15.14.1.018 where policy is managed by supautils.policy_grants
  # - tag `@describetag :requires_no_supautils_policy_grants` represents older images where schema restrictions can't be applied
  # - untagged tests assert behaviour on every version

  use Realtime.DataCase, async: true
  alias Realtime.Database
  alias RealtimeWeb.Dashboard.TenantMigrations

  setup do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    {:ok, settings} = Database.from_tenant(tenant, "realtime_test", :stop)
    opts = settings |> Map.from_struct() |> Keyword.new()

    {:ok, conn_postgres} = opts |> Keyword.put(:username, "postgres") |> Postgrex.start_link()

    {:ok, conn_superuser} =
      opts |> Keyword.put(:username, "supabase_admin") |> Postgrex.start_link()

    %{tenant: tenant, conn_postgres: conn_postgres, conn_superuser: conn_superuser, settings: settings}
  end

  describe "postgres role restrictions on realtime schema" do
    @describetag :requires_supautils_policy_grants

    test "not a member of supabase_realtime_admin", %{conn_postgres: conn_postgres} do
      assert %Postgrex.Result{rows: [[false]]} =
               Postgrex.query!(
                 conn_postgres,
                 "SELECT pg_has_role('postgres', 'supabase_realtime_admin', 'MEMBER')",
                 []
               )
    end

    test "cannot assume supabase_realtime_admin", %{conn_postgres: conn_postgres} do
      assert_denied(conn_postgres, "SET ROLE supabase_realtime_admin")
    end

    test "cannot drop any object", %{conn_postgres: conn_postgres} do
      %Postgrex.Result{rows: rows} =
        Postgrex.query!(
          conn_postgres,
          """
          SELECT format('DROP TABLE %I.%I', n.nspname, c.relname)
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'realtime' AND c.relkind IN ('r', 'p')
          UNION ALL
          SELECT format('DROP SEQUENCE %I.%I', n.nspname, c.relname)
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'realtime' AND c.relkind = 'S'
          UNION ALL
          SELECT format('DROP %s %s',
            CASE p.prokind WHEN 'p' THEN 'PROCEDURE' WHEN 'a' THEN 'AGGREGATE' ELSE 'FUNCTION' END,
            p.oid::regprocedure::text)
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'realtime'
          UNION ALL
          SELECT format('DROP TYPE %I.%I', n.nspname, t.typname)
          FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE n.nspname = 'realtime'
            AND (t.typtype = 'e'
                 OR (t.typtype = 'c' AND EXISTS (
                   SELECT 1 FROM pg_class c WHERE c.oid = t.typrelid AND c.relkind = 'c'
                 )))
          """,
          []
        )

      for object <- List.flatten(rows), do: assert_denied(conn_postgres, object)
    end

    test "cannot drop schema realtime", %{conn_postgres: conn_postgres} do
      assert_denied(conn_postgres, "DROP SCHEMA realtime CASCADE")
    end

    test "cannot create a table", %{conn_postgres: conn_postgres} do
      assert_denied(conn_postgres, "CREATE TABLE realtime.new_table (id int)")
    end

    test "cannot create a function", %{conn_postgres: conn_postgres} do
      assert_denied(
        conn_postgres,
        "CREATE FUNCTION realtime.evil() RETURNS void LANGUAGE sql AS 'SELECT 1'"
      )
    end

    test "cannot alter realtime.messages columns", %{conn_postgres: conn_postgres} do
      assert_denied(conn_postgres, "ALTER TABLE realtime.messages ADD COLUMN evil int")
      assert_denied(conn_postgres, "ALTER TABLE realtime.messages DROP COLUMN payload")
      assert_denied(conn_postgres, "ALTER TABLE realtime.messages RENAME COLUMN payload TO evil")
    end

    test "cannot alter a function owner to postgres", %{conn_postgres: conn_postgres} do
      assert_denied(
        conn_postgres,
        "ALTER FUNCTION realtime.send(jsonb, text, text, boolean) OWNER TO postgres"
      )
    end

    test "cannot rename realtime.messages", %{conn_postgres: conn_postgres} do
      assert_denied(conn_postgres, "ALTER TABLE realtime.messages RENAME TO evil_messages")
    end
  end

  describe "postgres role allowances on realtime schema" do
    test "has USAGE on schema realtime", %{conn_postgres: conn_postgres} do
      assert %Postgrex.Result{rows: [[true]]} =
               Postgrex.query!(
                 conn_postgres,
                 "SELECT has_schema_privilege('postgres', 'realtime', 'USAGE')",
                 []
               )
    end

    test "can grant USAGE on schema realtime to a custom role", %{conn_postgres: conn_postgres} do
      Postgrex.query!(conn_postgres, "CREATE ROLE role_test", [])

      assert {:ok, _} =
               Postgrex.query(conn_postgres, "GRANT USAGE ON SCHEMA realtime TO role_test", [])

      assert %Postgrex.Result{rows: [[true]]} =
               Postgrex.query!(
                 conn_postgres,
                 "SELECT has_schema_privilege('role_test', 'realtime', 'USAGE')",
                 []
               )

      Postgrex.query!(conn_postgres, "REVOKE USAGE ON SCHEMA realtime FROM role_test", [])
      Postgrex.query!(conn_postgres, "DROP ROLE role_test", [])
    end

    test "can grant SELECT and INSERT on realtime.messages to a custom role", %{conn_postgres: conn_postgres} do
      role = "role_test_delegated_#{System.unique_integer([:positive])}"
      Postgrex.query!(conn_postgres, "CREATE ROLE #{role}", [])

      assert {:ok, _} =
               Postgrex.query(conn_postgres, "GRANT SELECT, INSERT ON realtime.messages TO #{role}", [])

      assert %Postgrex.Result{rows: [[true, true]]} =
               Postgrex.query!(
                 conn_postgres,
                 """
                 SELECT
                   has_table_privilege($1, 'realtime.messages', 'SELECT'),
                   has_table_privilege($1, 'realtime.messages', 'INSERT')
                 """,
                 [role]
               )

      Postgrex.query!(conn_postgres, "REVOKE SELECT, INSERT ON realtime.messages FROM #{role}", [])
      Postgrex.query!(conn_postgres, "DROP ROLE #{role}", [])
    end

    @tag :requires_supautils_policy_grants
    test "cannot delegate any other realtime.messages privilege to a custom role", %{conn_postgres: conn_postgres} do
      role = "role_test_undelegatable_#{System.unique_integer([:positive])}"
      Postgrex.query!(conn_postgres, "CREATE ROLE #{role}", [])

      for privilege <- ~w(UPDATE DELETE TRUNCATE TRIGGER REFERENCES) do
        Postgrex.query!(conn_postgres, "GRANT #{privilege} ON realtime.messages TO #{role}", [])

        assert %Postgrex.Result{rows: [[false]]} =
                 Postgrex.query!(
                   conn_postgres,
                   "SELECT has_table_privilege($1, 'realtime.messages', $2)",
                   [role, privilege]
                 )
      end

      Postgrex.query!(conn_postgres, "DROP ROLE #{role}", [])
    end

    test "can insert into realtime.messages", %{conn_postgres: conn_postgres} do
      assert {:ok, %Postgrex.Result{num_rows: 1}} =
               Postgrex.query(
                 conn_postgres,
                 "INSERT INTO realtime.messages (payload, event, topic, private, extension) VALUES ($1, $2, $3, $4, $5)",
                 [%{"hello" => "world"}, "test_event", "test_topic", false, "broadcast"]
               )
    end

    test "can select from realtime.messages", %{conn_postgres: conn_postgres} do
      assert {:ok, _} =
               Postgrex.query(conn_postgres, "SELECT * FROM realtime.messages LIMIT 1", [])
    end

    test "can create a trigger on realtime tables", %{conn_postgres: conn_postgres} do
      Postgrex.query!(
        conn_postgres,
        "CREATE OR REPLACE FUNCTION public.dummy_function() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql",
        []
      )

      for table <- ~w(messages subscription) do
        assert_allowed(
          conn_postgres,
          "CREATE TRIGGER #{table}_trigger BEFORE INSERT ON realtime.#{table} FOR EACH ROW EXECUTE FUNCTION public.dummy_function()"
        )
      end
    end

    test "can truncate realtime tables", %{conn_postgres: conn_postgres} do
      for table <- ~w(messages subscription) do
        assert_allowed(conn_postgres, "TRUNCATE realtime.#{table}")
      end
    end
  end

  describe "realtime.messages policy grants" do
    test "create and drop SELECT policy", %{conn_postgres: conn_postgres} do
      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "CREATE POLICY messages_policy_select_test ON realtime.messages FOR SELECT TO authenticated USING (true)",
                 []
               )

      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "DROP POLICY messages_policy_select_test ON realtime.messages",
                 []
               )
    end

    test "create and drop INSERT policy", %{conn_postgres: conn_postgres} do
      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "CREATE POLICY messages_policy_insert_test ON realtime.messages FOR INSERT TO authenticated WITH CHECK (true)",
                 []
               )

      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "DROP POLICY messages_policy_insert_test ON realtime.messages",
                 []
               )
    end

    test "create and drop FOR ALL policy", %{conn_postgres: conn_postgres} do
      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "CREATE POLICY messages_policy ON realtime.messages FOR ALL TO authenticated USING (true) WITH CHECK (true)",
                 []
               )

      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "DROP POLICY messages_policy ON realtime.messages",
                 []
               )
    end

    test "alter existing policy", %{conn_postgres: conn_postgres} do
      Postgrex.query!(
        conn_postgres,
        "CREATE POLICY messages_policy_alter_test ON realtime.messages FOR SELECT TO authenticated USING (true)",
        []
      )

      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "ALTER POLICY messages_policy_alter_test ON realtime.messages USING (auth.role() = 'authenticated')",
                 []
               )

      Postgrex.query!(
        conn_postgres,
        "DROP POLICY messages_policy_alter_test ON realtime.messages",
        []
      )
    end
  end

  describe "realtime.subscription policy grants" do
    @describetag :requires_supautils_policy_grants

    test "create and drop SELECT policy", %{conn_postgres: conn_postgres} do
      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "CREATE POLICY subscription_policy_select ON realtime.subscription FOR SELECT TO authenticated USING (true)",
                 []
               )

      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "DROP POLICY subscription_policy_select ON realtime.subscription",
                 []
               )
    end

    test "create and drop INSERT policy", %{conn_postgres: conn_postgres} do
      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "CREATE POLICY subscription_policy_insert ON realtime.subscription FOR INSERT TO authenticated WITH CHECK (true)",
                 []
               )

      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "DROP POLICY subscription_policy_insert ON realtime.subscription",
                 []
               )
    end

    test "create and drop UPDATE policy", %{conn_postgres: conn_postgres} do
      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "CREATE POLICY subscription_policy_update ON realtime.subscription FOR UPDATE TO authenticated USING (true)",
                 []
               )

      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "DROP POLICY subscription_policy_update ON realtime.subscription",
                 []
               )
    end

    test "create and drop DELETE policy", %{conn_postgres: conn_postgres} do
      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "CREATE POLICY subscription_policy_delete ON realtime.subscription FOR DELETE TO authenticated USING (true)",
                 []
               )

      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "DROP POLICY subscription_policy_delete ON realtime.subscription",
                 []
               )
    end

    test "create and drop FOR ALL policy", %{conn_postgres: conn_postgres} do
      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "CREATE POLICY subscription_policy_all ON realtime.subscription FOR ALL TO authenticated USING (true) WITH CHECK (true)",
                 []
               )

      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "DROP POLICY subscription_policy_all ON realtime.subscription",
                 []
               )
    end

    test "alter existing policy", %{conn_postgres: conn_postgres} do
      Postgrex.query!(
        conn_postgres,
        "CREATE POLICY subscription_policy_alter_test ON realtime.subscription FOR SELECT TO authenticated USING (true)",
        []
      )

      assert {:ok, _} =
               Postgrex.query(
                 conn_postgres,
                 "ALTER POLICY subscription_policy_alter_test ON realtime.subscription USING (auth.role() = 'authenticated')",
                 []
               )

      Postgrex.query!(
        conn_postgres,
        "DROP POLICY subscription_policy_alter_test ON realtime.subscription",
        []
      )
    end
  end

  describe "realtime.schema_migrations" do
    test "postgres cannot modify rows", %{conn_postgres: conn_postgres} do
      assert_denied(
        conn_postgres,
        "INSERT INTO realtime.schema_migrations (version, inserted_at) VALUES (0, now())"
      )

      assert_denied(conn_postgres, "DELETE FROM realtime.schema_migrations")
      assert_denied(conn_postgres, "UPDATE realtime.schema_migrations SET version = 0")
    end

    test "postgres cannot create a policy", %{conn_postgres: conn_postgres} do
      assert_denied(
        conn_postgres,
        "CREATE POLICY sm_policy ON realtime.schema_migrations FOR SELECT TO authenticated USING (true)"
      )
    end

    test "postgres cannot create a trigger", %{conn_postgres: conn_postgres} do
      Postgrex.query!(
        conn_postgres,
        "CREATE OR REPLACE FUNCTION public.dummy_function() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql",
        []
      )

      assert_denied(
        conn_postgres,
        "CREATE TRIGGER schema_migrations_trigger BEFORE INSERT ON realtime.schema_migrations FOR EACH ROW EXECUTE FUNCTION public.dummy_function()"
      )
    end

    test "supabase_admin can write to schema_migrations", %{conn_superuser: conn_superuser} do
      assert {:ok, _} =
               Postgrex.query(
                 conn_superuser,
                 "INSERT INTO realtime.schema_migrations (version, inserted_at) VALUES (1, now())",
                 []
               )

      Postgrex.query!(
        conn_superuser,
        "DELETE FROM realtime.schema_migrations WHERE version = 1",
        []
      )
    end
  end

  describe "database broadcast caller authorization" do
    test "matching topic INSERT policy permits send and send_binary", %{conn_superuser: conn} do
      in_rollback(conn, fn conn ->
        Postgrex.query!(
          conn,
          "CREATE POLICY send_matching_topic ON realtime.messages FOR INSERT TO authenticated WITH CHECK (realtime.topic() = 'allowed-topic')",
          []
        )

        as_role(conn, "authenticated", %{}, fn ->
          Postgrex.query!(
            conn,
            "SELECT realtime.send('{}'::jsonb, $1, $2, true)",
            ["matching_topic_json", "allowed-topic"]
          )

          Postgrex.query!(
            conn,
            "SELECT realtime.send_binary($1, $2, $3, true)",
            [<<1, 2>>, "matching_topic_binary", "allowed-topic"]
          )
        end)

        assert message_count(conn, "matching_topic") == 2
      end)
    end

    test "wrong-topic policy denies send and send_binary", %{conn_superuser: conn} do
      in_rollback(conn, fn conn ->
        Postgrex.query!(
          conn,
          "CREATE POLICY send_wrong_topic ON realtime.messages FOR INSERT TO authenticated WITH CHECK (realtime.topic() = 'allowed-topic')",
          []
        )

        as_role(conn, "authenticated", %{}, fn ->
          Postgrex.query!(
            conn,
            "SELECT realtime.send('{}'::jsonb, $1, $2, true)",
            ["wrong_topic_json", "denied-topic"]
          )

          Postgrex.query!(
            conn,
            "SELECT realtime.send_binary($1, $2, $3, true)",
            [<<1, 2>>, "wrong_topic_binary", "denied-topic"]
          )
        end)

        assert message_count(conn, "wrong_topic") == 0
      end)
    end

    test "restrictive INSERT policy blocks broadcasts despite a permissive policy", %{
      conn_superuser: conn
    } do
      in_rollback(conn, fn conn ->
        Postgrex.query!(
          conn,
          "CREATE POLICY send_permissive_insert ON realtime.messages FOR INSERT TO authenticated WITH CHECK (true)",
          []
        )

        # Restrictive policies are `AND`
        Postgrex.query!(
          conn,
          "CREATE POLICY send_restrictive_deny ON realtime.messages AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false)",
          []
        )

        as_role(conn, "authenticated", %{}, fn ->
          Postgrex.query!(
            conn,
            "SELECT realtime.send('{}'::jsonb, $1, $2, true)",
            ["explicit_deny_json", "test-topic"]
          )

          Postgrex.query!(
            conn,
            "SELECT realtime.send_binary($1, $2, $3, true)",
            [<<1, 2>>, "explicit_deny_binary", "test-topic"]
          )
        end)

        assert message_count(conn, "explicit_deny") == 0
      end)
    end

    test "authenticated caller uses authenticated INSERT policy", %{conn_superuser: conn} do
      in_rollback(conn, fn conn ->
        Postgrex.query!(
          conn,
          "CREATE POLICY send_authenticated_only ON realtime.messages FOR INSERT TO authenticated WITH CHECK (true)",
          []
        )

        as_role(conn, "authenticated", %{}, fn ->
          Postgrex.query!(
            conn,
            "SELECT realtime.send('{}'::jsonb, $1, $2, true)",
            ["authenticated_caller_json", "test-topic"]
          )

          Postgrex.query!(
            conn,
            "SELECT realtime.send_binary($1, $2, $3, true)",
            [<<1, 2>>, "authenticated_caller_binary", "test-topic"]
          )
        end)

        assert message_count(conn, "authenticated_caller") == 2
      end)
    end

    test "anon caller cannot use authenticated INSERT policy", %{conn_superuser: conn} do
      in_rollback(conn, fn conn ->
        Postgrex.query!(
          conn,
          "CREATE POLICY send_authenticated_only ON realtime.messages FOR INSERT TO authenticated WITH CHECK (true)",
          []
        )

        as_role(conn, "anon", %{}, fn ->
          Postgrex.query!(
            conn,
            "SELECT realtime.send('{}'::jsonb, $1, $2, true)",
            ["anon_caller_json", "test-topic"]
          )

          Postgrex.query!(
            conn,
            "SELECT realtime.send_binary($1, $2, $3, true)",
            [<<1, 2>>, "anon_caller_binary", "test-topic"]
          )
        end)

        assert message_count(conn, "anon_caller") == 0
      end)
    end

    test "policies evaluate the topic argument set by send and send_binary", %{
      conn_superuser: conn
    } do
      in_rollback(conn, fn conn ->
        Postgrex.query!(conn, "CREATE TABLE public.schema_test_send_topic_log (topic text)", [])

        Postgrex.query!(
          conn,
          """
          CREATE FUNCTION public.schema_test_capture_send_topic() RETURNS boolean
          LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
          BEGIN
            INSERT INTO public.schema_test_send_topic_log(topic)
            VALUES (current_setting('realtime.topic', true));
            RETURN true;
          END;
          $$
          """,
          []
        )

        Postgrex.query!(
          conn,
          "CREATE POLICY send_captures_topic ON realtime.messages FOR INSERT TO authenticated WITH CHECK (public.schema_test_capture_send_topic())",
          []
        )

        as_role(conn, "authenticated", %{}, fn ->
          Postgrex.query!(
            conn,
            "SELECT realtime.send('{}'::jsonb, $1, $2, true)",
            ["topic_context_json", "captured-topic"]
          )

          Postgrex.query!(
            conn,
            "SELECT realtime.send_binary($1, $2, $3, true)",
            [<<1, 2>>, "topic_context_binary", "captured-topic"]
          )
        end)

        assert %{rows: [["captured-topic"], ["captured-topic"]]} =
                 Postgrex.query!(
                   conn,
                   "SELECT topic FROM public.schema_test_send_topic_log ORDER BY ctid",
                   []
                 )
      end)
    end

    test "matching JWT claims permit broadcasts", %{conn_superuser: conn} do
      in_rollback(conn, fn conn ->
        Postgrex.query!(
          conn,
          """
          CREATE POLICY send_matching_claim ON realtime.messages FOR INSERT TO authenticated
          WITH CHECK (current_setting('request.jwt.claims', true)::jsonb ->> 'sub' = 'allowed-user')
          """,
          []
        )

        as_role(
          conn,
          "authenticated",
          %{"role" => "authenticated", "sub" => "allowed-user"},
          fn ->
            Postgrex.query!(
              conn,
              "SELECT realtime.send('{}'::jsonb, $1, $2, true)",
              ["matching_claim_json", "test-topic"]
            )

            Postgrex.query!(
              conn,
              "SELECT realtime.send_binary($1, $2, $3, true)",
              [<<1, 2>>, "matching_claim_binary", "test-topic"]
            )
          end
        )

        assert message_count(conn, "matching_claim") == 2
      end)
    end

    test "non-matching JWT claims deny broadcasts", %{conn_superuser: conn} do
      in_rollback(conn, fn conn ->
        Postgrex.query!(
          conn,
          """
          CREATE POLICY send_matching_claim ON realtime.messages FOR INSERT TO authenticated
          WITH CHECK (current_setting('request.jwt.claims', true)::jsonb ->> 'sub' = 'allowed-user')
          """,
          []
        )

        as_role(conn, "authenticated", %{"role" => "authenticated", "sub" => "denied-user"}, fn ->
          Postgrex.query!(
            conn,
            "SELECT realtime.send('{}'::jsonb, $1, $2, true)",
            ["wrong_claim_json", "test-topic"]
          )

          Postgrex.query!(
            conn,
            "SELECT realtime.send_binary($1, $2, $3, true)",
            [<<1, 2>>, "wrong_claim_binary", "test-topic"]
          )
        end)

        assert message_count(conn, "wrong_claim") == 0
      end)
    end

    test "documented SECURITY DEFINER database trigger can broadcast", %{conn_superuser: conn} do
      in_rollback(conn, fn conn ->
        Postgrex.query!(
          conn,
          "CREATE POLICY send_database_allow ON realtime.messages FOR INSERT TO PUBLIC WITH CHECK (true)",
          []
        )

        Postgrex.query!(
          conn,
          "CREATE POLICY send_database_only ON realtime.messages AS RESTRICTIVE FOR INSERT TO PUBLIC WITH CHECK (false)",
          []
        )

        as_role(conn, "postgres", %{}, fn ->
          Postgrex.query!(conn, "CREATE TABLE public.schema_test_send_source (id int)", [])

          Postgrex.query!(
            conn,
            "GRANT INSERT ON public.schema_test_send_source TO authenticated",
            []
          )

          Postgrex.query!(
            conn,
            """
            CREATE FUNCTION public.schema_test_send_from_trigger() RETURNS trigger
            LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
            BEGIN
              PERFORM realtime.send('{}'::jsonb, 'database_trigger_json', 'database-topic', true);
              PERFORM realtime.send_binary('\\x0102'::bytea, 'database_trigger_binary', 'database-topic', true);
              RETURN NEW;
            END;
            $$
            """,
            []
          )

          Postgrex.query!(
            conn,
            "CREATE TRIGGER schema_test_send_trigger AFTER INSERT ON public.schema_test_send_source FOR EACH ROW EXECUTE FUNCTION public.schema_test_send_from_trigger()",
            []
          )
        end)

        as_role(conn, "authenticated", %{"role" => "authenticated"}, fn ->
          Postgrex.query!(conn, "INSERT INTO public.schema_test_send_source VALUES (1)", [])
        end)

        assert message_count(conn, "database_trigger") == 2
      end)
    end

    test "anon caller cannot bypass restrictive broadcast policy", %{conn_superuser: conn} do
      in_rollback(conn, fn conn ->
        Postgrex.query!(
          conn,
          "CREATE POLICY send_unprivileged_allow ON realtime.messages FOR INSERT TO PUBLIC WITH CHECK (true)",
          []
        )

        Postgrex.query!(
          conn,
          "CREATE POLICY send_unprivileged_deny ON realtime.messages AS RESTRICTIVE FOR INSERT TO PUBLIC WITH CHECK (false)",
          []
        )

        as_role(conn, "anon", %{"role" => "anon"}, fn ->
          Postgrex.query!(
            conn,
            "SELECT realtime.send('{}'::jsonb, $1, $2, true)",
            ["unprivileged_anon_json", "test-topic"]
          )

          Postgrex.query!(
            conn,
            "SELECT realtime.send_binary($1, $2, $3, true)",
            [<<1, 2>>, "unprivileged_anon_binary", "test-topic"]
          )
        end)

        assert message_count(conn, "unprivileged_anon") == 0
      end)
    end

    test "authenticated caller cannot bypass restrictive broadcast policy", %{
      conn_superuser: conn
    } do
      in_rollback(conn, fn conn ->
        Postgrex.query!(
          conn,
          "CREATE POLICY send_unprivileged_allow ON realtime.messages FOR INSERT TO PUBLIC WITH CHECK (true)",
          []
        )

        Postgrex.query!(
          conn,
          "CREATE POLICY send_unprivileged_deny ON realtime.messages AS RESTRICTIVE FOR INSERT TO PUBLIC WITH CHECK (false)",
          []
        )

        as_role(conn, "authenticated", %{"role" => "authenticated"}, fn ->
          Postgrex.query!(
            conn,
            "SELECT realtime.send('{}'::jsonb, $1, $2, true)",
            ["unprivileged_authenticated_json", "test-topic"]
          )

          Postgrex.query!(
            conn,
            "SELECT realtime.send_binary($1, $2, $3, true)",
            [<<1, 2>>, "unprivileged_authenticated_binary", "test-topic"]
          )
        end)

        assert message_count(conn, "unprivileged_authenticated") == 0
      end)
    end
  end

  describe "privileged write security contracts" do
    @describetag :requires_supautils_policy_grants

    test "functions send and send_binary preserve caller RLS", %{
      conn_postgres: conn_postgres
    } do
      %Postgrex.Result{rows: rows} =
        Postgrex.query!(
          conn_postgres,
          """
          SELECT p.proname, p.prosecdef, p.proconfig
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'realtime' AND p.proname IN ('send', 'send_binary')
          ORDER BY p.proname
          """,
          []
        )

      assert rows == [
               ["send", false, nil],
               ["send_binary", false, nil]
             ]
    end

    test "supabase_realtime_admin cannot escalate privileges", %{conn_postgres: conn_postgres} do
      assert %Postgrex.Result{rows: [[false, false, false]]} =
               Postgrex.query!(
                 conn_postgres,
                 "SELECT rolsuper, rolcreaterole, rolcreatedb FROM pg_roles WHERE rolname = 'supabase_realtime_admin'",
                 []
               )
    end

    test "a trigger fired by realtime.send preserves the caller role", %{
      conn_postgres: conn_postgres
    } do
      Postgrex.query!(conn_postgres, "DROP TABLE IF EXISTS public.schema_test_trigger_log", [])
      Postgrex.query!(conn_postgres, "CREATE TABLE public.schema_test_trigger_log (who text)", [])

      Postgrex.query!(
        conn_postgres,
        "GRANT INSERT ON public.schema_test_trigger_log TO supabase_realtime_admin",
        []
      )

      Postgrex.query!(
        conn_postgres,
        """
        CREATE OR REPLACE FUNCTION public.schema_test_capture_current_user() RETURNS trigger AS $$
        BEGIN
          INSERT INTO public.schema_test_trigger_log (who) VALUES (current_user);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
        """,
        []
      )

      Postgrex.query!(
        conn_postgres,
        "CREATE TRIGGER schema_test_capture_trigger AFTER INSERT ON realtime.messages FOR EACH ROW EXECUTE FUNCTION public.schema_test_capture_current_user()",
        []
      )

      Postgrex.query!(
        conn_postgres,
        "SELECT realtime.send('{}'::jsonb, 'test_event', 'test_topic')",
        []
      )

      assert %Postgrex.Result{rows: [["postgres"]]} =
               Postgrex.query!(
                 conn_postgres,
                 "SELECT who FROM public.schema_test_trigger_log",
                 []
               )
    end

    test "a trigger fired by realtime.send_binary preserves the caller role", %{
      conn_postgres: conn_postgres
    } do
      Postgrex.query!(conn_postgres, "DROP TABLE IF EXISTS public.schema_test_trigger_log", [])
      Postgrex.query!(conn_postgres, "CREATE TABLE public.schema_test_trigger_log (who text)", [])

      Postgrex.query!(
        conn_postgres,
        "GRANT INSERT ON public.schema_test_trigger_log TO supabase_realtime_admin",
        []
      )

      Postgrex.query!(
        conn_postgres,
        """
        CREATE OR REPLACE FUNCTION public.schema_test_capture_current_user() RETURNS trigger AS $$
        BEGIN
          INSERT INTO public.schema_test_trigger_log (who) VALUES (current_user);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
        """,
        []
      )

      Postgrex.query!(
        conn_postgres,
        "CREATE TRIGGER schema_test_capture_trigger AFTER INSERT ON realtime.messages FOR EACH ROW EXECUTE FUNCTION public.schema_test_capture_current_user()",
        []
      )

      Postgrex.query!(
        conn_postgres,
        "SELECT realtime.send_binary('\\x00'::bytea, 'test_event', 'test_topic')",
        []
      )

      assert %Postgrex.Result{rows: [["postgres"]]} =
               Postgrex.query!(
                 conn_postgres,
                 "SELECT who FROM public.schema_test_trigger_log",
                 []
               )
    end
  end

  describe "ownership" do
    test "all objects in the realtime schema are owned by supabase_realtime_admin", %{
      conn_superuser: conn_superuser
    } do
      query = """
      SELECT format('table %I.%I', n.nspname, c.relname), r.rolname FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_roles r ON r.oid = c.relowner
      WHERE n.nspname = 'realtime' AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
        AND c.relname <> 'schema_migrations'
        AND r.rolname <> 'supabase_realtime_admin'
      UNION ALL
      SELECT format('function %I.%I', n.nspname, p.proname), r.rolname FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      JOIN pg_roles r ON r.oid = p.proowner
      WHERE n.nspname = 'realtime' AND r.rolname <> 'supabase_realtime_admin'
      UNION ALL
      SELECT format('type %I.%I', n.nspname, t.typname), r.rolname FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_roles r ON r.oid = t.typowner
      WHERE n.nspname = 'realtime' AND t.typtype IN ('b', 'd', 'e', 'r', 'm')
        AND t.typname <> '_schema_migrations'
        AND r.rolname <> 'supabase_realtime_admin'
      """

      %Postgrex.Result{rows: offenders} = Postgrex.query!(conn_superuser, query, [])

      assert offenders == [],
             "realtime objects not owned by supabase_realtime_admin (add `ALTER ... OWNER TO supabase_realtime_admin` to the migration):\n" <>
               Enum.map_join(offenders, "\n", fn [object, owner] ->
                 "  - #{object} (owned by #{owner})"
               end)
    end

    test "realtime schema is owned by supabase_admin", %{conn_superuser: conn_superuser} do
      assert %Postgrex.Result{rows: [["supabase_admin"]]} =
               Postgrex.query!(
                 conn_superuser,
                 "SELECT r.rolname FROM pg_namespace n JOIN pg_roles r ON r.oid = n.nspowner WHERE n.nspname = 'realtime'",
                 []
               )
    end
  end

  describe "supabase_admin realtime objects management" do
    @describetag :requires_supautils_policy_grants

    test "can alter and revert ownership of a realtime object", %{conn_superuser: conn_superuser} do
      assert {:ok, _} =
               Postgrex.query(
                 conn_superuser,
                 "ALTER TABLE realtime.messages OWNER TO supabase_admin",
                 []
               )

      assert {:ok, _} =
               Postgrex.query(
                 conn_superuser,
                 "ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin",
                 []
               )
    end

    test "can create and drop objects in realtime schema", %{conn_superuser: conn_superuser} do
      assert {:ok, _} =
               Postgrex.query(
                 conn_superuser,
                 "CREATE TABLE realtime.future_migration_table (id int)",
                 []
               )

      assert {:ok, _} =
               Postgrex.query(conn_superuser, "DROP TABLE realtime.future_migration_table", [])
    end
  end

  describe "postgres role on realtime schema without supautils grants" do
    @describetag :requires_no_supautils_policy_grants

    test "is still a member of supabase_realtime_admin", %{conn_postgres: conn_postgres} do
      assert %Postgrex.Result{rows: [[true]]} =
               Postgrex.query!(
                 conn_postgres,
                 "SELECT pg_has_role('postgres', 'supabase_realtime_admin', 'MEMBER')",
                 []
               )
    end

    test "has CREATE on schema realtime", %{conn_postgres: conn_postgres} do
      assert %Postgrex.Result{rows: [[true]]} =
               Postgrex.query!(
                 conn_postgres,
                 "SELECT has_schema_privilege('postgres', 'realtime', 'CREATE')",
                 []
               )
    end

    test "can create and drop objects in the realtime schema", %{conn_postgres: conn_postgres} do
      assert_allowed(conn_postgres, "CREATE TABLE realtime.test (id int)")
      assert_allowed(conn_postgres, "DROP TABLE realtime.test")

      assert_allowed(
        conn_postgres,
        "CREATE FUNCTION realtime.test() RETURNS void LANGUAGE sql AS 'SELECT 1'"
      )

      assert_allowed(conn_postgres, "DROP FUNCTION realtime.test()")
    end

    test "can create a trigger on realtime tables", %{conn_postgres: conn_postgres} do
      Postgrex.query!(
        conn_postgres,
        "CREATE OR REPLACE FUNCTION public.dummy_function() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql",
        []
      )

      for table <- ~w(messages subscription) do
        assert_allowed(
          conn_postgres,
          "CREATE TRIGGER #{table}_trigger BEFORE INSERT ON realtime.#{table} FOR EACH ROW EXECUTE FUNCTION public.dummy_function()"
        )
      end
    end

    test "can assume supabase_realtime_admin to tamper with its objects", %{
      conn_postgres: conn_postgres
    } do
      Postgrex.transaction(conn_postgres, fn conn ->
        Postgrex.query!(conn, "SET ROLE supabase_realtime_admin", [])
        assert_allowed(conn, "DROP TABLE realtime.messages CASCADE")
        Postgrex.rollback(conn, :rollback)
      end)
    end
  end

  describe "pg-delta reconciliation" do
    @describetag :requires_supautils_policy_grants
    @describetag :skip_orioledb

    test "recreating realtime.messages leaves the postgres role able to work", %{
      tenant: tenant,
      conn_postgres: conn_postgres,
      conn_superuser: conn_superuser,
      settings: settings
    } do
      before_acl = relacl(conn_superuser, "messages")

      Postgrex.query!(conn_superuser, "DROP TABLE realtime.messages CASCADE", [])

      assert {:ok, %{status: :changes, plan: plan}} =
               TenantMigrations.run_pgdelta(%{settings | pool_size: 1})

      assert :ok = TenantMigrations.apply_pgdelta(tenant, plan)

      assert relacl(conn_superuser, "messages") == before_acl

      assert %Postgrex.Result{rows: [["supabase_realtime_admin"]]} =
               Postgrex.query!(
                 conn_superuser,
                 "SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid = 'realtime.messages'::regclass",
                 []
               )

      :ok = Realtime.Tenants.create_messages_partitions(conn_superuser)

      assert {:ok, %Postgrex.Result{num_rows: 1}} =
               Postgrex.query(
                 conn_postgres,
                 "INSERT INTO realtime.messages (payload, event, topic, private, extension) VALUES ($1, $2, $3, $4, $5)",
                 [%{"hello" => "world"}, "test_event", "test_topic", false, "broadcast"]
               )

      assert_allowed(
        conn_postgres,
        "CREATE POLICY reconciled_policy ON realtime.messages FOR SELECT TO authenticated USING (true)"
      )

      assert_allowed(conn_postgres, "DROP POLICY reconciled_policy ON realtime.messages")
      assert_allowed(conn_postgres, "TRUNCATE realtime.messages")
      assert_denied(conn_postgres, "CREATE TABLE realtime.new_table (id int)")
    end
  end

  describe "supabase_realtime_admin grants on the realtime schema" do
    test "keeps usage and create", %{conn_superuser: conn_superuser} do
      assert has_schema_privilege?(conn_superuser, "USAGE")
      assert has_schema_privilege?(conn_superuser, "CREATE")
    end

    test "holds no grant option", %{conn_superuser: conn_superuser} do
      refute has_schema_privilege?(conn_superuser, "USAGE WITH GRANT OPTION")
      refute has_schema_privilege?(conn_superuser, "CREATE WITH GRANT OPTION")
    end
  end

  defp has_schema_privilege?(conn, privilege) do
    %Postgrex.Result{rows: [[granted]]} =
      Postgrex.query!(
        conn,
        "SELECT has_schema_privilege('supabase_realtime_admin', 'realtime', $1)",
        [privilege]
      )

    granted
  end

  defp relacl(conn, table) do
    %Postgrex.Result{rows: [[acl]]} =
      Postgrex.query!(
        conn,
        "SELECT coalesce(array(SELECT unnest(relacl)::text ORDER BY 1), '{}') FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'realtime' AND c.relname = $1",
        [table]
      )

    acl
  end

  defp in_rollback(conn, fun) do
    assert {:error, :rollback} =
             Postgrex.transaction(conn, fn conn ->
               fun.(conn)
               Postgrex.rollback(conn, :rollback)
             end)
  end

  defp as_role(conn, role, claims, fun) when role in ["anon", "authenticated", "postgres"] do
    Postgrex.query!(conn, "SET LOCAL ROLE #{role}", [])

    Postgrex.query!(
      conn,
      "SELECT set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.role', $2, true)",
      [Jason.encode!(claims), role]
    )

    result = fun.()
    Postgrex.query!(conn, "RESET ROLE", [])
    result
  end

  defp message_count(conn, event_prefix) do
    %{rows: [[count]]} =
      Postgrex.query!(
        conn,
        "SELECT count(*) FROM realtime.messages WHERE event = ANY($1::text[])",
        [["#{event_prefix}_json", "#{event_prefix}_binary"]]
      )

    count
  end

  defp assert_denied(conn, query) do
    assert {:error, %Postgrex.Error{postgres: %{code: :insufficient_privilege}}} =
             Postgrex.query(conn, query, []),
           "expected insufficient_privilege for: #{query}"
  end

  defp assert_allowed(conn, query) do
    assert {:ok, _} = Postgrex.query(conn, query, []), "expected query to succeed: #{query}"
  end
end
