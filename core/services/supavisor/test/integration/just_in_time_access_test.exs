defmodule Supavisor.Integration.JustInTimeAccessTest do
  use Supavisor.JITDockerComposeCase, async: false
  use SupavisorWeb.ConnCase

  require Logger
  alias Ecto.Adapters.SQL.Sandbox
  alias Postgrex, as: P
  alias Supavisor.Support.Cluster

  @moduletag integration_docker: true

  setup do
    cert_dir = Path.expand("../../priv/jit/postgres/certs", __DIR__)
    cert_path = Path.join(cert_dir, "server.crt")
    key_path = Path.join(cert_dir, "server.key")

    prev_cert = Application.get_env(:supavisor, :global_downstream_cert)
    prev_key = Application.get_env(:supavisor, :global_downstream_key)
    Application.put_env(:supavisor, :global_downstream_cert, cert_path)
    Application.put_env(:supavisor, :global_downstream_key, key_path)

    db_conf =
      :supavisor
      |> Application.get_env(Supavisor.Repo)
      |> Keyword.put(:hostname, "localhost")
      |> Keyword.put(:port, "7543")
      |> Keyword.put(:database, "postgres")
      |> Keyword.put(:username, "postgres")
      |> Keyword.put(:password, "postgres")

    # Add a small delay between tests to allow connections to clean up
    on_exit(fn ->
      Application.put_env(:supavisor, :global_downstream_cert, prev_cert)
      Application.put_env(:supavisor, :global_downstream_key, prev_key)
      Process.sleep(100)
    end)

    %{db_conf: db_conf}
  end

  defp setup_tenant(db_conf, opts \\ []) do
    random_suffix = :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
    tenant_id = "update_creds_tenant_#{System.unique_integer([:positive])}_#{random_suffix}"
    cert_dir = Path.expand("../../priv/jit/postgres/certs", __DIR__)
    ca_path = Path.join(cert_dir, "ca.crt")

    ca_der =
      File.read!(ca_path)
      |> :public_key.pem_decode()
      |> hd()
      |> elem(1)

    {:ok, _tenant} =
      Supavisor.Tenants.create_tenant(%{
        db_database: db_conf[:database],
        db_host: to_string(db_conf[:hostname]),
        db_port: db_conf[:port],
        external_id: tenant_id,
        require_user: false,
        auth_query: "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1",
        default_parameter_status: %{"server_version" => "15.0"},
        upstream_tls_ca: ca_der,
        upstream_ssl: true,
        upstream_verify: :peer,
        enforce_ssl: false,
        availability_zone: Keyword.get(opts, :availability_zone),
        use_jit: true,
        jit_api_url: "http://localhost:8080/projects/odvmrtdcoyfyvfrdxzsj/database/jit",
        users: [
          %{
            "db_user" => to_string(db_conf[:username]),
            "db_password" => to_string(db_conf[:password]),
            "pool_size" => 3,
            "mode_type" => "transaction",
            "is_manager" => true
          }
        ]
      })

    on_exit(fn -> Supavisor.Tenants.delete_tenant_by_external_id(tenant_id) end)

    {tenant_id, ca_path}
  end

  test "health check endpoint returns 200" do
    {:ok, response} = api_request(:get, "/health")

    assert response.status == 200
    assert response.body == %{"status" => "healthy"}
  end

  test "valid credentials work directly (scram-sha256, no tls)", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:ok, pid} = single_connection(db_conf, tenant_id, ca_cert, ssl: false)
    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")
  end

  test "valid credentials work directly (password, tls)", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:ok, pid} = single_connection(db_conf, tenant_id, ca_cert, [])
    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")
  end

  test "invalid credentials rejected (scram-sha256, no tls)", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :invalid_password,
                message: "password authentication failed for user \"postgres\"",
                severity: "FATAL",
                pg_code: "28P01"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "something_something_secret",
               ssl: false
             )
  end

  test "valid credentials for role that is not JIT", %{db_conf: db_conf} do
    # the pg_hba.conf can be set to only allow
    # JIT access for some roles and use scram_sha256 for others.
    # those roles should still be able to log in, even if the tenant
    # has use_jit enabled.
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    # from postgres/init.sql
    assert {:ok, pid} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "TEST_SUPAVISOR_PASSWORD",
               username: "supabase_admin"
             )

    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")
  end

  test "valid credentials for role that contains = in password", %{db_conf: db_conf} do
    # the pg_hba.conf can be set to only allow
    # JIT access for some roles and use scram_sha256 for others.
    # those roles should still be able to log in, even if the tenant
    # has use_jit enabled.
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    # from postgres/init.sql
    assert {:ok, pid} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "56lRXbZStSL9=Y3cJJxLZd5wQxpWvfl9",
               username: "user_with_equal"
             )

    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")
  end

  test "access token fails incorrect token", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :invalid_password,
                message: "password authentication failed for user \"postgres\"",
                severity: "FATAL",
                pg_code: "28P01"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )
  end

  test "access token fails assuming wrong role", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :invalid_password,
                message: "password authentication failed for user \"supabase_admin\"",
                severity: "FATAL",
                pg_code: "28P01"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               username: "supabase_admin",
               jit: true
             )
  end

  test "access token fails mismatch in roles", %{db_conf: db_conf} do
    # the API returns a different role from the one requested in the auth request.
    # This should never happen, but supavisor should guard against this regardless.
    # User requests role `postgres` but the api responds that token is only valid for role
    # `otherrole`

    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :invalid_password,
                message: "password authentication failed for user \"postgres\"",
                severity: "FATAL",
                pg_code: "28P01"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )
  end

  test "invalid credentials rejected (password, tls)", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :invalid_password,
                message: "password authentication failed for user \"postgres\"",
                severity: "FATAL",
                pg_code: "28P01"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert, password: "fdsjalkfjdsaou40180cxv")
  end

  test "jit access fails if not tls", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message: "(ESSLREQUIRED) SSL connection is required for user: postgres",
                severity: "FATAL",
                pg_code: "XX000"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               ssl: false,
               jit: true
             )
  end

  test "access token auth works (jit)", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:ok, pid} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )

    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")
  end

  test "valid credential can join existing pool created with jit", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:ok, pid1} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )

    assert {:ok, %P.Result{}} = SingleConnection.query(pid1, "SELECT 1")

    assert {:ok, pid2} = single_connection(db_conf, tenant_id, ca_cert, [])
    assert {:ok, %P.Result{}} = SingleConnection.query(pid2, "SELECT 1")
  end

  test "invalid access token fails trying to join existing pool", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:ok, pid} = single_connection(db_conf, tenant_id, ca_cert, [])
    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :invalid_password,
                message: "password authentication failed for user \"postgres\"",
                severity: "FATAL",
                pg_code: "28P01"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )
  end

  test "api error results in failed auth", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message: "(EJITREQUESTFAILED) failed to reach JIT provider for user \"postgres\"",
                severity: "FATAL",
                pg_code: "XX000"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )
  end

  test "valid jit token can join existing pool created with scram", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:ok, pid1} = single_connection(db_conf, tenant_id, ca_cert, [])
    assert {:ok, %P.Result{}} = SingleConnection.query(pid1, "SELECT 1")

    assert {:ok, pid2} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )

    assert {:ok, %P.Result{}} = SingleConnection.query(pid2, "SELECT 1")
  end

  test "jit fails if switching to cleartext to join existing pool", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    assert {:ok, pid} = single_connection(db_conf, tenant_id, ca_cert, [])
    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message: "(ESSLREQUIRED) SSL connection is required for user: postgres",
                pg_code: "XX000",
                severity: "FATAL"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               ssl: false,
               jit: true
             )
  end

  test "jit successful authentication via proxy node", %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    assert {:ok, pid} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )

    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")
  end

  test "jit invalid token rejected via proxy node", %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :invalid_password,
                message: "password authentication failed for user \"postgres\"",
                severity: "FATAL",
                pg_code: "28P01"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )
  end

  test "jit access fails without tls via proxy node", %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message: "(ESSLREQUIRED) SSL connection is required for user: postgres",
                severity: "FATAL",
                pg_code: "XX000"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               ssl: false,
               jit: true
             )
  end

  test "jit token fails assuming wrong role via proxy node", %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :invalid_password,
                message: "password authentication failed for user \"supabase_admin\"",
                severity: "FATAL",
                pg_code: "28P01"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               username: "supabase_admin",
               jit: true
             )
  end

  test "jit token fails with role mismatch via proxy node", %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :invalid_password,
                message: "password authentication failed for user \"postgres\"",
                severity: "FATAL",
                pg_code: "28P01"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )
  end

  test "jit api error results in failed auth via proxy node", %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :internal_error,
                message: "(EJITREQUESTFAILED) failed to reach JIT provider for user \"postgres\"",
                severity: "FATAL",
                pg_code: "XX000"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )
  end

  test "scram credentials join jit-created pool via proxy node", %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    assert {:ok, pid} = single_connection(db_conf, tenant_id, ca_cert, [])
    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")
  end

  test "valid jit token joins scram-created pool via proxy node", %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    assert {:ok, pid} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )

    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")
  end

  test "valid credentials work via proxy node (scram-sha256, no tls)", %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    assert {:ok, pid} = single_connection(db_conf, tenant_id, ca_cert, ssl: false)
    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")
  end

  test "valid credentials work via proxy node (password, tls)", %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    assert {:ok, pid} = single_connection(db_conf, tenant_id, ca_cert, [])
    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")
  end

  test "non-jit role auth works via proxy node", %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    assert {:ok, pid} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "TEST_SUPAVISOR_PASSWORD",
               username: "supabase_admin"
             )

    assert {:ok, %P.Result{}} = SingleConnection.query(pid, "SELECT 1")
  end

  test "invalid scram credentials rejected via proxy node", %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    assert {:error,
            %Postgrex.Error{
              postgres: %{
                code: :invalid_password,
                message: "password authentication failed for user \"postgres\"",
                severity: "FATAL",
                pg_code: "28P01"
              }
            }} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "something_something_secret"
             )
  end

  test "supavisor does not reuse jit token for new connections", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    # Connect with a short-lived token (valid for only 2 uses within a 5s window).
    # The first connection consumes both uses (supavisor validation + PAM validation).
    assert {:ok, pid1} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )

    assert {:ok, %P.Result{}} = SingleConnection.query(pid1, "SELECT 1")

    # Connect with a different valid token. If supavisor were reusing the
    # first (now exhausted) token for the upstream connection, the mock
    # server would reject it as a 3rd use.
    assert {:ok, pid2} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )

    assert {:ok, %P.Result{}} = SingleConnection.query(pid2, "SELECT 1")
  end

  test "supavisor does not reuse jit token for new connections via proxy node",
       %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    # Connect with a short-lived token (valid for only 2 uses within a 5s window).
    # The first connection consumes both uses (supavisor validation + PAM validation).
    assert {:ok, pid1} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )

    assert {:ok, %P.Result{}} = SingleConnection.query(pid1, "SELECT 1")

    # Connect with a different valid token. If supavisor were reusing the
    # first (now exhausted) token for the upstream connection, the mock
    # server would reject it as a 3rd use.
    assert {:ok, pid2} =
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             )

    assert {:ok, %P.Result{}} = SingleConnection.query(pid2, "SELECT 1")
  end

  test "stale jit token rejected by database returns clear error", %{db_conf: db_conf} do
    {tenant_id, ca_cert} = setup_tenant(db_conf)

    # Token allows 1 use: passes Supavisor JIT validation, but PAM rejects it.
    # Connection is async so the error may surface on connect or on query.
    result =
      with {:ok, pid} <-
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             ) do
        SingleConnection.query(pid, "SELECT 1")
      end

    assert {:error, %Postgrex.Error{postgres: %{code: :invalid_password}}} = result
  end

  test "stale jit token rejected by database returns clear error via proxy node",
       %{db_conf: db_conf} do
    {tenant_id, ca_cert} =
      Sandbox.unboxed_run(Supavisor.Repo, fn ->
        setup_tenant(db_conf, availability_zone: "ap-southeast-1c")
      end)

    assert {:ok, _peer, node2} = Cluster.start_node()
    Node.connect(node2)

    # Token allows 2 uses: passes Supavisor JIT validation + proxy forwarding,
    # but PAM on the local DbHandler rejects it.
    result =
      with {:ok, pid} <-
             single_connection(db_conf, tenant_id, ca_cert,
               password: "sbp_TEST_TOKEN_REDACTED",
               jit: true
             ) do
        SingleConnection.query(pid, "SELECT 1")
      end

    assert {:error, %Postgrex.Error{postgres: %{code: :invalid_password}}} = result
  end

  defp single_connection(db_conf, tenant_id, ca_cert, overrides) do
    username = overrides[:username] || db_conf[:username]

    opts = [
      hostname: db_conf[:hostname],
      port: overrides[:port] || Application.get_env(:supavisor, :proxy_port_transaction),
      database: db_conf[:database],
      password: overrides[:password] || db_conf[:password],
      username: "#{username}.#{tenant_id}",
      pool_size: 1,
      sync_connect: true
    ]

    opts =
      if Keyword.get(overrides, :ssl, true) do
        opts ++ [ssl: true, ssl_opts: [verify: :verify_peer, cacertfile: ca_cert]]
      else
        opts
      end

    opts =
      if Keyword.get(overrides, :jit, false) do
        opts ++ [parameters: [options: "--jit=true"]]
      else
        opts
      end

    with {:error, {error, _}} <- start_supervised({SingleConnection, opts}) do
      {:error, error}
    end
  end
end
