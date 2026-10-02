defmodule Supavisor.Integration.PromExClusterTest do
  use Supavisor.DataCase, async: false

  require Logger

  alias Supavisor.Monitoring.PromEx
  alias Supavisor.Support.Cluster
  alias Supavisor.Support.Cluster.PortConfig

  defp start_test_node1,
    do:
      Cluster.start_node_unclustered(
        :test_node_1,
        %PortConfig{
          proxy_port_transaction: 7668,
          proxy_port_session: 7669,
          proxy_port: 7670,
          session_proxy_ports: [15_100, 15_101, 15_102, 15_103],
          transaction_proxy_ports: [15_104, 15_105, 15_106, 15_107]
        }
      )

  defp start_test_node2,
    do:
      Cluster.start_node_unclustered(
        :test_node_2,
        %PortConfig{
          proxy_port_transaction: 7671,
          proxy_port_session: 7672,
          proxy_port: 7673,
          session_proxy_ports: [16_100, 16_101, 16_102, 16_103],
          transaction_proxy_ports: [16_104, 16_105, 16_106, 16_107]
        }
      )

  defp cluster_nodes!(node1, node2) do
    Node.connect(node1)
    Node.connect(node2)
    assert node1 in Node.list()
    assert node2 in Node.list()
  end

  @tag cluster: true
  test "metrics collection works across cluster" do
    {:ok, _peer1, node1} = start_test_node1()
    {:ok, _peer2, node2} = start_test_node2()
    cluster_nodes!(node1, node2)

    metrics = IO.iodata_to_binary(PromEx.fetch_cluster_metrics())

    # Assert we have metrics from the primary node (region=eu)
    assert metrics =~
             ~s(supavisor_prom_ex_beam_system_logical_processors_online_info{az="nil",instance_id="nil",location="eu",nodehost="nohost",region="eu")

    # Assert we have metrics from test nodes (region=usa)
    assert metrics =~
             ~s(supavisor_prom_ex_beam_system_logical_processors_online_info{az="ap-southeast-1c",instance_id="nil",location="usa",nodehost="127.0.0.1",region="usa")

    assert String.ends_with?(metrics, "# EOF\n")
  end

  @tag cluster: true
  test "tenant metrics collection works across cluster" do
    {:ok, _peer1, node1} = start_test_node1()
    {:ok, _peer2, node2} = start_test_node2()
    cluster_nodes!(node1, node2)

    metrics = IO.iodata_to_binary(PromEx.fetch_cluster_tenant_metrics("test_tenant"))
    assert String.ends_with?(metrics, "# EOF\n")
  end
end
