defmodule Supavisor.Integration.ProxyTest do
  use Supavisor.DataCase, async: false

  require Logger
  require Supavisor

  alias Ecto.Adapters.SQL.Sandbox
  alias Postgrex, as: P
  alias Supavisor.Support.{Cluster, SSLHelper}

  @tenants ["proxy_tenant_ps_enabled", "proxy_tenant_ps_disabled"]

  defp setup_tenant_connections(tenant) do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)

    assert {:ok, proxy} =
             Postgrex.start_link(
               hostname: db_conf[:hostname],
               port: Application.get_env(:supavisor, :proxy_port_transaction),
               database: db_conf[:database],
               password: db_conf[:password],
               username: db_conf[:username] <> "." <> tenant
             )

    assert {:ok, origin} =
             Postgrex.start_link(
               hostname: db_conf[:hostname],
               port: db_conf[:port],
               database: db_conf[:database],
               password: db_conf[:password],
               username: db_conf[:username]
             )

    %{db_conf: db_conf, proxy: proxy, origin: origin, user: db_conf[:username]}
  end

  for tenant <- @tenants do
    test "insert with #{tenant}" do
      %{proxy: proxy, origin: origin} = setup_tenant_connections(unquote(tenant))
      test_value = "test_insert_#{unquote(tenant)}"
      P.query!(proxy, "insert into public.test (details) values ($1)", [test_value])

      assert %P.Result{num_rows: 1} =
               P.query!(origin, "select * from public.test where details = $1", [test_value])
    end
  end

  for tenant <- @tenants do
    test "the wrong password with #{tenant}" do
      db_conf = Application.get_env(:supavisor, Repo)

      url =
        "postgresql://#{db_conf[:username] <> "." <> unquote(tenant)}:no_pass@#{db_conf[:hostname]}:#{Application.get_env(:supavisor, :proxy_port_transaction)}/postgres"

      assert {:error,
              %Postgrex.Error{
                postgres: %{
                  code: :invalid_password,
                  message: "password authentication failed for user \"" <> _,
                  severity: "FATAL",
                  pg_code: "28P01"
                }
              }} = parse_uri(url) |> single_connection()
    end
  end

  test "tenant or user not found" do
    db_conf = Application.get_env(:supavisor, Repo)

    url =
      "postgresql://postgres.nonexistent_tenant:any_password@#{db_conf[:hostname]}:#{Application.get_env(:supavisor, :proxy_port_transaction)}/postgres"

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message: "(ENOTFOUND) tenant/user postgres.nonexistent_tenant not found",
                severity: "FATAL",
                pg_code: "XX000"
              }
            }} = parse_uri(url) |> single_connection()
  end

  for tenant <- @tenants do
    @tag cluster: true
    test "query via another node with #{tenant}" do
      %{proxy: proxy, user: user} = setup_tenant_connections(unquote(tenant))
      assert {:ok, _pid, node2} = Cluster.start_node()

      sup =
        Enum.reduce_while(1..30, nil, fn _, acc ->
          case Supavisor.get_global_sup({unquote(tenant), user, :transaction}) do
            nil ->
              Process.sleep(100)
              {:cont, acc}

            pid ->
              {:halt, pid}
          end
        end)

      assert sup ==
               :erpc.call(
                 node2,
                 Supavisor,
                 :get_global_sup,
                 [{unquote(tenant), user, :transaction}],
                 15_000
               )

      db_conf = Application.fetch_env!(:supavisor, Repo)

      assert {:ok, proxy2} =
               Postgrex.start_link(
                 hostname: db_conf[:hostname],
                 port: Application.get_env(:supavisor, :secondary_proxy_port),
                 database: db_conf[:database],
                 password: db_conf[:password],
                 username: db_conf[:username] <> "." <> unquote(tenant)
               )

      test_value = "dist_test_insert_#{unquote(tenant)}"
      P.query!(proxy2, "insert into public.test (details) values ($1)", [test_value])

      assert %P.Result{num_rows: 1} =
               P.query!(proxy, "select * from public.test where details = $1", [test_value])

      assert sup ==
               :erpc.call(
                 node2,
                 Supavisor,
                 :get_global_sup,
                 [{unquote(tenant), user, :transaction}],
                 15_000
               )
    end
  end

  @tag cluster: true
  test "app_name is set correctly for the proxy connection" do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)
    username = db_conf[:username]

    tenant =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        random_suffix = :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
        tenant_id = "app_name_test_#{System.unique_integer([:positive])}_#{random_suffix}"

        {:ok, _} =
          Supavisor.Tenants.create_tenant(%{
            db_host: to_string(db_conf[:hostname]),
            db_port: db_conf[:port],
            db_database: db_conf[:database],
            default_parameter_status: %{},
            external_id: tenant_id,
            require_user: true,
            availability_zone: "ap-southeast-1c",
            users: [
              %{
                "db_user" => db_conf[:username],
                "db_password" => db_conf[:password],
                "pool_size" => 3,
                "mode_type" => "transaction"
              }
            ]
          })

        on_exit(fn -> Supavisor.Tenants.delete_tenant_by_external_id(tenant_id) end)
        tenant_id
      end)

    id =
      Supavisor.id(
        type: :single,
        tenant: tenant,
        user: username,
        mode: :transaction,
        db: db_conf[:database]
      )

    assert {:ok, _pid, node2} = Cluster.start_node()
    Node.connect(node2)

    {:ok, conn} =
      Postgrex.start_link(
        hostname: db_conf[:hostname],
        port: Application.get_env(:supavisor, :proxy_port_transaction),
        database: db_conf[:database],
        password: db_conf[:password],
        username: "#{username}.#{tenant}",
        parameters: [application_name: "my_test_app"]
      )

    # Upstream DB connection should always identify as "Supavisor"
    assert %P.Result{rows: [["Supavisor"]]} =
             P.query!(conn, "SELECT current_setting('application_name')", [])

    # node2 is the pool node
    :ok =
      wait_until(fn ->
        :rpc.call(node2, Registry, :lookup, [
          Supavisor.Registry.TenantClients,
          id
        ]) != []
      end)

    [{_pid, proxy_meta}] =
      :rpc.call(node2, Registry, :lookup, [
        Supavisor.Registry.TenantClients,
        id
      ])

    assert proxy_meta[:app_name] == "my_test_app"

    # our node is the proxy node
    :ok =
      wait_until(fn ->
        Registry.lookup(Supavisor.Registry.TenantProxyClients, id) != []
      end)

    [{_pid, pool_meta}] = Registry.lookup(Supavisor.Registry.TenantProxyClients, id)
    assert pool_meta[:app_name] == "my_test_app"
  end

  @tag cluster: true
  test "app_name defaults to empty string when not provided" do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)
    username = db_conf[:username]

    tenant =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        random_suffix = :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
        tenant_id = "app_name_empty_#{System.unique_integer([:positive])}_#{random_suffix}"

        {:ok, _} =
          Supavisor.Tenants.create_tenant(%{
            db_host: to_string(db_conf[:hostname]),
            db_port: db_conf[:port],
            db_database: db_conf[:database],
            default_parameter_status: %{},
            external_id: tenant_id,
            require_user: true,
            availability_zone: "ap-southeast-1c",
            users: [
              %{
                "db_user" => db_conf[:username],
                "db_password" => db_conf[:password],
                "pool_size" => 3,
                "mode_type" => "transaction"
              }
            ]
          })

        on_exit(fn -> Supavisor.Tenants.delete_tenant_by_external_id(tenant_id) end)
        tenant_id
      end)

    id =
      Supavisor.id(
        type: :single,
        tenant: tenant,
        user: username,
        mode: :transaction,
        db: db_conf[:database]
      )

    assert {:ok, _pid, node2} = Cluster.start_node()
    Node.connect(node2)

    {:ok, conn} =
      Postgrex.start_link(
        hostname: db_conf[:hostname],
        port: Application.get_env(:supavisor, :proxy_port_transaction),
        database: db_conf[:database],
        password: db_conf[:password],
        username: "#{username}.#{tenant}"
      )

    # Upstream DB connection should always identify as "Supavisor"
    assert %P.Result{rows: [["Supavisor"]]} =
             P.query!(conn, "SELECT current_setting('application_name')", [])

    # node2 is the pool node
    :ok =
      wait_until(fn ->
        :rpc.call(node2, Registry, :lookup, [
          Supavisor.Registry.TenantClients,
          id
        ]) != []
      end)

    [{_pid, proxy_meta}] =
      :rpc.call(node2, Registry, :lookup, [
        Supavisor.Registry.TenantClients,
        id
      ])

    assert proxy_meta[:app_name] == ""

    # our node is the proxy node
    :ok =
      wait_until(fn ->
        Registry.lookup(Supavisor.Registry.TenantProxyClients, id) != []
      end)

    [{_pid, pool_meta}] = Registry.lookup(Supavisor.Registry.TenantProxyClients, id)
    assert pool_meta[:app_name] == ""
  end

  for tenant <- @tenants do
    test "select with #{tenant}" do
      %{proxy: proxy, origin: origin} = setup_tenant_connections(unquote(tenant))
      test_value = "test_select_#{unquote(tenant)}"
      P.query!(origin, "insert into public.test (details) values ($1)", [test_value])

      assert %P.Result{num_rows: 1} =
               P.query!(proxy, "select * from public.test where details = $1", [test_value])
    end
  end

  for tenant <- @tenants do
    test "update with #{tenant}" do
      %{proxy: proxy, origin: origin} = setup_tenant_connections(unquote(tenant))
      test_value = "test_update_#{unquote(tenant)}"
      updated_value = "test_update_updated_#{unquote(tenant)}"
      P.query!(origin, "insert into public.test (details) values ($1)", [test_value])

      P.query!(
        proxy,
        "update public.test set details = $1 where details = $2",
        [updated_value, test_value]
      )

      assert %P.Result{num_rows: 1} =
               P.query!(
                 origin,
                 "select * from public.test where details = $1",
                 [updated_value]
               )
    end
  end

  for tenant <- @tenants do
    test "delete with #{tenant}" do
      %{proxy: proxy, origin: origin} = setup_tenant_connections(unquote(tenant))
      test_value = "test_delete_#{unquote(tenant)}"
      P.query!(origin, "insert into public.test (details) values ($1)", [test_value])
      P.query!(proxy, "delete from public.test where details = $1", [test_value])

      assert %P.Result{num_rows: 0} =
               P.query!(origin, "select * from public.test where details = $1", [test_value])
    end
  end

  test "too many clients in session mode" do
    %{db_conf: db_conf} = setup_tenant_connections(List.first(@tenants))
    port = Application.get_env(:supavisor, :proxy_port_session)

    connection_opts =
      Keyword.merge(db_conf,
        username: "max_clients.proxy_tenant1",
        port: port
      )

    assert {:ok, _} = single_connection(connection_opts)
    assert {:ok, _} = single_connection(connection_opts)

    :timer.sleep(1000)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message:
                  "(EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 2",
                severity: "FATAL",
                pg_code: "XX000"
              }
            }} = single_connection(connection_opts)
  end

  test "http to proxy server returns 200 OK" do
    assert :httpc.request(
             "http://localhost:#{Application.get_env(:supavisor, :proxy_port_transaction)}"
           ) ==
             {:ok,
              {{~c"HTTP/1.1", 204, ~c"OK"},
               [{~c"x-app-version", Application.spec(:supavisor, :vsn)}], []}}
  end

  test "checks that client_handler is idle and db_connection is nil for transaction mode" do
    %{db_conf: db_conf} = setup_tenant_connections(List.first(@tenants))

    url =
      "postgresql://transaction.proxy_tenant1:#{db_conf[:password]}@#{db_conf[:hostname]}:#{Application.get_env(:supavisor, :proxy_port_transaction)}/postgres"

    assert {:ok, pid} = parse_uri(url) |> single_connection()

    [{_, client_pid, _}] =
      Supavisor.get_local_manager(
        Supavisor.id(
          type: :single,
          tenant: "proxy_tenant1",
          user: "transaction",
          mode: :transaction,
          db: "postgres"
        )
      )
      |> :sys.get_state()
      |> Access.get(:tid)
      |> :ets.tab2list()

    assert {state, map} = :sys.get_state(client_pid)
    assert %{db_connection: db_connection} = map

    assert {:idle, nil} = {state, db_connection}
    :gen_statem.stop(pid)
  end

  test "limit client connections" do
    %{db_conf: db_conf} = setup_tenant_connections(List.first(@tenants))

    connection_opts = [
      hostname: db_conf[:hostname],
      port: Application.get_env(:supavisor, :proxy_port_transaction),
      username: "max_clients.prom_tenant",
      database: "postgres",
      password: db_conf[:password]
    ]

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message: "(EMAXCONN) max client connections reached, limit: 0",
                pg_code: "XX000",
                severity: "FATAL"
              }
            }} = single_connection(connection_opts)
  end

  describe "waiting for a free client slot" do
    setup do
      db_conf = Application.get_env(:supavisor, Supavisor.Repo)

      connection_opts = [
        hostname: db_conf[:hostname],
        port: Application.get_env(:supavisor, :proxy_port_transaction),
        username: db_conf[:username] <> ".admission_tenant",
        database: db_conf[:database],
        password: db_conf[:password]
      ]

      test_pid = self()
      ref = make_ref()
      handler_id = {__MODULE__, ref}

      :telemetry.attach_many(
        handler_id,
        [
          [:supavisor, :client, :admission, :admitted],
          [:supavisor, :client, :admission, :rejected]
        ],
        fn event, _measurements, _metadata, _config -> send(test_pid, {ref, event}) end,
        nil
      )

      on_exit(fn -> :telemetry.detach(handler_id) end)

      %{connection_opts: connection_opts, ref: ref}
    end

    test "admits a waiting client when a slot frees up", ctx do
      ref = ctx.ref

      # admission_tenant allows 2 clients, so the pool is now full
      assert {:ok, conn} = single_connection(ctx.connection_opts)
      assert {:ok, _conn} = single_connection(ctx.connection_opts)

      test_pid = self()
      connection_opts = ctx.connection_opts

      spawn(fn ->
        result =
          try do
            SingleConnection.connect(connection_opts)
          catch
            kind, reason -> {:error, {kind, reason}}
          end

        send(test_pid, {:waiter, result})
      end)

      # Let the third connection hit the limit and start waiting before freeing a slot.
      Process.sleep(50)
      GenServer.stop(conn)

      assert_receive {:waiter, {:ok, _pid}}, 5_000
      assert_receive {^ref, [:supavisor, :client, :admission, :admitted]}, 1_000
    end

    test "rejects with EMAXCONN once the wait budget is exhausted", ctx do
      ref = ctx.ref

      assert {:ok, _conn} = single_connection(ctx.connection_opts)
      assert {:ok, _conn} = single_connection(ctx.connection_opts)

      {elapsed, result} = :timer.tc(fn -> single_connection(ctx.connection_opts) end)

      assert {:error,
              %Postgrex.Error{
                postgres: %{
                  code: :internal_error,
                  message: "(EMAXCONN) max client connections reached, limit: 2",
                  pg_code: "XX000",
                  severity: "FATAL"
                }
              }} = result

      assert_receive {^ref, [:supavisor, :client, :admission, :rejected]}, 1_000

      retries = Application.get_env(:supavisor, :admission_retries)
      backoff = Application.get_env(:supavisor, :admission_backoff)
      assert elapsed >= retries * div(backoff, 2) * 1_000
    end
  end

  test "checkout timeout in transaction mode" do
    %{db_conf: db_conf} = setup_tenant_connections(List.first(@tenants))

    connection_opts = [
      hostname: db_conf[:hostname],
      port: Application.get_env(:supavisor, :proxy_port_transaction),
      username: "checkout_timeout_test.proxy_tenant1",
      database: "postgres",
      password: "postgres"
    ]

    # Start 2 connections and keep them busy with transactions (pool_size is 2)
    {:ok, conn1} = single_connection(connection_opts)
    assert [%P.Result{}] = P.SimpleConnection.call(conn1, {:query, "BEGIN;"})

    {:ok, conn2} = single_connection(connection_opts)
    assert [%P.Result{}] = P.SimpleConnection.call(conn2, {:query, "BEGIN;"})

    {:ok, conn3} = single_connection(connection_opts)
    assert [%P.Result{}] = P.SimpleConnection.call(conn3, {:query, "BEGIN;"})

    {:ok, conn4} = single_connection(connection_opts)

    # Try to execute query on 4th connection - should timeout after 500ms
    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message:
                  "(ECHECKOUTTIMEOUT) unable to check out connection from the pool after 500ms in Transaction mode",
                pg_code: "XX000",
                severity: "FATAL"
              }
            }} = SingleConnection.query(conn4, "BEGIN;")
  end

  test "change role password" do
    %{origin: origin, db_conf: db_conf} = setup_tenant_connections("is_manager")

    conn = fn pass ->
      "postgresql://dev_postgres.is_manager:#{pass}@#{db_conf[:hostname]}:#{Application.get_env(:supavisor, :proxy_port_transaction)}/postgres?sslmode=disable"
    end

    first_pass = conn.(db_conf[:password])
    new_pass = conn.("postgres_new")

    assert {:ok, first_conn} = parse_uri(first_pass) |> single_connection()

    assert [%Postgrex.Result{rows: [["1"]]}] =
             P.SimpleConnection.call(first_conn, {:query, "select 1;"})

    P.query(origin, "alter user dev_postgres with password 'postgres_new';", [])

    # First attempt with new password fails: the SCRAM exchange used the stale salt,
    # but the client is told that the password was changed
    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :invalid_password,
                message: "password authentication failed for user \"dev_postgres\"",
                hint: "The password for this user was recently changed. Retry the connection.",
                severity: "FATAL",
                pg_code: "28P01"
              }
            }} = parse_uri(new_pass) |> single_connection()

    # Second attempt should succeed (cache was updated by the failed attempt)
    assert {:ok, second_conn} = parse_uri(new_pass) |> single_connection()

    assert [%Postgrex.Result{rows: [["1"]]}] =
             P.SimpleConnection.call(second_conn, {:query, "select 1;"})

    # First connection should still be up: we don't terminate the pool anymore when the secrets change
    assert [%Postgrex.Result{rows: [["1"]]}] =
             P.SimpleConnection.call(first_conn, {:query, "select 1;"})

    :gen_statem.stop(first_conn)
    :gen_statem.stop(second_conn)
  end

  test "change role password with cleartext auth retries against new secrets" do
    SSLHelper.setup_downstream_certs()
    %{origin: origin, db_conf: db_conf} = setup_tenant_connections("is_manager")

    on_exit(fn ->
      {:ok, origin} =
        Postgrex.start_link(
          hostname: db_conf[:hostname],
          port: db_conf[:port],
          database: db_conf[:database],
          username: db_conf[:username],
          password: db_conf[:password]
        )

      P.query!(origin, "alter user dev_postgres_password_test with password 'postgres';", [])
    end)

    connect = fn password ->
      opts = [
        hostname: db_conf[:hostname],
        port: Application.get_env(:supavisor, :proxy_port_transaction),
        database: db_conf[:database],
        username: "dev_postgres_password_test.is_manager",
        password: password,
        ssl: [verify: :verify_none]
      ]

      with {:error, {error, _}} <- start_supervised({SingleConnection, opts}) do
        {:error, error}
      end
    end

    assert {:ok, first_conn} = connect.(db_conf[:password])

    assert [%Postgrex.Result{rows: [["1"]]}] =
             P.SimpleConnection.call(first_conn, {:query, "select 1;"})

    P.query!(origin, "alter user dev_postgres_password_test with password 'postgres_new';", [])

    # The cleartext password is checked against the refreshed secrets, so the first
    # attempt with the new password succeeds
    assert {:ok, second_conn} = connect.("postgres_new")

    assert [%Postgrex.Result{rows: [["1"]]}] =
             P.SimpleConnection.call(second_conn, {:query, "select 1;"})

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :invalid_password,
                message: "password authentication failed for user \"dev_postgres_password_test\"",
                severity: "FATAL",
                pg_code: "28P01"
              }
            }} = connect.(db_conf[:password])

    :gen_statem.stop(first_conn)
    :gen_statem.stop(second_conn)
  end

  test "change role password for bypass user skips validation cache" do
    %{origin: origin, db_conf: db_conf} = setup_tenant_connections("is_manager")

    conn = fn pass ->
      "postgresql://bypass_user.is_manager:#{pass}@#{db_conf[:hostname]}:#{Application.get_env(:supavisor, :proxy_port_transaction)}/postgres?sslmode=disable"
    end

    first_pass = conn.(db_conf[:password])
    new_pass = conn.("postgres_new")

    assert {:ok, first_conn} = parse_uri(first_pass) |> single_connection()

    assert [%Postgrex.Result{rows: [["1"]]}] =
             P.SimpleConnection.call(first_conn, {:query, "select 1;"})

    P.query(origin, "alter user bypass_user with password 'postgres_new';", [])

    # For bypass users, first attempt with new password should succeed immediately
    # because validation secrets are not cached
    assert {:ok, second_conn} = parse_uri(new_pass) |> single_connection()

    assert [%Postgrex.Result{rows: [["1"]]}] =
             P.SimpleConnection.call(second_conn, {:query, "select 1;"})

    # First connection should still be up
    assert [%Postgrex.Result{rows: [["1"]]}] =
             P.SimpleConnection.call(first_conn, {:query, "select 1;"})

    :gen_statem.stop(first_conn)
    :gen_statem.stop(second_conn)
  end

  test "invalid characters in user or db_name" do
    %{db_conf: db_conf} = setup_tenant_connections(List.first(@tenants))

    url =
      "postgresql://user\x10user.proxy_tenant1:#{db_conf[:password]}@#{db_conf[:hostname]}:#{Application.get_env(:supavisor, :proxy_port_transaction)}/postgres\\\\\\\\\"\\"

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message:
                  "(EINVALIDUSERINFO) Authentication error, reason: \"Invalid format for user or db_name\"",
                pg_code: "XX000",
                severity: "FATAL"
              }
            }} = parse_uri(url) |> single_connection()
  end

  defp single_connection(db_conf, c_port \\ nil) when is_list(db_conf) do
    port = c_port || db_conf[:port]

    opts = [
      hostname: db_conf[:hostname],
      port: port,
      database: db_conf[:database],
      password: db_conf[:password],
      username: db_conf[:username],
      pool_size: 1
    ]

    with {:error, {error, _}} <- start_supervised({SingleConnection, opts}) do
      {:error, error}
    end
  end

  test "connect to deleted database returns proper error" do
    %{origin: origin, db_conf: db_conf} =
      setup_tenant_connections(List.first(@tenants))

    tenant = List.first(@tenants)
    test_db = "test_db_#{:erlang.unique_integer([:positive])}"

    P.query!(origin, "CREATE DATABASE #{test_db}", [])

    assert {:ok, test_proxy} =
             Postgrex.start_link(
               hostname: db_conf[:hostname],
               port: Application.get_env(:supavisor, :proxy_port_transaction),
               database: test_db,
               password: db_conf[:password],
               username: db_conf[:username] <> "." <> tenant
             )

    assert %P.Result{rows: [[1]]} = P.query!(test_proxy, "SELECT 1", [])
    GenServer.stop(test_proxy)

    pool_sup_pid =
      Supavisor.get_global_sup(
        Supavisor.id(
          type: :single,
          tenant: tenant,
          user: db_conf[:username],
          mode: :transaction,
          db: test_db
        )
      )

    assert is_pid(pool_sup_pid)
    assert Process.alive?(pool_sup_pid)

    P.query!(origin, "DROP DATABASE #{test_db} WITH (FORCE)", [])

    log =
      ExUnit.CaptureLog.capture_log(fn ->
        assert {:error, _} =
                 single_connection(
                   hostname: db_conf[:hostname],
                   port: Application.get_env(:supavisor, :proxy_port_transaction),
                   database: test_db,
                   password: db_conf[:password],
                   username: db_conf[:username] <> "." <> tenant
                 )

        Process.sleep(200)
      end)

    assert log =~
             ~r/SingleConnection.*FATAL 3D000.*database "#{Regex.escape(test_db)}" does not exist/

    refute Process.alive?(pool_sup_pid)

    GenServer.stop(origin)
  end

  test "circuit breaker blocks get_secrets after failures" do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)
    tenant = "circuit_breaker_secrets"

    for _ <- 1..5 do
      Supavisor.CircuitBreaker.record_failure(tenant, :get_secrets)
    end

    url =
      "postgresql://postgres.#{tenant}:#{db_conf[:password]}@#{db_conf[:hostname]}:#{Application.get_env(:supavisor, :proxy_port_transaction)}/postgres"

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message:
                  "(ECIRCUITBREAKER) failed to retrieve database credentials after multiple attempts, new connections are temporarily blocked",
                pg_code: "XX000",
                severity: "FATAL"
              }
            }} = parse_uri(url) |> single_connection()

    Supavisor.CircuitBreaker.clear(tenant, :get_secrets)
  end

  @tag :skip
  test "circuit breaker blocks db_connection after failures" do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)
    tenant = "circuit_breaker_db_conn"

    for _ <- 1..100 do
      Supavisor.CircuitBreaker.record_failure(tenant, :db_connection)
    end

    url =
      "postgresql://#{db_conf[:username]}.#{tenant}:#{db_conf[:password]}@#{db_conf[:hostname]}:#{Application.get_env(:supavisor, :proxy_port_transaction)}/postgres"

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message:
                  "(ECIRCUITBREAKER) too many failed attempts to connect to the database, new connections are temporarily blocked",
                pg_code: "XX000",
                severity: "FATAL"
              }
            }} = parse_uri(url) |> single_connection()

    Supavisor.CircuitBreaker.clear(tenant, :db_connection)
  end

  test "circuit breaker blocks auth after 10 failed password attempts" do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)
    tenant = "circuit_breaker_auth"

    url =
      "postgresql://#{db_conf[:username]}.#{tenant}:wrong_password@#{db_conf[:hostname]}:#{Application.get_env(:supavisor, :proxy_port_transaction)}/postgres"

    # First 10 attempts should fail with authentication error
    for _ <- 1..10 do
      assert {:error,
              %Postgrex.Error{
                postgres: %{
                  code: :invalid_password,
                  message: "password authentication failed for user \"" <> _,
                  severity: "FATAL",
                  pg_code: "28P01"
                }
              }} = parse_uri(url) |> single_connection()
    end

    # 11th attempt should fail with circuit breaker error
    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message:
                  "(ECIRCUITBREAKER) too many authentication failures, new connections are temporarily blocked",
                pg_code: "XX000",
                severity: "FATAL"
              }
            }} = parse_uri(url) |> single_connection()

    # Clean up - clear circuit breaker for this tenant+IP
    Supavisor.CircuitBreaker.clear({tenant, "127.0.0.1"}, :auth_error)
  end

  test "handles fatal TLS alert by terminating connection" do
    # Setup SSL certificates for testing
    {:ok, _cert_path, _key_path} = SSLHelper.configure_test_ssl()

    # Save original SSL config to restore later
    original_cert = Application.get_env(:supavisor, :global_downstream_cert)
    original_key = Application.get_env(:supavisor, :global_downstream_key)

    on_exit(fn ->
      # Restore original SSL configuration
      Application.put_env(:supavisor, :global_downstream_cert, original_cert)
      Application.put_env(:supavisor, :global_downstream_key, original_key)
    end)

    db_conf = Application.get_env(:supavisor, Supavisor.Repo)
    tenant = List.first(@tenants)
    port = Application.get_env(:supavisor, :proxy_port_transaction)

    # Establish an SSL connection at the socket level
    {:ok, tcp_socket} = :gen_tcp.connect(~c"127.0.0.1", port, [:binary, active: false])

    # Send SSL request message
    ssl_request = <<8::32, 80_877_103::32>>
    :ok = :gen_tcp.send(tcp_socket, ssl_request)

    # Server should respond with 'S' for SSL support
    {:ok, <<"S">>} = :gen_tcp.recv(tcp_socket, 1, 5000)

    # Upgrade to SSL
    {:ok, ssl_socket} =
      :ssl.connect(tcp_socket, [verify: :verify_none, active: false], 5000)

    # Send startup message with authentication
    username = db_conf[:username] <> "." <> tenant
    database = db_conf[:database]

    startup_params = [
      {"user", username},
      {"database", database}
    ]

    startup_message =
      IO.iodata_to_binary([
        for {key, value} <- startup_params do
          [key, 0, value, 0]
        end,
        0
      ])

    packet = <<byte_size(startup_message) + 8::32, 196_608::32, startup_message::binary>>
    :ok = :ssl.send(ssl_socket, packet)

    # Receive authentication challenge
    {:ok, _auth_response} = :ssl.recv(ssl_socket, 0, 5000)

    # Get underlying TCP socket and send malformed data to trigger a FATAL alert from server
    {:sslsocket, {:gen_tcp, tcp_port, _tls_sender, _opts}, _pids} = ssl_socket

    # Send garbage data directly to TCP socket to corrupt the TLS stream
    # This will cause the server to send a FATAL alert (Bad Record MAC or Decode Error)
    garbage = :crypto.strong_rand_bytes(100)

    log =
      ExUnit.CaptureLog.capture_log(fn ->
        :gen_tcp.send(tcp_port, garbage)
        # Give time for server to process and send FATAL alert back
        Process.sleep(500)
      end)

    # Check that we logged the fatal TLS alert and terminated
    # The server will generate a FATAL alert in response to the corrupted data
    assert log =~ "Received fatal TLS alert"
    assert log =~ "terminating connection"
  end

  test "no warm pool user has empty pool after disconnect in session mode" do
    %{db_conf: db_conf} = setup_tenant_connections(List.first(@tenants))

    connection_opts = [
      hostname: db_conf[:hostname],
      port: Application.get_env(:supavisor, :proxy_port_session),
      database: db_conf[:database],
      password: db_conf[:password],
      username: "no_warm_pool_user.proxy_tenant1"
    ]

    # Connect and execute a query
    assert {:ok, conn} = single_connection(connection_opts)
    assert [%P.Result{rows: [["1"]]}] = P.SimpleConnection.call(conn, {:query, "select 1;"})

    tenant_id =
      Supavisor.id(
        type: :single,
        tenant: "proxy_tenant1",
        user: "no_warm_pool_user",
        mode: :session,
        db: db_conf[:database]
      )

    # Pool should have workers while connected
    assert count_pool_workers(tenant_id) > 0

    # Disconnect
    :gen_statem.stop(conn)
    Process.sleep(100)

    # For no_warm_pool_user, pool should be empty after disconnect
    assert count_pool_workers(tenant_id) == 0
  end

  test "cleanup resets session state in session mode" do
    %{db_conf: db_conf, origin: origin} = setup_tenant_connections(List.first(@tenants))

    connection_opts = [
      hostname: db_conf[:hostname],
      port: Application.get_env(:supavisor, :proxy_port_session),
      database: db_conf[:database],
      password: db_conf[:password],
      username: db_conf[:username] <> "." <> List.first(@tenants)
    ]

    test_timeout = "12345ms"

    conn1_opts = Keyword.put(connection_opts, :parameters, application_name: "app_one")
    conn2_opts = Keyword.put(connection_opts, :parameters, application_name: "app_two")

    assert {:ok, conn1} = start_supervised({SingleConnection, conn1_opts}, id: :conn1)

    assert [%P.Result{rows: [[backend_pid_1]]}] =
             P.SimpleConnection.call(conn1, {:query, "SELECT pg_backend_pid();"})

    # conn1's application_name reached the backend
    assert [%P.Result{rows: [["Supavisor - app_one"]]}] =
             P.SimpleConnection.call(
               conn1,
               {:query,
                "SELECT application_name FROM pg_stat_activity WHERE pid = pg_backend_pid();"}
             )

    assert [%P.Result{}] =
             P.SimpleConnection.call(
               conn1,
               {:query, "SET statement_timeout = '#{test_timeout}';"}
             )

    assert [%P.Result{rows: [[^test_timeout]]}] =
             P.SimpleConnection.call(conn1, {:query, "SHOW statement_timeout;"})

    stop_supervised(:conn1)
    Process.sleep(100)

    # conn1 is now idle in the pool: cleanup (DISCARD ALL) reset application_name
    # back to the default, dropping the "app_one" set during conn1's session
    assert %P.Result{rows: [["Supavisor"]]} =
             P.query!(
               origin,
               "SELECT application_name FROM pg_stat_activity WHERE pid = $1",
               [String.to_integer(backend_pid_1)]
             )

    assert {:ok, conn2} = start_supervised({SingleConnection, conn2_opts}, id: :conn2)

    assert [%P.Result{rows: [[backend_pid_2]]}] =
             P.SimpleConnection.call(conn2, {:query, "SELECT pg_backend_pid();"})

    assert backend_pid_1 == backend_pid_2

    # conn2's application_name reached the backend
    assert [%P.Result{rows: [["Supavisor - app_two"]]}] =
             P.SimpleConnection.call(
               conn2,
               {:query,
                "SELECT application_name FROM pg_stat_activity WHERE pid = pg_backend_pid();"}
             )

    assert [%P.Result{rows: [[timeout]]}] =
             P.SimpleConnection.call(conn2, {:query, "SHOW statement_timeout;"})

    assert timeout != test_timeout
  end

  test "max pools reached returns proper error" do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)
    tenant = "max_pool_tenant"
    port = Application.get_env(:supavisor, :proxy_port_transaction)

    base_opts = [
      hostname: db_conf[:hostname],
      port: port,
      database: db_conf[:database],
      password: db_conf[:password],
      username: db_conf[:username] <> "." <> tenant
    ]

    # Open 10 connections with different search_paths to create 10 distinct pools
    # (max_pools is 10 in test config)
    for i <- 1..10 do
      opts = Keyword.put(base_opts, :parameters, search_path: "schema_#{i}")
      {:ok, conn} = start_supervised({Postgrex, opts}, id: :"conn_#{i}")
      assert %Postgrex.Result{} = Postgrex.query!(conn, "SELECT 1", [])
    end

    # Eleventh connection should fail at startup with MaxPoolsReachedError
    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message: "(EMAXPOOLSREACHED) max pools count reached",
                pg_code: "XX000",
                severity: "FATAL"
              }
            }} = single_connection(base_opts)
  end

  @tag cluster: true
  test "local node enforces proxy pool limit when remote manager is unresponsive" do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)
    tenant = "proxy_pool_tenant"
    username = db_conf[:username] <> "." <> tenant

    id =
      Supavisor.id(
        type: :single,
        tenant: tenant,
        user: db_conf[:username],
        mode: :transaction,
        db: db_conf[:database]
      )

    assert {:ok, _pid, node2} = Cluster.start_node()
    Node.connect(node2)

    node2_port = Application.get_env(:supavisor, :secondary_proxy_port)

    # Start the pool on node2 by connecting through it
    {:ok, node2_conn} =
      Postgrex.start_link(
        hostname: db_conf[:hostname],
        port: node2_port,
        database: db_conf[:database],
        password: db_conf[:password],
        username: username,
        connect_timeout: 5000
      )

    assert %P.Result{rows: [[1]]} = P.query!(node2_conn, "SELECT 1", [])

    # Verify the pool supervisor lives on node2
    assert :ok =
             Enum.reduce_while(1..30, nil, fn _, _ ->
               case Supavisor.get_global_sup(id) do
                 pid when is_pid(pid) and node(pid) == node2 ->
                   {:halt, :ok}

                 _ ->
                   Process.sleep(100)
                   {:cont, nil}
               end
             end)

    local_port = Application.get_env(:supavisor, :proxy_port_transaction)

    conn_opts = [
      hostname: db_conf[:hostname],
      port: local_port,
      database: db_conf[:database],
      password: db_conf[:password],
      username: username
    ]

    # Suspend the manager on node2 to simulate it being overloaded/unresponsive
    manager_pid = :erpc.call(node2, Supavisor, :get_local_manager, [id])
    assert is_pid(manager_pid)
    :erpc.call(node2, :sys, :suspend, [manager_pid])

    # proxy_pool_tenant has max_clients: 2. Fire 5 connections concurrently —
    # at least one must be rejected by the local proxy pool even though the
    # remote manager is unresponsive and can't enforce limits itself.
    monitored_tasks =
      Enum.map(1..5, fn i ->
        {:ok, pid} =
          start_supervised(%{
            id: {:conn_task, i},
            start:
              {Task, :start_link,
               [
                 fn ->
                   receive do
                     :go -> SingleConnection.connect(conn_opts)
                   end
                 end
               ]},
            restart: :temporary
          })

        {pid, Process.monitor(pid)}
      end)

    Enum.each(monitored_tasks, fn {pid, _} -> send(pid, :go) end)

    results =
      Enum.map(monitored_tasks, fn {pid, ref} ->
        receive do
          {:DOWN, ^ref, :process, ^pid, :normal} -> :ok
          {:DOWN, ^ref, :process, ^pid, reason} -> {:error, reason}
        after
          15_000 -> {:error, :timeout}
        end
      end)

    {max_conn_errors, other_errors} =
      Enum.split_with(results, fn
        {:error,
         %Postgrex.Error{
           postgres: %{
             code: :internal_error,
             message: "(EMAXCONN) max client connections reached, limit: 2"
           }
         }} ->
          true

        _ ->
          false
      end)

    assert length(max_conn_errors) == 3
    assert length(other_errors) == 2

    :erpc.call(node2, :sys, :resume, [manager_pid])
    GenServer.stop(node2_conn)
  end

  describe "banned tenant" do
    @ban_tenant "proxy_tenant_ps_enabled"

    setup do
      on_exit(fn ->
        Supavisor.Tenants.toggle_tenant_ban(@ban_tenant, %{"banned" => "false"})
        Supavisor.del_all_cache_dist(@ban_tenant)
      end)

      :ok
    end

    test "receives FATAL error on the wire on a connection attempt" do
      db_conf = Application.get_env(:supavisor, Supavisor.Repo)

      url =
        "postgresql://#{db_conf[:username]}.#{@ban_tenant}:#{db_conf[:password]}@#{db_conf[:hostname]}:#{Application.get_env(:supavisor, :proxy_port_transaction)}/#{db_conf[:database]}"

      {:ok, _} =
        Supavisor.Tenants.toggle_tenant_ban(@ban_tenant, %{
          "banned" => "true",
          "ban_reason" => "integration test ban"
        })

      assert {:error,
              %Postgrex.Error{
                postgres: %{
                  code: :internal_error,
                  message: "(EBANNED) tenant is banned: integration test ban",
                  pg_code: "XX000",
                  severity: "FATAL"
                }
              }} = parse_uri(url) |> single_connection()

      {:ok, _} = Supavisor.Tenants.toggle_tenant_ban(@ban_tenant, %{"banned" => "false"})

      assert {:ok, _pid} = single_connection(parse_uri(url))
    end

    test "has its connections dropped (transaction mode)" do
      Process.flag(:trap_exit, true)
      db_conf = Application.get_env(:supavisor, Supavisor.Repo)

      assert {:ok, conn} =
               Postgrex.start_link(
                 hostname: db_conf[:hostname],
                 port: Application.get_env(:supavisor, :proxy_port_transaction),
                 database: db_conf[:database],
                 password: db_conf[:password],
                 username: "#{db_conf[:username]}.#{@ban_tenant}",
                 backoff_type: :stop
               )

      Postgrex.query(conn, "SELECT 1", [])

      query_task =
        Task.async(fn ->
          Postgrex.query(conn, "SELECT pg_sleep(10)", [])
        end)

      {:ok, _} =
        Supavisor.Tenants.toggle_tenant_ban(@ban_tenant, %{
          "banned" => "true",
          "ban_reason" => "banned while connected test"
        })

      assert {:error,
              %Postgrex.Error{
                postgres: %{
                  code: :internal_error,
                  message: "(EBANNED) tenant is banned: banned while connected test"
                }
              }} = Task.await(query_task)

      assert {:error,
              %Postgrex.Error{
                postgres: %{message: "(EBANNED) tenant is banned: banned while connected test"}
              }} =
               single_connection(
                 hostname: db_conf[:hostname],
                 port: Application.get_env(:supavisor, :proxy_port_transaction),
                 database: db_conf[:database],
                 password: db_conf[:password],
                 username: "#{db_conf[:username]}.#{@ban_tenant}"
               )
    end

    test "has its connections dropped (session mode)" do
      Process.flag(:trap_exit, true)
      db_conf = Application.get_env(:supavisor, Supavisor.Repo)

      assert {:ok, conn} =
               Postgrex.start_link(
                 hostname: db_conf[:hostname],
                 port: Application.get_env(:supavisor, :proxy_port_session),
                 database: db_conf[:database],
                 password: db_conf[:password],
                 username: "#{db_conf[:username]}.#{@ban_tenant}",
                 backoff_type: :stop
               )

      assert %Postgrex.Result{} = Postgrex.query!(conn, "SELECT 1", [])

      query_task =
        Task.async(fn ->
          Postgrex.query(conn, "SELECT pg_sleep(10)", [])
        end)

      {:ok, _} =
        Supavisor.Tenants.toggle_tenant_ban(@ban_tenant, %{
          "banned" => "true",
          "ban_reason" => "banned while connected test session"
        })

      assert {:error,
              %Postgrex.Error{
                postgres: %{
                  code: :internal_error,
                  message: "(EBANNED) tenant is banned: banned while connected test session"
                }
              }} = Task.await(query_task)

      assert {:error,
              %Postgrex.Error{
                postgres: %{
                  message: "(EBANNED) tenant is banned: banned while connected test session"
                }
              }} =
               single_connection(
                 hostname: db_conf[:hostname],
                 port: Application.get_env(:supavisor, :proxy_port_session),
                 database: db_conf[:database],
                 password: db_conf[:password],
                 username: "#{db_conf[:username]}.#{@ban_tenant}"
               )
    end
  end

  test "connect using reference option for tenant name" do
    tenant = "proxy_tenant_ps_enabled"
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)

    base_opts = [
      hostname: db_conf[:hostname],
      port: Application.get_env(:supavisor, :proxy_port_transaction),
      database: db_conf[:database],
      password: db_conf[:password],
      username: db_conf[:username]
    ]

    assert {:ok, proxy} =
             Postgrex.start_link(base_opts ++ [parameters: [options: "--reference=#{tenant}"]])

    assert %Postgrex.Result{rows: [[1]]} = Postgrex.query!(proxy, "SELECT 1", [])

    assert {:ok, proxy2} =
             Postgrex.start_link(base_opts ++ [parameters: [options: "reference=#{tenant}"]])

    assert %Postgrex.Result{rows: [[1]]} = Postgrex.query!(proxy2, "SELECT 1", [])

    assert {:ok, proxy3} =
             Postgrex.start_link(
               base_opts ++ [parameters: [options: URI.encode("reference=#{tenant}")]]
             )

    assert %Postgrex.Result{rows: [[1]]} = Postgrex.query!(proxy3, "SELECT 1", [])
  end

  test "logs database fatal error reason on admin_shutdown" do
    %{proxy: proxy, origin: origin} = setup_tenant_connections(List.first(@tenants))

    assert %P.Result{rows: [[backend_pid]]} =
             P.query!(proxy, "SELECT pg_backend_pid()", [])

    log =
      ExUnit.CaptureLog.capture_log(fn ->
        P.query!(origin, "SELECT pg_terminate_backend($1)", [backend_pid])
        Process.sleep(500)
      end)

    assert log =~
             "DbHandler: Session terminated by server while idle in the pool: terminating connection due to administrator command (57P01)"
  end

  defp parse_uri(uri) do
    %URI{
      userinfo: userinfo,
      host: host,
      port: port,
      path: path
    } = URI.parse(uri)

    [username, pass] = String.split(userinfo, ":")
    database = String.replace(path, "/", "")

    [hostname: host, port: port, database: database, password: pass, username: username]
  end

  defp count_pool_workers(tenant_id) do
    tenant_id
    |> Supavisor.get_global_sup()
    |> get_poolboy_workers()
    |> length()
  end

  defp get_poolboy_workers(tenant_sup) do
    tenant_sup
    |> Supervisor.which_children()
    |> Enum.filter(&match?({:pool, _}, elem(&1, 0)))
    |> Enum.flat_map(fn {_id, pool_pid, _type, _modules} ->
      pool_pid
      |> Process.info()
      |> Kernel.get_in([:links])
      |> Enum.find(&poolboy_supervisor?/1)
      |> case do
        nil -> []
        poolboy_sup -> Supervisor.which_children(poolboy_sup)
      end
      |> Enum.filter(&is_pid(elem(&1, 1)))
    end)
  end

  defp poolboy_supervisor?(pid) do
    case Process.info(pid)[:dictionary][:"$initial_call"] do
      {:supervisor, :poolboy_sup, _} -> true
      _ -> false
    end
  end
end
