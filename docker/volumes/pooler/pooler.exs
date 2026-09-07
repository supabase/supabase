{:ok, _} = Application.ensure_all_started(:supavisor)

# Load the database registry to create one Supavisor tenant per database.
registry_path = System.get_env("DATABASE_REGISTRY_PATH", "/etc/supabase/databases.json")

databases =
  case File.read(registry_path) do
    {:ok, raw} ->
      raw
      |> Jason.decode!()
      |> Map.get("databases", [])

    {:error, reason} ->
      IO.puts("WARNING: could not read registry at #{registry_path}: #{inspect(reason)}")
      []
  end

# Fallback: if registry is empty or missing, synthesise a single entry from env vars.
databases =
  if databases == [] do
    [
      %{
        "ref" => System.get_env("POOLER_TENANT_ID"),
        "host" => System.get_env("POSTGRES_HOST", "db"),
        "port" => System.get_env("POSTGRES_PORT", "5432"),
        "database" => System.get_env("POSTGRES_DB", "postgres"),
        "password_env" => "POSTGRES_PASSWORD"
      }
    ]
  else
    databases
  end

# Resolve the Postgres version once (from the first reachable DB or fallback).
pg_version =
  case Supavisor.Repo.query("select version()") do
    {:ok, %{rows: [[ver]]}} ->
      case Supavisor.Helpers.parse_pg_version(ver) do
        {:ok, v} -> v
        _ -> "15.0"
      end

    _ ->
      "15.0"
  end

pool_size = System.get_env("POOLER_DEFAULT_POOL_SIZE", "20")
max_clients = System.get_env("POOLER_MAX_CLIENT_CONN", "100")
pool_mode = System.get_env("POOLER_POOL_MODE", "transaction")

Enum.each(databases, fn db ->
  external_id = db["ref"]
  db_host = db["host"] || System.get_env("POSTGRES_HOST", "db")
  db_port = db["port"] || System.get_env("POSTGRES_PORT", "5432")
  db_database = db["database"] || System.get_env("POSTGRES_DB", "postgres")
  password_env = db["password_env"] || "POSTGRES_PASSWORD"
  db_password = System.get_env(password_env, System.get_env("POSTGRES_PASSWORD", "postgres"))

  tenant_params = %{
    "external_id" => external_id,
    "db_host" => db_host,
    "db_port" => db_port,
    "db_database" => db_database,
    "require_user" => false,
    "auth_query" => "SELECT * FROM pgbouncer.get_auth($1)",
    "default_max_clients" => max_clients,
    "default_pool_size" => pool_size,
    "default_parameter_status" => %{"server_version" => pg_version},
    "users" => [
      %{
        "db_user" => "pgbouncer",
        "db_password" => db_password,
        "mode_type" => pool_mode,
        "pool_size" => pool_size,
        "is_manager" => true
      }
    ]
  }

  if !Supavisor.Tenants.get_tenant_by_external_id(external_id) do
    case Supavisor.Tenants.create_tenant(tenant_params) do
      {:ok, _} ->
        IO.puts("Supavisor tenant created: #{external_id} -> #{db_host}:#{db_port}/#{db_database}")

      {:error, reason} ->
        IO.puts("ERROR: failed to create tenant #{external_id}: #{inspect(reason)}")
    end
  else
    IO.puts("Supavisor tenant already exists: #{external_id}")
  end
end)