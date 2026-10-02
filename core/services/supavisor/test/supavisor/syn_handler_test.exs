defmodule Supavisor.SynHandlerTest do
  use ExUnit.Case, async: false
  import ExUnit.CaptureLog
  require Logger
  require Supavisor
  alias Ecto.Adapters.SQL.Sandbox
  alias Supavisor.Support.Cluster

  @id Supavisor.id(
        type: :single,
        tenant: "syn_tenant",
        user: "postgres",
        mode: :session,
        db: "postgres"
      )

  @id_local_wins Supavisor.id(
                   type: :single,
                   tenant: "syn_tenant_local_wins",
                   user: "postgres",
                   mode: :session,
                   db: "postgres"
                 )

  @tag cluster: true
  test "resolving conflict" do
    {:ok, peer, node2} = Cluster.start_node_unclustered(:peer.random_name())

    secret = %Supavisor.Secrets.PasswordSecrets{
      user: "postgres",
      password: "postgres"
    }

    {:ok, pid2} = :peer.call(peer, Supavisor.FixturesHelpers, :start_pool, [@id, secret])
    assert :peer.call(peer, Supavisor, :get_global_sup, [@id]) == pid2
    assert node(pid2) == node2

    assert nil == Supavisor.get_global_sup(@id)
    {:ok, pid1} = Supavisor.start(@id, secret)
    assert pid1 == Supavisor.get_global_sup(@id)
    assert node(pid1) == node()

    log =
      capture_log(fn ->
        true = Node.connect(node2)
        Process.sleep(500)
      end)

    assert log =~ "SynHandler: resolving"
    assert log =~ ~s(tenant: "syn_tenant")
    assert log =~ "SynHandler: Resolving"
    assert log =~ "conflict, stop local pid"
    assert log =~ "project=syn_tenant"
    assert log =~ "user=postgres"
    assert log =~ "mode=session"

    assert pid2 == Supavisor.get_global_sup(@id)
    assert node(pid2) == node2
  end

  @tag cluster: true
  test "resolving conflict, local pid wins" do
    {:ok, peer, node2} = Cluster.start_node_unclustered(:peer.random_name())

    secret = %Supavisor.Secrets.PasswordSecrets{
      user: "postgres",
      password: "postgres"
    }

    # Register the local pid first so it gets the earlier timestamp, making
    # it the pid that's kept and forcing the remote (peer) pid to be stopped.
    assert nil == Supavisor.get_global_sup(@id_local_wins)
    {:ok, pid_local} = Supavisor.start(@id_local_wins, secret)
    assert pid_local == Supavisor.get_global_sup(@id_local_wins)
    assert node(pid_local) == node()

    {:ok, pid_remote} =
      :peer.call(peer, Supavisor.FixturesHelpers, :start_pool, [@id_local_wins, secret])

    assert :peer.call(peer, Supavisor, :get_global_sup, [@id_local_wins]) == pid_remote
    assert node(pid_remote) == node2

    log =
      capture_log(fn ->
        true = Node.connect(node2)
        Process.sleep(500)
      end)

    assert log =~ "SynHandler: resolving"
    assert log =~ ~s(tenant: "syn_tenant_local_wins")
    assert log =~ "SynHandler: Resolving"
    assert log =~ "conflict, remote pid"
    assert log =~ "project=syn_tenant_local_wins"
    assert log =~ "user=postgres"
    assert log =~ "mode=session"

    assert pid_local == Supavisor.get_global_sup(@id_local_wins)
    assert node(pid_local) == node()
  end

  setup tags do
    pid = Sandbox.start_owner!(Supavisor.Repo, shared: not tags[:async])
    on_exit(fn -> Sandbox.stop_owner(pid) end)
    :ok
  end
end
