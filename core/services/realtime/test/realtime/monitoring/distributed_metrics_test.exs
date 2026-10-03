defmodule Realtime.DistributedMetricsTest do
  # Async false due to Clustered usage
  use ExUnit.Case, async: false

  alias Realtime.DistributedMetrics

  setup_all do
    {:ok, node} = Clustered.start()
    %{node: node}
  end

  describe "info/0 while connected" do
    test "per node metric", %{node: node} do
      assert %{
               ^node => %{
                 pid: _pid,
                 port: _port,
                 queue_size: {:ok, _},
                 state: :up,
                 inet_stats: [
                   recv_oct: _,
                   recv_cnt: _,
                   recv_max: _,
                   recv_avg: _,
                   recv_dvi: _,
                   send_oct: _,
                   send_cnt: _,
                   send_max: _,
                   send_avg: _,
                   send_pend: _
                 ]
               }
             } = DistributedMetrics.info()
    end
  end
end
