defmodule Supavisor.Integration.CircuitBreakerClusterTest do
  use Supavisor.DataCase, async: false

  require Logger

  alias Supavisor.CircuitBreaker
  alias Supavisor.Errors.CircuitBreakerError
  alias Supavisor.Support.Cluster
  alias Supavisor.Support.Cluster.PortConfig

  setup do
    :ets.delete_all_objects(Supavisor.CircuitBreaker.Blocks)
    :ets.delete_all_objects(Supavisor.CircuitBreaker.Windows)
    :ok
  end

  defp start_test_node1,
    do:
      Cluster.start_node_unclustered(
        :test_node_1,
        %PortConfig{
          proxy_port_transaction: 7658,
          proxy_port_session: 7659,
          proxy_port: 7660,
          session_proxy_ports: [13_100, 13_101, 13_102, 13_103],
          transaction_proxy_ports: [13_104, 13_105, 13_106, 13_107]
        }
      )

  defp start_test_node2,
    do:
      Cluster.start_node_unclustered(
        :test_node_2,
        %PortConfig{
          proxy_port_transaction: 7661,
          proxy_port_session: 7662,
          proxy_port: 7663,
          session_proxy_ports: [14_100, 14_101, 14_102, 14_103],
          transaction_proxy_ports: [14_104, 14_105, 14_106, 14_107]
        }
      )

  defp cluster_nodes!(node1, node2) do
    Node.connect(node1)
    Node.connect(node2)
    assert node1 in Node.list()
    assert node2 in Node.list()
  end

  @tag cluster: true
  test "auth_error ban propagates across cluster nodes" do
    {:ok, peer1, node1} = start_test_node1()
    {:ok, peer2, node2} = start_test_node2()
    cluster_nodes!(node1, node2)

    key = {"tenant1", "192.168.1.100"}

    for _ <- 1..10 do
      CircuitBreaker.record_failure(key, :auth_error)
    end

    :timer.sleep(500)

    assert {:error, %CircuitBreakerError{blocked_until: blocked_until}} =
             CircuitBreaker.check(key, :auth_error)

    for peer <- [peer1, peer2] do
      assert {:error, %CircuitBreakerError{blocked_until: ^blocked_until}} =
               :peer.call(peer, CircuitBreaker, :check, [key, :auth_error])
    end
  end

  @tag cluster: true
  test "opened/2 returns bans recorded across the cluster" do
    {:ok, peer1, node1} = Cluster.start_node(:test_node_1)
    Node.connect(node1)

    key1 = {"tenant1", "192.168.1.100"}
    key2 = {"tenant1", "192.168.1.101"}

    for _ <- 1..10 do
      CircuitBreaker.record_failure(key1, :auth_error)
      :peer.call(peer1, CircuitBreaker, :record_failure, [key2, :auth_error])
    end

    assert [_, _] = bans = CircuitBreaker.opened({"tenant1", :_}, :auth_error)

    assert Enum.sort(bans) ==
             :peer.call(peer1, CircuitBreaker, :opened, [{"tenant1", :_}, :auth_error])
             |> Enum.sort()
  end

  @tag cluster: true
  test "clear/1 removes ban from all nodes" do
    {:ok, peer1, node1} = start_test_node1()
    {:ok, peer2, node2} = start_test_node2()
    cluster_nodes!(node1, node2)

    key = {"tenant1", "192.168.1.100"}

    for _ <- 1..10 do
      CircuitBreaker.record_failure(key, :auth_error)
    end

    assert {:error, %CircuitBreakerError{}} = CircuitBreaker.check(key, :auth_error)

    for peer <- [peer1, peer2] do
      assert {:error, %CircuitBreakerError{}} =
               :peer.call(peer, CircuitBreaker, :check, [key, :auth_error])
    end

    CircuitBreaker.clear(key, :auth_error)

    assert :ok == CircuitBreaker.check(key, :auth_error)

    for peer <- [peer1, peer2] do
      assert :ok = :peer.call(peer, CircuitBreaker, :check, [key, :auth_error])
    end
  end

  @tag cluster: true
  test "record_failure/1 sets ban on all nodes" do
    {:ok, peer1, node1} = start_test_node1()
    {:ok, peer2, node2} = start_test_node2()
    cluster_nodes!(node1, node2)

    key = {"tenant1", "192.168.1.100"}

    for _ <- 1..10 do
      CircuitBreaker.record_failure(key, :auth_error)
    end

    assert {:error, %CircuitBreakerError{blocked_until: blocked_until}} =
             CircuitBreaker.check(key, :auth_error)

    for peer <- [peer1, peer2] do
      assert {:error, %CircuitBreakerError{blocked_until: ^blocked_until}} =
               :peer.call(peer, CircuitBreaker, :check, [key, :auth_error])
    end
  end
end
