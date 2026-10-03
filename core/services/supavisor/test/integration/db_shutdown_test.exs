defmodule Supavisor.Integration.DbShutdownTest do
  use Supavisor.DataCase, async: false

  alias Postgrex, as: P

  @moduletag :integration_docker
  @moduletag timeout: 12_000

  @db_port 7545
  @compose_dir Path.expand("db-shutdown", __DIR__)

  setup_all do
    start_container()
    wait_for_postgres()

    on_exit(fn -> remove_container() end)

    :ok
  end

  setup do
    start_container()
    wait_for_postgres()

    random_suffix = :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
    tenant_id = "db_shutdown_#{System.unique_integer([:positive])}_#{random_suffix}"

    {:ok, _} =
      Supavisor.Tenants.create_tenant(%{
        db_database: "postgres",
        db_host: "localhost",
        db_port: @db_port,
        external_id: tenant_id,
        require_user: true,
        default_parameter_status: %{"server_version" => "15.0"},
        upstream_ssl: false,
        enforce_ssl: false,
        users: [
          %{
            "db_user" => "postgres",
            "db_password" => "postgres",
            "pool_size" => 3,
            "mode_type" => "transaction",
            "is_manager" => true
          }
        ]
      })

    on_exit(fn ->
      stop_container()
      Supavisor.Tenants.delete_tenant_by_external_id(tenant_id)
    end)

    %{tenant_id: tenant_id}
  end

  test "in-progress transaction completes and new connections are rejected when db shuts down",
       %{tenant_id: tenant_id} do
    {:ok, proxy} =
      start_supervised(
        SingleConnection.child_spec(
          hostname: "localhost",
          port: Application.get_env(:supavisor, :proxy_port_transaction),
          database: "postgres",
          password: "postgres",
          username: "postgres.#{tenant_id}",
          sync_connect: true
        )
      )

    assert {:ok, %P.Result{}} = SingleConnection.query(proxy, "SELECT 1")

    query_task =
      Task.async(fn ->
        SingleConnection.query(proxy, "BEGIN")
        SingleConnection.query(proxy, "SELECT pg_sleep(4)")
      end)

    :timer.sleep(1000)

    shutdown_task = Task.async(fn -> pg_smart_shutdown() end)
    :timer.sleep(1000)

    # New queries should be rejected (smart shutdown blocks new upstream connections)
    {:ok, new_conn} =
      start_supervised(
        SingleConnection.child_spec(
          hostname: "localhost",
          port: Application.get_env(:supavisor, :proxy_port_transaction),
          database: "postgres",
          password: "postgres",
          username: "postgres.#{tenant_id}",
          sync_connect: true
        )
      )

    assert {:error, %Postgrex.Error{postgres: %{code: :cannot_connect_now}}} =
             SingleConnection.query(new_conn, "SELECT 1")

    # In-progress transaction should complete successfully
    assert {:ok, %P.Result{}} = Task.await(query_task, 10_000)
    Task.await(shutdown_task, 10_000)
  end

  test "session mode connection fails when db shuts down",
       %{tenant_id: tenant_id} do
    {:ok, proxy} =
      start_supervised(
        SingleConnection.child_spec(
          hostname: "localhost",
          port: Application.get_env(:supavisor, :proxy_port_session),
          database: "postgres",
          password: "postgres",
          username: "postgres.#{tenant_id}",
          sync_connect: true
        )
      )

    SingleConnection.query(proxy, "BEGIN")
    Task.async(fn -> pg_smart_shutdown() end)
    :timer.sleep(1000)

    assert {:error, {%Postgrex.Error{postgres: %{code: :cannot_connect_now}}, _}} =
             start_supervised(
               SingleConnection.child_spec(
                 hostname: "localhost",
                 port: Application.get_env(:supavisor, :proxy_port_session),
                 database: "postgres",
                 password: "postgres",
                 username: "postgres.#{tenant_id}",
                 sync_connect: true
               )
             )
  end

  test "fast shutdown: what does postgres send on the wire before closing",
       %{tenant_id: tenant_id} do
    {:ok, proxy} =
      start_supervised(
        SingleConnection.child_spec(
          hostname: "localhost",
          port: Application.get_env(:supavisor, :proxy_port_transaction),
          database: "postgres",
          password: "postgres",
          username: "postgres.#{tenant_id}",
          sync_connect: true
        )
      )

    assert {:ok, %P.Result{}} = SingleConnection.query(proxy, "SELECT 1")

    query_task =
      Task.async(fn ->
        SingleConnection.query(proxy, "BEGIN")
        SingleConnection.query(proxy, "SELECT pg_sleep(4)")
      end)

    :timer.sleep(1000)

    stop_container()

    # Fast shutdown terminates in-progress connections with admin_shutdown
    assert {:error, %Postgrex.Error{postgres: %{code: :admin_shutdown}}} =
             Task.await(query_task, 10_000)
  end

  defp start_container do
    {output, exit_code} =
      System.cmd("docker", ["compose", "up", "-d"],
        stderr_to_stdout: true,
        cd: @compose_dir
      )

    if exit_code != 0, do: raise("Failed to start Docker Compose: #{output}")
  end

  defp remove_container do
    System.cmd("docker", ["compose", "down", "-v"],
      stderr_to_stdout: true,
      cd: @compose_dir
    )
  end

  defp pg_smart_shutdown do
    {output, exit_code} =
      System.cmd(
        "docker",
        [
          "compose",
          "exec",
          "-T",
          "-u",
          "postgres",
          "db",
          "pg_ctl",
          "stop",
          "-m",
          "smart",
          "-D",
          "/var/lib/postgresql/data"
        ],
        stderr_to_stdout: true,
        cd: @compose_dir
      )

    {output, exit_code}
  end

  defp stop_container do
    System.cmd("docker", ["compose", "stop", "db"],
      stderr_to_stdout: true,
      cd: @compose_dir
    )
  end

  defp wait_for_postgres(max_attempts \\ 30, delay_ms \\ 1000) do
    Enum.reduce_while(1..max_attempts, nil, fn attempt, _acc ->
      {_output, exit_code} =
        System.cmd(
          "docker",
          ["compose", "exec", "-T", "db", "pg_isready", "-U", "postgres"],
          stderr_to_stdout: true,
          cd: @compose_dir
        )

      if exit_code == 0 do
        {:halt, :ok}
      else
        if attempt == max_attempts do
          raise "PostgreSQL failed to start after #{max_attempts} attempts"
        else
          Process.sleep(delay_ms)
          {:cont, nil}
        end
      end
    end)
  end
end
