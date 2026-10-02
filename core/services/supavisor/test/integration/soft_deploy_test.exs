defmodule Supavisor.SoftDeployTest do
  use Supavisor.DataCase, async: false

  setup do
    db_conf = Application.get_env(:supavisor, Supavisor.Repo)

    {:ok, proxy} =
      start_supervised(
        {Postgrex,
         [
           hostname: db_conf[:hostname],
           port: Application.get_env(:supavisor, :proxy_port_transaction),
           database: db_conf[:database],
           password: db_conf[:password],
           username: db_conf[:username] <> ".proxy_tenant_ps_enabled"
         ]}
      )

    _ = Postgrex.query!(proxy, "SELECT 1", [])

    :ok
  end

  test "relevant workers are updated" do
    supervised_procs = :release_handler_1.get_supervised_procs()

    for module <- [
          Supavisor.ClientHandler,
          Supavisor.Manager,
          Supavisor.SecretChecker,
          Supavisor.Terminator,
          Supavisor.DbHandler
        ] do
      assert Enum.any?(supervised_procs, fn {_, _, _, modules} = t ->
               modules == [module]
             end)
    end
  end
end
