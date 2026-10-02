defmodule Integrations do
  import ExUnit.Assertions
  import Generators

  alias Realtime.Api.Tenant
  alias Realtime.Database
  alias Realtime.Tenants.Authorization
  alias Realtime.Tenants.Connect

  def checkout_tenant_and_connect(_context \\ %{}) do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    {:ok, db_conn} = Connect.lookup_or_start_connection(tenant.external_id)
    assert Connect.ready?(tenant.external_id)
    %{db_conn: db_conn, tenant: tenant}
  end

  def rls_context(%{tenant: tenant} = context) do
    {:ok, db_conn} = Database.connect(tenant, "realtime_test", :stop)
    clean_table(db_conn, "realtime", "messages")
    topic = Map.get(context, :topic, random_string())
    policies = Map.get(context, :policies, nil)
    role = Map.get(context, :role, nil)
    sub = Map.get(context, :sub, nil)

    if policies, do: create_rls_policies(db_conn, policies, %{topic: topic, role: role, sub: sub})

    authorization_context =
      Authorization.build_authorization_params(%{
        tenant_id: tenant.external_id,
        topic: topic,
        headers: [{"header-1", "value-1"}],
        claims: %{sub: sub, role: role},
        role: role,
        sub: sub
      })

    ExUnit.Callbacks.on_exit(fn ->
      if Process.alive?(db_conn) do
        try do
          GenServer.stop(db_conn, :normal, 1_000)
        catch
          :exit, _ -> :ok
        end
      end
    end)

    %{topic: topic, role: role, sub: sub, db_conn: db_conn, authorization_context: authorization_context}
  end

  def change_tenant_configuration(%Tenant{external_id: external_id}, limit, value) do
    tenant =
      external_id
      |> Realtime.Tenants.get_tenant_by_external_id()
      |> Tenant.changeset(%{limit => value})
      |> Realtime.Repo.update!()

    Realtime.Tenants.Cache.update_cache(tenant)
  end

  def checkout_tenant_connect_and_setup_postgres_changes(_context \\ %{}) do
    %{db_conn: db_conn} = result = checkout_tenant_and_connect()
    setup_postgres_changes(db_conn)
    result
  end

  def setup_postgres_changes(conn) do
    publication = "supabase_realtime_test"

    Postgrex.transaction(conn, fn db_conn ->
      queries = [
        "DROP TABLE IF EXISTS public.test",
        "DROP PUBLICATION IF EXISTS #{publication}",
        "create sequence if not exists test_id_seq;",
        """
        create table "public"."test" (
        "id" int4 not null default nextval('test_id_seq'::regclass),
        "details" text,
        "binary_data" bytea,
        primary key ("id"));
        """,
        "grant all on table public.test to anon;",
        "grant all on table public.test to supabase_realtime_admin;",
        "grant all on table public.test to authenticated;",
        "create publication #{publication} for all tables",
        """
        DO $$
        DECLARE
        r RECORD;
        BEGIN
        FOR r IN
          SELECT slot_name, active_pid
          FROM pg_replication_slots
          WHERE slot_name LIKE 'supabase_realtime%'
        LOOP
          IF r.active_pid IS NOT NULL THEN
            BEGIN
              SELECT pg_terminate_backend(r.active_pid);
              PERFORM pg_sleep(0.5);
            EXCEPTION WHEN OTHERS THEN
              NULL;
            END;
          END IF;

          BEGIN
            IF EXISTS (SELECT 1 FROM pg_replication_slots WHERE slot_name = r.slot_name) THEN
              PERFORM pg_drop_replication_slot(r.slot_name);
            END IF;
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;
        END LOOP;
        END$$;
        """
      ]

      Enum.each(queries, &Postgrex.query!(db_conn, &1, []))
    end)
  end

  def assert_process_down(pid, timeout \\ 5000) do
    ref = Process.monitor(pid)
    assert_receive {:DOWN, ^ref, :process, ^pid, _reason}, timeout
  end
end
