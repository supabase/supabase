defmodule Supavisor.Integration.ClientIdleTimeoutTest do
  use Supavisor.DataCase, async: false

  alias Supavisor.Support.ProtocolClient

  @moduletag :integration

  @idle_timeout_ms 1000

  setup do
    %{db_conf: Application.get_env(:supavisor, Supavisor.Repo)}
  end

  test "server disconnects a client that sits idle past client_idle_timeout", %{db_conf: db_conf} do
    sock = db_conf |> idle_tenant() |> connect()

    assert {:error, :closed} = :gen_tcp.recv(sock, 0, @idle_timeout_ms * 5)
  end

  # Creates a require_user tenant with client_idle_timeout set.
  defp idle_tenant(db_conf) do
    suffix = :crypto.strong_rand_bytes(6) |> Base.encode16(case: :lower)
    tenant_id = "idle_timeout_#{System.unique_integer([:positive])}_#{suffix}"

    {:ok, _} =
      Supavisor.Tenants.create_tenant(%{
        db_host: db_conf[:hostname],
        db_port: db_conf[:port],
        db_database: db_conf[:database],
        external_id: tenant_id,
        require_user: true,
        default_parameter_status: %{"server_version" => "15.0"},
        client_idle_timeout: @idle_timeout_ms,
        client_heartbeat_interval: 0,
        users: [
          %{
            "db_user" => db_conf[:username],
            "db_password" => db_conf[:password],
            "pool_size" => 2,
            "max_clients" => 10,
            "mode_type" => "transaction",
            "is_manager" => true
          }
        ]
      })

    on_exit(fn -> Supavisor.Tenants.delete_tenant_by_external_id(tenant_id) end)

    %{
      tenant: tenant_id,
      port: Application.get_env(:supavisor, :proxy_port_transaction),
      user: db_conf[:username],
      password: db_conf[:password]
    }
  end

  defp connect(%{tenant: tenant, port: port, user: user, password: password}) do
    {:ok, sock} = :gen_tcp.connect(~c"127.0.0.1", port, [:binary, active: false])
    ProtocolClient.authenticate(sock, "#{user}.#{tenant}", password)
    sock
  end
end
