alias Supavisor.Tenants
alias Supavisor.Repo
import Ecto.Adapters.SQL, only: [query: 3]

db_conf = Application.get_env(:supavisor, Repo)

tenant_name = "dev_tenant"

if Tenants.get_tenant_by_external_id(tenant_name) do
  Tenants.delete_tenant_by_external_id(tenant_name)
end

if !Tenants.get_tenant_by_external_id("is_manager") do
  {:ok, _} =
    %{
      db_host: db_conf[:hostname],
      db_port: db_conf[:port],
      db_database: db_conf[:database],
      default_parameter_status: %{},
      external_id: "is_manager",
      require_user: false,
      auth_query: "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1;",
      users: [
        %{
          "db_user" => db_conf[:username],
          "db_password" => db_conf[:password],
          "pool_size" => 2,
          "mode_type" => "transaction",
          "is_manager" => true,
          "pool_checkout_timeout" => 1000
        }
      ]
    }
    |> Tenants.create_tenant()
end

[
  "proxy_tenant1",
  "syn_tenant",
  "syn_tenant_local_wins",
  "prom_tenant",
  "max_pool_tenant",
  "metrics_tenant"
]
|> Enum.each(fn tenant ->
  if !Tenants.get_tenant_by_external_id(tenant) do
    {:ok, _} =
      %{
        db_host: db_conf[:hostname],
        db_port: db_conf[:port],
        db_database: db_conf[:database],
        default_parameter_status: %{},
        external_id: tenant,
        require_user: true,
        users: [
          %{
            "db_user" => db_conf[:username],
            "db_password" => db_conf[:password],
            "pool_size" => 9,
            "max_clients" => 100,
            "mode_type" => "transaction"
          },
          %{
            "db_user" => "transaction",
            "db_password" => "postgres",
            "pool_size" => 3,
            "max_clients" => 100,
            "mode_type" => "transaction"
          },
          %{
            "db_user" => "session",
            "db_password" => "postgres",
            "pool_size" => 1,
            "mode_type" => "session",
            "max_clients" => 100,
            "pool_checkout_timeout" => 500
          },
          %{
            "db_user" => "max_clients",
            "db_password" => "postgres",
            "pool_size" => 2,
            "max_clients" => 0,
            "mode_type" => "transaction",
            "pool_checkout_timeout" => 500
          },
          %{
            "db_user" => "checkout_timeout_test",
            "db_password" => "postgres",
            "pool_size" => 2,
            "max_clients" => 100,
            "mode_type" => "transaction",
            "pool_checkout_timeout" => 500
          },
          %{
            "db_user" => "no_warm_pool_user",
            "db_password" => "postgres",
            "pool_size" => 5,
            "mode_type" => "session",
            "max_clients" => 100,
            "pool_checkout_timeout" => 500
          }
        ]
      }
      |> Tenants.create_tenant()
  end
end)

if !Tenants.get_tenant_by_external_id("proxy_pool_tenant") do
  {:ok, _} =
    %{
      db_host: db_conf[:hostname],
      db_port: db_conf[:port],
      db_database: db_conf[:database],
      default_parameter_status: %{},
      external_id: "proxy_pool_tenant",
      require_user: true,
      users: [
        %{
          "db_user" => db_conf[:username],
          "db_password" => db_conf[:password],
          "pool_size" => 2,
          "max_clients" => 2,
          "mode_type" => "transaction"
        }
      ]
    }
    |> Tenants.create_tenant()
end

if !Tenants.get_tenant_by_external_id("admission_tenant") do
  {:ok, _} =
    %{
      db_host: db_conf[:hostname],
      db_port: db_conf[:port],
      db_database: db_conf[:database],
      default_parameter_status: %{},
      external_id: "admission_tenant",
      require_user: true,
      users: [
        %{
          "db_user" => db_conf[:username],
          "db_password" => db_conf[:password],
          "pool_size" => 2,
          "max_clients" => 2,
          "mode_type" => "transaction"
        }
      ]
    }
    |> Tenants.create_tenant()
end

if !Tenants.get_tenant_by_external_id("dead_port_repro_tenant") do
  {:ok, _} =
    %{
      db_host: db_conf[:hostname],
      db_port: db_conf[:port],
      db_database: db_conf[:database],
      default_parameter_status: %{},
      external_id: "dead_port_repro_tenant",
      require_user: true,
      users: [
        %{
          "db_user" => db_conf[:username],
          "db_password" => db_conf[:password],
          "pool_size" => 1,
          "max_clients" => 100,
          "mode_type" => "transaction"
        }
      ]
    }
    |> Tenants.create_tenant()
end

# Create tenants with specific prepared statements feature flag settings for transaction mode
[
  {"proxy_tenant_ps_enabled", %{"named_prepared_statements" => true}},
  {"proxy_tenant_ps_disabled", %{"named_prepared_statements" => false}},
  {"proxy_tenant_pgoptions", %{}}
]
|> Enum.each(fn {tenant, feature_flags} ->
  if !Tenants.get_tenant_by_external_id(tenant) do
    {:ok, _} =
      %{
        db_host: db_conf[:hostname],
        db_port: db_conf[:port],
        db_database: db_conf[:database],
        default_parameter_status: %{},
        external_id: tenant,
        require_user: true,
        feature_flags: feature_flags,
        users: [
          %{
            "db_user" => db_conf[:username],
            "db_password" => db_conf[:password],
            "pool_size" => 9,
            "max_clients" => 100,
            "mode_type" => "transaction"
          }
        ]
      }
      |> Tenants.create_tenant()
  end
end)

if !Tenants.get_tenant_by_external_id("circuit_breaker_secrets") do
  {:ok, _} =
    %{
      db_host: db_conf[:hostname],
      db_port: db_conf[:port],
      db_database: db_conf[:database],
      default_parameter_status: %{},
      external_id: "circuit_breaker_secrets",
      require_user: false,
      auth_query: "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1;",
      users: [
        %{
          "db_user" => db_conf[:username],
          "db_password" => db_conf[:password],
          "pool_size" => 1,
          "mode_type" => "transaction",
          "is_manager" => true
        }
      ]
    }
    |> Tenants.create_tenant()
end

# Create tenants for other circuit breaker tests
["circuit_breaker_db_conn", "circuit_breaker_auth"]
|> Enum.each(fn tenant ->
  if !Tenants.get_tenant_by_external_id(tenant) do
    {:ok, _} =
      %{
        db_host: db_conf[:hostname],
        db_port: db_conf[:port],
        db_database: db_conf[:database],
        default_parameter_status: %{},
        external_id: tenant,
        require_user: true,
        users: [
          %{
            "db_user" => db_conf[:username],
            "db_password" => db_conf[:password],
            "pool_size" => 1,
            "mode_type" => "transaction"
          }
        ]
      }
      |> Tenants.create_tenant()
  end
end)

# Create cluster test tenants for integration tests
for i <- 1..10 do
  tenant_id = "cluster_pool_tenant_#{i}"

  if !Tenants.get_tenant_by_external_id(tenant_id) do
    {:ok, _} =
      %{
        db_host: db_conf[:hostname],
        db_port: db_conf[:port],
        db_database: db_conf[:database],
        default_parameter_status: %{"server_version" => "14.6 (Debian 14.6-1.pgdg110+1)"},
        external_id: tenant_id,
        require_user: true,
        users: [
          %{
            "db_user" => db_conf[:username],
            "db_password" => db_conf[:password],
            "pool_size" => 5,
            "mode_type" => "transaction"
          }
        ]
      }
      |> Tenants.create_tenant()
  end
end

{:ok, _} =
  Repo.transaction(fn ->
    [
      "drop user if exists dev_postgres;",
      "create user dev_postgres with password 'postgres';",
      "drop user if exists dev_postgres_password_test;",
      "create user dev_postgres_password_test with password 'postgres';",
      "drop user if exists bypass_user;",
      "create user bypass_user with password 'postgres';",
      "drop user if exists transaction;",
      "create user transaction with password 'postgres';",
      "drop user if exists session;",
      "create user session with password 'postgres';",
      "drop user if exists max_clients;",
      "create user max_clients with password 'postgres';",
      "drop user if exists checkout_timeout_test;",
      "create user checkout_timeout_test with password 'postgres';",
      "drop user if exists no_warm_pool_user;",
      "create user no_warm_pool_user with password 'postgres';",
      "drop table if exists \"public\".\"test\";",
      "create sequence if not exists test_id_seq;",
      "create table \"public\".\"test\" (
        \"id\" int4 not null default nextval('test_id_seq'::regclass),
        \"details\" text,
        primary key (\"id\")
    );",
      "grant all on table public.test to anon;",
      "grant all on table public.test to postgres;",
      "grant all on table public.test to authenticated;"
    ]
    |> Enum.each(&query(Repo, &1, []))
  end)
