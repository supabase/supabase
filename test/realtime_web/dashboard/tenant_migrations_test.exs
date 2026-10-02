defmodule RealtimeWeb.Dashboard.TenantMigrationsTest do
  use RealtimeWeb.ConnCase, async: false
  import Phoenix.LiveViewTest

  @moduletag :skip_orioledb

  alias Realtime.Api
  alias Realtime.Database
  alias Realtime.Tenants.Migrations
  alias RealtimeWeb.Dashboard.TenantMigrations

  setup do
    Application.put_env(:realtime, :dashboard_auth, :basic_auth)
    Application.put_env(:realtime, :dashboard_credentials, {"user", "pass"})

    on_exit(fn ->
      Application.delete_env(:realtime, :dashboard_auth)
      Application.delete_env(:realtime, :dashboard_credentials)
    end)

    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    conn = using_basic_auth(build_conn(), "user", "pass")

    %{tenant: tenant, conn: conn}
  end

  test "renders lookup form", %{conn: conn} do
    {:ok, view, _html} = live(conn, "/admin/dashboard/tenant_migrations")

    assert has_element?(view, "h5.card-title", "Tenant Migrations")
    assert has_element?(view, "input[name=external_id]")
    assert has_element?(view, "button[type=submit]", "Lookup")
  end

  test "shows schema_migrations for valid external_id via URL param", %{conn: conn, tenant: tenant} do
    {:ok, view, _html} = live(conn, "/admin/dashboard/tenant_migrations?external_id=#{tenant.external_id}")

    assert has_element?(view, "h6", "realtime.schema_migrations")
    assert has_element?(view, "th", "version")
    assert has_element?(view, "th", "inserted_at")
  end

  test "shows schema_migrations for valid external_id via form submit", %{conn: conn, tenant: tenant} do
    {:ok, view, _html} = live(conn, "/admin/dashboard/tenant_migrations")

    view
    |> element("form[phx-submit=lookup]")
    |> render_submit(%{external_id: tenant.external_id})

    assert has_element?(view, "h6", "realtime.schema_migrations")
    assert has_element?(view, "th", "version")
  end

  test "shows error for unknown external_id via URL param", %{conn: conn} do
    {:ok, view, _html} = live(conn, "/admin/dashboard/tenant_migrations?external_id=nonexistent")

    assert has_element?(view, "p.text-danger", "Tenant not found")
  end

  test "shows error for unknown external_id via form submit", %{conn: conn} do
    {:ok, view, _html} = live(conn, "/admin/dashboard/tenant_migrations")

    view
    |> element("form[phx-submit=lookup]")
    |> render_submit(%{external_id: "nonexistent"})

    assert has_element?(view, "p.text-danger", "Tenant not found")
  end

  test "renders the pg-delta section header", %{conn: conn, tenant: tenant} do
    {:ok, view, _html} = live(conn, "/admin/dashboard/tenant_migrations?external_id=#{tenant.external_id}")

    assert has_element?(view, "h6", "pg-delta plan vs committed schema")
  end

  @pgdelta_running ~s([data-test-id="pgdelta-running"])

  describe "shadow database provisioning" do
    test "pg-delta starts on the live mount, not on the dead render", %{conn: conn, tenant: tenant} do
      conn = get(conn, "/admin/dashboard/tenant_migrations?external_id=#{tenant.external_id}")

      doc = conn |> html_response(200) |> Floki.parse_document!()
      assert doc |> Floki.find("h6") |> Floki.text() =~ "pg-delta plan vs committed schema"
      assert Floki.find(doc, @pgdelta_running) == []

      {:ok, view, _html} = live(conn)
      assert view |> element(@pgdelta_running) |> has_element?()
    end

    test "looking up another tenant does not leave the previous plan running", %{conn: conn, tenant: tenant} do
      {:ok, view, _html} = live(conn, "/admin/dashboard/tenant_migrations?external_id=#{tenant.external_id}")
      assert view |> element(@pgdelta_running) |> has_element?()

      running = task_supervisor_children()

      view
      |> element("form[phx-submit=lookup]")
      |> render_submit(%{external_id: "nonexistent"})

      assert view |> element("p.text-danger", "Tenant not found") |> has_element?()
      refute view |> element(@pgdelta_running) |> has_element?()
      assert_eventually(task_supervisor_children() <= running)
    end
  end

  defp task_supervisor_children do
    Realtime.TaskSupervisor |> Task.Supervisor.children() |> length()
  end

  test "shows 0 rows instead of an error when realtime.schema_migrations is missing", %{conn: conn, tenant: tenant} do
    {:ok, settings} = Database.from_tenant(tenant, "realtime_test", :stop)
    {:ok, admin_conn} = Database.connect_db(%{settings | username: "supabase_admin", pool_size: 1})
    Postgrex.query!(admin_conn, "DROP TABLE realtime.schema_migrations", [])

    {:ok, view, _html} = live(conn, "/admin/dashboard/tenant_migrations?external_id=#{tenant.external_id}")

    assert has_element?(view, "p.text-muted.small.mb-2", "0")
    refute has_element?(view, "p.text-danger")
  end

  describe "apply_pgdelta/2 with nil sql (backfill)" do
    test "inserts missing versions and updates tenants.migrations_ran", %{tenant: tenant} do
      {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)

      Postgrex.query!(
        db_conn,
        "DELETE FROM realtime.schema_migrations WHERE version > 20211116213934",
        []
      )

      {:ok, _} = Api.update_migrations_ran(tenant.external_id, 7)

      assert :ok = TenantMigrations.apply_pgdelta(tenant, nil)

      %{rows: [[count]]} =
        Postgrex.query!(db_conn, "SELECT count(*)::int FROM realtime.schema_migrations", [])

      total = length(Migrations.migrations())
      assert count == total

      updated = Api.get_tenant_by_external_id(tenant.external_id, use_replica?: false)
      assert updated.migrations_ran == total
    end

    test "running twice keeps the row count and migrations_ran stable", %{tenant: tenant} do
      {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)
      total = length(Migrations.migrations())

      assert :ok = TenantMigrations.apply_pgdelta(tenant, nil)
      assert :ok = TenantMigrations.apply_pgdelta(tenant, nil)

      %{rows: [[count]]} =
        Postgrex.query!(db_conn, "SELECT count(*)::int FROM realtime.schema_migrations", [])

      assert count == total

      updated = Api.get_tenant_by_external_id(tenant.external_id, use_replica?: false)
      assert updated.migrations_ran == total
    end

    test "restores the primary key when realtime.schema_migrations lost it", %{tenant: tenant} do
      {:ok, settings} = Database.from_tenant(tenant, "realtime_test", :stop)
      {:ok, admin_conn} = Database.connect_db(%{settings | username: "supabase_admin", pool_size: 1})

      Postgrex.query!(admin_conn, "ALTER TABLE realtime.schema_migrations DROP CONSTRAINT schema_migrations_pkey", [])

      assert :ok = TenantMigrations.apply_pgdelta(tenant, nil)

      assert %{rows: [[1]]} =
               Postgrex.query!(
                 admin_conn,
                 "SELECT count(*)::int FROM pg_constraint WHERE conrelid = 'realtime.schema_migrations'::regclass AND contype = 'p'",
                 []
               )

      %{rows: [[count]]} = Postgrex.query!(admin_conn, "SELECT count(*)::int FROM realtime.schema_migrations", [])
      assert count == length(Migrations.migrations())
    end
  end

  describe "profile" do
    test "ships a valid pg-delta profile" do
      profile = TenantMigrations.profile_path() |> File.read!() |> Jason.decode!()

      assert %{"id" => "realtime-tenant", "policy" => %{"filter" => filter}} = profile
      assert is_list(filter)
    end
  end

  describe "run_pgdelta/1" do
    # The 15.1.0.1 image is excluded because its pg_net 0.6 worker never accepts the
    # ProcSignalBarrier, so pg-delta's DROP DATABASE ... WITH (FORCE) shadow cleanup hangs.
    @describetag :requires_supautils_policy_grants
    setup %{tenant: tenant} do
      {:ok, settings} = Database.from_tenant(tenant, "realtime_test", :stop)
      settings = %{settings | pool_size: 1}
      {:ok, admin_conn} = Database.connect_db(%{settings | username: "supabase_admin"})

      %{settings: settings, admin_conn: admin_conn}
    end

    test "reports no drift for a freshly migrated tenant", %{settings: settings} do
      assert {:ok, %{status: :no_changes, plan: nil}} = TenantMigrations.run_pgdelta(settings)
    end

    test "plans the drift it can see and leaves the rest alone", %{
      settings: settings,
      admin_conn: admin_conn
    } do
      Postgrex.query!(admin_conn, "DROP INDEX realtime.messages_inserted_at_topic_index", [])
      Postgrex.query!(admin_conn, "ALTER TABLE realtime.messages OWNER TO postgres", [])
      Postgrex.query!(admin_conn, "ALTER TABLE realtime.subscription ADD COLUMN rogue_col text", [])
      Postgrex.query!(admin_conn, "CREATE POLICY customer_policy ON realtime.messages FOR SELECT USING (true)", [])

      assert {:ok, %{status: :changes, sql: sql, plan: plan, destructive: destructive}} =
               TenantMigrations.run_pgdelta(settings)

      assert sql =~ "CREATE INDEX messages_inserted_at_topic_index"
      assert sql =~ ~s(ALTER TABLE "realtime"."messages" OWNER TO "supabase_realtime_admin")
      assert sql =~ ~s(ALTER TABLE "realtime"."subscription" DROP COLUMN "rogue_col")
      refute sql =~ "customer_policy"
      assert destructive > 0
      assert is_binary(plan)

      refute sql =~ "WARNING"
      refute sql =~ "shadow database"
      refute sql =~ "Extracting target"
      refute sql =~ "Planning:"
    end

    test "keeps user RLS policies and their comments", %{
      settings: settings,
      admin_conn: admin_conn
    } do
      Postgrex.query!(admin_conn, "CREATE POLICY customer_policy ON realtime.messages FOR SELECT USING (true)", [])
      Postgrex.query!(admin_conn, "COMMENT ON POLICY customer_policy ON realtime.messages IS 'customer note'", [])

      Postgrex.query!(
        admin_conn,
        "CREATE POLICY customer_sub_policy ON realtime.subscription FOR SELECT USING (true)",
        []
      )

      Postgrex.query!(
        admin_conn,
        "COMMENT ON POLICY customer_sub_policy ON realtime.subscription IS 'customer note'",
        []
      )

      assert {:ok, %{status: :no_changes}} = TenantMigrations.run_pgdelta(settings)
    end

    test "detects privilege drift on customer-facing roles", %{
      settings: settings,
      admin_conn: admin_conn
    } do
      Postgrex.query!(admin_conn, "REVOKE INSERT ON realtime.messages FROM authenticated", [])

      assert {:ok, %{status: :changes, sql: sql}} = TenantMigrations.run_pgdelta(settings)
      assert sql =~ ~s(GRANT INSERT, SELECT, UPDATE ON TABLE "realtime"."messages" TO "authenticated")
    end

    test "ignores privileges of platform-managed grantees", %{
      settings: settings,
      admin_conn: admin_conn
    } do
      Postgrex.query!(admin_conn, "REVOKE ALL ON realtime.messages FROM dashboard_user", [])

      assert {:ok, %{status: :no_changes}} = TenantMigrations.run_pgdelta(settings)
    end

    test "keeps grants on customer-created roles while planning real drift", %{
      tenant: tenant,
      settings: settings,
      admin_conn: admin_conn
    } do
      Postgrex.query!(admin_conn, "DROP ROLE IF EXISTS customer_role", [])
      Postgrex.query!(admin_conn, "CREATE ROLE customer_role NOLOGIN", [])

      on_exit(fn ->
        {:ok, conn} = Database.connect_db(%{settings | username: "supabase_admin"})
        Postgrex.query!(conn, "DROP OWNED BY customer_role", [])
        Postgrex.query!(conn, "DROP ROLE IF EXISTS customer_role", [])
      end)

      Postgrex.query!(admin_conn, "GRANT USAGE ON SCHEMA realtime TO customer_role", [])
      Postgrex.query!(admin_conn, "GRANT SELECT, INSERT ON realtime.messages TO customer_role", [])
      Postgrex.query!(admin_conn, "DROP INDEX realtime.messages_inserted_at_topic_index", [])

      assert {:ok, %{status: :changes, sql: sql, plan: plan}} = TenantMigrations.run_pgdelta(settings)

      assert sql =~ "CREATE INDEX messages_inserted_at_topic_index"
      refute sql =~ "customer_role"

      assert :ok = TenantMigrations.apply_pgdelta(tenant, plan)

      assert %Postgrex.Result{rows: [[true, true, true]]} =
               Postgrex.query!(
                 admin_conn,
                 """
                 SELECT
                   has_schema_privilege('customer_role', 'realtime', 'USAGE'),
                   has_table_privilege('customer_role', 'realtime.messages', 'SELECT'),
                   has_table_privilege('customer_role', 'realtime.messages', 'INSERT')
                 """,
                 []
               )
    end

    test "still reverts an added privilege on a platform grantee", %{
      tenant: tenant,
      settings: settings,
      admin_conn: admin_conn
    } do
      Postgrex.query!(admin_conn, "GRANT DELETE ON realtime.messages TO authenticated", [])

      assert {:ok, %{status: :changes, sql: sql, plan: plan}} = TenantMigrations.run_pgdelta(settings)

      assert sql =~ ~s(REVOKE ALL ON TABLE "realtime"."messages" FROM "authenticated")
      assert sql =~ ~s(GRANT INSERT, SELECT, UPDATE ON TABLE "realtime"."messages" TO "authenticated")

      assert :ok = TenantMigrations.apply_pgdelta(tenant, plan)

      assert %Postgrex.Result{rows: [[false]]} =
               Postgrex.query!(
                 admin_conn,
                 "SELECT has_table_privilege('authenticated', 'realtime.messages', 'DELETE')",
                 []
               )
    end

    test "surfaces the shadow database error when the role lacks CREATEDB", %{
      settings: settings,
      admin_conn: admin_conn
    } do
      Postgrex.query!(admin_conn, "DROP ROLE IF EXISTS pgdelta_no_createdb", [])
      Postgrex.query!(admin_conn, "CREATE ROLE pgdelta_no_createdb LOGIN PASSWORD 'postgres' NOCREATEDB", [])

      assert {:error, message} =
               TenantMigrations.run_pgdelta(%{settings | username: "pgdelta_no_createdb"})

      assert message =~ "CREATEDB"

      Postgrex.query!(admin_conn, "DROP ROLE IF EXISTS pgdelta_no_createdb", [])
    end
  end

  describe "apply_pgdelta/2" do
    # The 15.1.0.1 image is excluded because its pg_net 0.6 worker never accepts the
    # ProcSignalBarrier, so pg-delta's DROP DATABASE ... WITH (FORCE) shadow cleanup hangs.
    @describetag :requires_supautils_policy_grants
    setup %{tenant: tenant} do
      {:ok, settings} = Database.from_tenant(tenant, "realtime_test", :stop)
      settings = %{settings | pool_size: 1}
      {:ok, admin_conn} = Database.connect_db(%{settings | username: "supabase_admin"})

      %{settings: settings, admin_conn: admin_conn}
    end

    test "applies the plan, converges to no drift and backfills schema_migrations", %{
      tenant: tenant,
      settings: settings,
      admin_conn: admin_conn
    } do
      Postgrex.query!(admin_conn, "DROP INDEX realtime.messages_inserted_at_topic_index", [])
      Postgrex.query!(admin_conn, "ALTER TABLE realtime.messages OWNER TO postgres", [])
      Postgrex.query!(admin_conn, "CREATE POLICY customer_policy ON realtime.messages FOR SELECT USING (true)", [])
      Postgrex.query!(admin_conn, "COMMENT ON POLICY customer_policy ON realtime.messages IS 'customer note'", [])

      Postgrex.query!(admin_conn, "DELETE FROM realtime.schema_migrations WHERE version > 20211116213934", [])
      {:ok, _} = Api.update_migrations_ran(tenant.external_id, 7)

      assert {:ok, %{status: :changes, plan: plan}} = TenantMigrations.run_pgdelta(settings)
      assert :ok = TenantMigrations.apply_pgdelta(tenant, plan)

      assert {:ok, %{status: :no_changes}} = TenantMigrations.run_pgdelta(settings)

      %{rows: [[owner]]} =
        Postgrex.query!(
          admin_conn,
          "SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid = 'realtime.messages'::regclass",
          []
        )

      assert owner == "supabase_realtime_admin"

      %{num_rows: surviving_policies} =
        Postgrex.query!(
          admin_conn,
          "SELECT 1 FROM pg_policies WHERE schemaname = 'realtime' AND policyname = 'customer_policy'",
          []
        )

      assert surviving_policies == 1

      assert %{rows: [["customer note"]]} =
               Postgrex.query!(
                 admin_conn,
                 """
                 SELECT obj_description(pol.oid, 'pg_policy')
                 FROM pg_policy pol
                 WHERE pol.polrelid = 'realtime.messages'::regclass AND pol.polname = 'customer_policy'
                 """,
                 []
               )

      %{rows: [[count]]} = Postgrex.query!(admin_conn, "SELECT count(*)::int FROM realtime.schema_migrations", [])

      total = length(Migrations.migrations())
      assert count == total

      updated = Api.get_tenant_by_external_id(tenant.external_id, use_replica?: false)
      assert updated.migrations_ran == total
    end

    test "preserve user-defined policies", %{
      tenant: tenant,
      settings: settings,
      admin_conn: admin_conn
    } do
      create_customer_policies(admin_conn)

      policies_before = messages_policies(admin_conn)
      assert length(policies_before) == 2

      drift_messages(admin_conn)

      assert {:ok, %{status: :changes, sql: sql, plan: plan}} = TenantMigrations.run_pgdelta(settings)
      assert sql =~ ~s(ALTER TABLE "realtime"."messages" DROP COLUMN "rogue_col")
      refute sql =~ "customer_select"
      refute sql =~ "customer_insert"

      assert :ok = TenantMigrations.apply_pgdelta(tenant, plan)

      assert messages_policies(admin_conn) == policies_before
      assert {:ok, %{status: :no_changes}} = TenantMigrations.run_pgdelta(settings)
    end

    test "preserve user-defined policy comments", %{
      tenant: tenant,
      settings: settings,
      admin_conn: admin_conn
    } do
      create_customer_policies(admin_conn)

      Postgrex.query!(admin_conn, "COMMENT ON POLICY customer_select ON realtime.messages IS 'select note'", [])
      Postgrex.query!(admin_conn, "COMMENT ON POLICY customer_insert ON realtime.messages IS 'insert note'", [])

      comments_before = messages_policy_comments(admin_conn)
      assert comments_before == [["customer_insert", "insert note"], ["customer_select", "select note"]]

      drift_messages(admin_conn)

      assert {:ok, %{status: :changes, sql: sql, plan: plan}} = TenantMigrations.run_pgdelta(settings)
      assert sql =~ ~s(ALTER TABLE "realtime"."messages" DROP COLUMN "rogue_col")
      refute sql =~ "select note"
      refute sql =~ "insert note"

      assert :ok = TenantMigrations.apply_pgdelta(tenant, plan)

      assert messages_policy_comments(admin_conn) == comments_before
      assert {:ok, %{status: :no_changes}} = TenantMigrations.run_pgdelta(settings)
    end
  end

  describe "postgres_url/1" do
    test "builds a valid URL for IPv4 hosts" do
      assert TenantMigrations.postgres_url(%Database{
               hostname: "db.example.com",
               port: 5432,
               database: "postgres",
               username: "supabase_admin",
               password: "s3cr3t",
               socket_options: [:inet],
               ssl: true
             }) == "postgresql://supabase_admin:s3cr3t@db.example.com:5432/postgres?sslmode=require"
    end

    test "builds a valid URL for IPv6 hosts" do
      assert TenantMigrations.postgres_url(%Database{
               hostname: "2600:1f14:359d:9302:205d:38ca:a017:c7e3",
               port: 5432,
               database: "postgres",
               username: "supabase_admin",
               password: "s3cr3t",
               socket_options: [:inet6],
               ssl: true
             }) ==
               "postgresql://supabase_admin:s3cr3t@[2600:1f14:359d:9302:205d:38ca:a017:c7e3]:5432/postgres?sslmode=require&host=2600:1f14:359d:9302:205d:38ca:a017:c7e3"
    end

    test "builds a valid URL for DNS hostnames resolved over IPv6" do
      assert TenantMigrations.postgres_url(%Database{
               hostname: "db.example.com",
               port: 5432,
               database: "postgres",
               username: "supabase_admin",
               password: "s3cr3t",
               socket_options: [:inet6],
               ssl: true
             }) == "postgresql://supabase_admin:s3cr3t@db.example.com:5432/postgres?sslmode=require"
    end
  end

  defp create_customer_policies(conn) do
    Postgrex.query!(
      conn,
      "CREATE POLICY customer_select ON realtime.messages FOR SELECT TO authenticated USING (extension = 'broadcast')",
      []
    )

    Postgrex.query!(
      conn,
      """
      CREATE POLICY customer_insert ON realtime.messages AS RESTRICTIVE FOR INSERT
      TO authenticated, service_role WITH CHECK (private IS TRUE)
      """,
      []
    )
  end

  defp drift_messages(conn) do
    Postgrex.query!(conn, "ALTER TABLE realtime.messages ADD COLUMN rogue_col text", [])
    Postgrex.query!(conn, "DROP INDEX realtime.messages_inserted_at_topic_index", [])
  end

  defp messages_policies(conn) do
    query = """
    SELECT pol.polname,
           pol.polcmd,
           pol.polpermissive,
           pg_get_expr(pol.polqual, pol.polrelid),
           pg_get_expr(pol.polwithcheck, pol.polrelid),
           (SELECT array_agg(pg_get_userbyid(oid) ORDER BY pg_get_userbyid(oid)) FROM unnest(pol.polroles) AS oid)
    FROM pg_policy pol
    WHERE pol.polrelid = 'realtime.messages'::regclass
    ORDER BY pol.polname
    """

    Postgrex.query!(conn, query, []).rows
  end

  defp messages_policy_comments(conn) do
    query = """
    SELECT pol.polname, obj_description(pol.oid, 'pg_policy')
    FROM pg_policy pol
    WHERE pol.polrelid = 'realtime.messages'::regclass
    ORDER BY pol.polname
    """

    Postgrex.query!(conn, query, []).rows
  end

  defp using_basic_auth(conn, username, password) do
    header_content = "Basic " <> Base.encode64("#{username}:#{password}")
    put_req_header(conn, "authorization", header_content)
  end
end
