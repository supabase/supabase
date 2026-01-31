{:ok, _} = Application.ensure_all_started(:supavisor)

{:ok, version} =
  case Supavisor.Repo.query!("select version()") do
    %{rows: [[ver]]} -> Supavisor.Helpers.parse_pg_version(ver)
    _ -> nil
  end

# Default tenant params
default_params = %{
  "external_id" => System.get_env("POOLER_TENANT_ID"),
  "db_host" => "db",
  "db_port" => System.get_env("POSTGRES_PORT"),
  "db_database" => System.get_env("POSTGRES_DB"),
  "require_user" => false,
  "auth_query" => "SELECT * FROM pgbouncer.get_auth($1)",
  "default_max_clients" => System.get_env("POOLER_MAX_CLIENT_CONN"),
  "default_pool_size" => System.get_env("POOLER_DEFAULT_POOL_SIZE"),
  "default_parameter_status" => %{"server_version" => version},
  "users" => [%{
    "db_user" => "pgbouncer",
    "db_password" => System.get_env("POSTGRES_PASSWORD"),
    "mode_type" => System.get_env("POOLER_POOL_MODE"),
    "pool_size" => System.get_env("POOLER_DEFAULT_POOL_SIZE"),
    "is_manager" => true
  }]
}

# Create default tenant if not exists
if !Supavisor.Tenants.get_tenant_by_external_id(default_params["external_id"]) do
  {:ok, _} = Supavisor.Tenants.create_tenant(default_params)
end

# Load all projects from multi-tenant table and create tenants for each
try do
  case Supavisor.Repo.query!("SELECT ref, db_name, pooler_tenant_id FROM _supabase._multi_tenant.projects WHERE ref != 'default'") do
    %{rows: rows} when is_list(rows) ->
      Enum.each(rows, fn [ref, db_name, pooler_tenant_id] ->
        tenant_id = pooler_tenant_id || ref
        if !Supavisor.Tenants.get_tenant_by_external_id(tenant_id) do
          project_params = %{
            "external_id" => tenant_id,
            "db_host" => "db",
            "db_port" => System.get_env("POSTGRES_PORT"),
            "db_database" => db_name || System.get_env("POSTGRES_DB"),
            "require_user" => false,
            "auth_query" => "SELECT * FROM pgbouncer.get_auth($1)",
            "default_max_clients" => System.get_env("POOLER_MAX_CLIENT_CONN"),
            "default_pool_size" => System.get_env("POOLER_DEFAULT_POOL_SIZE"),
            "default_parameter_status" => %{"server_version" => version},
            "users" => [%{
              "db_user" => "pgbouncer",
              "db_password" => System.get_env("POSTGRES_PASSWORD"),
              "mode_type" => System.get_env("POOLER_POOL_MODE"),
              "pool_size" => System.get_env("POOLER_DEFAULT_POOL_SIZE"),
              "is_manager" => true
            }]
          }
          {:ok, _} = Supavisor.Tenants.create_tenant(project_params)
          IO.puts("Created pooler tenant for project: #{ref}")
        end
      end)
    _ ->
      IO.puts("No additional projects found in multi-tenant table")
  end
rescue
  e ->
    IO.puts("Multi-tenant table not found or error loading projects: #{inspect(e)}")
end
