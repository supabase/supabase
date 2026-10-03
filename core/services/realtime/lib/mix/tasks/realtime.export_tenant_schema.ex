defmodule Mix.Tasks.Realtime.ExportTenantSchema do
  @shortdoc "Regenerate priv/repo/tenant_schema"

  @moduledoc """
  Writes the declarative schema artifact at `priv/repo/tenant_schema/`, used by
  `RealtimeWeb.Dashboard.TenantMigrations` to detect drifted DB state. The
  artifact is identical on every supported Postgres major version, so a single
  directory serves them all.

  The task provisions a throwaway database on the target cluster, runs the tenant
  migrations into it with `Ecto.Migrator`, exports the schema and drops the
  database again. The artifact therefore always matches
  `Realtime.Tenants.Migrations.migrations/0` with no manual database set-up:

      mise task run db-start
      mix realtime.export_tenant_schema

  Pass `--pgdelta-path` to force a custom binary:

      mix realtime.export_tenant_schema --pgdelta-path /path/to/pgdelta

  The target cluster is read from `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` /
  `DB_PASSWORD` env vars and the connecting role needs `CREATEDB`.

  Requires `pgdelta` on `$PATH` or pass `--pgdelta-path` to force a custom path.
  """
  use Mix.Task

  alias Realtime.Repo
  alias Realtime.Tenants.Migrations

  @requirements ["app.config"]

  @schema_owner "supabase_admin"
  @realtime_admin "supabase_realtime_admin"
  @profile_path "priv/repo/pgdelta_profile.json"
  @migration_timeout 120_000

  @impl Mix.Task
  def run(args) do
    {opts, _, _} = OptionParser.parse(args, strict: [pgdelta_path: :string])

    {:ok, _} = Application.ensure_all_started(:ecto_sql)

    pgdelta = pgdelta_bin!(opts[:pgdelta_path])
    conn_opts = conn_opts_from_env()
    scratch = "realtime_golden_#{System.system_time(:second)}"
    out_dir = Path.expand("priv/repo/tenant_schema", File.cwd!())

    Mix.shell().info("[export_tenant_schema] cluster: #{redact(build_url(conn_opts))}")
    Mix.shell().info("[export_tenant_schema] pgdelta: #{pgdelta}")
    Mix.shell().info("[export_tenant_schema] scratch database: #{scratch}")

    create_database!(conn_opts, scratch)

    try do
      scratch_opts = Keyword.put(conn_opts, :database, scratch)
      migrate!(scratch_opts)
      export!(pgdelta, build_url(scratch_opts), out_dir)
    after
      drop_database!(conn_opts, scratch)
    end

    Mix.shell().info("[export_tenant_schema] wrote #{out_dir}")
  end

  defp create_database!(conn_opts, database) do
    admin_query!(conn_opts, ~s(CREATE DATABASE "#{database}"))
  end

  defp drop_database!(conn_opts, database) do
    admin_query!(conn_opts, ~s|DROP DATABASE IF EXISTS "#{database}" WITH (FORCE)|)
  end

  defp admin_query!(conn_opts, query) do
    with {:ok, conn} <- Postgrex.start_link(Keyword.put(conn_opts, :backoff_type, :stop)),
         {:ok, _} <- Postgrex.query(conn, query, []) do
      GenServer.stop(conn)
      :ok
    else
      error -> Mix.raise("#{query} failed: #{inspect(error)}")
    end
  end

  defp migrate!(scratch_opts) do
    config = Keyword.merge(scratch_opts, pool_size: 2, backoff_type: :stop)

    Repo.with_dynamic_repo(config, fn repo ->
      Repo.query!(~s(CREATE SCHEMA realtime AUTHORIZATION "#{@schema_owner}"), [], dynamic_repo: repo)

      Repo.query!(~s(GRANT ALL ON SCHEMA realtime TO "#{@realtime_admin}"), [], dynamic_repo: repo)

      applied =
        Ecto.Migrator.run(Repo, Migrations.migrations(), :up,
          all: true,
          prefix: "realtime",
          dynamic_repo: repo,
          timeout: @migration_timeout
        )

      Mix.shell().info("[export_tenant_schema] applied #{length(applied)} migration(s)")
    end)
  end

  defp export!(pgdelta, url, out_dir) do
    profile = Path.expand(@profile_path, File.cwd!())

    args = [
      "schema",
      "export",
      "--source",
      url,
      "--out-dir",
      out_dir,
      "--profile",
      profile,
      "--default-owner",
      "none",
      "--prune-unmanaged"
    ]

    case System.cmd(pgdelta, args, stderr_to_stdout: true) do
      {output, 0} -> Mix.shell().info(output)
      {output, code} -> Mix.raise("pgdelta schema export exited #{code}:\n#{output}")
    end
  end

  defp pgdelta_bin!(nil), do: System.find_executable("pgdelta") || Mix.raise("pgdelta not found on $PATH")

  defp pgdelta_bin!(path) do
    path = Path.expand(path)
    System.find_executable(path) || Mix.raise("pgdelta not found or not executable at #{path}")
  end

  defp conn_opts_from_env do
    [
      hostname: System.get_env("DB_HOST", "127.0.0.1"),
      port: System.get_env("DB_PORT", "5433") |> String.to_integer(),
      database: System.get_env("DB_NAME", "postgres"),
      username: System.get_env("DB_USER", "supabase_admin"),
      password: System.get_env("DB_PASSWORD", "postgres")
    ]
  end

  defp build_url(conn_opts) do
    "postgresql://#{URI.encode_www_form(conn_opts[:username])}:#{URI.encode_www_form(conn_opts[:password])}@" <>
      "#{conn_opts[:hostname]}:#{conn_opts[:port]}/#{conn_opts[:database]}?sslmode=disable"
  end

  defp redact(url) do
    case URI.parse(url) do
      %URI{userinfo: nil} = u ->
        URI.to_string(u)

      %URI{userinfo: userinfo} = u ->
        user = userinfo |> String.split(":", parts: 2) |> hd()
        URI.to_string(%{u | userinfo: "#{user}:***"})
    end
  end
end
