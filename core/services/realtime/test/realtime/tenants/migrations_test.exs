defmodule Realtime.Tenants.MigrationsTest do
  # Can't use async: true because Cachex does not work well with Ecto Sandbox
  use Realtime.DataCase, async: false
  use Mimic

  setup :set_mimic_from_context

  import ExUnit.CaptureLog

  alias Realtime.Database
  alias Realtime.Repo
  alias Realtime.Tenants.Cache
  alias Realtime.Tenants.Migrations

  setup do
    Cachex.clear(Realtime.FeatureFlags.Cache)
    :ok
  end

  describe "run_migrations/1" do
    setup do
      stub(Migrations, :load_db_dump?, fn migrations_ran, repo ->
        migrations_ran == 0 and Migrations.schema_migrations_empty?(repo)
      end)

      :ok
    end

    test "migrations for a given tenant only run once" do
      tenant = TestTenantDb.checkout_tenant()

      res =
        for _ <- 0..10 do
          Task.async(fn -> Migrations.run_migrations(tenant) end)
        end
        |> Task.await_many()
        |> Enum.uniq()

      assert [:ok] = res
    end

    test "migrations run if tenant has migrations_ran set to 0" do
      tenant = TestTenantDb.checkout_tenant()

      assert Migrations.run_migrations(tenant) == :ok

      assert_eventually(
        Cache.get_tenant_by_external_id(tenant.external_id).migrations_ran == Enum.count(Migrations.migrations())
      )
    end

    test "migrations do not run if tenant has migrations_ran at the count of all migrations" do
      tenant = tenant_fixture(%{migrations_ran: Enum.count(Migrations.migrations())})
      assert Migrations.run_migrations(tenant) == :noop
    end

    test "runs every migration step sequentially when migrations_ran is already greater than 0" do
      tenant = %{TestTenantDb.checkout_tenant() | migrations_ran: 1}
      total = Enum.count(Migrations.migrations())

      :telemetry.attach(
        "sequential-migrator-test",
        [:realtime, :tenants, :migrations, :stop],
        fn _event, _measurements, metadata, %{pid: pid} ->
          send(pid, {:migrations_metadata, metadata.source, metadata.migrations_executed})
        end,
        %{pid: self()}
      )

      on_exit(fn -> :telemetry.detach("sequential-migrator-test") end)

      assert Migrations.run_migrations(tenant) == :ok
      assert_receive {:migrations_metadata, :migrator, ^total}

      assert_eventually Cache.get_tenant_by_external_id(tenant.external_id).migrations_ran == total
    end

    test "creates realtime types even when same-named types exist in other schemas" do
      tenant = %{TestTenantDb.checkout_tenant() | migrations_ran: 1}
      total = Enum.count(Migrations.migrations())
      type_names = ~w(equality_op user_defined_filter action wal_rls wal_column)

      # Every table has a same-named row type in pg_type
      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)
      for name <- type_names, do: Postgrex.query!(conn, "CREATE TABLE public.#{name} (id int)", [])

      assert Migrations.run_migrations(tenant) == :ok
      assert_eventually Cache.get_tenant_by_external_id(tenant.external_id).migrations_ran == total

      for name <- type_names do
        assert %{rows: [[true]]} =
                 Postgrex.query!(conn, "SELECT to_regtype($1) IS NOT NULL", ["realtime.#{name}"])
      end
    end

    test "reconciles migrations_ran instead of reloading the dump when the database is already migrated" do
      tenant = TestTenantDb.checkout_tenant()
      total = Enum.count(Migrations.migrations())

      assert Migrations.run_migrations(tenant) == :ok

      assert_eventually Cache.get_tenant_by_external_id(tenant.external_id).migrations_ran == total

      :telemetry.attach(
        "reconcile-test",
        [:realtime, :tenants, :migrations, :stop],
        fn _event, _measurements, metadata, %{pid: pid} ->
          send(pid, {:migrations_metadata, metadata.source, metadata.migrations_executed})
        end,
        %{pid: self()}
      )

      on_exit(fn -> :telemetry.detach("reconcile-test") end)

      stale_tenant = %{tenant | migrations_ran: 0}
      assert Migrations.run_migrations(stale_tenant) == :ok
      assert_receive {:migrations_metadata, :migrator, 0}

      assert_eventually Cache.get_tenant_by_external_id(tenant.external_id).migrations_ran == total
    end

    @tag :skip_orioledb
    @tag :requires_pg_150000
    test "loads the bundled dump for a brand-new tenant" do
      tenant = TestTenantDb.checkout_tenant()
      total = Enum.count(Migrations.migrations())

      :telemetry.attach(
        "tenant-db-dump-test",
        [:realtime, :tenants, :migrations, :stop],
        fn _event, _measurements, metadata, %{pid: pid} ->
          send(pid, {:migrations_metadata, metadata.source, metadata.migrations_executed})
        end,
        %{pid: self()}
      )

      on_exit(fn -> :telemetry.detach("tenant-db-dump-test") end)

      assert Migrations.run_migrations(tenant) == :ok
      assert_receive {:migrations_metadata, :dump, ^total}
    end

    @tag :skip_orioledb
    @tag :requires_pg_150000
    test "treats a missing schema_migrations table as empty and loads the dump for a new tenant" do
      tenant = TestTenantDb.checkout_tenant()
      total = Enum.count(Migrations.migrations())

      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)
      Postgrex.query!(conn, "DROP TABLE IF EXISTS realtime.schema_migrations", [])
      GenServer.stop(conn)

      :telemetry.attach(
        "undefined-table-test",
        [:realtime, :tenants, :migrations, :stop],
        fn _event, _measurements, metadata, %{pid: pid} ->
          send(pid, {:migrations_metadata, metadata.source, metadata.migrations_executed})
        end,
        %{pid: self()}
      )

      on_exit(fn -> :telemetry.detach("undefined-table-test") end)

      assert Migrations.run_migrations(tenant) == :ok
      assert_receive {:migrations_metadata, :dump, ^total}

      assert_eventually Cache.get_tenant_by_external_id(tenant.external_id).migrations_ran == total
    end

    test "falls back to sequential migrations without crashing when the schema_migrations check errors unexpectedly" do
      tenant = TestTenantDb.checkout_tenant()
      total = Enum.count(Migrations.migrations())

      expect(Repo, :query, fn "SELECT count(*)::int FROM realtime.schema_migrations", [], _opts ->
        {:error, %Postgrex.Error{postgres: %{code: :insufficient_privilege}}}
      end)

      log =
        capture_log(fn ->
          assert Migrations.run_migrations(tenant) == :ok
        end)

      assert log =~ "TenantMigrationsRanCheckFailed"

      assert_eventually Cache.get_tenant_by_external_id(tenant.external_id).migrations_ran == total
    end

    test "does not check the database when migrations_ran is already greater than 0" do
      tenant = %{TestTenantDb.checkout_tenant() | migrations_ran: 1}

      reject(&Repo.query/3)

      assert Migrations.run_migrations(tenant) == :ok
    end
  end

  describe "run_migrations_async/1" do
    test "returns immediately and runs migrations in the background" do
      tenant = TestTenantDb.checkout_tenant()

      assert Migrations.run_migrations_async(tenant) == :ok

      assert_eventually(
        Cache.get_tenant_by_external_id(tenant.external_id).migrations_ran == Enum.count(Migrations.migrations())
      )
    end

    test "does not run if tenant has migrations_ran equal to count of all migrations" do
      tenant = tenant_fixture(%{migrations_ran: Enum.count(Migrations.migrations())})
      assert Migrations.run_migrations_async(tenant) == :noop
    end
  end

  describe "run_migrations?/1" do
    test "returns true if migrations_ran is lower than existing migrations" do
      tenant = tenant_fixture(%{migrations_ran: 0})
      assert Migrations.run_migrations?(tenant)

      tenant = tenant_fixture(%{migrations_ran: Enum.count(Migrations.migrations()) - 1})
      assert Migrations.run_migrations?(tenant)
    end

    test "returns false if migrations_ran is count of all migrations" do
      tenant = tenant_fixture(%{migrations_ran: Enum.count(Migrations.migrations())})
      refute Migrations.run_migrations?(tenant)
    end
  end

  describe "telemetry" do
    setup do
      events = [
        [:realtime, :tenants, :migrations, :start],
        [:realtime, :tenants, :migrations, :stop],
        [:realtime, :tenants, :migrations, :exception]
      ]

      :telemetry.attach_many(__MODULE__, events, &__MODULE__.handle_telemetry/4, pid: self())
      on_exit(fn -> :telemetry.detach(__MODULE__) end)

      :ok
    end

    test "emits start event metadata" do
      tenant = TestTenantDb.checkout_tenant()
      external_id = tenant.external_id

      assert Migrations.run_migrations(tenant) == :ok

      assert_receive {:telemetry, [:realtime, :tenants, :migrations, :start], %{system_time: _},
                      %{external_id: ^external_id, hostname: hostname}}

      assert is_binary(hostname)
    end

    test "emits stop event with metadata" do
      tenant = %{TestTenantDb.checkout_tenant() | migrations_ran: 1}
      external_id = tenant.external_id

      assert Migrations.run_migrations(tenant) == :ok

      total = Enum.count(Migrations.migrations())

      assert_receive {:telemetry, [:realtime, :tenants, :migrations, :stop], %{duration: duration},
                      %{external_id: ^external_id, hostname: hostname, migrations_executed: ^total}}

      assert is_binary(hostname)
      assert is_integer(duration) and duration >= 0
    end

    test "emits exception event tagged with postgrex error on postgres errors" do
      tenant = %{TestTenantDb.checkout_tenant() | migrations_ran: 1}
      external_id = tenant.external_id

      error = %Postgrex.Error{postgres: %{code: :undefined_column}}
      expect(Ecto.Migrator, :run, fn _, _, _, _ -> raise error end)

      Migrations.run_migrations(tenant)

      assert_receive {:telemetry, [:realtime, :tenants, :migrations, :exception], %{duration: _},
                      %{external_id: ^external_id, error_code: :undefined_column, kind: :error, reason: ^error}}
    end

    test "tags connection errors with connection_error code" do
      tenant = %{TestTenantDb.checkout_tenant() | migrations_ran: 1}
      external_id = tenant.external_id

      error = %DBConnection.ConnectionError{message: "ssl send: closed"}
      expect(Ecto.Migrator, :run, fn _, _, _, _ -> raise error end)

      Migrations.run_migrations(tenant)

      assert_receive {:telemetry, [:realtime, :tenants, :migrations, :exception], _,
                      %{external_id: ^external_id, error_code: :connection_error}}
    end
  end

  def handle_telemetry(event, measurements, metadata, pid: pid) do
    send(pid, {:telemetry, event, measurements, metadata})
  end
end
