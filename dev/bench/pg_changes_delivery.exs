# Asserts Postgres Changes loses nothing: writes rows concurrently, drains the slot the way the
# replication poller does, and reports which primary keys never reached the subscriber.
#
# The companion to list_changes.exs, which measures how fast a poll is. This one measures whether
# a poll is correct. Exits non-zero when anything is missing, so it can gate a comparison.
#
#     mise task run db-start
#     mix run dev/bench/pg_changes_delivery.exs
#
# Only meaningful where a COMMIT waits for a standby: that is the window in which a change can be
# decoded before its row is visible. A single node without `synchronous_standby_names` has no
# window and will report no loss whatever the code does, so point this at Multigres or set that
# GUC before reading anything into a clean run.
#
# Reads DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD, plus WRITES and WRITERS.
# The connecting role needs CREATEDB.

alias Extensions.PostgresCdcRls.Replications
alias Realtime.Repo
alias Realtime.Tenants.Migrations

{:ok, _} = Application.ensure_all_started(:ecto_sql)

# Migration DDL is logged at :info and buries the result.
Logger.configure(level: :warning)

conn_opts = [
  hostname: System.get_env("DB_HOST", "127.0.0.1"),
  port: System.get_env("DB_PORT", "5433") |> String.to_integer(),
  database: System.get_env("DB_NAME", "postgres"),
  username: System.get_env("DB_USER", "supabase_admin"),
  password: System.get_env("DB_PASSWORD", "postgres")
]

writes = System.get_env("WRITES", "500") |> String.to_integer()
writers = System.get_env("WRITERS", "4") |> String.to_integer()

scratch = "realtime_delivery_#{System.system_time(:second)}"
publication = "delivery_publication"
slot = "delivery_slot"

admin = fn query ->
  {:ok, conn} = Postgrex.start_link(Keyword.put(conn_opts, :backoff_type, :stop))
  result = Postgrex.query(conn, query, [])
  GenServer.stop(conn)

  case result do
    {:ok, _} -> :ok
    error -> error
  end
end

admin! = fn query -> :ok = admin.(query) end

# Multigres does not implement CREATE DATABASE, so fall back to working in the database given.
# That one gets its realtime schema recreated, which is why this wants a scratch server.
own_database? =
  case admin.(~s(CREATE DATABASE "#{scratch}")) do
    :ok ->
      true

    {:error, _} ->
      IO.puts("CREATE DATABASE unsupported, using #{conn_opts[:database]} and resetting its realtime schema")
      false
  end

exit_code =
  try do
    scratch_opts = if own_database?, do: Keyword.put(conn_opts, :database, scratch), else: conn_opts

    if not own_database? do
      # Sharing a database with earlier runs, so clear the fixture as well as the schema.
      admin!.(~s(DROP PUBLICATION IF EXISTS #{publication}))
      admin!.(~s(DROP TABLE IF EXISTS public.delivery CASCADE))
      admin!.(~s(DROP SCHEMA IF EXISTS realtime CASCADE))
    end

    # Multigres rejects the runtime-built EXECUTE some migrations use unless the connection opts
    # in; Migrations.after_connect is the same hatch the app uses and is a no-op on plain Postgres.
    migrate_opts =
      Keyword.merge(scratch_opts,
        pool_size: 2,
        backoff_type: :stop,
        after_connect: Migrations.after_connect()
      )

    Repo.with_dynamic_repo(migrate_opts, fn repo ->
      Repo.query!(~s(CREATE SCHEMA realtime AUTHORIZATION "supabase_admin"), [], dynamic_repo: repo)
      Repo.query!(~s(GRANT ALL ON SCHEMA realtime TO "supabase_realtime_admin"), [], dynamic_repo: repo)

      Ecto.Migrator.run(Repo, Migrations.migrations(), :up,
        all: true,
        prefix: "realtime",
        dynamic_repo: repo,
        timeout: 120_000
      )
    end)

    {:ok, conn} = Postgrex.start_link(Keyword.put(scratch_opts, :backoff_type, :stop))

    # A policy that reads the row is what exposes the bug: without one, apply_rls authorizes
    # straight from the WAL record and never looks the row up, so nothing is ever lost.
    Postgrex.query!(conn, "CREATE TABLE public.delivery (id serial primary key, details text)", [])
    Postgrex.query!(conn, "GRANT SELECT ON public.delivery TO anon", [])
    Postgrex.query!(conn, "ALTER TABLE public.delivery ENABLE ROW LEVEL SECURITY", [])

    Postgrex.query!(
      conn,
      """
      CREATE POLICY delivery_read ON public.delivery TO anon
      USING (details = current_setting('request.jwt.claims', true)::jsonb ->> 'audience')
      """,
      []
    )

    Postgrex.query!(conn, "CREATE PUBLICATION #{publication} FOR TABLE public.delivery", [])

    Postgrex.query!(
      conn,
      """
      INSERT INTO realtime.subscription (subscription_id, entity, filters, claims)
      VALUES (gen_random_uuid(), 'public.delivery'::regclass, '{}',
              '{"role":"anon","audience":"allowed","sub":"00000000-0000-0000-0000-000000000000"}'::jsonb)
      """,
      []
    )

    {:ok, _} = Replications.prepare_replication(conn, slot)

    %{rows: [[sync_standby]]} = Postgrex.query!(conn, "SHOW synchronous_standby_names", [])

    IO.puts("synchronous_standby_names: #{inspect(sync_standby)}")
    IO.puts("writing #{writes} rows across #{writers} writers")

    parent = self()
    per_writer = div(writes, writers)

    for _ <- 1..writers do
      spawn(fn ->
        {:ok, writer} = Postgrex.start_link(Keyword.put(scratch_opts, :backoff_type, :stop))

        for _ <- 1..per_writer do
          Postgrex.query!(writer, "INSERT INTO public.delivery (details) VALUES ('allowed')", [])
        end

        GenServer.stop(writer)
        send(parent, :writer_done)
      end)
    end

    # SETTLED picks the SQL function directly: the poller reads settled where a commit can wait
    # for a synchronous standby.
    function =
      if System.get_env("SETTLED", "true") == "true",
        do: "realtime.list_changes_sync",
        else: "realtime.list_changes"

    IO.puts("using #{function}")

    poll = fn ->
      {:ok, %Postgrex.Result{rows: rows}} =
        Postgrex.query(
          conn,
          """
          SELECT wal->>'type', wal->>'schema', wal->>'table', COALESCE(wal->>'record', '{}'),
                 subscription_ids
          FROM #{function}($1, $2, $3, $4)
          """,
          [publication, slot, 10_000, 1_048_576]
        )

      for ["INSERT", "public", "delivery", record, ids] <- rows,
          ids != [],
          do: Jason.decode!(record)["id"]
    end

    # Stop only after several consecutive empty polls: one proves nothing while the writers' WAL
    # is still being decoded.
    drain = fn drain, seen, writers_left, empty ->
      writers_left =
        receive do
          :writer_done -> writers_left - 1
        after
          0 -> writers_left
        end

      delivered = poll.()
      seen = MapSet.union(seen, MapSet.new(delivered))

      cond do
        writers_left == 0 and empty >= 5 -> seen
        delivered == [] -> drain.(drain, seen, writers_left, empty + 1)
        true -> drain.(drain, seen, writers_left, 0)
      end
    end

    seen = drain.(drain, MapSet.new(), writers, 0)

    %{rows: [[committed]]} = Postgrex.query!(conn, "SELECT count(*)::int FROM public.delivery", [])
    missing = Enum.reject(1..committed, &MapSet.member?(seen, &1))

    IO.puts("committed:  #{committed}")
    IO.puts("delivered:  #{MapSet.size(seen)}")
    IO.puts("lost:       #{length(missing)}")

    GenServer.stop(conn)

    if missing == [] do
      IO.puts("\nOK, every committed row reached the subscriber.")
      0
    else
      IO.puts(
        "\nLOST #{length(missing)} of #{committed} at positions #{inspect(Enum.take(missing, 25), charlists: :as_lists)}"
      )

      1
    end
  after
    if own_database?, do: admin!.(~s|DROP DATABASE IF EXISTS "#{scratch}" WITH (FORCE)|)
  end

System.halt(exit_code)
