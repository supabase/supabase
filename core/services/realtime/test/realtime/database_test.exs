defmodule Realtime.DatabaseTest do
  use Realtime.DataCase, async: true
  use Mimic

  setup :set_mimic_from_context

  import ExUnit.CaptureLog

  alias Realtime.Crypto
  alias Realtime.Database

  doctest Realtime.Database
  def handle_telemetry(event, metadata, content, pid: pid), do: send(pid, {event, metadata, content})

  setup context do
    :telemetry.attach(__MODULE__, [:realtime, :database, :transaction], &__MODULE__.handle_telemetry/4, pid: self())

    on_exit(fn -> :telemetry.detach(__MODULE__) end)

    maybe_checkout_tenant(context)
  end

  # Pure tests (DNS resolution, settings structs, pool-size math) never touch a tenant database,
  # so they skip the container checkout.
  defp maybe_checkout_tenant(%{without_db: true}), do: :ok
  defp maybe_checkout_tenant(_context), do: %{tenant: TestTenantDb.checkout_tenant()}

  describe "check_tenant_connection/1" do
    setup context do
      extension = %{
        "type" => "postgres_cdc_rls",
        "settings" => %{
          "db_host" => "127.0.0.1",
          "db_name" => "postgres",
          "db_user" => "supabase_admin",
          "db_password" => "postgres",
          "region" => "us-east-1",
          "ssl_enforced" => false,
          "db_pool" => Map.get(context, :db_pool),
          "subcriber_pool_size" => Map.get(context, :subcriber_pool_size),
          "subs_pool_size" => Map.get(context, :subs_pool_size)
        }
      }

      {:ok, tenant} = update_extension(context.tenant, extension)

      %{tenant: tenant}
    end

    test "returns error when tenant is nil" do
      assert {:error, :tenant_not_found} = Database.check_tenant_connection(nil)
    end

    test "connects to a tenant database", %{tenant: tenant} do
      assert {:ok, _conn, migrations_ran} = Database.check_tenant_connection(tenant)
      assert is_integer(migrations_ran)
      assert migrations_ran >= 0
    end

    test "returns 0 migrations when realtime.schema_migrations does not exist", %{tenant: tenant} do
      # by default new containers do not have the schema_migrations table
      assert {:ok, _conn, 0} = Database.check_tenant_connection(tenant)
    end

    test "returns migration count when realtime.schema_migrations exists", %{tenant: tenant} do
      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)

      Postgrex.query!(conn, "CREATE TABLE IF NOT EXISTS realtime.schema_migrations (version bigint PRIMARY KEY)", [])
      Postgrex.query!(conn, "INSERT INTO realtime.schema_migrations VALUES (1), (2), (3)", [])

      assert {:ok, check_conn, 3} = Database.check_tenant_connection(tenant)
      GenServer.stop(check_conn)
      GenServer.stop(conn)
    end

    # Connection limit for docker tenant db is 100
    @tag db_pool: 50,
         subs_pool_size: 73
    test "restricts connection if tenant database cannot receive more connections based on tenant pool",
         %{tenant: tenant} do
      assert capture_log(fn ->
               assert {:error, :tenant_db_too_many_connections} = Database.check_tenant_connection(tenant)
             end) =~ ~r/Only \d+ available connections\. At least 125 connections are required/
    end

    @tag db_pool: 500
    test "counts only the client backends holding a connection slot", %{tenant: tenant} do
      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)

      %{rows: [[available_connections]]} =
        Postgrex.query!(
          conn,
          """
          SELECT (current_setting('max_connections')::int - count(*))::int
            FROM pg_stat_activity
           WHERE backend_type = 'client backend'
             AND application_name NOT IN ('realtime_connect', 'realtime_connect_probe')
          """,
          []
        )

      assert capture_log(fn ->
               assert {:error, :tenant_db_too_many_connections} = Database.check_tenant_connection(tenant)
             end) =~ "Only #{available_connections} available connections"
    end

    @tag db_pool: 3
    test "durable pool opens the configured number of realtime_connect connections", %{
      tenant: tenant,
      db_pool: pool_size
    } do
      # pg_stat_activity is server-wide, so draining 'realtime_connect' backends left
      # behind by earlier tests can inflate the count. Terminate any lingering ones
      # (using a separate connection that is not counted) to start from a clean slate.
      {:ok, admin} = Database.connect(tenant, "realtime_test", :stop)
      from_realtime_connect = "FROM pg_stat_activity WHERE application_name = 'realtime_connect'"

      Postgrex.query!(admin, "SELECT pg_terminate_backend(pid) " <> from_realtime_connect, [])

      assert {:ok, conn, _migrations_ran} = Database.check_tenant_connection(tenant)

      # Multigres multiplexes idle clients onto one backend, so keep them all mid-query to count.
      busy =
        for _ <- 1..pool_size,
            do: Task.async(fn -> Postgrex.query(conn, "SELECT pg_sleep(5)", [], timeout: 15_000) end)

      # Postgrex opens the pool connections asynchronously, so give it a moment
      # to bring all of them up.
      case_wait Postgrex.query!(admin, "SELECT count(*)::int " <> from_realtime_connect, []) do
        %{rows: [[^pool_size]]} -> :ok
      else
        %{rows: [[count]]} -> flunk("Expected #{pool_size} connections, but found #{count}")
      end

      Enum.each(busy, &Task.shutdown(&1, :brutal_kill))
    end
  end

  describe "replication_slot_teardown/1" do
    test "removes replication slots with the realtime prefix", %{tenant: tenant} do
      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)
      create_replication_slot(conn, "realtime_test_slot", plugin: "pgoutput", temporary: false)
      Database.replication_slot_teardown(tenant)

      assert %{rows: []} =
               Postgrex.query!(conn, "SELECT slot_name FROM pg_replication_slots WHERE slot_type = 'logical'", [])
    end

    test "removes every replication slot with the realtime prefix", %{tenant: tenant} do
      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)

      for slot <- ~w(realtime_test_slot_a realtime_test_slot_b) do
        create_replication_slot(conn, slot, plugin: "pgoutput", temporary: false)
      end

      Database.replication_slot_teardown(tenant)

      assert %{rows: []} =
               Postgrex.query!(conn, "SELECT slot_name FROM pg_replication_slots WHERE slot_type = 'logical'", [])
    end
  end

  describe "replication_slot_teardown/2" do
    test "removes replication slots with a given name and existing connection", %{tenant: tenant} do
      name = String.downcase("slot_#{random_string()}")
      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)

      create_replication_slot(conn, name, plugin: "pgoutput")

      Database.replication_slot_teardown(conn, name)

      # Postgres releases the slot asynchronously once the walsender exits.
      assert_eventually %{rows: []} =
                          Postgrex.query!(
                            conn,
                            "SELECT slot_name FROM pg_replication_slots WHERE slot_type = 'logical'",
                            []
                          )
    end

    test "removes replication slots with a given name and a tenant", %{tenant: tenant} do
      name = String.downcase("slot_#{random_string()}")
      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)
      create_replication_slot(conn, name, plugin: "pgoutput", temporary: false)
      Database.replication_slot_teardown(tenant, name)

      assert %{rows: []} =
               Postgrex.query!(conn, "SELECT slot_name FROM pg_replication_slots WHERE slot_type = 'logical'", [])
    end
  end

  describe "transaction/1" do
    setup context do
      extension = %{
        "type" => "postgres_cdc_rls",
        "settings" => %{
          "db_host" => "127.0.0.1",
          "db_name" => "postgres",
          "db_user" => "supabase_admin",
          "db_password" => "postgres",
          "region" => "us-east-1",
          "ssl_enforced" => false,
          "db_pool" => Map.get(context, :db_pool)
        }
      }

      {:ok, tenant} = update_extension(context.tenant, extension)

      # Split database connection and pool creation into two steps so individual tests
      # can control the pool_queue settings.
      {:ok, settings} = Database.from_tenant(tenant, "realtime_test", :stop)
      {:ok, db_conn} = Database.connect_db(settings, Map.get(context, :pool_queue, []))

      %{db_conn: db_conn}
    end

    test "handles transaction errors", %{db_conn: db_conn} do
      assert {:error, %Postgrex.Error{postgres: %{code: :admin_shutdown}}} =
               Database.transaction(db_conn, fn conn ->
                 Postgrex.query!(conn, "select pg_terminate_backend(pg_backend_pid())", [])
               end)
    end

    @tag db_pool: 1, pool_queue: [queue_target: 50, queue_interval: 100]
    test "on checkout error, handles raised exception as an error", %{db_conn: db_conn} do
      TestHelpers.hold_connections!(db_conn)

      log =
        capture_log(fn ->
          assert {:error, %DBConnection.ConnectionError{reason: :queue_timeout}} =
                   Task.async(fn ->
                     Database.transaction(
                       db_conn,
                       fn conn -> Postgrex.query!(conn, "SELECT pg_sleep(11)", []) end,
                       [timeout: 15000],
                       external_id: "123",
                       project: "123"
                     )
                   end)
                   |> Task.await(20000)
        end)

      assert log =~ "project=123 external_id=123 [error] ErrorExecutingTransaction"
    end

    test "handles exit signals in transactions", %{db_conn: db_conn} do
      assert capture_log(fn ->
               assert {:error, {:exit, _}} = Database.transaction(db_conn, fn _conn -> exit(:test_exit) end)
             end) =~ "ErrorExecutingTransaction"
    end

    test "run call using RPC", %{db_conn: db_conn} do
      assert {:ok, %{rows: [[1]]}} =
               Realtime.Rpc.enhanced_call(
                 node(db_conn),
                 Database,
                 :transaction,
                 [
                   db_conn,
                   fn db_conn -> Postgrex.query!(db_conn, "SELECT 1", []) end,
                   [backoff: :stop],
                   [tenant_id: "test"]
                 ]
               )
    end

    test "handles RPC error", %{db_conn: db_conn} do
      assert {:error, :rpc_error, :noconnection} =
               Realtime.Rpc.enhanced_call(
                 :potato@nohost,
                 Database,
                 :transaction,
                 [
                   db_conn,
                   fn db_conn -> Postgrex.query!(db_conn, "SELECT 1", []) end,
                   [backoff: :stop],
                   [tenant_id: "test"]
                 ]
               )
    end

    test "with telemetry event defined, emits telemetry event", %{db_conn: db_conn} do
      event = [:realtime, :database, :transaction]
      opts = [telemetry: event]

      Database.transaction(db_conn, fn conn -> Postgrex.query!(conn, "SELECT pg_sleep(0.1)", []) end, opts)
      assert_receive {^event, %{latency: latency}, %{tenant: nil}}
      assert latency > 100
    end

    test "with telemetry event defined, emits telemetry event with tenant_id", %{db_conn: db_conn} do
      event = [:realtime, :database, :transaction]
      tenant_id = random_string()
      opts = [telemetry: event, tenant_id: tenant_id]

      Database.transaction(db_conn, fn conn -> Postgrex.query!(conn, "SELECT pg_sleep(0.1)", []) end, opts)

      assert_receive {^event, %{latency: latency}, %{tenant: ^tenant_id}}
      assert latency > 100
    end
  end

  describe "pool_size_by_application_name/2" do
    @describetag without_db: true
    test "returns the number of connections per application name" do
      assert Database.pool_size_by_application_name("realtime_connect", %{}) == 1
      assert Database.pool_size_by_application_name("realtime_connect", %{"db_pool" => 10}) == 10
      assert Database.pool_size_by_application_name("realtime_potato", %{}) == 1
      assert Database.pool_size_by_application_name("realtime_rls", %{"db_pool" => 10}) == 1
      assert Database.pool_size_by_application_name("realtime_rls", %{"subs_pool_size" => 10}) == 1
      assert Database.pool_size_by_application_name("realtime_rls", %{"subcriber_pool_size" => 10}) == 1
      assert Database.pool_size_by_application_name("realtime_broadcast_changes", %{"db_pool" => 10}) == 1
      assert Database.pool_size_by_application_name("realtime_broadcast_changes", %{"subs_pool_size" => 10}) == 1
      assert Database.pool_size_by_application_name("realtime_broadcast_changes", %{"subcriber_pool_size" => 10}) == 1
      assert Database.pool_size_by_application_name("realtime_migrations", %{"db_pool" => 10}) == 2
      assert Database.pool_size_by_application_name("realtime_migrations", %{"subs_pool_size" => 10}) == 2
      assert Database.pool_size_by_application_name("realtime_migrations", %{"subcriber_pool_size" => 10}) == 2
    end
  end

  describe "get_external_id/1" do
    @describetag without_db: true
    test "returns the external id for a given hostname" do
      assert Realtime.Database.get_external_id("tenant.realtime.supabase.co") == {:ok, "tenant"}
      assert Realtime.Database.get_external_id("tenant.supabase.co") == {:ok, "tenant"}
      assert Realtime.Database.get_external_id("localhost") == {:ok, "localhost"}
    end
  end

  describe "detect_ip_version/1" do
    @describetag without_db: true
    test "detects appropriate IP version" do
      # Using ipv4.google.com
      assert Realtime.Database.detect_ip_version("ipv4.google.com") == {:ok, :inet}

      # Using ipv6.google.com
      assert Realtime.Database.detect_ip_version("ipv6.google.com") == {:ok, :inet6}
      assert Realtime.Database.detect_ip_version("2001:0db8:85a3:0000:0000:8a2e:0370:7334") == {:ok, :inet6}

      # Using 127.0.0.1
      assert Realtime.Database.detect_ip_version("127.0.0.1") == {:ok, :inet}

      # Using invalid domain
      assert Realtime.Database.detect_ip_version("potato") == {:error, :nxdomain}
    end

    test "logs a warning when the host resolves to an IPv4 address" do
      log =
        capture_log(fn ->
          assert Realtime.Database.detect_ip_version("ipv4.google.com") == {:ok, :inet}
        end)

      assert log =~ "DatabaseIpVersionIsIpv4"
      assert log =~ "ipv4.google.com"
    end
  end

  describe "from_tenant/3" do
    test "uses default backoff when not provided", %{tenant: tenant} do
      {:ok, settings} = Database.from_tenant(tenant, "realtime_test")
      assert settings.backoff_type == :rand_exp
    end
  end

  describe "from_settings/3 encryption" do
    test "decrypts GCM and legacy ECB values side by side", %{tenant: tenant} do
      [extension] = tenant.extensions

      settings =
        extension.settings
        |> Map.put("db_name", Crypto.encrypt!("gcm_db", cipher: :gcm))
        |> Map.put("db_user", Crypto.encrypt!("ecb_user", cipher: :ecb))

      {:ok, _} = extension |> Ecto.Changeset.change(%{settings: settings}) |> Repo.update()

      tenant = Realtime.Api.get_tenant_by_external_id(tenant.external_id)
      settings = Realtime.PostgresCdc.filter_settings("postgres_cdc_rls", tenant.extensions)

      assert {:ok, %Database{database: "gcm_db", username: "ecb_user"}} =
               Database.from_settings(settings, "realtime_connect")
    end
  end

  describe "from_settings/3" do
    test "uses default backoff when not provided", %{tenant: tenant} do
      settings = Realtime.PostgresCdc.filter_settings("postgres_cdc_rls", tenant.extensions)
      {:ok, result} = Database.from_settings(settings, "realtime_connect")
      assert result.backoff_type == :rand_exp
    end

    test "returns struct with correct setup", %{tenant: tenant} do
      application_name = "realtime_connect"
      backoff = :stop
      {:ok, ip_version} = Database.detect_ip_version("127.0.0.1")
      socket_options = [ip_version]
      settings = Realtime.PostgresCdc.filter_settings("postgres_cdc_rls", tenant.extensions)

      username = System.get_env("DB_USER", "supabase_admin")

      {:ok, settings} = Database.from_settings(settings, application_name, backoff)
      port = settings.port

      assert %Realtime.Database{
               socket_options: ^socket_options,
               application_name: ^application_name,
               backoff_type: ^backoff,
               hostname: "127.0.0.1",
               port: ^port,
               database: "postgres",
               username: ^username,
               password: "postgres",
               pool_size: 1,
               queue_target: 5000,
               max_restarts: nil,
               ssl: false
             } = settings
    end

    @tag without_db: true
    test "defaults ssl to true when ssl_enforced is not set" do
      assert Database.default_ssl_param(%{})
      assert Database.default_ssl_param(%{"other" => "value"})
    end

    test "handles SSL properties", %{tenant: tenant} do
      application_name = "realtime_connect"
      backoff = :stop

      settings = Realtime.PostgresCdc.filter_settings("postgres_cdc_rls", tenant.extensions)
      settings = Map.put(settings, "ssl_enforced", true)
      {:ok, settings} = Database.from_settings(settings, application_name, backoff)
      assert settings.ssl == [verify: :verify_none]

      settings = Realtime.PostgresCdc.filter_settings("postgres_cdc_rls", tenant.extensions)
      settings = Map.put(settings, "ssl_enforced", false)
      {:ok, settings} = Database.from_settings(settings, application_name, backoff)
      refute settings.ssl
    end
  end

  describe "orioledb/1" do
    @tag :skip_orioledb
    test "reports no OrioleDB without the extension", %{tenant: tenant} do
      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)
      assert {:ok, false} = Database.orioledb(conn)
    end

    @tag :requires_orioledb
    test "reports OrioleDB with the extension", %{tenant: tenant} do
      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)
      assert {:ok, true} = Database.orioledb(conn)
    end

    test "returns the error when the check fails", %{tenant: tenant} do
      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)

      Postgrex.transaction(conn, fn tx ->
        assert {:error, _} = Postgrex.query(tx, "SELECT 1/0", [])
        assert {:error, %Postgrex.Error{postgres: %{code: :in_failed_sql_transaction}}} = Database.orioledb(tx)
      end)
    end
  end

  describe "check_replication_slot/2" do
    setup %{tenant: tenant} do
      {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)
      suffix = System.unique_integer([:positive])
      slot_name = "test_slot_#{suffix}"
      table_name = "slot_test_#{suffix}"

      create_replication_slot(db_conn, slot_name, plugin: "pgoutput", temporary: false)
      Postgrex.query!(db_conn, "CREATE TABLE IF NOT EXISTS #{table_name} (id INT, data TEXT)", [])

      on_exit(fn ->
        case Database.connect(tenant, "realtime_test_cleanup", :stop) do
          {:ok, conn} ->
            drop_replication_slot(conn, slot_name)
            Postgrex.query(conn, "DROP TABLE IF EXISTS #{table_name} CASCADE", [])
            GenServer.stop(conn)

          _ ->
            :ok
        end
      end)

      %{db_conn: db_conn, slot_name: slot_name, table_name: table_name}
    end

    test "returns {:error, :slot_not_found} for unknown slot", %{db_conn: db_conn} do
      assert {:error, :slot_not_found} == Database.check_replication_slot(db_conn, "nonexistent_slot_xyz")
    end

    test "returns {:error, :slot_inactive} when slot exists but is not being consumed", %{
      db_conn: db_conn,
      slot_name: slot_name
    } do
      assert {:error, :slot_inactive} == Database.check_replication_slot(db_conn, slot_name)
    end

    test "returns {:error, :slot_inactive} when lag is non-zero but below threshold", %{
      db_conn: db_conn,
      slot_name: slot_name,
      table_name: table_name
    } do
      # Generate ~40% of the 32MB max_slot_wal_keep_size (test container value) by inserting
      # ~50k rows of 200 bytes each — produces roughly 12-13MB of WAL, safely under the 16MB
      # (50%) lag threshold. The slot is inactive so restart_lsn stays pinned; with lag below
      # the threshold, inactivity is the reported problem.
      Postgrex.query!(
        db_conn,
        "INSERT INTO #{table_name} SELECT generate_series(1, 50000), repeat('x', 200)",
        []
      )

      assert {:error, :slot_inactive} == Database.check_replication_slot(db_conn, slot_name)
    end

    test "returns {:error, :lag_too_high} when slot is far behind", %{
      db_conn: db_conn,
      slot_name: slot_name,
      table_name: table_name
    } do
      # Generate >16MB of WAL (50% of the 32MB max_slot_wal_keep_size in test containers).
      # The slot is inactive so restart_lsn stays pinned at creation LSN. An excessive lag
      # takes precedence over the slot being inactive.
      Postgrex.query!(
        db_conn,
        "INSERT INTO #{table_name} SELECT generate_series(1, 100000), repeat('x', 200)",
        []
      )

      assert {:error, :lag_too_high} == Database.check_replication_slot(db_conn, slot_name)
    end
  end

  defp update_extension(tenant, extension) do
    db_port = Realtime.Crypto.decrypt!(hd(tenant.extensions).settings["db_port"])
    extensions = [put_in(extension, ["settings", "db_port"], db_port)]
    Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{extensions: extensions})
  end
end
