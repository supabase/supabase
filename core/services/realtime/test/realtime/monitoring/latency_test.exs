defmodule Realtime.LatencyTest do
  # async: false due to the usage of Clustered mode that interacts with this tests and breaks their expectations
  use Realtime.DataCase, async: false
  alias Realtime.Latency

  describe "pong/0" do
    test "returns pong with region" do
      assert {:ok, {:pong, region}} = Latency.pong()
      assert is_binary(region)
    end
  end

  describe "pong/1" do
    test "returns pong after sleeping for the given latency" do
      assert {:ok, {:pong, _region}} = Latency.pong(0)
    end
  end

  describe "handle_info/2" do
    test "unexpected message does not crash the server" do
      pid = Process.whereis(Latency)
      send(pid, :unexpected_message)
      assert Process.alive?(pid)
    end
  end

  describe "handle_cast/2" do
    test "ping cast triggers a ping and does not crash" do
      pid = Process.whereis(Latency)
      GenServer.cast(pid, {:ping, 0, 5_000, 5_000})
      assert Process.alive?(pid)
    end
  end

  describe "ping/3" do
    setup do
      for node <- Node.list(), do: Node.disconnect(node)
      :ok
    end

    test "returns pong from healthy remote node" do
      {:ok, _node} = Clustered.start()
      results = Latency.ping()
      assert Enum.all?(results, fn {%Task{}, result} -> match?({:ok, %{response: {:ok, {:pong, _}}}}, result) end)
    end

    test "returns pong from slow but healthy remote node" do
      {:ok, _node} = Clustered.start()
      results = Latency.ping(100, 10_000, 30_000)
      assert Enum.all?(results, fn {%Task{}, result} -> match?({:ok, %{response: {:ok, {:pong, _}}}}, result) end)
    end

    test "returns error when remote node exceeds timer timeout" do
      assert [{%Task{}, {:ok, %{response: {:error, :rpc_error, _}}}}] = Latency.ping(500, 100)
    end

    test "returns nil when task does not yield before yield timeout" do
      assert [{%Task{}, nil}] = Latency.ping(1_000, 500, 100)
    end
  end
end
