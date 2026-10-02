# Replays every tenant migration into a database, instead of loading
# priv/repo/tenant_db_dump_<major>.sql into it.
#
#     DB_PORT=5534 mix run --no-start dev/scripts/migrate_tenant_db.exs

alias Realtime.Repo
alias Realtime.Tenants.Migrations

{:ok, _} = Application.ensure_all_started(:ecto_sql)
{:ok, _} = Application.ensure_all_started(:postgrex)

config = [
  hostname: System.get_env("DB_HOST", "127.0.0.1"),
  port: System.get_env("DB_PORT", "5432") |> String.to_integer(),
  database: System.get_env("DB_NAME", "postgres"),
  username: System.get_env("DB_USER", "supabase_admin"),
  password: System.get_env("DB_PASSWORD", "postgres"),
  ssl: false
]

migrations = Migrations.migrations()

IO.puts("# replaying #{length(migrations)} tenant migrations into #{config[:hostname]}:#{config[:port]}")

Repo.with_dynamic_repo(config, fn repo ->
  ran = Ecto.Migrator.run(Repo, migrations, :up, all: true, prefix: "realtime", dynamic_repo: repo, log: false)
  IO.puts("# applied #{length(ran)} migrations")
end)
