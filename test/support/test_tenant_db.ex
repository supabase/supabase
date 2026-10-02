defmodule TestTenantDb.UnhealthyDatabaseError do
  @moduledoc false
  # Raised when a checkout could not be served by any pool worker because their
  # databases stopped answering. Named (rather than a bare `:error`) so the flaky
  # digest can group it and so the failure carries its own root cause.
  defexception [:message]
end

defmodule TestTenantDb do
  @moduledoc false
  # Backend-neutral pool of ready-to-use tenant databases for the test suite.

  alias Extensions.PostgresCdcRls
  alias Realtime.Tenants.Connect
  alias TestTenantDb.Backend
  alias TestTenantDb.Probe
  alias TestTenantDb.UnhealthyDatabaseError
  alias Realtime.Database

  use GenServer

  # Every checkout probes its database before handing it to the test.
  # We do this, to make sure the database is healthy and ready.
  # If a database stops working, it poisons the entire run (observed in many
  # failures in the flaky test report).
  # We also use this to print diagnostics to hopefully get to the bottom of
  # this.
  #
  # "Stops answering" deliberately covers three different states, because we do
  # not know which one CI hits:
  #
  #   1. the container is gone (crash, OOM kill) — connect is refused at once
  #   2. it is up but not accepting connections — connect hangs
  #   3. it is accepting, but queries block on a stuck backend — the query hangs
  #
  # Our check for 3. only says "this database accept queries" - locks or others may still hold it up
  #
  # The check itself lives in `TestTenantDb.Probe`, shared with the backend's readiness
  # gate so the two cannot disagree about what "usable" means.

  # A probe is only allowed to condemn a database after failing twice.
  @probe_attempts 2

  # Attempts across *different* workers.
  @checkout_attempts 3

  # How long to wait for a _free worker_
  # The timeouts above ask "is this database healthy"; this one asks "is a peer test done
  # with theirs yet" - poolboy only.
  #
  # We have more workers in the pool than parallel cases - should be instant unless
  # something is too slow.
  @worker_checkout_timeout_ms 5_000

  @unhealthy_table __MODULE__.Unhealthy
  @probe_retry_table __MODULE__.ProbeRetries

  def start_link(max_cases), do: GenServer.start_link(__MODULE__, max_cases, name: __MODULE__)

  def init(max_cases) do
    {:ok, %{}, {:continue, {:pool, max_cases}}}
  end

  def handle_continue({:pool, max_cases}, state) do
    # Owned by this long-lived process so the tallies survive every test process.
    for table <- [@unhealthy_table, @probe_retry_table] do
      :ets.new(table, [:named_table, :public, :set, write_concurrency: true])
    end

    {worker_module, size} = Backend.current().pool_spec(max_cases)

    {:ok, _pid} =
      :poolboy.start_link(
        [
          strategy: :fifo,
          name: {:local, TestTenantDb.Pool},
          size: size,
          max_overflow: 0,
          worker_module: worker_module
        ],
        []
      )

    {:noreply, state}
  end

  @doc "Return a port for a pooled tenant DB that can be used"
  def checkout() do
    case acquire_tenant_db() do
      {:ok, port, checkin} ->
        # Automatically checkin at the end of the test
        ExUnit.Callbacks.on_exit(fn -> checkin.() end)
        {:ok, port}

      :error ->
        {:error, "failed to checkout a tenant database"}
    end
  end

  def checkout_tenant(opts \\ []), do: do_checkout_tenant(opts, :sandbox)
  def checkout_tenant_unboxed(opts \\ []), do: do_checkout_tenant(opts, :unboxed)

  @doc """
  Tears the pool down and hands the backend its resources back.

  Done after tests finish to not leave resources hanging.

  The pool has to go first, as workers claim their resource lazily.
  A short run might finish while resources are still being acquired and then left hanging around.
  """
  def shutdown(_results \\ %{}) do
    if pid = Process.whereis(__MODULE__), do: GenServer.stop(pid)
    Backend.current().cleanup!()
  catch
    # after_suite runs after the results are decided but before they are reported, so
    # anything raised here replaces the suite's verdict with a teardown error. A docker
    # hiccup must not turn a green run red — say what leaked and let the run stand.
    kind, reason ->
      IO.puts(:stderr, "[TestTenantDb] teardown failed (#{kind}: #{inspect(reason)}); resources may have leaked")
  end

  @doc """
  Prints the run's unhealthy-checkout and retried-probe tallies.

  Deliberately loud so we can figure out what's going on/breaking.
  """
  def report_unhealthy_checkouts(_results \\ %{}) do
    report_offenders(:ets.tab2list(@unhealthy_table))
    report_retries(:ets.tab2list(@probe_retry_table))
  end

  defp report_offenders([]), do: :ok

  defp report_offenders(offenders) do
    IO.puts(:stderr, """

    [TestTenantDb] #{total(offenders)} unhealthy tenant-database checkout(s) across #{length(offenders)} resource(s):
    #{tally_lines(offenders)}
    The resources were replaced mid-run, so tests that drew them were retried rather than
    killed.
    """)
  end

  defp report_retries([]), do: :ok

  defp report_retries(retries) do
    IO.puts(:stderr, """

    [TestTenantDb] #{total(retries)} probe(s) failed once and succeeded on retry:
    #{tally_lines(retries)}
    These cost checkout time without failing anything. A non-trivial count means the probe
    is too strict for the load, not that the databases are broken.
    """)
  end

  defp total(tally), do: tally |> Enum.map(&elem(&1, 1)) |> Enum.sum()

  defp tally_lines(tally) do
    tally
    |> Enum.sort_by(&elem(&1, 1), :desc)
    |> Enum.map_join("\n", fn {label, count} -> "  #{count}x  #{label}" end)
  end

  # Acquire a tenant database for one test — a pooled supabase/postgres
  # container, or (in external mode) one of the pre-configured external DBs.
  # Either way it's a real pool checkout, released via the returned checkin
  # function once the caller is done.
  #
  # A worker whose database fails the probe is discarded rather than handed on:
  # its resource is destroyed and the worker killed, which makes poolboy start a
  # replacement that claims a fresh one.
  defp acquire_tenant_db(attempts \\ @checkout_attempts, failures \\ [])

  defp acquire_tenant_db(0, failures) do
    raise UnhealthyDatabaseError,
      message:
        "no healthy tenant database after #{@checkout_attempts} checkout attempts.\n\n" <>
          Enum.join(Enum.reverse(failures), "\n\n")
  end

  defp acquire_tenant_db(attempts, failures) do
    case checkout_worker() do
      {:ok, worker} ->
        port = Backend.current().worker_port(worker)

        case probe(port) do
          :ok ->
            {:ok, port, fn -> :poolboy.checkin(TestTenantDb.Pool, worker) end}

          {:error, reason} ->
            acquire_tenant_db(attempts - 1, [discard_worker(worker, port, reason) | failures])
        end

      :full ->
        no_free_worker(failures)
    end
  end

  # A blocking `:poolboy.checkout/3` never returns `:full` — it lets its own
  # `GenServer.call` time out and re-raises, which reaches the test as a bare
  # `** (EXIT) time out` naming nothing. Translated here so pool exhaustion raises
  # like every other failure in this module.
  defp checkout_worker do
    {:ok, :poolboy.checkout(TestTenantDb.Pool, true, @worker_checkout_timeout_ms)}
  catch
    :exit, {:timeout, _} -> :full
  end

  # Poolboy gave up waiting for a free worker. If this checkout already condemned
  # databases on the way here, that is the likeliest reason the pool is short — so
  # say so and keep the forensics.
  defp no_free_worker(failures) do
    raise UnhealthyDatabaseError,
      message: "no free tenant database within #{@worker_checkout_timeout_ms}ms" <> after_discarding(failures)
  end

  defp after_discarding([]), do: "."

  defp after_discarding(failures) do
    ", after discarding #{length(failures)} unhealthy one(s) during this checkout.\n\n" <>
      Enum.join(Enum.reverse(failures), "\n\n")
  end

  # Capture the forensics *before* destroying anything: `docker inspect` and
  # `docker logs` on the dead container are the only place an OOM kill or a
  # Postgres PANIC shows up, and they vanish with the container.
  defp discard_worker(worker, port, reason) do
    {label, details} = Backend.current().diagnose(worker)
    _count = :ets.update_counter(@unhealthy_table, label, 1, {label, 0})

    # UTC so it lines up with the container's own log timestamps below.
    at = DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.to_iso8601()

    report =
      "[TestTenantDb] tenant database #{label} (port #{port}) failed its checkout probe at #{at}: " <>
        "#{reason}\n#{details}"

    # Straight to stderr, in the test environment we might not get log lines (capturing etc).
    IO.puts(:stderr, report <> "\n")

    # Same error message is also included here to ideally be attached to the failing test
    Backend.current().discard(worker)
    # We diagnosed it as unhealthy/unresponsive, kill it so poolboy can start a new one.
    Process.exit(worker, :kill)

    report
  end

  defp probe(port, attempts \\ @probe_attempts) do
    case Probe.check_port(port) do
      :ok ->
        :ok

      # we already ran another probe --> attempts already exhausted
      {:error, reason} when attempts <= 1 ->
        {:error, reason}

      {:error, reason} ->
        # Only counted when we retry, as the other proves show up in different unhealthy reports
        case probe(port, attempts - 1) do
          :ok ->
            :ets.update_counter(@probe_retry_table, reason, 1, {reason, 0})
            :ok

          error ->
            error
        end
    end
  end

  defp do_checkout_tenant(opts, mode) do
    with {:ok, port, checkin} <- acquire_tenant_db() do
      tenant = repo_run(mode, fn -> Generators.tenant_fixture(%{port: port, migrations_ran: 0}) end)

      run_migrations? = Keyword.get(opts, :run_migrations, false)

      {:ok, settings} = Database.from_tenant(tenant, "realtime_test", :stop)
      settings = %{settings | max_restarts: 0, ssl: false}
      {:ok, conn} = Database.connect_db(settings)

      try do
        reset_realtime_schema!(settings)
        Backend.current().storage_up!(tenant)

        RateCounterHelper.stop(tenant.external_id)

        ExUnit.Callbacks.on_exit(fn ->
          if connect_pid = Connect.whereis(tenant.external_id) do
            supervisor = {:via, PartitionSupervisor, {Realtime.Tenants.Connect.DynamicSupervisor, tenant.external_id}}

            DynamicSupervisor.terminate_child(supervisor, connect_pid)
          end

          try do
            PostgresCdcRls.handle_stop(tenant.external_id, 5_000)
          catch
            _, _ -> :ok
          end

          if mode == :unboxed do
            repo_run(:unboxed, fn -> Realtime.Api.delete_tenant_by_external_id(tenant.external_id) end)
          end

          checkin.()
        end)

        if run_migrations? do
          case run_migrations(tenant) do
            {:ok, count} ->
              :ok = Realtime.Tenants.create_messages_partitions(conn)

              {:ok, tenant} =
                repo_run(mode, fn ->
                  Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{migrations_ran: count})
                end)

              if mode == :sandbox, do: Realtime.Tenants.Cache.invalidate_tenant_cache(tenant.external_id)

              tenant

            error ->
              raise "Failed to run migrations: #{inspect(error)}"
          end
        else
          tenant
        end
      after
        GenServer.stop(conn)
      end
    else
      :error -> {:error, "failed to checkout a tenant database"}
    end
  end

  defp repo_run(:unboxed, fun), do: Ecto.Adapters.SQL.Sandbox.unboxed_run(Realtime.Repo, fun)
  defp repo_run(:sandbox, fun), do: fun.()

  # Drops every object `query` names. The names come from the catalogue, so they
  # are interpolated rather than bound: DROP takes an identifier, not a value.
  defp drop_all!(conn, query, drop_prefix, drop_suffix \\ "") do
    %{rows: rows} = Postgrex.query!(conn, query, [])

    Enum.each(rows, fn [name] ->
      Postgrex.query!(conn, drop_prefix <> ~s("#{name}") <> drop_suffix, [])
    end)
  end

  # Reset the tenant DB to a clean slate before each test. Backend-neutral:
  # runs against whatever DB was checked out (both docker and external servers
  # are supabase/postgres-compatible). Mirrors the supabase/postgres
  # migrations.
  #
  # It has to undo everything a test can leave behind, not just the realtime
  # schema: the docker backend hands out a fresh container each time, but an
  # external server is one database reused for the whole run, so leftovers
  # there change what later tests see. A fresh tenant database has no tables
  # in `public` and exactly one publication, `supabase_realtime`.
  #
  # Retried because a pooler can drop the connection mid-statement and OrioleDB can block on
  # OTablesMetaTranche. The schema is dropped before it is recreated, so a lost attempt leaves the
  # database with no realtime schema and every migration then fails with 3F000.
  defp reset_realtime_schema!(settings) do
    case WaitForIt.until(fn -> reset_realtime_schema(settings) end, timeout: 2_500, interval: 500) do
      {:ok, _} ->
        :ok

      {:timeout, _} ->
        # Unguarded, so the underlying error surfaces instead of a bare timeout.
        reset_realtime_schema_once!(settings)
    end
  end

  defp reset_realtime_schema(settings) do
    reset_realtime_schema_once!(settings)
    true
  rescue
    _ -> false
  catch
    # A pooler dropping the connection mid-statement exits rather than raising.
    :exit, _ -> false
  end

  defp reset_realtime_schema_once!(settings) do
    {:ok, admin_conn} =
      Postgrex.start_link(
        hostname: settings.hostname,
        port: settings.port,
        database: settings.database,
        username: "supabase_admin",
        password: settings.password
      )

    try do
      # Logical only: those are the ones Realtime creates. A cluster keeps a physical slot for
      # its own replication, and dropping that tears down the cluster's replication instead.
      %{rows: slots} =
        Postgrex.query!(
          admin_conn,
          "SELECT slot_name, active_pid FROM pg_replication_slots WHERE slot_type = 'logical'",
          []
        )

      Enum.each(slots, fn [slot_name, active_pid] ->
        if active_pid, do: Postgrex.query!(admin_conn, "SELECT pg_terminate_backend($1)", [active_pid])
        Postgrex.query!(admin_conn, "SELECT pg_drop_replication_slot($1)", [slot_name])
      end)

      drop_all!(
        admin_conn,
        "SELECT pubname FROM pg_publication WHERE pubname <> 'supabase_realtime'",
        "DROP PUBLICATION IF EXISTS "
      )

      drop_all!(
        admin_conn,
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
        "DROP TABLE IF EXISTS public.",
        " CASCADE"
      )

      Postgrex.query!(admin_conn, "DROP SCHEMA IF EXISTS realtime CASCADE", [])
      Postgrex.query!(admin_conn, "CREATE SCHEMA realtime", [])

      Postgrex.query!(admin_conn, "GRANT USAGE ON SCHEMA realtime TO postgres", [])
      Postgrex.query!(admin_conn, "GRANT ALL ON ALL TABLES IN SCHEMA realtime TO postgres, dashboard_user", [])
      Postgrex.query!(admin_conn, "GRANT ALL ON ALL SEQUENCES IN SCHEMA realtime TO postgres, dashboard_user", [])
      Postgrex.query!(admin_conn, "GRANT ALL ON ALL ROUTINES IN SCHEMA realtime TO postgres, dashboard_user", [])

      Postgrex.query!(
        admin_conn,
        "ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres, dashboard_user",
        []
      )

      Postgrex.query!(
        admin_conn,
        "ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres, dashboard_user",
        []
      )

      Postgrex.query!(
        admin_conn,
        "ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON ROUTINES TO postgres, dashboard_user",
        []
      )

      Postgrex.query!(admin_conn, "GRANT USAGE ON SCHEMA realtime TO anon, authenticated, service_role", [])
      Postgrex.query!(admin_conn, "GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin", [])

      # Confirm the schema landed rather than trusting that no statement above was lost.
      %{rows: [[true]]} =
        Postgrex.query!(admin_conn, "SELECT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'realtime')", [])

      :ok
    after
      if Process.alive?(admin_conn), do: GenServer.stop(admin_conn)
    end
  end

  # This exists so we avoid using an external process on Realtime.Tenants.Migrations
  defp run_migrations(tenant) do
    %{extensions: [%{settings: settings} | _]} = tenant
    {:ok, settings} = Database.from_settings(settings, "realtime_migrations", :stop)

    [
      hostname: settings.hostname,
      port: settings.port,
      database: settings.database,
      password: settings.password,
      username: settings.username,
      pool_size: settings.pool_size,
      backoff_type: settings.backoff_type,
      socket_options: settings.socket_options,
      parameters: [application_name: settings.application_name],
      after_connect: Realtime.Tenants.Migrations.after_connect(),
      ssl: settings.ssl
    ]
    |> Realtime.Repo.with_dynamic_repo(fn repo ->
      try do
        opts = [all: true, prefix: "realtime", dynamic_repo: repo, log: false]
        migrations = Realtime.Tenants.Migrations.migrations()
        Ecto.Migrator.run(Realtime.Repo, migrations, :up, opts)

        {:ok, length(migrations)}
      rescue
        error ->
          {:error, error}
      end
    end)
  end
end
