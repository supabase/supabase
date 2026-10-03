defmodule Supavisor.Integration.ScramIterationsTest do
  use Supavisor.DataCase, async: false

  alias Postgrex, as: P

  @password "scram_iterations_password"
  @tenant "is_manager"

  setup do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)
    role = "scram_iterations_user_#{System.unique_integer([:positive])}"

    {:ok, origin} = connect_origin(db_conf)

    on_exit(fn ->
      {:ok, cleanup} = connect_origin(db_conf)
      Postgrex.query!(cleanup, "DROP ROLE IF EXISTS #{role};", [])
    end)

    %{db_conf: db_conf, origin: origin, role: role}
  end

  test "authenticates with a non-default iteration count", ctx do
    create_role(ctx.origin, ctx.role, 10_000)

    assert {:ok, pid} = connect_to_proxy(ctx.db_conf, ctx.role)
    assert {:ok, %P.Result{rows: [["1"]]}} = SingleConnection.query(pid, "SELECT 1")
  end

  test "rejects users with an iteration count above the limit", ctx do
    create_role(ctx.origin, ctx.role, 32_769)

    assert {:error, %P.Error{postgres: %{severity: "FATAL", message: message}}} =
             connect_to_proxy(ctx.db_conf, ctx.role)

    assert message =~ "SCRAM secret iteration count 32769 exceeds the maximum of 32768"
  end

  defp create_role(conn, role, iterations) do
    salt = :crypto.strong_rand_bytes(16)
    salted_password = :pgo_scram.hi(@password, salt, iterations)
    stored_key = :pgo_scram.h(:pgo_scram.hmac(salted_password, "Client Key"))
    server_key = :pgo_scram.hmac(salted_password, "Server Key")

    verifier =
      "SCRAM-SHA-256$#{iterations}:#{Base.encode64(salt)}$" <>
        "#{Base.encode64(stored_key)}:#{Base.encode64(server_key)}"

    Postgrex.query!(conn, "CREATE ROLE #{role} WITH LOGIN PASSWORD '#{verifier}';", [])
  end

  defp connect_to_proxy(db_conf, role) do
    with {:error, {error, _}} <-
           start_supervised(
             {SingleConnection,
              hostname: db_conf[:hostname],
              port: Application.get_env(:supavisor, :proxy_port_transaction),
              database: db_conf[:database],
              username: "#{role}.#{@tenant}",
              password: @password,
              pool_size: 1}
           ) do
      {:error, error}
    end
  end

  defp connect_origin(db_conf) do
    Postgrex.start_link(
      hostname: db_conf[:hostname],
      port: db_conf[:port],
      database: db_conf[:database],
      password: db_conf[:password],
      username: db_conf[:username]
    )
  end
end
