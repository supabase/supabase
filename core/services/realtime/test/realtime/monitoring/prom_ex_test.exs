defmodule Realtime.PromExTest do
  use ExUnit.Case, async: true
  doctest Realtime.PromEx
  alias Realtime.Nodes
  alias Realtime.PromEx

  describe "get_metrics/0" do
    test "builds metrics in prometheus format which includes host region and id" do
      metrics = PromEx.get_metrics() |> IO.iodata_to_binary()
      [_name, host] = node() |> Atom.to_string() |> String.split("@", parts: 2)
      id = Nodes.short_node_id_from_name(node())

      assert String.contains?(
               metrics,
               "# HELP beam_system_schedulers_online_info The number of scheduler threads that are online."
             )

      assert String.contains?(metrics, "# TYPE beam_system_schedulers_online_info gauge")

      assert String.contains?(
               metrics,
               "beam_system_schedulers_online_info{host=\"#{host}\",id=\"#{id}\",region=\"us-east-1\"}"
             )
    end
  end
end
