alias Realtime.Api.Tenant
alias Realtime.Database
alias Realtime.Env
alias Realtime.Repo
alias Realtime.Tenants

tenant_name = Env.get_binary("TENANT", "realtime-dev")
default_db_host = "127.0.0.1"
publication = "supabase_realtime"

attrs = %{
  "name" => tenant_name,
  "external_id" => tenant_name,
  "jwt_secret" => Env.get_binary("API_JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long"),
  "jwt_jwks" => System.get_env("API_JWT_JWKS") |> then(fn v -> if v, do: Jason.decode!(v) end),
  "extensions" => [
    %{
      "type" => "postgres_cdc_rls",
      "settings" => %{
        "db_name" => Env.get_binary("TENANT_DB_NAME", "postgres"),
        "db_host" => Env.get_binary("DB_HOST", default_db_host),
        "db_user" => Env.get_binary("DB_USER", "supabase_admin"),
        "db_password" => Env.get_binary("DB_PASSWORD", "postgres"),
        "db_port" => Env.get_binary("TENANT_DB_PORT", fn -> Env.get_binary("DB_PORT", "5433") end),
        "region" => "us-east-1",
        "poll_interval_ms" => 100,
        "poll_max_record_bytes" => 1_048_576,
        "ssl_enforced" => false
      }
    }
  ]
}

# Keep an existing tenant, refreshing its settings so a database on a new port is picked up.
tenant =
  case Repo.get_by(Tenant, external_id: tenant_name) do
    nil -> %Tenant{} |> Tenant.changeset(attrs) |> Repo.insert!()
    tenant -> tenant |> Repo.preload(:extensions) |> Tenant.changeset(attrs) |> Repo.update!()
  end

{:ok, settings} = Database.from_tenant(tenant, "realtime_seeds", :stop)
{:ok, admin_conn} = Database.connect_db(%{settings | username: "supabase_admin", max_restarts: 0, ssl: false})

# Only add what is missing: re-creating the publication would un-publish the tables someone added
# to it, and re-creating the table would discard its rows.
Postgrex.transaction(admin_conn, fn db_conn ->
  [
    "grant usage on schema realtime to postgres, anon, authenticated, service_role",
    "grant all on schema realtime to supabase_realtime_admin",
    "create table if not exists public.test_tenant ( id SERIAL PRIMARY KEY, details text )",
    "grant all on table public.test_tenant to anon, authenticated, supabase_realtime_admin"
  ]
  |> Enum.each(&Postgrex.query!(db_conn, &1))

  %{rows: [[has_publication]]} =
    Postgrex.query!(db_conn, "SELECT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = $1)", [publication])

  case has_publication do
    false ->
      Postgrex.query!(db_conn, "create publication #{publication} for table public.test_tenant", [])

    true ->
      %{rows: [[published]]} =
        Postgrex.query!(
          db_conn,
          "SELECT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = $1 AND schemaname = 'public' AND tablename = 'test_tenant')",
          [publication]
        )

      if !published do
        Postgrex.query!(db_conn, "alter publication #{publication} add table public.test_tenant", [])
      end
  end
end)

case Tenants.Migrations.run_migrations(tenant) do
  :ok -> :ok
  :noop -> :ok
  _ -> raise "Running Migrations failed"
end

repo = Repo.config()

IO.puts("""

  tenant             #{tenant_name}
  realtime database  #{repo[:hostname]}:#{repo[:port]}/#{repo[:database]}
  tenant database    #{settings.hostname}:#{settings.port}/#{settings.database}
""")
