defmodule TestEnvTest do
  # async: false — the run tag tests swap :realtime app env that Clustered and TestTenantDb
  # read while tests run.
  use ExUnit.Case, async: false

  # config/test.exs derives the suffix and the node name from the same claimed port, so a run
  # simulated here has to move both of them together.
  defp put_node_suffix(suffix) do
    original_suffix = Application.fetch_env!(:realtime, :test_node_suffix)
    original_name = Application.fetch_env!(:realtime, :test_node_name)

    Application.put_env(:realtime, :test_node_suffix, suffix)
    Application.put_env(:realtime, :test_node_name, :"main#{suffix}@127.0.0.1")

    on_exit(fn ->
      Application.put_env(:realtime, :test_node_suffix, original_suffix)
      Application.put_env(:realtime, :test_node_name, original_name)
    end)
  end

  describe "node_name/0 and peer names" do
    test "the first run on a machine looks exactly like it did before run tags existed" do
      put_node_suffix("")

      assert TestEnv.node_name() == :"main@127.0.0.1"
      assert TestEnv.peer_name(:us_node) == :us_node
      assert TestEnv.peer_node(:us_node) == :"us_node@127.0.0.1"
    end

    test "a second run tags its node and its peers with its endpoint port" do
      put_node_suffix("_4003")

      assert TestEnv.node_name() == :"main_4003@127.0.0.1"
      assert TestEnv.peer_name(:us_node) == :us_node_4003
      assert TestEnv.peer_node(:us_node) == :"us_node_4003@127.0.0.1"
    end

    test "peers stay sorted around the local node name so syn conflict resolution is stable" do
      put_node_suffix("_4003")

      assert TestEnv.peer_node(:atest) < TestEnv.node_name()
      assert TestEnv.peer_node(:test) > TestEnv.node_name()
    end
  end

  describe "peer_http_port/1 and peer_gen_rpc_port/1" do
    test "a peer keeps one slot in both port ranges" do
      assert TestEnv.peer_http_port(:ap2_nodeX) - TestEnv.peer_http_port() ==
               TestEnv.peer_gen_rpc_port(:ap2_nodeX) - TestEnv.peer_gen_rpc_port()
    end

    test "every peer owns a distinct port" do
      http = Enum.map(TestEnv.peers(), &TestEnv.peer_http_port/1)
      gen_rpc = Enum.map(TestEnv.peers(), &TestEnv.peer_gen_rpc_port/1)

      assert length(Enum.uniq(http)) == length(TestEnv.peers())
      assert length(Enum.uniq(gen_rpc)) == length(TestEnv.peers())
      assert Enum.empty?(MapSet.intersection(MapSet.new(http), MapSet.new(gen_rpc)))
    end

    test "the ports this run claimed are the ones it hands out" do
      assert TestEnv.peer_http_port() == Application.fetch_env!(:realtime, :test_peer_http_base)
      assert TestEnv.peer_gen_rpc_port() == Application.fetch_env!(:realtime, :test_peer_gen_rpc_base)
    end

    test "every peer fits in the band a run reserves" do
      assert length(TestEnv.peers()) <= Application.fetch_env!(:realtime, :test_peer_ports_per_run)
    end

    test "raise on an unregistered peer" do
      assert_raise ArgumentError, ~r/unknown peer :nope/, fn -> TestEnv.peer_http_port(:nope) end
      assert_raise ArgumentError, ~r/unknown peer :nope/, fn -> TestEnv.peer_gen_rpc_port(:nope) end
    end
  end
end
