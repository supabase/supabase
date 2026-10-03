defmodule RealtimeWeb.StatusLive.IndexTest do
  use RealtimeWeb.ConnCase, async: true
  import Phoenix.LiveViewTest

  alias Realtime.Latency.Payload
  alias Realtime.Nodes
  alias RealtimeWeb.Endpoint
  alias RealtimeWeb.StatusLive.Index

  @self Nodes.short_node_id_from_name(Node.self())

  describe "Status LiveView" do
    test "renders cluster health page", %{conn: conn} do
      {:ok, _view, html} = live(conn, ~p"/status")

      assert html =~ "Realtime Cluster Health"
      assert html =~ @self
    end

    test "receives a broadcast and shows the node's region", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/status")

      payload = %Payload{
        from_node: @self,
        from_region: "us-east-1",
        node: @self,
        region: "us-east-1",
        latency: 42.0,
        response: {:ok, {:pong, "us-east-1"}},
        timestamp: DateTime.utc_now()
      }

      Endpoint.broadcast("admin:cluster", "ping", payload)

      send(view.pid, :flush)
      html = render(view)
      assert html =~ "region: us-east-1"
    end

    test "renders are throttled until the flush timer fires", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/status")

      payload = %Payload{
        from_node: @self,
        from_region: "us-east-1",
        node: @self,
        region: "us-east-1",
        latency: 42.0,
        response: {:ok, {:pong, "us-east-1"}},
        timestamp: DateTime.utc_now()
      }

      Endpoint.broadcast("admin:cluster", "ping", payload)

      refute render(view) =~ "region: us-east-1"

      send(view.pid, :flush)
      assert render(view) =~ "region: us-east-1"
    end
  end

  describe "node_status/3" do
    test "ok when every non-self pair is healthy" do
      pair_status = %{
        "a_b" => %{status: :ok},
        "b_a" => %{status: :ok}
      }

      assert Index.node_status("a", ["a", "b"], pair_status) == :ok
    end

    test "error when a majority of incoming pairs are unreachable (node is down)" do
      pair_status =
        %{"b_a" => %{status: :error}, "c_a" => %{status: :error}, "d_a" => %{status: :ok}}
        |> Map.merge(%{"a_b" => %{status: :ok}, "a_c" => %{status: :ok}, "a_d" => %{status: :ok}})

      assert Index.node_status("a", ["a", "b", "c", "d"], pair_status) == :error
    end

    test "stale when a majority of outgoing pairs are stale (node went silent)" do
      pair_status =
        %{"a_b" => %{status: :stale}, "a_c" => %{status: :stale}, "a_d" => %{status: :ok}}
        |> Map.merge(%{"b_a" => %{status: :ok}, "c_a" => %{status: :ok}, "d_a" => %{status: :ok}})

      assert Index.node_status("a", ["a", "b", "c", "d"], pair_status) == :stale
    end

    test "a single slow link does NOT flip an otherwise-healthy node (stays ok)" do
      pair_status =
        for other <- ["b", "c", "d", "e"], into: %{} do
          {"a_#{other}", %{status: if(other == "b", do: :warning, else: :ok)}}
        end
        |> Map.merge(for(other <- ["b", "c", "d", "e"], into: %{}, do: {"#{other}_a", %{status: :ok}}))

      assert Index.node_status("a", ["a", "b", "c", "d", "e"], pair_status) == :ok
    end

    test "warning when a majority of the node's outgoing links are slow" do
      pair_status = %{
        "a_b" => %{status: :warning},
        "a_c" => %{status: :warning},
        "b_a" => %{status: :ok},
        "c_a" => %{status: :ok}
      }

      assert Index.node_status("a", ["a", "b", "c"], pair_status) == :warning
    end

    test "self-pings are excluded from the rollup" do
      pair_status = %{
        "a_a" => %{status: :error},
        "a_b" => %{status: :ok},
        "b_a" => %{status: :ok}
      }

      assert Index.node_status("a", ["a", "b"], pair_status) == :ok
    end

    test "unknown when there is no data yet" do
      assert Index.node_status("a", ["a", "b"], %{}) == :unknown
    end
  end

  describe "apply_staleness/2" do
    test "flips a pair to :stale once it exceeds two ping intervals without an update" do
      now = DateTime.utc_now()
      old = DateTime.add(now, -31_000, :millisecond)

      pair_status = %{
        "a_b" => %{from: "a", to: "b", latency: 5.0, status: :ok, updated_at: old}
      }

      assert %{"a_b" => %{status: :stale}} = Index.apply_staleness(pair_status, now)
    end

    test "leaves a recently-updated pair untouched" do
      now = DateTime.utc_now()
      recent = DateTime.add(now, -1_000, :millisecond)

      pair_status = %{
        "a_b" => %{from: "a", to: "b", latency: 5.0, status: :ok, updated_at: recent}
      }

      assert %{"a_b" => %{status: :ok}} = Index.apply_staleness(pair_status, now)
    end

    test "leaves never-updated pairs untouched with no reference start time" do
      pair_status = %{
        "a_b" => %{from: "a", to: "b", latency: nil, status: :unknown, updated_at: nil}
      }

      assert Index.apply_staleness(pair_status, DateTime.utc_now()) == pair_status
    end

    test "a pair that never reported even once eventually goes stale too" do
      now = DateTime.utc_now()
      mounted_at = DateTime.add(now, -31_000, :millisecond)

      pair_status = %{
        "a_b" => %{from: "a", to: "b", latency: nil, status: :unknown, updated_at: nil}
      }

      assert %{"a_b" => %{status: :stale}} = Index.apply_staleness(pair_status, now, mounted_at)
    end

    test "does not flag a never-reported pair as stale before two ping cycles have passed" do
      now = DateTime.utc_now()
      mounted_at = DateTime.add(now, -1_000, :millisecond)

      pair_status = %{
        "a_b" => %{from: "a", to: "b", latency: nil, status: :unknown, updated_at: nil}
      }

      assert %{"a_b" => %{status: :unknown}} = Index.apply_staleness(pair_status, now, mounted_at)
    end
  end

  describe "problem_pairs/3" do
    test "excludes healthy, unknown, and self pairs" do
      pair_status = %{
        "a_a" => %{from: "a", to: "a", status: :error, latency: nil},
        "a_b" => %{from: "a", to: "b", status: :ok, latency: 5.0},
        "a_c" => %{from: "a", to: "c", status: :unknown, latency: nil},
        "a_d" => %{from: "a", to: "d", status: :error, latency: nil}
      }

      {problems, overflow} = Index.problem_pairs(pair_status, %{})

      assert overflow == 0
      assert Enum.map(problems, & &1.to) == ["d"]
    end

    test "caps the list and reports how many were dropped, even with a huge cluster" do
      pair_status =
        for n <- 1..300, into: %{} do
          {"a_node#{n}", %{from: "a", to: "node#{n}", status: :warning, latency: n * 1.0}}
        end

      {problems, overflow} = Index.problem_pairs(pair_status, %{})

      assert length(problems) == 200
      assert overflow == 100
    end

    test "sort_by latency orders worst-first" do
      pair_status = %{
        "a_b" => %{from: "a", to: "b", status: :warning, latency: 10.0},
        "a_c" => %{from: "a", to: "c", status: :warning, latency: 999.0}
      }

      {[first, second], _overflow} = Index.problem_pairs(pair_status, %{}, "latency")

      assert first.to == "c"
      assert second.to == "b"
    end
  end

  describe "visible_nodes/5" do
    test "fuzzy-filters by region substring" do
      node_regions = %{"a" => "us-east-1", "b" => "eu-west-1", "c" => "us-west-2"}

      assert Index.visible_nodes(["a", "b", "c"], node_regions, %{}, "us-", "node") == ["a", "c"]
    end

    test "sorts by region" do
      node_regions = %{"a" => "us-east-1", "b" => "eu-west-1"}

      assert Index.visible_nodes(["a", "b"], node_regions, %{}, "", "region") == ["b", "a"]
    end
  end

  describe "region_pair_stats/4" do
    test "averages latency across every node pair between two regions" do
      node_regions = %{"a" => "us-east-1", "b" => "us-east-1", "c" => "eu-west-1"}

      pair_status = %{
        "a_c" => %{from: "a", to: "c", status: :ok, latency: 100.0},
        "b_c" => %{from: "b", to: "c", status: :ok, latency: 200.0}
      }

      stats = Index.region_pair_stats(pair_status, node_regions, "us-east-1", "eu-west-1")

      assert stats.avg_latency == 150.0
      assert stats.sample_size == 2
    end

    test "region status is majority-based, so a minority of bad links keeps the region healthy" do
      node_regions = %{"a" => "us-east-1", "b" => "us-east-1", "c" => "eu-west-1", "d" => "eu-west-1"}

      pair_status = %{
        "a_c" => %{from: "a", to: "c", status: :ok, latency: 100.0},
        "a_d" => %{from: "a", to: "d", status: :ok, latency: 120.0},
        "b_c" => %{from: "b", to: "c", status: :error, latency: nil}
      }

      stats = Index.region_pair_stats(pair_status, node_regions, "us-east-1", "eu-west-1")

      assert stats.status == :ok
      assert stats.avg_latency == 110.0
    end

    test "region status goes error when a majority of links to the region fail" do
      node_regions = %{"a" => "us-east-1", "b" => "us-east-1", "c" => "eu-west-1"}

      pair_status = %{
        "a_c" => %{from: "a", to: "c", status: :error, latency: 0.0},
        "b_c" => %{from: "b", to: "c", status: :error, latency: 0.0}
      }

      stats = Index.region_pair_stats(pair_status, node_regions, "us-east-1", "eu-west-1")

      assert stats.status == :error
      assert stats.avg_latency == nil
    end

    test "excludes failed/stale probe latencies from the average" do
      node_regions = %{"a" => "us-east-1", "b" => "us-east-1", "c" => "eu-west-1"}

      pair_status = %{
        # an unreachable probe still carries a fail-time latency that must NOT be averaged in
        "a_c" => %{from: "a", to: "c", status: :error, latency: 0.0},
        "b_c" => %{from: "b", to: "c", status: :ok, latency: 120.0}
      }

      stats = Index.region_pair_stats(pair_status, node_regions, "us-east-1", "eu-west-1")

      assert stats.avg_latency == 120.0
    end

    test "avg_latency is nil (falls back to status label) when no probe succeeded" do
      node_regions = %{"a" => "us-east-1", "c" => "eu-west-1"}
      pair_status = %{"a_c" => %{from: "a", to: "c", status: :error, latency: 0.0}}

      stats = Index.region_pair_stats(pair_status, node_regions, "us-east-1", "eu-west-1")

      assert stats.avg_latency == nil
      assert stats.status == :error
    end
  end

  describe "node_pairs/4" do
    test "sorts by worst latency across outgoing/incoming" do
      pair_status = %{
        "a_b" => %{from: "a", to: "b", status: :ok, latency: 5.0},
        "b_a" => %{from: "b", to: "a", status: :ok, latency: 500.0},
        "a_c" => %{from: "a", to: "c", status: :ok, latency: 10.0},
        "c_a" => %{from: "c", to: "a", status: :ok, latency: 20.0}
      }

      [first, second] = Index.node_pairs("a", ["a", "b", "c"], pair_status, "latency")

      assert first.node == "b"
      assert second.node == "c"
    end
  end
end
