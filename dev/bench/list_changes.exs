# Measures the Postgres Changes poll: realtime.list_changes decoding a batch from the
# replication slot and running it through apply_rls.
#
# Provisions its own throwaway database and migrates it, so it measures whatever the checked-out
# revision defines. Run it on two revisions against the same server to compare them.
#
#     mise task run db-start
#     mix run dev/bench/list_changes.exs
#
# Reads DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD, defaulting to the tenant database
# that db-start brings up. The connecting role needs CREATEDB.

alias Realtime.Repo
alias Realtime.Tenants.Migrations

{:ok, _} = Application.ensure_all_started(:ecto_sql)

# Migration DDL is logged at :info and buries the results.
Logger.configure(level: :warning)

conn_opts = [
  hostname: System.get_env("DB_HOST", "127.0.0.1"),
  port: System.get_env("DB_PORT", "5433") |> String.to_integer(),
  database: System.get_env("DB_NAME", "postgres"),
  username: System.get_env("DB_USER", "supabase_admin"),
  password: System.get_env("DB_PASSWORD", "postgres")
]

scratch = "realtime_bench_#{System.system_time(:second)}"
publication = "bench_publication"
slot = "bench_slot"

admin! = fn query ->
  {:ok, conn} = Postgrex.start_link(Keyword.put(conn_opts, :backoff_type, :stop))
  {:ok, _} = Postgrex.query(conn, query, [])
  GenServer.stop(conn)
end

admin!.(~s(CREATE DATABASE "#{scratch}"))

try do
  scratch_opts = Keyword.put(conn_opts, :database, scratch)

  Repo.with_dynamic_repo(Keyword.merge(scratch_opts, pool_size: 2, backoff_type: :stop), fn repo ->
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
  {:ok, writer} = Postgrex.start_link(Keyword.put(scratch_opts, :backoff_type, :stop))

  # A policy that reads the row is what makes apply_rls resolve against the table rather than
  # authorizing straight from the WAL record, which is the expensive path worth measuring.
  Postgrex.query!(conn, "CREATE TABLE public.bench (id serial primary key, details text)", [])
  Postgrex.query!(conn, "GRANT SELECT ON public.bench TO anon", [])
  Postgrex.query!(conn, "ALTER TABLE public.bench ENABLE ROW LEVEL SECURITY", [])

  Postgrex.query!(
    conn,
    """
    CREATE POLICY bench_read ON public.bench TO anon
    USING (details = current_setting('request.jwt.claims', true)::jsonb ->> 'audience')
    """,
    []
  )

  Postgrex.query!(conn, "CREATE PUBLICATION #{publication} FOR TABLE public.bench", [])

  Postgrex.query!(
    conn,
    """
    INSERT INTO realtime.subscription (subscription_id, entity, filters, claims)
    VALUES (gen_random_uuid(), 'public.bench'::regclass, '{}',
            '{"role":"anon","audience":"allowed","sub":"00000000-0000-0000-0000-000000000000"}'::jsonb)
    """,
    []
  )

  fill = fn count ->
    Postgrex.query!(
      writer,
      "INSERT INTO public.bench (details) SELECT 'allowed' FROM generate_series(1, $1)",
      [count]
    )
  end

  # Empties a slot with the plain decoder rather than the function under test: the settled variant
  # defers by design, so it cannot be relied on to leave the slot empty for the next iteration.
  drain_fully = fn name ->
    Stream.repeatedly(fn ->
      %Postgrex.Result{num_rows: n} =
        Postgrex.query!(
          conn,
          "SELECT 1 FROM pg_logical_slot_get_changes($1::name, null, null, 'format-version', '2')",
          [name]
        )

      n
    end)
    |> Enum.find(&(&1 == 0))
  end

  # One benchee run per function, each against a slot created just beforehand. Running both in a
  # single benchee run makes the idle one accumulate WAL for the whole of the other's run, so it
  # then decodes a backlog and reports several times its real cost.
  measure = fn function ->
    name = "#{slot}_#{:erlang.phash2(function)}"

    Postgrex.query!(
      conn,
      "SELECT pg_create_logical_replication_slot($1::name, 'wal2json', temporary => true)",
      [name]
    )

    poll = fn ->
      {:ok, %Postgrex.Result{rows: rows}} =
        Postgrex.query(
          conn,
          """
          SELECT wal->>'type', subscription_ids, slot_changes_count
          FROM #{function}($1, $2, $3, $4)
          """,
          [publication, name, 100_000, 1_048_576]
        )

      rows
    end

    Benchee.run(
      %{function => fn _ -> poll.() end},
      inputs: %{
        "1 change" => 1,
        "100 changes" => 100,
        "1000 changes" => 1000,
        "10000 changes" => 10_000
      },
      # Every measured call sees exactly `count` changes: the slot is emptied, the batch written,
      # then the writer is given a moment to leave the proc array so the settled variant is not
      # measured deferring. Hook time is excluded from the measurement.
      before_each: fn count ->
        drain_fully.(name)
        fill.(count)
        Process.sleep(5)
        count
      end,
      warmup: 2,
      time: 10,
      print: %{configuration: false}
    )

    Postgrex.query!(conn, "SELECT pg_drop_replication_slot($1::name)", [name])
  end

  Enum.each(["realtime.list_changes", "realtime.list_changes_sync"], measure)

  GenServer.stop(conn)
  GenServer.stop(writer)
after
  admin!.(~s|DROP DATABASE IF EXISTS "#{scratch}" WITH (FORCE)|)
end
