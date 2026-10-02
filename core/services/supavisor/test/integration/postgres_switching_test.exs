defmodule Supavisor.Integration.PostgresSwitchingTest do
  use SupavisorWeb.ConnCase, async: false

  alias Supavisor.Jwt.Token

  @moduletag integration_docker: true

  @postgres_port 7432
  @postgres_user "postgres"
  @postgres_password "postgres"
  @postgres_db "postgres"
  @tenant_name "switching_test_tenant"
  @db_host "localhost"

  setup %{conn: conn} do
    cleanup_containers()

    jwt = gen_token()

    conn =
      conn
      |> put_req_header("accept", "application/json")
      |> put_req_header("authorization", "Bearer " <> jwt)

    on_exit(fn -> cleanup_containers() end)

    {:ok, conn: conn}
  end

  test "PostgreSQL upgrade scenario: 15 -> 16", %{conn: conn} do
    start_postgres_container(15)
    create_tenant(conn)
    assert :ok = test_connection()

    stop_postgres_container(15)

    # Ideally, we shouldn't need to terminate the tenant manually here.
    #
    # Instead, Supavisor should detect the version change and either:
    # a) seamlessly handle the "db pool switching" while keeping client
    #    connections available.
    # b) gracefully terminate existing all client handlers
    #
    # Currently, if we don't terminate the tenant (or restart supavisor),
    # we get authentication errors.
    terminate_tenant(conn)
    Process.sleep(2000)
    start_postgres_container(16)

    assert :ok = test_connection()
  end

  defp start_postgres_container(version) do
    container_name = container_name(version)

    {_output, 0} =
      System.cmd("docker", [
        "run",
        "-d",
        "--name",
        container_name,
        "-e",
        "POSTGRES_USER=#{@postgres_user}",
        "-e",
        "POSTGRES_PASSWORD=#{@postgres_password}",
        "-e",
        "POSTGRES_DB=#{@postgres_db}",
        "-p",
        "#{@postgres_port}:5432",
        "postgres:#{version}"
      ])

    wait_for_postgres()
  end

  defp wait_for_postgres(max_attempts \\ 30) do
    wait_for_postgres(1, max_attempts)
  end

  defp wait_for_postgres(attempt, max_attempts) when attempt != max_attempts do
    case System.cmd("pg_isready", [
           "-h",
           "localhost",
           "-p",
           to_string(@postgres_port),
           "-U",
           @postgres_user,
           "-d",
           @postgres_db
         ]) do
      {_, 0} ->
        :ok

      _ ->
        Process.sleep(1000)
        wait_for_postgres(attempt + 1, max_attempts)
    end
  end

  defp wait_for_postgres(_attempt, max_attempts) do
    raise "PostgreSQL failed to start within #{max_attempts} seconds"
  end

  defp stop_postgres_container(version) do
    System.cmd("docker", ["stop", container_name(version)])
    System.cmd("docker", ["rm", container_name(version)])
  end

  defp create_tenant(conn) do
    tenant_attrs = %{
      db_host: @db_host,
      db_port: @postgres_port,
      db_database: @postgres_db,
      external_id: @tenant_name,
      ip_version: "auto",
      enforce_ssl: false,
      require_user: false,
      auth_query: "SELECT rolname, rolpassword FROM pg_authid WHERE rolname=$1;",
      users: [
        %{
          db_user: @postgres_user,
          db_password: @postgres_password,
          pool_size: 20,
          mode_type: "transaction",
          is_manager: true
        }
      ]
    }

    conn = put(conn, Routes.tenant_path(conn, :update, @tenant_name), tenant: tenant_attrs)

    case conn.status do
      status when status in 200..201 ->
        :ok

      _status ->
        :ok
    end
  end

  defp terminate_tenant(conn) do
    _conn = get(conn, Routes.tenant_path(conn, :terminate, @tenant_name))
    :ok
  end

  defp test_connection do
    proxy_port = Application.fetch_env!(:supavisor, :proxy_port_transaction)

    connection_opts = [
      hostname: @db_host,
      port: proxy_port,
      database: @postgres_db,
      username: "#{@postgres_user}.#{@tenant_name}",
      password: @postgres_password,
      # This is important as otherwise Postgrex may try to reconnect in case of errors.
      # We want to avoid that, as it hides connection errors.
      backoff: nil
    ]

    assert {:ok, conn} = Postgrex.start_link(connection_opts)
    assert {:ok, %{rows: [[_version_string]]}} = Postgrex.query(conn, "SELECT version();", [])

    :ok
  end

  defp container_name(version) do
    "test_postgres_#{version}_switching"
  end

  defp cleanup_containers do
    [15, 16]
    |> Enum.each(fn version ->
      System.cmd("docker", ["rm", "-f", container_name(version)], stderr_to_stdout: true)
    end)
  end

  defp gen_token do
    secret = Application.fetch_env!(:supavisor, :api_jwt_secret)
    Token.gen!(secret)
  end
end
