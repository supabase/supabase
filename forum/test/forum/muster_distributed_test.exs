defmodule Forum.MusterDistributedTest do
  # Real multi-node tests: spin up `:peer` nodes, run Muster on each over the
  # default Erlang-distribution adapter, and exercise discovery + rebalance +
  # the cross-node convergence barrier end-to-end (real `:rebalance_marker`
  # announcements, not injected). The precise barrier *state machine* is covered
  # by the single-node tests in muster_test.exs; this file proves the wiring
  # works across real nodes and that every node converges all the way to
  # :ready (not left stuck in :rebalancing or :converging).
  #
  # BLACK BOX ONLY. Every test here must drive Muster purely through its public
  # surface and real cluster events -- start/stop nodes, join/leave, real process
  # crashes -- and observe outcomes through public reads (persistent_term, the
  # occupancy table) and the snabbkaffe trace. The ONLY sanctioned ways to steer
  # execution are snabbkaffe `force_ordering/1` and `inject_crash/1,2` (both
  # anchored on real `tp` events). NO mocks, and NO reaching inside a process to
  # mutate it: `:sys.replace_state`, hand-set `:persistent_term`s standing in for
  # real convergence, or any other state surgery are forbidden -- they assert on a
  # fiction the running system never actually produces. If a scenario cannot be
  # reached black-box, observe the mechanism via a `tp` rather than fake the state.
  use ExUnit.Case, async: false
  use Snabbkaffex

  alias ExHashRing.Ring
  alias Forum.Muster
  alias Forum.Muster.Scope

  @aux_mod (quote do
              defmodule MusterPeerAux do
                # Start Muster and keep it alive (the supervisor links to this
                # long-lived process, mirroring the Census peer pattern). Extra
                # opts are merged over the defaults so a test can, e.g., shrink
                # the view-heartbeat interval on this peer.
                def start(scope, opts \\ []) do
                  opts = Keyword.merge([vacant_flush_interval_ms: 100], opts)

                  spawn(fn ->
                    {:ok, _} = Forum.Muster.start_link(scope, opts)
                    Process.sleep(:infinity)
                  end)
                end

                def join(scope, group) do
                  pid = spawn(fn -> Process.sleep(:infinity) end)
                  Forum.Muster.join(scope, group, pid)
                end

                # Join then immediately leave the SAME (unlinked) pid, both as
                # ordinary GenServer.calls against the shard, so the group is
                # left genuinely mid-cooldown on THIS node without ever
                # exposing the member pid across the wire.
                def join_and_leave(scope, group) do
                  pid = spawn(fn -> Process.sleep(:infinity) end)
                  :ok = Forum.Muster.join(scope, group, pid)
                  :ok = Forum.Muster.leave(scope, group, pid)
                end

                def status(scope) do
                  :persistent_term.get({Forum.Muster, scope, :status})
                end

                # Gracefully drain this node's router role (Forum.Muster.drain/2).
                def drain(scope, opts \\ []) do
                  Forum.Muster.drain(scope, opts)
                end

                def view_hash(scope) do
                  :persistent_term.get({Forum.Muster, scope, :view_hash})
                end

                # Advance this VM's global monotonic counter by `n`. The
                # occupancy/announce seqs are :erlang.unique_integer([:monotonic]),
                # which starts from the SAME base on every fresh VM, so burning a
                # large amount here makes this incarnation's announce watermark
                # deterministically higher than a same-named restart will ever
                # reach -- forcing the cross-incarnation seq regression.
                def burn(n) do
                  Enum.each(1..n, fn _ -> :erlang.unique_integer([:monotonic]) end)
                  :ok
                end

                # The VM's current monotonic counter value.
                def current_seq, do: :erlang.unique_integer([:monotonic])
              end
            end)

  defp spec(scope, opts) do
    %{id: scope, start: {Muster, :start_link, [scope, opts]}, type: :supervisor}
  end

  defp start_remote_muster(peer, scope), do: start_remote_muster(peer, scope, [])

  defp start_remote_muster(peer, scope, opts) do
    :peer.call(peer, MusterPeerAux, :start, [scope, opts])
  end

  # Start Muster on a peer with a fast view heartbeat, so the heartbeat backstop
  # gets many chances to heal during a test (used by the restart-regression test
  # to prove the heartbeat cannot heal the stuck node).
  defp start_remote_muster_fast_heartbeat(peer, scope) do
    start_remote_muster(peer, scope, view_heartbeat_interval_ms: 200)
  end

  defp status(scope), do: :persistent_term.get({Forum.Muster, scope, :status})
  defp remote_status(peer, scope), do: :peer.call(peer, MusterPeerAux, :status, [scope])

  defp occupancy_on(n, scope, group) when n == node(), do: Scope.occupancy(scope, group)
  defp occupancy_on(n, scope, group), do: :erpc.call(n, Scope, :occupancy, [scope, group])

  # Tolerates the coordinator being transiently unregistered right after a
  # deliberate restart (Process.exit(coord, :kill) + immediate rejoin tests):
  # the OLD pid can already be gone while the supervisor hasn't finished
  # spawning its replacement, so a plain GenServer.call can hit :noproc even
  # though the shard-level state the caller cares about is already settled.
  defp group_state(scope, group, timeout \\ 2_000) do
    deadline = System.monotonic_time(:millisecond) + timeout
    do_group_state(scope, group, deadline)
  end

  defp do_group_state(scope, group, deadline) do
    GenServer.call(Forum.Supervisor.name(scope), :status).group_states[group]
  catch
    :exit, reason ->
      if System.monotonic_time(:millisecond) >= deadline do
        exit(reason)
      else
        Process.sleep(5)
        do_group_state(scope, group, deadline)
      end
  end

  # `group_state/2` read on a remote node `n` (the coordinator's :status folds in
  # every shard's per-group state). A shard that is momentarily down mid-restart
  # is skipped by the gather, so the group reads as nil until it is back.
  defp remote_group_state(n, scope, group) do
    status = :erpc.call(n, GenServer, :call, [Forum.Supervisor.name(scope), :status])
    status.group_states[group]
  end

  # Find a group the LIVE local ring routes to `target` (cluster must be settled).
  defp group_routed_to(scope, target) do
    Enum.find(Stream.map(1..20_000, &:"dist_group_#{&1}"), fn g ->
      match?({:ok, ^target}, Muster.router(scope, g))
    end)
  end

  # Event-driven convergence sync: block until every node in `view` (or
  # `opts[:nodes]`, when only a subset is expected to converge) has emitted its
  # `opts[:nth]`-th (default 1st) :muster_status_change to :ready for `view`'s
  # hash. By the time a node announces :ready for a view its ring IS that view,
  # so this subsumes the old members/status polling. Already-collected events
  # count towards `nth`, which makes `nth: 2` the race-free way to wait for a
  # node to become ready for the same view AGAIN after churn. Requires every
  # waited-on node's trace to be forwarded to this node's collector.
  defp await_ready(view, opts \\ []) do
    nth = Keyword.get(opts, :nth, 1)
    timeout = Keyword.get(opts, :timeout, 15_000)
    view_hash = :erlang.phash2(Enum.sort(view))

    for n <- Keyword.get(opts, :nodes, view) do
      assert {:ok, _} =
               block_until(
                 %{
                   :"$kind" => :muster_status_change,
                   to: :ready,
                   node: ^n,
                   view_hash: ^view_hash
                 },
                 nth,
                 timeout,
                 :infinity
               )
    end

    :ok
  end

  # Plain state polling -- the fallback for conditions with no usable trace
  # anchor (e.g. an event whose occurrence count is nondeterministic).
  defp wait_until(fun, timeout \\ 5_000) do
    deadline = System.monotonic_time(:millisecond) + timeout
    do_wait_until(fun, deadline)
  end

  defp do_wait_until(fun, deadline) do
    cond do
      fun.() ->
        :ok

      System.monotonic_time(:millisecond) >= deadline ->
        flunk("condition not met in time")

      true ->
        Process.sleep(20)
        do_wait_until(fun, deadline)
    end
  end

  # Like `wait_until/2`, but returns the truthy value `fun` produced instead of
  # discarding it: needed whenever the caller must assert on exactly the value
  # that satisfied the poll, not re-read the same condition a moment later. A
  # separate re-read races anything that can retract the condition right after
  # it becomes true (e.g. a claim landing and then being immediately swept),
  # which is indistinguishable from the condition never having held.
  defp wait_until_value(fun, timeout \\ 5_000) do
    deadline = System.monotonic_time(:millisecond) + timeout
    do_wait_until_value(fun, deadline)
  end

  defp do_wait_until_value(fun, deadline) do
    case fun.() do
      falsy when falsy in [nil, false] ->
        if System.monotonic_time(:millisecond) >= deadline do
          flunk("condition not met in time")
        else
          Process.sleep(20)
          do_wait_until_value(fun, deadline)
        end

      value ->
        value
    end
  end

  describe "distributed convergence barrier" do
    setup do
      scope = :"muster_dist_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    test "rebalance re-announces held groups to the new router; all nodes converge",
         %{scope: scope} do
      group = :dist_g
      t_node = node()

      check_trace(
        fn ->
          # Form {A, P1}.
          {:ok, p1, n1} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(n1)
          start_remote_muster(p1, scope)
          await_ready([t_node, n1])

          # P1 holds `group`. join/3 only returns :ok once the router has been
          # told (the RPC-before-Partition.join invariant), so the occupancy
          # row is already in place.
          :ok = :peer.call(p1, MusterPeerAux, :join, [scope, group])
          {:ok, r1} = Muster.router(scope, group)
          assert n1 in occupancy_on(r1, scope, group)

          # Add P2 -> {A, P1, P2}. `group`'s router may move; the rebalance
          # must re-announce {group, n1} to the new router, and every node must
          # converge all the way to :ready.
          {:ok, p2, n2} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(n2)
          start_remote_muster(p2, scope)
          await_ready([t_node, n1, n2])

          # Whoever the current router is, it holds {group, n1} -- this is the
          # core invariant the barrier protects: by the time the cluster is
          # :ready, the new router's occupancy is complete (no grace period).
          {:ok, r2} = Muster.router(scope, group)
          assert n1 in occupancy_on(r2, scope, group)
        end,
        fn _trace -> :ok end
      )
    end

    # Same convergence guarantee as the test above, but proven from the trace
    # instead of polling persistent_term: every node must emit a status
    # transition to :ready *for the final cluster view* after the second node
    # joins triggers a rebalance. snabbkaffe forwards the peers' trace points to
    # this (collector) node, so a single trace holds events from all three nodes.
    #
    # forward_trace/1 is attached to each peer *before* its Muster starts, so no
    # status transition is emitted before forwarding is wired up.
    test "every node converges to :ready again after a rebalance (traced)", %{scope: scope} do
      check_trace(
        fn ->
          # {A, P1}
          {:ok, p1, n1} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(n1)
          start_remote_muster(p1, scope)
          await_ready([node(), n1])

          # Add P2 -> {A, P1, P2}: every node rebalances and must re-converge.
          {:ok, p2, n2} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(n2)
          start_remote_muster(p2, scope)

          members = Enum.sort([node(), n1, n2])
          view_hash = :erlang.phash2(members)

          # Wait for each node to announce :ready for the final 3-node view. The
          # view_hash match is what makes this "ready *again*": an earlier 2-node
          # :ready (from {A, P1}) carries a different hash and is ignored.
          await_ready(members)

          %{members: members, view_hash: view_hash}
        end,
        fn result, trace ->
          # The trace independently confirms all three nodes reached :ready at
          # the final view, and that a rebalance into that view actually happened.
          ready_nodes =
            of_kind(trace, :muster_status_change)
            |> Enum.filter(&(&1.to == :ready and &1.view_hash == result.view_hash))
            |> Enum.map(& &1.node)
            |> Enum.uniq()
            |> Enum.sort()

          assert ready_nodes == result.members

          rebalanced_into_final =
            of_kind(trace, :muster_rebalance_start)
            |> Enum.any?(&(&1.view_hash == result.view_hash))

          assert rebalanced_into_final
        end
      )
    end
  end

  describe "snapshot vs. drop_stale_router_entries" do
    setup do
      scope = :"muster_race_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # These exercise, black-box (real nodes + public API only), that a node's
    # drop_stale_router_entries never permanently loses an occupancy row another
    # node snapshotted to it, across real cluster churn. The precise source-
    # agreement guard logic -- whose worst case (a stale-view sweep over a row
    # whose source disagrees) is no longer reachable black-box now that apply is
    # serialized through Scope -- is driven deterministically in muster_test.exs.

    # A real joiner C rebalances through partial (subset) views as it discovers
    # peers, before settling. A group routing to C must never be dropped from
    # C's occupancy along the way -- consistent-hashing monotonicity keeps it
    # routed to C in every subset view a joiner transiently holds.
    test "a snapshotted row survives a real joiner reaching :ready", %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          # Settled 2-node cluster {T, O}.
          {:ok, p_o, o_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(o_node)
          start_remote_muster(p_o, scope)
          await_ready([t_node, o_node])

          c_name = ~c"muster_race_c_#{System.unique_integer([:positive])}"
          c_node = :"#{c_name}@127.0.0.1"
          final_members = Enum.sort([t_node, o_node, c_node])
          # The victim group must route to C in the final view {C, O, T}; by
          # monotonicity it then also routes to C in every subset C holds.
          group = pick_group([{final_members, c_node}])

          # T holds the group; the pre-join router knows it by the time join
          # returns (the RPC-before-Partition.join invariant).
          member = spawn(fn -> Process.sleep(:infinity) end)
          :ok = Muster.join(scope, group, member)
          {:ok, r1} = Muster.router(scope, group)
          assert t_node in occupancy_on(r1, scope, group)

          {:ok, p_c, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(p_c, scope)

          # Cluster settles; T's rebalance snapshots {group, T} onto C.
          await_ready(final_members)
          assert {:ok, ^c_node} = Muster.router(scope, group)
          assert t_node in occupancy_on(c_node, scope, group)

          %{group: group, c_node: c_node, t_node: t_node}
        end,
        fn result, trace ->
          # The group always routes to C, so no partial-view sweep C ran while
          # discovering peers may ever have dropped T's row.
          assert of_kind(trace, :muster_drop_stale_entry)
                 |> Enum.count(
                   &(&1.node == result.c_node and &1.group == result.group and
                       &1.source == result.t_node)
                 ) == 0
        end
      )
    end

    # A real ephemeral node D joins and dies. While D is alive the group routes
    # to D (C correctly stops holding it); when D dies T heals C -- its rebalance
    # back to {C, O, T} moves the group D -> C and re-snapshots it onto C. After
    # the churn settles C must again be the router and hold T's row -- the round
    # trip must not permanently lose it.
    test "a snapshotted row survives a real ephemeral node's churn", %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          # Settled 2-node cluster {T, O}.
          {:ok, p_o, o_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(o_node)
          start_remote_muster(p_o, scope)
          await_ready([t_node, o_node])

          # C's and D's node names are chosen upfront so the victim group can be
          # picked from ring math before either boots: it must route to C in the
          # final view {C, O, T} and to D in {C, D, O, T}.
          c_name = ~c"muster_race_c_#{System.unique_integer([:positive])}"
          c_node = :"#{c_name}@127.0.0.1"
          d_name = ~c"muster_race_d_#{System.unique_integer([:positive])}"
          d_node = :"#{d_name}@127.0.0.1"
          final_members = Enum.sort([t_node, o_node, c_node])
          group = pick_victim_group(c_node, d_node, [t_node, o_node])

          # T holds the group; the pre-join router knows it by the time join
          # returns (the RPC-before-Partition.join invariant).
          member = spawn(fn -> Process.sleep(:infinity) end)
          :ok = Muster.join(scope, group, member)
          {:ok, r1} = Muster.router(scope, group)
          assert t_node in occupancy_on(r1, scope, group)

          # Settle C: T snapshots the group to C as it rebalances to {C, O, T}.
          {:ok, p_c, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(p_c, scope)
          await_ready(final_members)
          assert {:ok, ^c_node} = Muster.router(scope, group)
          assert t_node in occupancy_on(c_node, scope, group)

          # D joins: the group's router moves C -> D; T hands it over to D.
          {:ok, p_d, ^d_node} = Peer.start(name: d_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(d_node)
          start_remote_muster(p_d, scope)
          await_ready(Enum.sort([d_node | final_members]))
          assert {:ok, ^d_node} = Muster.router(scope, group)

          # D dies: the group moves D -> C and T re-snapshots (heals) it onto C.
          # final view reaches :ready a 2nd time (the 1st was before D), nth: 2.
          :ok = stop_supervised({:peer, d_name})
          await_ready(final_members, nth: 2, timeout: 20_000)

          assert {:ok, ^c_node} = Muster.router(scope, group)
          assert t_node in occupancy_on(c_node, scope, group)

          %{group: group, c_node: c_node, t_node: t_node}
        end,
        fn result, trace ->
          # T delivered the row to C at least twice: the initial join and the
          # post-death heal, proving the heal actually re-delivered it after D's
          # tenure (during which C correctly dropped it). The initial delivery is a
          # FULL snapshot (C was a brand-new router); the heal, to a now-settled C
          # regaining the group on a leave, is a DELTA.
          fulls =
            of_kind(trace, :muster_node_state_received)
            |> Enum.filter(&(&1.node == result.c_node and &1.source == result.t_node))

          deltas =
            of_kind(trace, :muster_delta_received)
            |> Enum.filter(&(&1.node == result.c_node and &1.source == result.t_node))

          # The initial join took the full-snapshot path.
          assert fulls != []

          # The group reached C at least twice across full + delta deliveries.
          deliveries =
            (fulls ++ deltas) |> Enum.count(&(result.group in &1.groups))

          assert deliveries >= 2

          # And the post-death heal exercised the delta path.
          assert Enum.any?(deltas, &(result.group in &1.groups))
        end
      )
    end
  end

  describe "delta-on-leave across real nodes" do
    setup do
      scope = :"muster_delta_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # README rebalance step 7 (full vs. delta): when a node leaves, a surviving
    # router that INHERITS the departed node's groups is a settled member whose
    # rows match the previous generation, so the holder re-announces via a DELTA
    # carrying only the moved-in groups, never the groups the survivor already
    # held (those are preserved on it because the delta path does not wipe). The
    # full-snapshot path would re-send the survivor's entire slice; this is the
    # churn win. Driven black-box: a real node D dies and T heals the survivor S.
    test "a survivor inheriting a group on a leave gets a delta of only the moved-in group",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          # Settled {T, S}.
          {:ok, p_s, s_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(s_node)
          start_remote_muster(p_s, scope)
          await_ready([t_node, s_node])

          # D's name upfront so the victim groups can be picked from ring math.
          d_name = ~c"muster_delta_d_#{System.unique_integer([:positive])}"
          d_node = :"#{d_name}@127.0.0.1"
          view3 = Enum.sort([t_node, s_node, d_node])
          view2 = Enum.sort([t_node, s_node])

          # g_keep routes to S before AND after D dies (S holds it throughout);
          # g_move routes to D before, S after (it moves onto S when D dies).
          g_keep = pick_group([{view3, s_node}, {view2, s_node}])
          g_move = pick_group([{view3, d_node}, {view2, s_node}])
          assert g_keep != g_move

          # Bring up D and settle {T, S, D}.
          {:ok, p_d, ^d_node} = Peer.start(name: d_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(d_node)
          start_remote_muster(p_d, scope)
          await_ready(view3)

          # T holds both groups; each travels to its router as :occupied (not a
          # snapshot), so S never enters owed_snapshots and stays a settled router.
          :ok = Muster.join(scope, g_keep, spawn(fn -> Process.sleep(:infinity) end))
          :ok = Muster.join(scope, g_move, spawn(fn -> Process.sleep(:infinity) end))
          assert t_node in occupancy_on(s_node, scope, g_keep)
          assert t_node in occupancy_on(d_node, scope, g_move)

          # D dies: g_move moves D -> S; T re-announces it to the settled survivor
          # S via a DELTA.
          :ok = stop_supervised({:peer, d_name})

          assert {:ok, %{groups: delta_groups}} =
                   block_until(
                     %{:"$kind" => :muster_delta_received, node: ^s_node, source: ^t_node},
                     20_000
                   )

          # view2 reaches :ready a 2nd time (the 1st was before D joined), nth: 2.
          await_ready(view2, nth: 2, timeout: 20_000)

          assert g_move in delta_groups, "the inherited group must ride the delta"

          refute g_keep in delta_groups,
                 "the group S already held must NOT be re-sent in the delta"

          # Final occupancy: the moved group was ADDED and the kept group PRESERVED
          # (it was never re-sent, yet survives because the delta does not wipe).
          assert {:ok, ^s_node} = Muster.router(scope, g_move)
          assert t_node in occupancy_on(s_node, scope, g_move)
          assert t_node in occupancy_on(s_node, scope, g_keep)

          %{g_keep: g_keep, g_move: g_move, s_node: s_node, t_node: t_node}
        end,
        fn result, trace ->
          # The heal was a delta, never a full snapshot: S was settled throughout
          # (it only ever GAINED groups, which on a leave travels incrementally),
          # so T never sent it a receive_node_state.
          assert of_kind(trace, :muster_node_state_received)
                 |> Enum.filter(&(&1.node == result.s_node and &1.source == result.t_node)) == []

          # Exactly the moved group rode the delta(s) to S; the kept group never did.
          delta_groups =
            of_kind(trace, :muster_delta_received)
            |> Enum.filter(&(&1.node == result.s_node and &1.source == result.t_node))
            |> Enum.flat_map(& &1.groups)

          assert result.g_move in delta_groups
          refute result.g_keep in delta_groups
        end
      )
    end
  end

  describe "owed router falls back to a full snapshot (forced ordering)" do
    setup do
      scope = :"muster_owed_#{System.unique_integer([:positive])}"
      # Generous rpc_timeout: the survivor's snapshot apply is parked for the whole
      # window between two membership changes, and the sender's snapshot RPCs wait
      # on it, so they must not time out (which crashes the sender) before release.
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100, rpc_timeout_ms: 30_000))
      %{scope: scope}
    end

    # README rebalance step 7 (full vs. delta): when a router has a still-in-flight
    # round from us (`owed_snapshots`), its baseline is unknown, so a SECOND
    # rebalance that would otherwise send it a delta falls back to a FULL snapshot.
    # Driven black-box with forced ordering: park survivor S's first snapshot apply
    # so S stays owed on T, then make a real second membership change (O leaves)
    # move a group onto S, and assert S receives that group via a full snapshot,
    # never a delta.
    test "a second rebalance while a router is owed sends a full snapshot, not a delta",
         %{scope: scope} do
      t_node = node()

      o_name = ~c"muster_owed_o_#{System.unique_integer([:positive])}"
      o_node = :"#{o_name}@127.0.0.1"
      s_name = ~c"muster_owed_s_#{System.unique_integer([:positive])}"
      s_node = :"#{s_name}@127.0.0.1"
      view_tos = Enum.sort([t_node, o_node, s_node])
      view_ts = Enum.sort([t_node, s_node])

      check_trace(
        fn ->
          # Settled {T, O}.
          {:ok, p_o, ^o_node} = Peer.start(name: o_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(o_node)
          start_remote_muster(p_o, scope)
          await_ready([t_node, o_node])

          # g_park routes to S in {T,O,S} and {T,S}, so S's join snapshots it onto
          # S (the round we park, making S owed) and it stays there. g_move routes
          # to O in {T,O,S} but S in {T,S}, so it moves onto S when O leaves (the
          # would-be delta).
          g_park = pick_group([{view_tos, s_node}, {view_ts, s_node}])
          g_move = pick_group([{view_tos, o_node}, {view_ts, s_node}])
          assert g_park != g_move

          # T holds both (they travel as :occupied, not snapshots).
          :ok = Muster.join(scope, g_park, spawn(fn -> Process.sleep(:infinity) end))
          :ok = Muster.join(scope, g_move, spawn(fn -> Process.sleep(:infinity) end))

          # Park EVERY snapshot apply on S from T until we release: S's coordinator
          # blocks in {:apply_snapshot}, so its RPC worker on T never returns and
          # T's owed_snapshots[S] never clears.
          force_ordering(
            until: %{:"$kind" => :test_release_s},
            delay: %{:"$kind" => :muster_node_state_received, node: ^s_node, source: ^t_node}
          )

          # S joins {T,O,S}: T's rebalance snapshots g_park onto the new router S
          # (full, since S is new), and that apply parks -> S is owed on T.
          {:ok, p_s, ^s_node} = Peer.start(name: s_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(s_node)
          start_remote_muster(p_s, scope)

          # Wait until T records S as owed (its snapshot is in flight / parked).
          wait_until(fn ->
            Forum.Supervisor.name(scope)
            |> GenServer.call(:dump)
            |> Map.fetch!(:owed_snapshots)
            |> Map.has_key?(s_node)
          end)

          # O leaves {T,O,S} -> {T,S} while S is owed. g_move moves O -> S, so T
          # re-announces it to S, and because S is owed, as a FULL snapshot.
          :ok = stop_supervised({:peer, o_name})

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_rebalance_start, node: ^t_node, to: ^view_ts},
                     10_000
                   )

          # Release: S applies the parked rounds, processes O's DOWN, and converges.
          tp(:test_release_s, %{})
          await_ready(view_ts, timeout: 20_000)

          # Both groups landed on S from T.
          assert {:ok, ^s_node} = Muster.router(scope, g_move)
          assert t_node in occupancy_on(s_node, scope, g_move)
          assert t_node in occupancy_on(s_node, scope, g_park)

          %{g_park: g_park, g_move: g_move, s_node: s_node, t_node: t_node}
        end,
        fn result, trace ->
          # The owed fallback held: T sent S only FULL snapshots, and g_move,
          # which for a settled, non-owed router would have been a delta, arrived
          # in one.
          fulls =
            of_kind(trace, :muster_node_state_received)
            |> Enum.filter(&(&1.node == result.s_node and &1.source == result.t_node))

          assert Enum.any?(fulls, &(result.g_move in &1.groups)),
                 "g_move must reach S via a full snapshot under the owed fallback"

          assert of_kind(trace, :muster_delta_received)
                 |> Enum.count(&(&1.node == result.s_node and &1.source == result.t_node)) == 0,
                 "no delta should be sent to an owed router"
        end
      )
    end
  end

  describe "rebalance markers respect prior-round owed_snapshots" do
    setup do
      scope = :"muster_marker_owed_#{System.unique_integer([:positive])}"

      start_supervised!(
        spec(scope, vacant_flush_interval_ms: 100, view_heartbeat_interval_ms: 200)
      )

      %{scope: scope}
    end

    # README rebalance step 8 (bare markers): a member still owed a PREVIOUS
    # round's un-acked snapshot must never be told "the new view is settled" by
    # a later round that happens not to move any group its way -- its marker
    # has to keep riding the still-in-flight snapshot. Driven black-box with
    # forced ordering: freeze T's round-1 full snapshot to C (a real RPC, an
    # `:erlang.spawn_opt` worker, not the coordinator) BEFORE it is dispatched,
    # so C never actually receives it, then make a real second membership
    # change (O leaves) that does NOT move the group T holds. The buggy code
    # excludes only THIS round's snapshot targets from the bare-marker send, so
    # it marks C for the new view anyway; C then satisfies its own barrier and
    # goes :ready with the group's row still in flight.
    test "a router still owed a prior round's snapshot must not reach :ready off a bare marker",
         %{scope: scope} do
      t_node = node()

      o_name = ~c"muster_marker_owed_o_#{System.unique_integer([:positive])}"
      o_node = :"#{o_name}@127.0.0.1"
      c_name = ~c"muster_marker_owed_c_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"
      view_toc = Enum.sort([t_node, o_node, c_node])
      view_tc = Enum.sort([t_node, c_node])
      view_tc_hash = :erlang.phash2(view_tc)

      check_trace(
        fn ->
          # Settled {T, O}.
          {:ok, p_o, ^o_node} = Peer.start(name: o_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(o_node)
          start_remote_muster(p_o, scope)
          await_ready([t_node, o_node])

          # g routes to C in BOTH {T,O,C} and {T,C}: O's departure must not move
          # it, so round 2 has nothing new to send C.
          g = pick_group([{view_toc, c_node}, {view_tc, c_node}])

          # T holds g before C ever joins, so C's join snapshots it in full.
          :ok = Muster.join(scope, g, spawn(fn -> Process.sleep(:infinity) end))

          # Freeze T's round-1 snapshot dispatch to C before the RPC is even
          # sent: T's owed_snapshots[C] is set (that happens synchronously in
          # do_rebalance), but C receives nothing until we release.
          force_ordering(
            until: %{:"$kind" => :test_release_snapshot},
            delay: %{
              :"$kind" => :muster_rpc_worker_start,
              router: ^c_node,
              function: :receive_node_state
            }
          )

          # C joins {T,O,C}: T's rebalance snapshots g onto the new router C
          # (full, since C is new), and that dispatch freezes -> C is owed on T.
          {:ok, p_c, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(p_c, scope)

          wait_until(fn ->
            Forum.Supervisor.name(scope)
            |> GenServer.call(:dump)
            |> Map.fetch!(:owed_snapshots)
            |> Map.has_key?(c_node)
          end)

          # O leaves {T,O,C} -> {T,C} while C is still owed. g's router does not
          # change, so round 2 has no fresh snapshot for C -- only a candidate
          # bare marker.
          :ok = stop_supervised({:peer, o_name})

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_rebalance_start, node: ^t_node, to: ^view_tc},
                     10_000
                   )

          # The crux: with the frozen snapshot never having reached C, C must
          # not be able to reach :ready for {T,C} by any other means. Give it a
          # bounded window (the buggy bare marker, if sent, arrives near-
          # instantly; the fix means this must time out).
          premature_ready? =
            case block_until(
                   %{
                     :"$kind" => :muster_status_change,
                     to: :ready,
                     node: ^c_node,
                     view_hash: ^view_tc_hash
                   },
                   3_000
                 ) do
              {:ok, _} -> true
              :timeout -> false
            end

          refute premature_ready?,
                 "C reached :ready for #{inspect(view_tc)} while T's round-1 snapshot " <>
                   "(carrying #{inspect(g)}) was still frozen in flight -- a bare marker " <>
                   "must not satisfy the barrier for a still-owed router"

          # Release: C finally receives the (now stale-viewed, but still valid
          # data) snapshot, T's owed entry clears, and its fast heartbeat
          # re-announces the current view so C converges for real.
          tp(:test_release_snapshot, %{})
          await_ready(view_tc, nodes: [c_node], timeout: 20_000)

          %{g: g, c_node: c_node, t_node: t_node}
        end,
        fn result, _trace ->
          # Final state must be correct: the group's row actually landed on C.
          %{g: g, c_node: c_node, t_node: t_node} = result

          assert {:ok, ^c_node} = Muster.router(scope, g)
          assert t_node in occupancy_on(c_node, scope, g)

          assert {:ok, [t_node]} ==
                   :erpc.call(c_node, Muster, :targets, [scope, g, view_tc_hash])
        end
      )
    end
  end

  describe "delta correctness across multiple rounds" do
    setup do
      scope = :"muster_delta_multi_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # README rebalance step 7 (full vs. delta), the INDUCTIVE step: a delta's
    # baseline is "the receiver's rows from the PREVIOUS ring generation", and that
    # baseline must hold even when the previous generation was itself established by
    # a delta (not a full snapshot). Two sequential leaves each move a different
    # group onto the same settled survivor S; the SECOND delta must build on the
    # table the FIRST delta left, never dropping the group the first delta delivered
    # (nor the group S has held since the joins). If deltas did not chain correctly,
    # S would end the test missing g1.
    test "consecutive leaves chain deltas onto one survivor (a delta built on a delta base)",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          # Settled {T, S}. T holds nothing yet, so S joins as a settled router that
          # never receives a full snapshot (the joins below travel as :occupied).
          {:ok, p_s, s_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(s_node)
          start_remote_muster(p_s, scope)
          await_ready([t_node, s_node])

          # D1, D2 names upfront so the victim groups can be picked from ring math.
          d1_name = ~c"muster_chain_d1_#{System.unique_integer([:positive])}"
          d2_name = ~c"muster_chain_d2_#{System.unique_integer([:positive])}"
          d1_node = :"#{d1_name}@127.0.0.1"
          d2_node = :"#{d2_name}@127.0.0.1"

          view4 = Enum.sort([t_node, s_node, d1_node, d2_node])
          view_b = Enum.sort([t_node, s_node, d2_node])
          view2 = Enum.sort([t_node, s_node])

          # g_keep: S in every view (S holds it throughout, never re-sent).
          # g1: D1 in view4, S after D1 leaves -> rides delta #1.
          # g2: D2 in view4 AND view_b (survives D1's leave), S after D2 leaves ->
          #     rides delta #2, which must build on the base delta #1 left.
          g_keep = pick_group([{view4, s_node}, {view_b, s_node}, {view2, s_node}])
          g1 = pick_group([{view4, d1_node}, {view_b, s_node}])
          g2 = pick_group([{view4, d2_node}, {view_b, d2_node}, {view2, s_node}])
          assert g_keep != g1 and g1 != g2 and g_keep != g2

          # Bring up D1 then D2; settle the 4-node view.
          {:ok, p_d1, ^d1_node} = Peer.start(name: d1_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(d1_node)
          start_remote_muster(p_d1, scope)
          await_ready(Enum.sort([t_node, s_node, d1_node]))

          {:ok, p_d2, ^d2_node} = Peer.start(name: d2_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(d2_node)
          start_remote_muster(p_d2, scope)
          await_ready(view4)

          # T holds all three; each travels to its router as :occupied, so S never
          # enters owed_snapshots and stays a settled router.
          :ok = Muster.join(scope, g_keep, spawn(fn -> Process.sleep(:infinity) end))
          :ok = Muster.join(scope, g1, spawn(fn -> Process.sleep(:infinity) end))
          :ok = Muster.join(scope, g2, spawn(fn -> Process.sleep(:infinity) end))
          assert t_node in occupancy_on(s_node, scope, g_keep)
          assert t_node in occupancy_on(d1_node, scope, g1)
          assert t_node in occupancy_on(d2_node, scope, g2)

          # Round 1: D1 leaves. g1 moves D1 -> S via DELTA #1; g_keep and g2 unmoved.
          :ok = stop_supervised({:peer, d1_name})

          assert {:ok, %{groups: delta1}} =
                   block_until(
                     %{:"$kind" => :muster_delta_received, node: ^s_node, source: ^t_node},
                     20_000
                   )

          assert g1 in delta1
          await_ready(view_b, timeout: 20_000)

          # Drain owed so round 2 to S is a genuine delta, not an owed-fallback full.
          wait_until(fn ->
            owed = GenServer.call(Forum.Supervisor.name(scope), :dump).owed_snapshots
            not Map.has_key?(owed, s_node)
          end)

          # Round 2: D2 leaves. g2 moves D2 -> S via DELTA #2, built on the table
          # delta #1 left (g_keep + g1 already present on S, neither re-sent).
          :ok = stop_supervised({:peer, d2_name})

          # The 4-arg (nth) block_until returns {:ok, [events]}; the 2nd is delta #2.
          assert {:ok, deltas_to_s} =
                   block_until(
                     %{:"$kind" => :muster_delta_received, node: ^s_node, source: ^t_node},
                     2,
                     20_000,
                     :infinity
                   )

          assert g2 in List.last(deltas_to_s).groups
          await_ready(view2, nth: 2, timeout: 20_000)

          # All three groups are present on S: g1 survived round 2 (the chain did not
          # drop it), g2 was added, g_keep preserved throughout without re-send.
          assert t_node in occupancy_on(s_node, scope, g1)
          assert t_node in occupancy_on(s_node, scope, g2)
          assert t_node in occupancy_on(s_node, scope, g_keep)

          %{g_keep: g_keep, g1: g1, g2: g2, s_node: s_node, t_node: t_node}
        end,
        fn result, trace ->
          to_s = fn kind ->
            of_kind(trace, kind)
            |> Enum.filter(&(&1.node == result.s_node and &1.source == result.t_node))
          end

          # S was settled throughout: it only ever GAINED groups on leaves, which
          # travels incrementally, so T never sent it a full snapshot.
          assert to_s.(:muster_node_state_received) == []

          # Both moved groups rode deltas; the kept group never did.
          delta_groups = to_s.(:muster_delta_received) |> Enum.flat_map(& &1.groups)
          assert result.g1 in delta_groups
          assert result.g2 in delta_groups
          refute result.g_keep in delta_groups
        end
      )
    end

    # README rebalance step 7 + step 9 ("the receiver owns removes"): the delta path
    # leans on the receiver's OWN drop_stale_router_entries to retract a group that
    # moved away, and on the delta's baseline surviving a round that delivered the
    # receiver no data at all. Here g_move ping-pongs S -> D -> S: when D joins, S is
    # only bare-marked (it gains nothing) yet must DROP g_move via its own sweep;
    # when D leaves, S regains g_move via a delta whose baseline is exactly that
    # swept-down table. g_keep, held by S throughout, is never re-sent and must
    # survive. This is the inductive base-maintenance that the (not deterministically
    # forceable) divergent-observation-order case ultimately relies on.
    test "a survivor's own sweep retracts a moved-away group and a later delta re-adds it",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_s, s_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(s_node)
          start_remote_muster(p_s, scope)
          await_ready([t_node, s_node])

          d_name = ~c"muster_pingpong_d_#{System.unique_integer([:positive])}"
          d_node = :"#{d_name}@127.0.0.1"
          view2 = Enum.sort([t_node, s_node])
          view3 = Enum.sort([t_node, s_node, d_node])

          # g_keep: S in both views. g_move: S in {T,S}, D once D joins.
          g_keep = pick_group([{view2, s_node}, {view3, s_node}])
          g_move = pick_group([{view2, s_node}, {view3, d_node}])
          assert g_keep != g_move

          # T holds both; both route to S now, travelling as :occupied.
          :ok = Muster.join(scope, g_keep, spawn(fn -> Process.sleep(:infinity) end))
          :ok = Muster.join(scope, g_move, spawn(fn -> Process.sleep(:infinity) end))
          assert t_node in occupancy_on(s_node, scope, g_keep)
          assert t_node in occupancy_on(s_node, scope, g_move)

          # D joins: g_move's router moves S -> D. S gains nothing (g_keep stays), so
          # T only bare-marks S; S must drop its now-stale {g_move, T} on its own.
          {:ok, p_d, ^d_node} = Peer.start(name: d_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(d_node)
          start_remote_muster(p_d, scope)
          await_ready(view3)

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_drop_stale_entry,
                       node: ^s_node,
                       group: ^g_move,
                       source: ^t_node
                     },
                     20_000
                   )

          # The sweep ran: S no longer routes g_move (D does) and dropped its row;
          # g_keep is untouched and D now holds it.
          assert occupancy_on(s_node, scope, g_move) == []
          assert t_node in occupancy_on(d_node, scope, g_move)
          assert t_node in occupancy_on(s_node, scope, g_keep)

          # D leaves: g_move moves D -> S again. S is settled (only ever bare-marked,
          # never owed), so T re-announces via a DELTA whose baseline is S's
          # swept-down table.
          :ok = stop_supervised({:peer, d_name})

          assert {:ok, %{groups: delta_groups}} =
                   block_until(
                     %{:"$kind" => :muster_delta_received, node: ^s_node, source: ^t_node},
                     20_000
                   )

          assert g_move in delta_groups
          await_ready(view2, nth: 2, timeout: 20_000)

          # g_move re-added by the delta; g_keep preserved without ever being re-sent.
          assert t_node in occupancy_on(s_node, scope, g_move)
          assert t_node in occupancy_on(s_node, scope, g_keep)

          %{g_keep: g_keep, g_move: g_move, s_node: s_node, t_node: t_node}
        end,
        fn result, trace ->
          to_s = fn kind ->
            of_kind(trace, kind)
            |> Enum.filter(&(&1.node == result.s_node and &1.source == result.t_node))
          end

          # S was never sent a full snapshot: it stayed settled across the whole
          # ping-pong (bare marker on the join, delta on the leave).
          assert to_s.(:muster_node_state_received) == []

          # Exactly the moved group rode the delta back to S; the kept group never did.
          delta_groups = to_s.(:muster_delta_received) |> Enum.flat_map(& &1.groups)
          assert result.g_move in delta_groups
          refute result.g_keep in delta_groups

          # S itself performed the retract (receiver owns removes): the only node to
          # drop g_move (sourced from T) as stale was S.
          drops =
            of_kind(trace, :muster_drop_stale_entry)
            |> Enum.filter(&(&1.group == result.g_move and &1.source == result.t_node))

          assert drops |> Enum.map(& &1.node) |> Enum.uniq() == [result.s_node]
        end
      )
    end
  end

  describe "vacant DELETE vs. re-claim -- occupancy seq guard (forced ordering)" do
    setup do
      scope = :"muster_seq_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacancy_cooldown_ms: 50, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # README "Vacant-time RPC failure": :erpc does not cancel remote execution,
    # so a vacant batch's DELETE can land on the router AFTER the source has
    # re-claimed the group with a fresh :occupied INSERT. The occupancy-row seq
    # versioning must make the stale, lower-seq DELETE a no-op. The single-node
    # tests prove the guard with hand-fed seqs; here the dangerous arrival
    # order is FORCED on a real router: the batch's RPC worker is parked at its
    # trace point until the re-claim's INSERT has been committed, then released
    # so the DELETE runs strictly after it.
    test "a late vacant DELETE cannot clobber a re-claimed group on a real router",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready([t_node, r_node])

          group = group_routed_to(scope, r_node)

          member = spawn(fn -> Process.sleep(:infinity) end)
          :ok = Muster.join(scope, group, member)
          assert t_node in occupancy_on(r_node, scope, group)

          # Park the batched DELETE on the router until a SECOND :occupied
          # INSERT for this group has been committed there -- the first was the
          # join above, the second is the re-claim below. (Already-collected
          # events count towards n_events, hence 2.)
          force_ordering(
            until: %{:"$kind" => :muster_occupied, node: ^r_node, group: ^group, source: ^t_node},
            count: 2,
            delay: %{
              :"$kind" => :muster_vacant_batch,
              :"$span" => :start,
              node: ^r_node,
              source: ^t_node
            },
            when: true
          )

          # Vacate: cooldown (50ms) expires -> :vacant_queued -> the periodic
          # flush (100ms) dispatches the batch, whose RPC worker parks on the
          # router. The group stays :vacant_flushing while it is parked.
          :ok = Muster.leave(scope, group, member)

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: :vacant_flushing
                     },
                     5_000
                   )

          # Re-claim while the DELETE is in flight. handle_claim dispatches the
          # :occupied immediately (it does NOT wait for the batch), stamped
          # with a strictly higher seq.
          :ok = Muster.join(scope, group, spawn(fn -> Process.sleep(:infinity) end))

          # The INSERT released the parked batch; wait for the stale DELETE to
          # be applied...
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_vacant_batch,
                       :"$span" => {:complete, _},
                       node: ^r_node,
                       source: ^t_node
                     },
                     5_000
                   )

          # ...and the row must have survived it.
          assert t_node in occupancy_on(r_node, scope, group)
          assert group_state(scope, group) == :occupied

          %{group: group, r_node: r_node}
        end,
        fn result, trace ->
          # Exactly two INSERTs reached the router: the join and the re-claim,
          # in dispatch order (seqs are per-source monotonic).
          assert [%{seq: first_seq}, %{seq: reclaim_seq}] =
                   of_kind(trace, :muster_occupied)
                   |> Enum.filter(&(&1.node == result.r_node and &1.group == result.group))

          assert first_seq < reclaim_seq

          # The batch the router applied was genuinely stale: stamped at
          # dispatch BEFORE the re-claim (lower seq), applied AFTER its INSERT
          # (later in the trace -- the forced ordering).
          batches =
            of_kind(trace, :muster_vacant_batch)
            |> Enum.filter(&(&1[:"$span"] == :start and result.group in &1.groups))

          assert [%{seq: batch_seq}] = batches
          assert batch_seq < reclaim_seq

          # Both events are pinned to their exact seqs, so this is a single
          # forced pair: the stale batch was applied AFTER the re-claim that
          # superseded it.
          assert causality(
                   trace,
                   %{:"$kind" => :muster_occupied, seq: ^reclaim_seq},
                   %{:"$kind" => :muster_vacant_batch, :"$span" => :start, seq: ^batch_seq}
                 )
        end
      )
    end
  end

  describe "reverse race -- a stale occupied INSERT vs. a fresh vacant DELETE (forced ordering)" do
    setup do
      scope = :"muster_revseq_#{System.unique_integer([:positive])}"
      # Long flush interval so the only vacant flush is the one the test triggers
      # deterministically; a generous rpc_timeout so the parked occupied worker
      # does not time out before we release it.
      start_supervised!(
        spec(scope,
          vacancy_cooldown_ms: 50,
          vacant_flush_interval_ms: 100,
          rpc_timeout_ms: 30_000
        )
      )

      %{scope: scope}
    end

    # The MIRROR of "a late vacant DELETE cannot clobber a re-claimed group". That
    # test proved a stale, lower-seq DELETE landing after a fresh, higher-seq
    # INSERT is a no-op (vacant_batch's `=<` seq guard). This proves the opposite
    # direction now holds too: a stale, lower-seq `occupied` INSERT landing on a
    # real router AFTER a fresh, higher-seq `vacant_batch` DELETE must NOT
    # resurrect a group the source has actually vacated. Before vacancy tombstones
    # (the DELETE removed the row outright, discarding its seq) the late INSERT
    # won via insert_new and left a permanent phantom; now the DELETE leaves a
    # seq-stamped tombstone that the lower-seq INSERT loses to.
    #
    # This IS a plain occupied-vs-vacant race, via the SAME :erpc-no-cancel
    # property the vacant side exploits -- an `occupied` whose RPC was orphaned is
    # not cancelled, so its INSERT can still land late. The only subtlety is
    # producing it: the claim state machine awaits `occupied` (a caller parks in
    # :occupied_pending until it confirms), so an `occupied` is not normally in
    # flight while a later `vacant` for the same group is dispatched. A shard
    # CRASH is the bridge -- the orphaned `occupied` worker (low seq) survives the
    # crash (it is monitored, not linked), and the restart reconciles the
    # un-confirmed :occupied_pending (count 0) straight to :vacant_queued, so the
    # next flush dispatches a HIGHER-seq `vacant` for the same {group, source}.
    # Both RPCs race the router; we force the dangerous order -- DELETE first, then
    # the orphaned INSERT -- and assert the vacated group does not reappear.
    test "a stale occupied INSERT after a fresh vacant DELETE must NOT resurrect the group",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready([t_node, r_node])

          group = group_routed_to(scope, r_node)

          # Park the occupied INSERT on the router until the vacant_batch DELETE
          # for the same source has completed there -- forcing the stale INSERT to
          # apply strictly AFTER the fresh DELETE. The :muster_occupied_apply
          # :start anchor fires BEFORE the ETS write, so the row is genuinely not
          # written while parked.
          force_ordering(
            until: %{
              :"$kind" => :muster_vacant_batch,
              :"$span" => {:complete, _},
              node: ^r_node,
              source: ^t_node
            },
            delay: %{
              :"$kind" => :muster_occupied_apply,
              :"$span" => :start,
              node: ^r_node,
              group: ^group,
              source: ^t_node
            }
          )

          # Claim the group. join blocks in :occupied_pending (its occupied RPC is
          # parked on the router), so run it off to the side -- we never use its
          # result; the shard is about to be killed under it. spawn (not
          # spawn_link) so its exit does not touch the test.
          member = spawn(fn -> Process.sleep(:infinity) end)
          _claimer = spawn(fn -> Muster.join(scope, group, member) end)

          # The occupied RPC has been dispatched (the shard is now :occupied_pending
          # and the worker is in flight to the router, where it will park at the
          # forced :muster_occupied_apply :start). We wait on this SOURCE-side event
          # rather than the parked apply event itself -- force_ordering withholds the
          # parked event from the trace until it is released, so waiting on it here
          # would deadlock.
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: {:occupied_pending, _}
                     },
                     10_000
                   )

          # Kill the shard that owns the group on the SOURCE while its occupied is
          # in flight. The orphaned worker (monitored, not linked) survives and
          # stays parked on the router.
          shard_name = Forum.Supervisor.shard(scope, group)
          old_shard = Process.whereis(shard_name)
          ref = Process.monitor(old_shard)
          true = Process.exit(old_shard, :kill)
          assert_receive {:DOWN, ^ref, :process, ^old_shard, :killed}, 5_000

          # The restarted shard reconciles the un-confirmed claim (count 0) to
          # :vacant_queued -- the source now considers the group released.
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: :vacant_queued
                     },
                     10_000
                   )

          # The natural flush dispatches the (higher-seq) vacant_batch to the
          # router. With the INSERT parked, it deletes nothing, and on completion
          # releases the parked INSERT -- which then applies its stale, lower seq.

          # Wait for the freed INSERT to commit on the router.
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_occupied_apply,
                       :"$span" => {:complete, _},
                       node: ^r_node,
                       group: ^group,
                       source: ^t_node
                     },
                     10_000
                   )

          # The source has fully forgotten the group (the vacant batch was
          # acknowledged).
          wait_until(fn -> group_state(scope, group) == nil end)

          %{group: group, r_node: r_node, t_node: t_node}
        end,
        fn result, trace ->
          # The forced order really was DELETE-then-INSERT, and the INSERT carried
          # the lower (stale) seq -- otherwise this would not be the reverse race.
          assert [%{seq: ins_seq}] =
                   of_kind(trace, :muster_occupied_apply)
                   |> Enum.filter(
                     &(&1[:"$span"] == :start and &1.node == result.r_node and
                         &1.group == result.group)
                   )

          assert [%{seq: del_seq}] =
                   of_kind(trace, :muster_vacant_batch)
                   |> Enum.filter(
                     &(&1[:"$span"] == :start and &1.node == result.r_node and
                         result.group in &1.groups)
                   )

          assert ins_seq < del_seq,
                 "the INSERT must be the stale (lower-seq) write for this to be the reverse race"

          # THE PROPERTY UNDER TEST: the source genuinely vacated the group (no
          # local member, state forgotten), so the router must NOT still list it.
          # A failure here means the stale INSERT resurrected a phantom occupancy
          # that nothing will ever retract (the group routes to this router, so
          # its own drop_stale_router_entries spares it; the source will never
          # re-vacate).
          assert Muster.local_member_count(scope, result.group) == 0
          assert group_state(scope, result.group) == nil

          refute result.t_node in occupancy_on(result.r_node, scope, result.group),
                 "stale occupied INSERT resurrected a vacated group on the router (phantom occupancy)"
        end
      )
    end
  end

  describe "periodic stale-router-entry sweep (piggybacked on :sweep_tombstones)" do
    setup do
      scope = :"muster_fencing_gap_#{System.unique_integer([:positive])}"
      # Generous rpc_timeout: the parked occupied worker survives across an
      # entire membership change and its convergence before we release it, and
      # must not time out client-side and confuse the source shard's state
      # machine while we orchestrate the race. A short, independent
      # tombstone_window_ms (the periodic sweep's interval) so the backstop
      # this test proves has several chances to fire within the timeout below.
      start_supervised!(
        spec(scope,
          vacancy_cooldown_ms: 50,
          vacant_flush_interval_ms: 100,
          rpc_timeout_ms: 30_000,
          tombstone_window_ms: 200
        )
      )

      %{scope: scope}
    end

    # occupied/4 and vacant_batch/4 are the only cross-node writes in Muster
    # with no cluster-view fencing -- only {group, source_node, seq}. Every
    # other cross-node write (receive_node_state, apply_delta) is stamped with
    # view_hash and folds into the readiness barrier.
    #
    # :erpc does not cancel a delayed call: the request still lands and
    # executes on the remote node later (the same property the reverse-race
    # test above exploits). Here it lands on a router that has ALREADY swept
    # past the view where it would have mattered:
    #
    #   1. T holds `group`, routed to R; its shard dispatches occupied(group,
    #      T, seq) to R. We park it (force_ordering) BEFORE it writes the row.
    #   2. Before it lands, X joins and `group`'s router moves R -> X. T's
    #      rebalance settles the parked join locally (the ring already shows
    #      the new router -- settle_moved_pending) and snapshots the group onto
    #      X; it never waits on the worker still parked against R.
    #   3. R agrees on the new (3-node) view and runs its OWN
    #      drop_stale_router_entries sweep on the :ready transition -- a no-op
    #      for {group, T}, since R has no row for it yet.
    #   4. We release the park. The stale, low-seq occupied INSERT finally
    #      lands on R. upsert_if_newer has no existing row to compare against,
    #      so insert_new wins UNCONDITIONALLY, planting a phantom present row.
    #
    # Nothing else in this test's remaining life ever touches that row: T only
    # ever asserts what it currently holds (X, not R) and never sends R a
    # retraction, and no further membership churn arrives to trigger another
    # rebalance or :ready transition. The ONLY thing left that can catch it is
    # the periodic backstop sweep piggybacked on :sweep_tombstones -- this test
    # proves it does, within one :tombstone_window_ms tick, without needing
    # any further churn.
    test "a stale occupied INSERT delayed past R's sweep is caught by the next periodic tick",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          # Settled 2-node cluster {T, R}. R needs the same short
          # tombstone_window_ms as T -- it is R's own periodic sweep, running
          # on R's own schedule, that this test proves catches the phantom row.
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope, tombstone_window_ms: 200)
          await_ready([t_node, r_node])

          # X's name is fixed upfront so the victim group can be picked from
          # ring math: routed to R in {T,R}, moved onto X once X joins.
          x_name = ~c"muster_fencing_gap_x_#{System.unique_integer([:positive])}"
          x_node = :"#{x_name}@127.0.0.1"
          view3 = Enum.sort([t_node, r_node, x_node])
          hash3 = :erlang.phash2(view3)
          group = pick_group([{[t_node, r_node], r_node}, {view3, x_node}])

          # Park the occupied INSERT on R before it writes the row -- the
          # delayed-RPC arm of the race. The :start anchor fires before the ETS
          # write (same anchor the reverse-race test above uses), so the row is
          # genuinely absent while parked.
          force_ordering(
            until: %{:"$kind" => :test_release_occupied},
            delay: %{
              :"$kind" => :muster_occupied_apply,
              :"$span" => :start,
              node: ^r_node,
              group: ^group,
              source: ^t_node
            }
          )

          # Claim off to the side: the join call parks in :occupied_pending
          # (its :occupied RPC to R is parked there), so run it off to the
          # side -- we never use its result.
          member = spawn(fn -> Process.sleep(:infinity) end)
          _claimer = spawn(fn -> Muster.join(scope, group, member) end)

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: {:occupied_pending, _}
                     },
                     10_000
                   )

          # X joins: the group's router moves R -> X. T's rebalance settles the
          # parked pending join right here (settle_moved_pending) and snapshots
          # the group onto the fresh router X -- never waiting on the worker
          # still parked against R.
          {:ok, p_x, ^x_node} = Peer.start(name: x_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(x_node)
          start_remote_muster(p_x, scope)

          assert {:ok, %{groups: snapshotted}} =
                   block_until(
                     %{:"$kind" => :muster_node_state_received, node: ^x_node, source: ^t_node},
                     15_000
                   )

          assert group in snapshotted

          # Every node -- INCLUDING R -- converges to :ready for the 3-node view.
          # R's own sweep on this transition is a genuine no-op for {group, T}:
          # it has no row for it yet, the parked INSERT hasn't landed.
          await_ready(view3)

          assert {:ok, ^x_node} = Muster.router(scope, group)
          assert t_node in occupancy_on(x_node, scope, group)
          assert occupancy_on(r_node, scope, group) == []

          # Release the park. The stale INSERT lands on R strictly AFTER R
          # already agreed on the view that routes `group` away from it.
          tp(:test_release_occupied, %{})

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_occupied_apply,
                       :"$span" => {:complete, _},
                       node: ^r_node,
                       group: ^group,
                       source: ^t_node
                     },
                     10_000
                   )

          # The gap really opens: with no row to compare against, insert_new
          # wins unconditionally and plants a phantom present row.
          wait_until(fn -> occupancy_on(r_node, scope, group) != [] end)
          assert t_node in occupancy_on(r_node, scope, group)

          # No further churn happens from here on -- the only thing left that
          # can ever touch this row is the periodic backstop. Give it a few
          # ticks (tombstone_window_ms: 200) to catch and drop it.
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_drop_stale_entry,
                       node: ^r_node,
                       group: ^group,
                       source: ^t_node
                     },
                     5_000
                   )

          wait_until(fn -> occupancy_on(r_node, scope, group) == [] end)

          %{group: group, r_node: r_node, x_node: x_node, t_node: t_node, hash3: hash3}
        end,
        fn result, trace ->
          group = result.group
          r_node = result.r_node
          hash3 = result.hash3

          # The choreography really held: R's genuine :ready-for-view3 sweep
          # happened BEFORE the delayed INSERT applied on it, so that sweep is
          # not what caught the phantom row (it ran before the row existed).
          assert causality(
                   trace,
                   %{
                     :"$kind" => :muster_status_change,
                     node: ^r_node,
                     to: :ready,
                     view_hash: ^hash3
                   },
                   %{
                     :"$kind" => :muster_occupied_apply,
                     :"$span" => {:complete, _},
                     node: ^r_node,
                     group: ^group
                   }
                 )

          # And the delayed INSERT really did land before the drop that caught
          # it -- this is the periodic backstop catching a row that did not
          # exist at either of the earlier sweep points (do_rebalance's own,
          # and the :ready transition's), not a coincidence of test timing.
          assert causality(
                   trace,
                   %{
                     :"$kind" => :muster_occupied_apply,
                     :"$span" => {:complete, _},
                     node: ^r_node,
                     group: ^group
                   },
                   %{:"$kind" => :muster_drop_stale_entry, node: ^r_node, group: ^group}
                 )

          # Exactly one drop for this key: the backstop caught it once and it
          # never came back (T never re-asserts to R; it now only talks to X).
          assert of_kind(trace, :muster_drop_stale_entry)
                 |> Enum.count(&(&1.node == r_node and &1.group == group)) == 1

          refute result.t_node in occupancy_on(r_node, scope, group),
                 "the periodic backstop sweep should have caught and dropped the phantom row"
        end
      )
    end
  end

  describe "round-trip immunity (an orphaned occupied INSERT cannot resurrect a group after a ring round-trip)" do
    setup do
      scope = :"muster_roundtrip_#{System.unique_integer([:positive])}"

      # Generous rpc_timeout: the parked, orphaned occupied worker survives
      # across an entire membership change (X joining, then leaving again)
      # and its convergence before we release it -- see the "caught by the
      # next periodic tick" test above for why this must not time out
      # client-side and confuse the source shard's state machine.
      start_supervised!(
        spec(scope,
          vacancy_cooldown_ms: 50,
          vacant_flush_interval_ms: 100,
          rpc_timeout_ms: 30_000
        )
      )

      %{scope: scope}
    end

    # This exercises the exact gap a hard-delete sweep would leave open: a
    # ring round-trip (R -> X -> R) must not give the sweep a second chance
    # to destroy a tombstone it should never touch, discarding the seq floor
    # that guards against a still-in-flight, orphaned `occupied` RPC.
    # drop_stale_router_entries/1 closes that gap by never re-judging a row
    # that already reads as a tombstone (the `meta == :present` guard) --
    # this test proves the round trip has nothing to bite into.
    #
    #   1. T holds `group`, routed to R. Its occupied RPC is parked
    #      (force_ordering) before it writes the row -- R has no row for it
    #      yet.
    #   2. T's shard is killed while the claim is unconfirmed. The orphaned
    #      occupied worker (monitored, not linked) survives untouched; the
    #      restarted shard reconciles the claim straight to :vacant_queued --
    #      T now genuinely holds nothing.
    #   3. The natural flush dispatches a real (higher-seq) vacant_batch to
    #      R. With no existing row, it plants a TOMBSTONE directly -- the seq
    #      floor that protects against the still-parked, stale occupied.
    #   4. X joins. `group`'s router moves R -> X; R's :ready-transition
    #      sweep runs (update_status fires it on every :ready transition) but
    #      the row already reads as a tombstone, so the guard skips it
    #      outright -- no judgment, no write, the seq floor is untouched.
    #   5. X leaves. `group`'s router moves back R -> R -- the round trip
    #      completes with the tombstone exactly as step 3 left it.
    #   6. Release the park. The stale occupied lands on R against the
    #      still-alive tombstone: its seq predates the vacate, so
    #      upsert_if_newer's guard rejects it outright. No resurrection.
    test "an orphaned occupied INSERT delayed across a ring round-trip cannot resurrect a vacated group",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready([t_node, r_node])

          # X's name is fixed upfront so the victim group can be picked from
          # ring math: routed to R in {T,R}, moved onto X once X joins.
          x_name = ~c"muster_roundtrip_x_#{System.unique_integer([:positive])}"
          x_node = :"#{x_name}@127.0.0.1"
          view2 = Enum.sort([t_node, r_node])
          view3 = Enum.sort([t_node, r_node, x_node])
          hash3 = :erlang.phash2(view3)
          group = pick_group([{view2, r_node}, {view3, x_node}])

          # Park the occupied INSERT on R before it writes -- the
          # delayed-RPC arm; the orphaned worker survives independently of
          # the shard that dispatched it.
          force_ordering(
            until: %{:"$kind" => :test_release_occupied},
            delay: %{
              :"$kind" => :muster_occupied_apply,
              :"$span" => :start,
              node: ^r_node,
              group: ^group,
              source: ^t_node
            }
          )

          member = spawn(fn -> Process.sleep(:infinity) end)
          _claimer = spawn(fn -> Muster.join(scope, group, member) end)

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: {:occupied_pending, _}
                     },
                     10_000
                   )

          # Kill the shard while the claim is unconfirmed. The parked,
          # orphaned occupied worker survives (monitored, not linked); the
          # restart reconciles the claim straight to :vacant_queued.
          shard_name = Forum.Supervisor.shard(scope, group)
          old_shard = Process.whereis(shard_name)
          ref = Process.monitor(old_shard)
          true = Process.exit(old_shard, :kill)
          assert_receive {:DOWN, ^ref, :process, ^old_shard, :killed}, 5_000

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: :vacant_queued
                     },
                     10_000
                   )

          # The natural flush dispatches a real, higher-seq vacant_batch to
          # R. With no existing row (the occupied is still parked), it
          # plants a tombstone directly -- the seq floor the rest of this
          # test is about.
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_vacant_batch,
                       :"$span" => {:complete, _},
                       node: ^r_node,
                       source: ^t_node
                     },
                     10_000
                   )

          wait_until(fn -> group_state(scope, group) == nil end)
          assert occupancy_on(r_node, scope, group) == []

          # X joins: `group`'s router moves R -> X. R's own :ready-transition
          # sweep runs here (update_status fires it on every :ready
          # transition, unconditionally), but the row already reads as a
          # tombstone, so the fix's `meta == :present` guard skips it without
          # judging or writing anything -- proven below by the total absence
          # of any :muster_drop_stale_judged/:muster_drop_stale_entry event
          # for this key across the whole trace.
          {:ok, p_x, ^x_node} = Peer.start(name: x_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(x_node)
          start_remote_muster(p_x, scope)

          await_ready(view3)
          assert occupancy_on(r_node, scope, group) == []

          # X leaves: `group`'s router moves back R -> R -- the round trip
          # completes with the tombstone exactly as step 3 left it.
          :ok = stop_supervised({:peer, x_name})

          await_ready(view2, nth: 2, timeout: 20_000)
          assert {:ok, ^r_node} = Muster.router(scope, group)
          assert occupancy_on(r_node, scope, group) == []

          # Release the park. The stale occupied lands on R against the
          # tombstone from step 3, still standing guard.
          tp(:test_release_occupied, %{})

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_occupied_apply,
                       :"$span" => {:complete, _},
                       node: ^r_node,
                       group: ^group,
                       source: ^t_node
                     },
                     10_000
                   )

          # The seq guard held: the stale INSERT lost to the still-alive
          # tombstone, so the row never becomes visible as present.
          refute t_node in occupancy_on(r_node, scope, group)

          %{group: group, r_node: r_node, t_node: t_node, hash3: hash3}
        end,
        fn result, trace ->
          group = result.group
          r_node = result.r_node
          t_node = result.t_node
          hash3 = result.hash3

          # T genuinely forgot the group entirely -- there is nothing left
          # on its side that will ever retract R's row.
          assert group_state(scope, group) == nil
          assert Muster.local_member_count(scope, group) == 0

          # The round trip really completed -- R re-reached :ready for view3
          # -- BEFORE the stale occupied was released and evaluated, so the
          # sweep had every opportunity to touch this row and, per the fix,
          # correctly declined to.
          assert causality(
                   trace,
                   %{
                     :"$kind" => :muster_status_change,
                     node: ^r_node,
                     to: :ready,
                     view_hash: ^hash3
                   },
                   %{
                     :"$kind" => :muster_occupied_apply,
                     :"$span" => {:complete, _},
                     node: ^r_node,
                     group: ^group,
                     source: ^t_node
                   }
                 )

          # THE FIX: the tombstone from step 3 is never re-judged by any
          # :ready-transition sweep -- not once, across the entire round
          # trip -- because it no longer reads as :present. Nothing ever
          # judges or drops this key.
          assert of_kind(trace, :muster_drop_stale_judged)
                 |> Enum.count(&(&1.node == r_node and &1.group == group and &1.source == t_node)) ==
                   0

          assert of_kind(trace, :muster_drop_stale_entry)
                 |> Enum.count(&(&1.node == r_node and &1.group == group and &1.source == t_node)) ==
                   0

          # And because the seq floor was never disturbed, the late, orphaned
          # occupied INSERT has a real tombstone to lose against: it is
          # rejected rather than resurrecting the group.
          refute t_node in occupancy_on(r_node, scope, group),
                 "a ring round-trip let an already-tombstoned row get re-judged, " <>
                   "destroying the seq floor an orphaned occupied INSERT needed to lose against"
        end
      )
    end
  end

  describe "sweep delete vs. a concurrent fresh claim (forced ordering)" do
    setup do
      scope = :"muster_sweep_toctou_#{System.unique_integer([:positive])}"

      start_supervised!(
        spec(scope,
          vacancy_cooldown_ms: 50,
          vacant_flush_interval_ms: 100
        )
      )

      %{scope: scope}
    end

    # drop_stale_router_entries judges rows from a snapshot taken by
    # :ets.select, but occupied/4 writes the SAME table from :erpc worker
    # processes, concurrently with the sweeping coordinator. Between the
    # sweep's judgment of a row (at seq_stale) and its physical delete, a
    # fresh, legitimate occupied INSERT can raise the same {group, source} key
    # to a newer seq -- and a key-only delete then destroys the FRESH row, not
    # the row that was judged. Every other write to this table is individually
    # seq-guarded (put_if_newer); the sweep's delete must be too.
    #
    # The interleaving, with T = this node, R and X = peers:
    #
    #   1. Settled {T, R}; T holds `group`, routed to R -- R carries a real
    #      row {group, T, seq_stale}.
    #   2. X joins; the group's router moves R -> X, so R's row is genuinely
    #      stale. The first R sweep able to judge it (T has agreed on the
    #      3-node view) decides to drop it -- and is parked (force_ordering)
    #      BETWEEN that judgment and the delete.
    #   3. T vacates the group. The vacancy is dispatched to X (the router
    #      now); R is never told -- its stale row is exactly what only its own
    #      (parked) sweep may remove.
    #   4. X dies; the group's router moves BACK to R. T holds nothing, so its
    #      rebalance sends R only an async marker -- no occupancy write rides it.
    #   5. T re-claims the group fresh. Its shard dispatches occupied(group, T,
    #      seq_fresh) to R, and the :erpc worker writes R's table directly --
    #      R's parked coordinator plays no part. The judged key now holds a
    #      newer, LEGITIMATE row (seq_fresh > watermark of the announcement R
    #      judged under, so even a re-judgment would skip it).
    #   6. Release the park. The sweep's key-only :ets.delete fires against a
    #      row it never judged and destroys it.
    #
    # Nothing ever heals the destroyed row: T got its :ok (the RPC succeeded),
    # so its shard rests in :occupied with nothing queued; T's future
    # rebalances send deltas of MOVED groups only (the group never moves
    # again); heartbeats carry markers, not data; the vacant flush re-sends
    # vacancies only. R converges to :ready as the group's router with no
    # occupancy row for it -- broadcasts to the group silently miss T forever.
    test "the sweep's delete must not destroy a fresh occupied row raised after judgment",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          # Settled 2-node cluster {T, R}.
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready([t_node, r_node])

          # X's name is fixed upfront so the victim group can be picked from
          # ring math: routed to R in {T,R}, moved onto X once X joins.
          x_name = ~c"muster_sweep_toctou_x_#{System.unique_integer([:positive])}"
          x_node = :"#{x_name}@127.0.0.1"
          view3 = Enum.sort([t_node, r_node, x_node])
          view2 = Enum.sort([t_node, r_node])
          hash2 = :erlang.phash2(view2)
          group = pick_group([{view2, r_node}, {view3, x_node}])

          # T holds the group; its occupied lands on R (the router in {T, R}).
          m1 = spawn(fn -> Process.sleep(:infinity) end)
          :ok = Muster.join(scope, group, m1)
          assert t_node in occupancy_on(r_node, scope, group)

          # Park R's sweep between judging {group, T} stale and deleting it.
          force_ordering(
            until: %{:"$kind" => :test_release_drop},
            delay: %{
              :"$kind" => :muster_drop_stale_apply,
              :"$span" => :start,
              node: ^r_node,
              group: ^group,
              source: ^t_node
            }
          )

          # X joins: the group's router moves R -> X, making R's row stale.
          {:ok, p_x, ^x_node} = Peer.start(name: x_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(x_node)
          start_remote_muster(p_x, scope)

          # R may park inside its own do_rebalance sweep (its view-3 markers
          # are sent before that sweep, so T and X still converge) and then
          # never announce :ready for view3 -- wait only on T and X.
          await_ready(view3, nodes: [t_node, x_node])

          # R has judged the stale row and is parked BEFORE the delete.
          assert {:ok, judged} =
                   block_until(
                     %{
                       :"$kind" => :muster_drop_stale_judged,
                       node: ^r_node,
                       group: ^group,
                       source: ^t_node
                     },
                     15_000
                   )

          # T vacates the group; the vacancy goes to X (the router now), so R
          # keeps its stale row. The shard's group state ending DELETED
          # (state: nil) implies the flush was acked: the group is fully
          # vacant on T and will not be a candidate in T's next rebalance.
          :ok = Muster.leave(scope, group, m1)

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: nil
                     },
                     10_000
                   )

          assert t_node in occupancy_on(r_node, scope, group)

          # X dies: the group's router moves back to R. T holds nothing, so
          # its rebalance sends R only a marker; T lands :converging for the
          # 2-node view (R, parked, cannot have agreed yet) with its ring
          # already swapped -- claims from here on route to R. nth: 2 because
          # T already passed :converging for this same view hash once, during
          # the initial {T, R} discovery rebalance at setup.
          :ok = stop_supervised({:peer, x_name})

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_status_change,
                       node: ^t_node,
                       to: :converging,
                       view_hash: ^hash2
                     },
                     2,
                     15_000,
                     :infinity
                   )

          # The fresh re-claim: the occupied RPC writes R's table directly
          # from the :erpc worker (join returning :ok implies the row is
          # committed on R), raising the judged key to a newer seq.
          m2 = spawn(fn -> Process.sleep(:infinity) end)
          :ok = Muster.join(scope, group, m2)
          assert t_node in occupancy_on(r_node, scope, group)

          # Release the parked delete. It fires against a row it never judged.
          tp(:test_release_drop, %{})

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_drop_stale_apply,
                       :"$span" => {:complete, _},
                       node: ^r_node,
                       group: ^group,
                       source: ^t_node
                     },
                     10_000
                   )

          # R heals: processes X's nodedown, rebalances to {T, R}, and both
          # nodes reach :ready for the 2-node view a 2nd time (1st was setup).
          await_ready(view2, nth: 2, timeout: 20_000)
          assert {:ok, ^r_node} = Muster.router(scope, group)

          # THE POINT: R is the settled, :ready router for a group T genuinely
          # holds (m2 is alive, T's shard is :occupied), and nothing will ever
          # re-send the row. The sweep must have spared it.
          assert t_node in occupancy_on(r_node, scope, group),
                 "the sweep's key-only delete destroyed a fresh occupied row " <>
                   "written between its judgment and its delete"

          %{group: group, r_node: r_node, t_node: t_node, judged_seq: judged.seq}
        end,
        fn result, trace ->
          group = result.group
          r_node = result.r_node
          t_node = result.t_node

          # Exactly two occupied INSERTs landed on R for this key: the
          # original claim (what the sweep judged) and the fresh re-claim
          # (what the delete must spare).
          occupied_seqs =
            of_kind(trace, :muster_occupied_apply)
            |> Enum.filter(
              &(&1.node == r_node and &1.group == group and &1.source == t_node and
                  match?({:complete, _}, Map.get(&1, :"$span")))
            )
            |> Enum.map(& &1.seq)
            |> Enum.sort()

          assert [stale_seq, fresh_seq] = occupied_seqs
          assert result.judged_seq == stale_seq
          assert fresh_seq > stale_seq

          # The interleaving really held: the sweep judged the STALE row
          # first, the FRESH row landed while it was parked, and only then did
          # its delete fire -- the exact select-then-delete TOCTOU window.
          assert causality(
                   trace,
                   %{
                     :"$kind" => :muster_drop_stale_judged,
                     node: ^r_node,
                     group: ^group,
                     source: ^t_node
                   },
                   %{
                     :"$kind" => :muster_occupied_apply,
                     :"$span" => {:complete, _},
                     node: ^r_node,
                     group: ^group,
                     seq: ^fresh_seq
                   }
                 )

          assert causality(
                   trace,
                   %{
                     :"$kind" => :muster_occupied_apply,
                     :"$span" => {:complete, _},
                     node: ^r_node,
                     group: ^group,
                     seq: ^fresh_seq
                   },
                   %{
                     :"$kind" => :muster_drop_stale_apply,
                     :"$span" => {:complete, _},
                     node: ^r_node,
                     group: ^group,
                     source: ^t_node
                   }
                 )

          # The seq-guarded delete was a no-op on the raised key, so the
          # "row is gone" event never fired for it.
          assert of_kind(trace, :muster_drop_stale_entry)
                 |> Enum.filter(&(&1.node == r_node and &1.group == group)) == []
        end
      )
    end
  end

  describe "router-readiness barrier across real nodes (forced ordering)" do
    setup do
      scope = :"muster_barrier_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # README "Router-readiness barrier" -- the exact three-node ordering the
    # barrier exists for: T and the fresh router C agree on the final view and
    # C even holds T's snapshot, but B has not announced that view (its
    # rebalance is parked) -- so a membership-agreement check alone would let C
    # decide from an occupancy table that is, in general, incomplete. Until
    # EVERY member announces the view, all nodes must sit in :converging with
    # can_decide? == false (routers flood -- over-deliver, never miss), and the
    # moment the lagging node is released, everyone must converge to :ready.
    test "no node trusts its occupancy until every member announces the view",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          # Settled 2-node cluster {B, T}.
          {:ok, p_b, b_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(b_node)
          start_remote_muster(p_b, scope)
          await_ready([t_node, b_node])

          # C's name is chosen upfront so the group can be picked from ring
          # math: T holds a group whose router lands on the FRESH node C in
          # the final view -- the worst case, since C is the node whose table
          # nobody has agreed on yet.
          c_name = ~c"muster_barrier_c_#{System.unique_integer([:positive])}"
          c_node = :"#{c_name}@127.0.0.1"
          view3 = Enum.sort([t_node, b_node, c_node])
          hash3 = :erlang.phash2(view3)
          group = pick_group([{view3, c_node}])

          member = spawn(fn -> Process.sleep(:infinity) end)
          :ok = Muster.join(scope, group, member)
          {:ok, r0} = Muster.router(scope, group)
          assert t_node in occupancy_on(r0, scope, group)

          # Park B's rebalance into the 3-node view until the test emits the
          # release event: B is the "still mid-rebalance" third node of the
          # README scenario. (Its discovery ack -- carrying its OLD view -- is
          # sent before the parked rebalance, so C does learn about B.)
          force_ordering(
            until: %{:"$kind" => :test_release_b},
            delay: %{:"$kind" => :muster_rebalance_start, node: ^b_node, to: ^view3}
          )

          {:ok, p_c, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(p_c, scope)

          # T and C adopt the 3-node view -- with B parked neither can go past
          # :converging, so their rebalances into it must end exactly there...
          for n <- [t_node, c_node] do
            assert {:ok, _} =
                     block_until(
                       %{
                         :"$kind" => :muster_status_change,
                         to: :converging,
                         node: ^n,
                         view_hash: ^hash3
                       },
                       10_000
                     )
          end

          # ...and T's rebalance has snapshotted the group to the new router C
          # (the event fires after the snapshot is committed) -- the data is in
          # place...
          assert {:ok, %{groups: snapshotted}} =
                   block_until(
                     %{:"$kind" => :muster_node_state_received, node: ^c_node, source: ^t_node},
                     10_000
                   )

          assert group in snapshotted
          assert t_node in occupancy_on(c_node, scope, group)

          # ...but B's announcement of the view is missing, so neither T nor C
          # may trust an occupancy table: both are stuck in :converging (only a
          # marker from B could advance them, and B is parked) and report
          # can_decide? == false (the flooding fallback).
          assert status(scope) == :converging
          assert remote_status(p_c, scope) == :converging
          refute Muster.can_decide?(scope, hash3)
          refute :erpc.call(c_node, Muster, :can_decide?, [scope, hash3])

          # Routing itself still works while :converging -- it targets the ring
          # node; only the router-side table trust is withheld.
          assert {:ok, ^c_node} = Muster.router(scope, group)

          # Release B. It rebalances, announces the view, and every node must
          # now converge all the way to :ready.
          tp(:test_release_b, %{})
          await_ready(view3)

          assert Muster.can_decide?(scope, hash3)
          assert :erpc.call(c_node, Muster, :can_decide?, [scope, hash3])

          %{view3: view3, hash3: hash3}
        end,
        fn result, trace ->
          # The barrier held the WHOLE cluster down while one announcement was
          # missing: no node emitted :ready for the final view before the
          # release event.
          release_at = Enum.find_index(trace, &(&1[:"$kind"] == :test_release_b))
          assert release_at

          ready3 =
            trace
            |> Enum.with_index()
            |> Enum.filter(fn {e, _} ->
              e[:"$kind"] == :muster_status_change and e[:to] == :ready and
                e[:view_hash] == result.hash3
            end)

          ready_nodes = ready3 |> Enum.map(fn {e, _} -> e.node end) |> Enum.uniq() |> Enum.sort()
          assert ready_nodes == result.view3
          assert Enum.all?(ready3, fn {_, idx} -> idx > release_at end)
        end
      )
    end
  end

  describe "queued vacancy across a rebalance" do
    setup do
      scope = :"muster_vac_#{System.unique_integer([:positive])}"
      # Natural flush only: we align the leave to just after a real flush tick on
      # the owning shard, then use a comfortably larger interval than the 50ms
      # cooldown so the vacancy stays queued across the rebalance before the next
      # natural flush dispatches it.
      start_supervised!(spec(scope, vacancy_cooldown_ms: 50, vacant_flush_interval_ms: 5_000))
      %{scope: scope}
    end

    # README rebalance step 3 + "Stale router entries": a group sitting in
    # :vacant_queued when membership changes is NOT re-announced (we don't hold
    # it), the old router's now-stale row is GC'd by its own sweep once the
    # source demonstrably agrees on the view (this is the positive counterpart
    # of the no-wrongful-drops test above), and the eventual flush routes the
    # vacancy to the group's CURRENT router -- not the one it was queued under.
    test "not announced, stale row swept on the old router, flush targets the new router",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          # Settled 2-node cluster {O, T}.
          {:ok, p_o, o_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(o_node)
          start_remote_muster(p_o, scope)
          await_ready([t_node, o_node])

          # Routed to O before C joins, to C afterwards.
          c_name = ~c"muster_vac_c_#{System.unique_integer([:positive])}"
          c_node = :"#{c_name}@127.0.0.1"
          view3 = Enum.sort([t_node, o_node, c_node])
          group = pick_group([{[t_node, o_node], o_node}, {view3, c_node}])

          member = spawn(fn -> Process.sleep(:infinity) end)
          :ok = Muster.join(scope, group, member)
          assert t_node in occupancy_on(o_node, scope, group)

          shard_name = Forum.Supervisor.shard(scope, group)
          shard_pid = Process.whereis(shard_name)

          shard_index =
            case shard_name do
              name when is_atom(name) ->
                name
                |> Atom.to_string()
                |> String.split("_")
                |> List.last()
                |> String.to_integer()
            end

          assert is_pid(shard_pid)

          # Align the leave to just after a real flush tick on the owning shard.
          # back_in_time: 0 forces a FRESH tick (the default :infinity would
          # happily match one already collected from shard startup, long
          # before this point, giving zero real alignment and letting the
          # "runway" below shrink to whatever happened to be left in that
          # earlier period -- sometimes only milliseconds).
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_flush_tick,
                       node: ^t_node,
                       index: ^shard_index
                     },
                     5_000,
                     0
                   )

          # Vacate. The cooldown (50ms) expires and the vacancy is queued, but
          # the next natural flush has not fired yet -- O still believes we hold
          # the group until the post-rebalance flush below.
          :ok = Muster.leave(scope, group, member)

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: :vacant_queued
                     },
                     5_000
                   )

          # C joins: the group's router moves O -> C while the vacancy is
          # still queued.
          {:ok, p_c, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(p_c, scope)

          await_ready(view3)

          # The new router was never told about the group (we don't hold it)...
          assert occupancy_on(c_node, scope, group) == []

          # ...and the old router sweeps its stale row -- at the latest on its
          # :converging -> :ready transition, which re-judges every row under
          # the now-agreed view. The drop event fires after the delete, so the
          # row is gone once it is collected.
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_drop_stale_entry,
                       node: ^o_node,
                       group: ^group,
                       source: ^t_node
                     },
                     10_000
                   )

          assert occupancy_on(o_node, scope, group) == []

          # The next natural flush must send the vacancy to the CURRENT router, C.
          # Timeout comfortably exceeds vacant_flush_interval_ms: the aligned
          # tick above bounds the wait to at most one interval from here.

          assert {:ok, batch} =
                   block_until(
                     %{:"$kind" => :muster_vacant_batch, :"$span" => :start, source: ^t_node},
                     8_000
                   )

          assert batch.node == c_node
          assert group in batch.groups

          # Batch acknowledged: the group is forgotten on the source
          # (state: nil is the delete_group_state transition).
          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_group_state, node: ^t_node, group: ^group, state: nil},
                     5_000
                   )

          %{group: group, t_node: t_node, o_node: o_node, c_node: c_node}
        end,
        fn result, trace ->
          # The rebalance never announced the queued group to anyone.
          assert [] =
                   of_kind(trace, :muster_node_state_received)
                   |> Enum.filter(&(result.group in &1.groups))

          # Exactly one rightful drop: the old router clearing its stale row.
          drops =
            of_kind(trace, :muster_drop_stale_entry)
            |> Enum.filter(&(&1.group == result.group and &1.source == result.t_node))

          assert Enum.map(drops, & &1.node) == [result.o_node]

          # And no vacant batch for the group ever targeted the OLD router.
          refute of_kind(trace, :muster_vacant_batch)
                 |> Enum.any?(
                   &(&1[:"$span"] == :start and &1.node == result.o_node and
                       result.group in &1.groups)
                 )
        end
      )
    end
  end

  describe "self-routed vacant flush races the rebalance self-row upsert (forced ordering)" do
    setup do
      scope = :"muster_phantom_#{System.unique_integer([:positive])}"
      # partitions: 2 so the victim's shard (index 0) is gathered BEFORE the
      # shard-1 gather we park. Short cooldown + flush so the vacancy injected
      # inside the parked gather window drains to a forgotten group promptly; a
      # large gather timeout so the coordinator can stay parked mid-gather without
      # its synchronous {:rebalance} call to shard 1 timing out (and crashing it).
      start_supervised!(
        spec(scope,
          partitions: 2,
          vacancy_cooldown_ms: 50,
          vacant_flush_interval_ms: 100,
          rebalance_gather_timeout_ms: 30_000
        )
      )

      %{scope: scope}
    end

    # PERMANENT phantom, below the model's coordinator-atomic granularity (the
    # gather and the self-row upsert are one step in the spec's Rebalance action;
    # this came from code review, not the model).
    #
    # do_rebalance stamps snapshot_seq, then gathers each shard's held set with
    # synchronous, in-ORDER GenServer.calls, and only AFTER the gather writes its
    # local self-router occupancy rows (at that by-then-old snapshot_seq). A group
    # an early-gathered shard reported held (:occupied / :cooldown) can vacate AND
    # flush while the coordinator is still blocked gathering a LATER shard: the
    # self-routed flush branch HARD-DELETES the row (`:ets.delete`), discarding the
    # seq high-water mark for {group, node()}. The coordinator's subsequent,
    # lower-seq self-upsert then resurrects the row via `insert_new` as a
    # member-less phantom -- a self-routed row `drop_stale_router_entries` never
    # judges (it skips rows that route to us) and no shard claim state remains to
    # retract. Over-delivery only (broadcasts fan out to a node with no members --
    # no lost data), but PERMANENT until unrelated churn moves the group away. The
    # remote path is already immune: a remote flush tombstones via
    # `vacant_batch` at a fresh seq that beats snapshot_seq.
    #
    # Driven deterministically, black-box: T holds `group` (routed to remote R)
    # with a LIVE member, so the gather reports it held with certainty -- no
    # cooldown-vs-gather timing luck. R leaves -> T rebalances to [T], where
    # `group` routes to T (a CHANGED router => a local self-target the coordinator
    # upserts). A force_ordering parks shard 1's gather so the coordinator blocks
    # mid-gather right after shard 0 has reported `group` held; the test then kills
    # the member, driving the whole vacancy (cooldown -> vacant_queued ->
    # self-routed flush -> forgotten) INSIDE that window, and only then releases
    # the gather. The fix -- a seq-guarded local tombstone (`Scope.vacant_batch/5`
    # locally) in place of the hard delete -- leaves a fresh high-water mark the
    # coordinator's lower-seq upsert loses to, so the phantom never forms. Before
    # the fix the hard delete discarded the seq and the stale upsert resurrected
    # the row.
    test "a self-routed flush during the gather window must not leave a phantom self-row",
         %{scope: scope} do
      t_node = node()
      view_t = [t_node]

      r_name = ~c"muster_phantom_r_#{System.unique_integer([:positive])}"
      r_node = :"#{r_name}@127.0.0.1"

      check_trace(
        fn ->
          # Settled {T, R}.
          {:ok, p_r, ^r_node} = Peer.start(name: r_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready([t_node, r_node])

          # `group` routes to R in {T, R} (so T's claim travels to R and T's OWN
          # occupancy table holds no {group, T} row) and lives on shard index 0
          # (gathered before the shard-1 gather we park below).
          group = pick_phantom_group(t_node, r_node)
          assert :erlang.phash2(group, 2) == 0

          # T holds `group` with a live member; the claim reached R as :occupied,
          # so the shard is :occupied -- definitely reported held at gather time.
          member = spawn(fn -> Process.sleep(:infinity) end)
          :ok = Muster.join(scope, group, member)
          assert t_node in occupancy_on(r_node, scope, group)
          assert Muster.local_member_count(scope, group) == 1

          # Park shard 1's gather so the coordinator, gathering shards in index
          # order, blocks mid-gather right AFTER shard 0 reported `group` held.
          # Installed now -- after the {T,R} join rebalance already gathered the
          # shards -- so it can only catch the R-leave rebalance below.
          force_ordering(
            until: %{:"$kind" => :test_release_gather},
            delay: %{:"$kind" => :muster_rebalance_gather, node: ^t_node, index: 1}
          )

          # R leaves -> T rebalances to [T]. `group` now routes to T (a changed
          # router), so the coordinator self-upserts {group, T} after the gather.
          :ok = stop_supervised({:peer, r_name})

          # The R-leave rebalance has started (the only rebalance whose target is
          # [T]; the join went to [T, R]). Its gather of shard 0 fires ~immediately
          # after and captures `group` as held; shard 1's gather then parks.
          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_rebalance_start, node: ^t_node, to: ^view_t},
                     10_000
                   )

          # Kill the member INSIDE the parked window: the shard enters cooldown
          # (50ms) -> :vacant_queued -> the self-routed flush (the ring is already
          # [T]) HARD-DELETES {group, T} and forgets the group -- all while the
          # coordinator is still blocked on shard 1's parked gather.
          Process.exit(member, :kill)

          # The group is fully forgotten on the shard (state: nil is the
          # delete_group_state in the self-routed flush branch).
          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_group_state, node: ^t_node, group: ^group, state: nil},
                     10_000
                   )

          # Release the parked gather: the coordinator finishes gathering (its
          # reply set still lists `group` as held) and writes its local self-row
          # upsert for `group` at the now-stale snapshot_seq -- resurrecting the
          # row on the buggy code.
          tp(:test_release_gather, %{})

          # T converges to :ready for the single-node view; do_rebalance (and thus
          # its local self-upsert) has fully run by the time this fires.
          await_ready(view_t)

          %{group: group, t_node: t_node}
        end,
        fn result, trace ->
          %{group: group, t_node: t_node} = result

          # The group has no local member and no shard claim state, so any
          # {group, T} occupancy row is necessarily a member-less phantom.
          assert Muster.local_member_count(scope, group) == 0
          assert group_state(scope, group) == nil

          # THE ASSERTION: no phantom self-row. Buggy code leaves {group, T}
          # :present here -- a permanent over-delivery target routing to a node
          # with no members. The seq-guarded local tombstone fix keeps it absent.
          assert occupancy_on(t_node, scope, group) == [],
                 "a self-routed vacant flush racing the rebalance gather left a " <>
                   "member-less phantom occupancy row {#{inspect(group)}, #{inspect(t_node)}}"

          # Sanity: the scenario really happened -- T rebalanced into [T].
          assert of_kind(trace, :muster_rebalance_start)
                 |> Enum.any?(&(&1.node == t_node and &1.to == [t_node]))
        end
      )
    end
  end

  describe "real remote claim/vacancy RPC failures" do
    setup do
      scope = :"muster_rpc_fail_#{System.unique_integer([:positive])}"

      start_supervised!(spec(scope, vacancy_cooldown_ms: 50, vacant_flush_interval_ms: 100))

      %{scope: scope}
    end

    test "a real occupied RPC failure returns :rpc_failed and leaves no local registration",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          r_name = ~c"muster_occ_fail_r_#{System.unique_integer([:positive])}"
          r_node = :"#{r_name}@127.0.0.1"

          {:ok, p_r, ^r_node} = Peer.start(name: r_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready([t_node, r_node])

          group = group_routed_to(scope, r_node)

          # Hold the remote INSERT at the router so the claim cannot complete
          # before we kill the peer, turning this into a real occupied RPC
          # failure instead of a race with a fast success.
          force_ordering(
            until: %{:"$kind" => :test_release_occupied_never},
            delay: %{
              :"$kind" => :muster_occupied_apply,
              :"$span" => :start,
              node: ^r_node,
              group: ^group,
              source: ^t_node
            }
          )

          member = spawn(fn -> Process.sleep(:infinity) end)
          join_task = Task.async(fn -> Muster.join(scope, group, member) end)

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: {:occupied_pending, _}
                     },
                     10_000
                   )

          :ok = stop_supervised({:peer, r_name})

          assert {:error, :rpc_failed} = Task.await(join_task, 10_000)

          wait_until(fn -> Muster.members(scope) == [t_node] and status(scope) == :ready end)

          refute Muster.local_member?(scope, group, member)
          assert Muster.local_member_count(scope, group) == 0

          # The failure queues a vacant instead of forgetting the group
          # outright (see Shard.handle_occupied_done): the group is now
          # self-routed (R is gone), so the next flush's local no-op drains
          # it to nil.
          wait_until(fn -> group_state(scope, group) == nil end)

          %{group: group, t_node: t_node}
        end,
        fn result, trace ->
          refute of_kind(trace, :muster_occupied)
                 |> Enum.any?(&(&1.group == result.group and &1.source == result.t_node))
        end
      )
    end

    test "a failed real vacant batch is re-queued and a later flush drains it",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          r_name = ~c"muster_vac_fail_r_#{System.unique_integer([:positive])}"
          r_node = :"#{r_name}@127.0.0.1"

          {:ok, p_r, ^r_node} = Peer.start(name: r_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready([t_node, r_node])

          group = group_routed_to(scope, r_node)
          member = spawn(fn -> Process.sleep(:infinity) end)

          :ok = Muster.join(scope, group, member)
          assert t_node in occupancy_on(r_node, scope, group)

          :ok = Muster.leave(scope, group, member)

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: :vacant_queued
                     },
                     5_000
                   )

          # Hold the router-side DELETE so the natural flush stays in flight until
          # we kill the peer, forcing the source shard down the real re-queue path.
          force_ordering(
            until: %{:"$kind" => :test_release_vacant_never},
            delay: %{
              :"$kind" => :muster_vacant_batch,
              :"$span" => :start,
              node: ^r_node,
              source: ^t_node
            }
          )

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: :vacant_flushing
                     },
                     5_000
                   )

          :ok = stop_supervised({:peer, r_name})

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: :vacant_queued
                     },
                     10_000
                   )

          wait_until(fn ->
            Muster.members(scope) == [t_node] and status(scope) == :ready
          end)

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: nil
                     },
                     10_000
                   )

          assert occupancy_on(t_node, scope, group) == []
          assert Muster.local_member_count(scope, group) == 0

          %{group: group}
        end,
        fn result, trace ->
          states =
            of_kind(trace, :muster_group_state)
            |> Enum.filter(&(&1.group == result.group and &1.node == node()))
            |> Enum.map(& &1.state)

          assert :vacant_flushing in states
          assert :vacant_queued in states
          assert nil in states
        end
      )
    end
  end

  describe "occupied RPC timeout after remote execution lands" do
    setup do
      scope = :"muster_rpc_timeout_#{System.unique_integer([:positive])}"

      start_supervised!(
        spec(scope, vacancy_cooldown_ms: 50, vacant_flush_interval_ms: 100, rpc_timeout_ms: 150)
      )

      %{scope: scope}
    end

    # README invariant: "router notified ⟹ a local record exists to eventually
    # retract". :erpc does not cancel remote execution on timeout (the fact
    # every other crash-window analysis in this codebase leans on), so a claim
    # RPC can time out on the caller while the router still commits the
    # INSERT afterwards. handle_occupied_done's error branch currently
    # deletes the group state outright on ANY {:error, _} result, timeout
    # included, forgetting the group instead of queuing a retraction. If the
    # remote INSERT then lands, nothing on the source ever tells the router
    # to drop it: the periodic sweep does not help (the group genuinely
    # routes to that router), so the phantom row leaks until the source
    # sends that router a fresh full snapshot or leaves the cluster.
    test "a timed-out :occupied RPC whose write still lands is eventually retracted",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          r_name = ~c"muster_occ_timeout_r_#{System.unique_integer([:positive])}"
          r_node = :"#{r_name}@127.0.0.1"

          {:ok, p_r, ^r_node} = Peer.start(name: r_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready([t_node, r_node])

          group = group_routed_to(scope, r_node)

          # Park the remote apply BEFORE it writes the row, so it genuinely
          # cannot complete before T's short rpc_timeout_ms elapses -- a real
          # client-side timeout, not a race with a fast success.
          force_ordering(
            until: %{:"$kind" => :test_release_occupied_timeout},
            delay: %{
              :"$kind" => :muster_occupied_apply,
              :"$span" => :start,
              node: ^r_node,
              group: ^group,
              source: ^t_node
            }
          )

          member = spawn(fn -> Process.sleep(:infinity) end)
          join_task = Task.async(fn -> Muster.join(scope, group, member) end)

          # T's :erpc.call times out while the remote apply is still parked.
          assert {:error, :rpc_failed} = Task.await(join_task, 10_000)

          # Release the park: this is the RPC's execution finally landing on
          # R, exactly as :erpc's non-cancelling timeout allows.
          tp(:test_release_occupied_timeout, %{})

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_occupied_apply,
                       :"$span" => {:complete, _},
                       node: ^r_node,
                       group: ^group,
                       source: ^t_node
                     },
                     10_000
                   )

          # Capture the occupants from the SAME read that observes the row as
          # present: rpc_timeout_ms/vacant_flush_interval_ms are both very
          # short here, so the window between the delayed insert landing and
          # the queued vacant flush retracting it can be narrower than the gap
          # between two separate reads -- a wait-then-re-read can straddle the
          # retraction and see it disappear again before the assert runs.
          occupants =
            wait_until_value(fn ->
              case occupancy_on(r_node, scope, group) do
                [] -> nil
                other -> other
              end
            end)

          assert t_node in occupants

          # The phantom row must eventually be retracted: T should have
          # queued the group for a vacant flush instead of forgetting it, so
          # the next flush drains the row it may have left behind.
          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_vacant_batch, :"$span" => :start, source: ^t_node},
                     5_000
                   )

          wait_until(fn -> occupancy_on(r_node, scope, group) == [] end)

          %{group: group, t_node: t_node, r_node: r_node}
        end,
        fn result, trace ->
          batches =
            of_kind(trace, :muster_vacant_batch)
            |> Enum.filter(&(&1[:"$span"] == :start and &1.node == result.r_node))

          assert Enum.any?(batches, &(result.group in &1.groups))
        end
      )
    end
  end

  describe "rebalance RPC failure (injected crash)" do
    setup do
      scope = :"muster_inject_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # README "Rebalance RPC failure": if any :receive_node_state call raises
    # or returns {:error, _}, do_rebalance re-raises and Scope CRASHES; the
    # supervisor restarts it, init/1 resets it to a single-node view, rebuilds
    # group_states from the surviving Partition tables, and re-discovers -- and
    # the next rebalance re-announces everything it holds.
    #
    # The failure is injected at the worst possible moment: the very FIRST
    # snapshot T sends to the fresh router C, i.e. exactly when the group's
    # routing moved onto a node that knows nothing about it. inject_crash
    # kills the receiver-side RPC worker at the :muster_node_state_received
    # trace point (recover_after(1): only the first attempt dies), so T's
    # snapshot RPC fails, T's Scope crashes mid-rebalance, and the entire
    # documented recovery pipeline has to run for the cluster to converge.
    test "the source Scope crashes when its snapshot RPC fails, restarts, and re-announces",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          # Settled 2-node cluster {R, T}.
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready([t_node, r_node])

          # Routed to R before C joins, to C afterwards -- so T's rebalance
          # into the 3-node view MUST snapshot C.
          c_name = ~c"muster_inject_c_#{System.unique_integer([:positive])}"
          c_node = :"#{c_name}@127.0.0.1"
          view3 = Enum.sort([t_node, r_node, c_node])
          hash3 = :erlang.phash2(view3)
          group = pick_group([{[t_node, r_node], r_node}, {view3, c_node}])

          member = spawn(fn -> Process.sleep(:infinity) end)
          :ok = Muster.join(scope, group, member)
          assert t_node in occupancy_on(r_node, scope, group)

          inject_crash(
            %{:"$kind" => :muster_node_state_received, node: ^c_node, source: ^t_node},
            recover_after: 1
          )

          {:ok, p_c, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(p_c, scope)

          # The injected crash fires on C's RPC worker (nemesis records it as
          # a :snabbkaffe_crash event carrying the original event's fields)...
          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :snabbkaffe_crash, node: ^c_node, source: ^t_node},
                     10_000
                   )

          # ...failing T's rebalance and crashing T's Scope. Reaching :ready
          # for the 3-node view is only possible after the full recovery --
          # the crashed rebalance died before announcing anything to anyone.
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_status_change,
                       to: :ready,
                       node: ^t_node,
                       view_hash: ^hash3
                     },
                     15_000
                   )

          # R can likewise only reach :ready for the 3-node view after the
          # recovery (the crashed rebalance died before announcing it).
          await_ready(view3, nodes: [r_node])

          # The post-restart rebalance re-announced the group to its router:
          # the retried snapshot is the only one C ever collects (the crashed
          # attempt died at its trace point, before collection), and the event
          # fires after the rows are committed. C wiped T's rows when it saw
          # T's Scope die, so the row can only come from this retry.
          assert {:ok, %{groups: healed}} =
                   block_until(
                     %{:"$kind" => :muster_node_state_received, node: ^c_node, source: ^t_node},
                     15_000
                   )

          assert group in healed

          # C's :ready count for the 3-node view is nondeterministic -- the
          # crashed snapshot already delivered T's marker, so C may or may not
          # have converged once BEFORE it saw T's Scope die -- so an Nth-event
          # block_until has no sound N here: poll its CURRENT state instead.
          wait_until(
            fn ->
              :erpc.call(c_node, Muster, :members, [scope]) == view3 and
                remote_status(p_c, scope) == :ready
            end,
            15_000
          )

          # The local membership survived the crash -- Partition tables are
          # owned by the Supervisor, not Scope.
          assert {:ok, ^c_node} = Muster.router(scope, group)
          assert t_node in occupancy_on(c_node, scope, group)
          assert Muster.local_member_count(scope, group) == 1

          # And the recovered Scope is fully functional.
          assert :ok = Muster.join(scope, group, spawn(fn -> Process.sleep(:infinity) end))

          %{group: group, t_node: t_node, c_node: c_node, hash3: hash3}
        end,
        fn result, trace ->
          # The crash fired exactly once: at the first snapshot to C.
          assert of_kind(trace, :snabbkaffe_crash)
                 |> Enum.count(&(&1[:node] == result.c_node and &1[:source] == result.t_node)) ==
                   1

          # At least one post-crash snapshot from T landed on C and every such
          # delivery carried the group. The crashed attempt dies at its trace point
          # and is never collected; later recovery rounds may legitimately
          # re-snapshot the same group to the same router.
          snaps_to_c =
            of_kind(trace, :muster_node_state_received)
            |> Enum.filter(&(&1.node == result.c_node and &1.source == result.t_node))

          assert snaps_to_c != []
          assert Enum.all?(snaps_to_c, &(result.group in &1.groups))

          # T entered a rebalance into the 3-node view at least twice: the
          # crashed attempt and the successful post-restart one.
          t_rebalances =
            of_kind(trace, :muster_rebalance_start)
            |> Enum.count(&(&1.node == result.t_node and &1.view_hash == result.hash3))

          assert t_rebalances >= 2
        end
      )
    end
  end

  describe "router Scope crash recovery" do
    setup do
      scope = :"muster_crash_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # README "Scope crash for other reasons" / "Rebalance RPC failure": a
    # router Scope that dies takes its occupancy table with it (only the
    # Partition tables survive, on the Supervisor). Peers see the monitor DOWN
    # and rebalance away; the restarted Scope rediscovers the cluster, and the
    # sources' rebalances back into the rejoined view re-snapshot it -- healing
    # the router's occupancy with no manual intervention, after which every
    # node converges to :ready again.
    test "a crashed router Scope is restarted and re-learns occupancy from source snapshots",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)

          view2 = Enum.sort([t_node, r_node])
          await_ready(view2)

          group = group_routed_to(scope, r_node)
          member = spawn(fn -> Process.sleep(:infinity) end)
          :ok = Muster.join(scope, group, member)
          assert t_node in occupancy_on(r_node, scope, group)

          # Kill the router's Scope. Its occupancy table dies with it.
          scope_pid = :erpc.call(r_node, Process, :whereis, [Forum.Supervisor.name(scope)])
          Process.monitor(scope_pid)
          true = :erpc.call(r_node, Process, :exit, [scope_pid, :kill])
          assert_receive {:DOWN, _, _, ^scope_pid, _}

          # T sees the monitor DOWN and rebalances down to itself (this `to`
          # matches no other rebalance in the test)...
          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_rebalance_start, node: ^t_node, to: [^t_node]},
                     10_000
                   )

          # ...then the restarted Scope re-pairs, and T's rebalance back into
          # the 2-node view re-snapshots the router -- the heal. This is the
          # only :receive_node_state of the whole test (the original join
          # travelled as :occupied), so seeing it proves the heal really fired.
          assert {:ok, %{groups: healed}} =
                   block_until(
                     %{:"$kind" => :muster_node_state_received, node: ^r_node, source: ^t_node},
                     10_000
                   )

          assert group in healed

          # Both nodes re-converge to :ready for the 2-node view -- their
          # SECOND time there (the first was the original formation), hence
          # nth: 2.
          await_ready(view2, nth: 2)

          # The healed router knows T holds the group again, and the member is
          # still registered locally (Partition tables survive Scope's death).
          assert t_node in occupancy_on(r_node, scope, group)
          assert Muster.local_member_count(scope, group) == 1

          %{group: group, r_node: r_node, t_node: t_node}
        end,
        fn result, trace ->
          # Exactly one snapshot from T landed on the router -- the post-crash
          # heal -- and it carried the group.
          assert [%{groups: groups}] =
                   of_kind(trace, :muster_node_state_received)
                   |> Enum.filter(&(&1.node == result.r_node and &1.source == result.t_node))

          assert result.group in groups
        end
      )
    end
  end

  describe "rebalance gather timeout on a real membership change" do
    setup do
      scope = :"muster_gather_timeout_dist_#{System.unique_integer([:positive])}"

      start_supervised!(
        spec(scope, vacant_flush_interval_ms: 100, rebalance_gather_timeout_ms: 150)
      )

      %{scope: scope}
    end

    test "a blocked shard times out the coordinator, which restarts and re-converges",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready([t_node, r_node])

          # Hold shard 0 inside the synchronous rebalance gather with a real trace
          # ordering, so the coordinator times out naturally on its GenServer.call.
          force_ordering(
            until: %{:"$kind" => :test_release_gather},
            delay: %{:"$kind" => :muster_rebalance_gather, node: ^t_node, index: 0}
          )

          coord = Process.whereis(Forum.Supervisor.name(scope))
          coord_ref = Process.monitor(coord)

          c_name = ~c"muster_gather_timeout_c_#{System.unique_integer([:positive])}"
          c_node = :"#{c_name}@127.0.0.1"

          {:ok, p_c, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(p_c, scope)

          assert_receive {:DOWN, ^coord_ref, :process, ^coord, _reason}, 5_000

          # Release the held gather on the restarted shard so the recovery
          # rebalance can complete; only the first rebalance should time out.
          tp(:test_release_gather, %{})

          wait_until(
            fn ->
              pid = Process.whereis(Forum.Supervisor.name(scope))
              is_pid(pid) and pid != coord
            end,
            5_000
          )

          view3 = Enum.sort([t_node, r_node, c_node])

          wait_until(
            fn ->
              Enum.sort(Muster.members(scope)) == view3 and
                status(scope) == :ready and
                :erpc.call(r_node, Muster, :members, [scope]) == view3 and
                remote_status(p_r, scope) == :ready and
                :erpc.call(c_node, Muster, :members, [scope]) == view3 and
                remote_status(p_c, scope) == :ready
            end,
            20_000
          )

          assert :ok =
                   Muster.join(
                     scope,
                     :"gather_timeout_recovered_#{System.unique_integer([:positive])}",
                     spawn(fn -> Process.sleep(:infinity) end)
                   )

          %{t_node: t_node, view3: view3}
        end,
        fn result, trace ->
          assert of_kind(trace, :muster_rebalance_start)
                 |> Enum.count(&(&1.node == result.t_node and &1.to == result.view3)) >= 2
        end
      )
    end
  end

  describe "shard crash recovery" do
    setup do
      scope = :"muster_shard_crash_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # A claim shard owns only the per-group state machine; the durable data lives
    # elsewhere -- members in the Supervisor-owned Partition ETS, occupancy in the
    # router's coordinator. So a shard crash must be INVISIBLE at the cluster
    # level: the supervisor restarts the shard, init re-adopts its held groups
    # :occupied from the surviving Partition, and NO cluster traffic is needed --
    # no rebalance (the coordinator does not monitor shards, only peers), no
    # snapshot, no re-:occupied RPC. This is the counterpoint to the router Scope
    # crash above, whose heal IS a cross-node snapshot.
    test "a crashed shard restarts and re-adopts its groups with zero cluster traffic",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)

          view2 = Enum.sort([t_node, r_node])
          await_ready(view2)

          # R holds a group routed to T: R's shard dispatched :occupied to T, so
          # T's (router) occupancy carries {group, R}. The member lives on R.
          group = group_routed_to(scope, t_node)
          :ok = :peer.call(p_r, MusterPeerAux, :join, [scope, group])
          assert r_node in occupancy_on(t_node, scope, group)
          assert :erpc.call(r_node, Muster, :local_member_count, [scope, group]) == 1
          assert :occupied = remote_group_state(r_node, scope, group)

          # Kill the shard that owns the group ON R (a remote node), at the worst
          # moment for that shard -- while it is the live holder of the group. Its
          # member pid and Partition are separate, Supervisor-owned processes and
          # survive.
          shard_name = :erpc.call(r_node, Forum.Supervisor, :shard, [scope, group])
          old_shard = :erpc.call(r_node, Process, :whereis, [shard_name])
          assert is_pid(old_shard)
          ref = Process.monitor(old_shard)
          true = :erpc.call(r_node, Process, :exit, [old_shard, :kill])
          assert_receive {:DOWN, ^ref, :process, ^old_shard, :killed}, 5_000

          # The supervisor restarts the shard; init re-adopts the group :occupied
          # from R's surviving Partition. rebuild_group_states does not emit a
          # trace point, so poll for the restarted pid + re-adopted state.
          wait_until(fn ->
            pid = :erpc.call(r_node, Process, :whereis, [shard_name])

            is_pid(pid) and pid != old_shard and
              remote_group_state(r_node, scope, group) == :occupied
          end)

          # Transparent: occupancy on the router is unchanged, the member
          # survived, neither node left :ready, and membership never moved -- the
          # kill never disturbed the cluster.
          assert r_node in occupancy_on(t_node, scope, group)
          assert :erpc.call(r_node, Muster, :local_member_count, [scope, group]) == 1
          assert remote_status(p_r, scope) == :ready
          assert status(scope) == :ready
          assert :erpc.call(r_node, Muster, :members, [scope]) == view2

          # The recovered shard is fully functional: a fresh join through it lands.
          :ok = :peer.call(p_r, MusterPeerAux, :join, [scope, group])

          wait_until(fn ->
            :erpc.call(r_node, Muster, :local_member_count, [scope, group]) == 2
          end)

          %{group: group, r_node: r_node, t_node: t_node}
        end,
        fn result, trace ->
          # The whole heal was shard-local: NO node ever applied a snapshot for
          # this group. The original claim travelled as :occupied and the restart
          # re-adopts from the Partition -- neither path is a snapshot. (Contrast
          # the router Scope crash, where the heal IS a snapshot.)
          snaps =
            of_kind(trace, :muster_node_state_received)
            |> Enum.filter(&(result.group in &1.groups))

          assert snaps == [],
                 "a shard crash must heal locally -- no cross-node snapshot should be needed"

          # And no rebalance was triggered by the crash: the only rebalances are
          # the cluster-formation ones into the 2-node view (a shard DOWN is not
          # a membership event).
          view2_hash = :erlang.phash2(Enum.sort([result.t_node, result.r_node]))

          assert of_kind(trace, :muster_rebalance_start)
                 |> Enum.all?(&(&1.view_hash == view2_hash or &1.to == [&1.node])),
                 "a shard crash must not trigger a rebalance into any new view"
        end
      )
    end

    # The dispatch→state-write window. handle_join must commit the durable
    # :occupied_pending BEFORE dispatching the :occupied RPC, so that a shard
    # crash in that window is recoverable WITHOUT a caller retry: the restart
    # reconciles the un-confirmed claim (no live member) straight to
    # :vacant_queued, and the flush retracts whatever row the orphaned RPC worker
    # (monitored, not linked, so it survives the crash) lands on the router.
    #
    # If the state were written AFTER dispatch, a crash here would leave the
    # source with NO record of the claim while the orphaned worker's INSERT lands
    # a phantom occupancy row on the router that nothing ever retracts. We force
    # exactly that crash by injecting at :muster_occupied_dispatched (the anchor
    # fires after the worker is spawned but before handle_join returns) and assert
    # the row never survives -- proving recovery does not depend on the caller.
    test "a shard crash in the :occupied dispatch→state-write window strands no router row",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready([t_node, r_node])

          # A group whose router is the REMOTE node, so the join takes the
          # dispatch (remote-router) branch on T.
          group = group_routed_to(scope, r_node)

          # Crash T's shard the FIRST time it dispatches the :occupied for this
          # group -- i.e. right in the dispatch→state-write window. recover_after(1)
          # leaves the restarted shard healthy.
          inject_crash(
            %{:"$kind" => :muster_occupied_dispatched, node: ^t_node, group: ^group},
            recover_after: 1
          )

          # Claim off to the side: the join call dies with the shard and we NEVER
          # retry it -- recovery must not depend on a caller retry. spawn (not
          # spawn_link) so its exit does not touch the test.
          member = spawn(fn -> Process.sleep(:infinity) end)
          _claimer = spawn(fn -> Muster.join(scope, group, member) end)

          # The injected crash fires on T's shard...
          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :snabbkaffe_crash, node: ^t_node, group: ^group},
                     10_000
                   )

          # ...and the restarted shard reconciles the un-confirmed claim (no live
          # member) to :vacant_queued -- with no caller retry. (On the broken
          # ordering the source has no record at all, so this never appears.)
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^t_node,
                       group: ^group,
                       state: :vacant_queued
                     },
                     10_000
                   )

          # The natural flush retracts the row (a real tombstone if the orphaned
          # worker landed it, a no-op DELETE otherwise). The source then forgets
          # the group (state: nil).

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_group_state, node: ^t_node, group: ^group, state: nil},
                     10_000
                   )

          # The orphaned INSERT may land before OR after the DELETE; the seq guard
          # makes the (lower-seq) INSERT lose either way, so the row clears for good.
          wait_until(fn -> occupancy_on(r_node, scope, group) == [] end)

          %{group: group, r_node: r_node, t_node: t_node}
        end,
        fn result, _trace ->
          refute result.t_node in occupancy_on(result.r_node, scope, result.group),
                 "an orphaned :occupied INSERT stranded a phantom row the source never retracted"

          assert group_state(scope, result.group) == nil
          assert Muster.local_member_count(scope, result.group) == 0
        end
      )
    end
  end

  describe "cooldown across a shard crash -- the retraction survives a restart mid-cooldown" do
    setup do
      scope = :"muster_cooldown_crash_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # No existing test crashes a shard while its group sits in :cooldown. The
    # single-node shard_test.exs restart test only ever kills a shard with a
    # LIVE member (straight back to :occupied); the cooldown-specific
    # reconciliation branch -- a durable :occupied/:cooldown claim with NO
    # live member re-enters :cooldown, not :occupied, on restart -- exists in
    # shard.ex but is otherwise only proven by the code being there, never
    # exercised end-to-end across a real crash+restart. This proves it: R's
    # last member leaves (cooldown starts), R's shard for that group is
    # killed mid-cooldown, and the restart must re-arm a FRESH cooldown timer
    # rather than silently forgetting the claim or resurrecting it :occupied.
    # That fresh timer must also be a real, functioning timer, not just a
    # state label: left alone, it must still expire, queue the group, and
    # flush the retraction to the router exactly as an uninterrupted cooldown
    # would have.
    test "a shard killed mid-cooldown re-arms the timer on restart and still flushes to vacant",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope, vacancy_cooldown_ms: 50)
          await_ready([t_node, r_node])

          # A group routed to T, held by a member on R: R is the source
          # carrying the claim state, T is the router whose occupancy row
          # tracks it.
          group = group_routed_to(scope, t_node)

          # Join then immediately leave the same pid on R: the group is left
          # genuinely mid-cooldown on R, with T's occupancy row still intact
          # (cooldown never sends an RPC -- the router still believes R holds
          # the group).
          :ok = :peer.call(p_r, MusterPeerAux, :join_and_leave, [scope, group])
          assert :cooldown = remote_group_state(r_node, scope, group)
          assert r_node in occupancy_on(t_node, scope, group)

          # Kill the shard that owns the group ON R, at the worst possible
          # moment: mid-cooldown, with no live member to fall back on.
          shard_name = :erpc.call(r_node, Forum.Supervisor, :shard, [scope, group])
          old_shard = :erpc.call(r_node, Process, :whereis, [shard_name])
          assert is_pid(old_shard)
          ref = Process.monitor(old_shard)
          true = :erpc.call(r_node, Process, :exit, [old_shard, :kill])
          assert_receive {:DOWN, ^ref, :process, ^old_shard, :killed}, 5_000

          # The supervisor restarts the shard; reconciliation finds a durable
          # :cooldown claim with no live member and re-enters :cooldown with a
          # FRESH timer, rather than forgetting the claim or reclaiming it
          # :occupied. rebuild_group_states emits no trace point of its own,
          # so poll for the restarted pid + reconciled state.
          wait_until(fn ->
            pid = :erpc.call(r_node, Process, :whereis, [shard_name])

            is_pid(pid) and pid != old_shard and
              remote_group_state(r_node, scope, group) == :cooldown
          end)

          # Transparent so far: T's occupancy row (and the rest of the
          # cluster) never saw the crash.
          assert r_node in occupancy_on(t_node, scope, group)
          assert remote_status(p_r, scope) == :ready
          assert status(scope) == :ready

          # The re-armed timer is a REAL timer, not just a state label: left
          # alone, it expires, queues the group, and the natural flush
          # retracts T's occupancy row exactly as an uninterrupted cooldown
          # would have.
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^r_node,
                       group: ^group,
                       state: :vacant_queued
                     },
                     10_000
                   )

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_group_state,
                       node: ^r_node,
                       group: ^group,
                       state: nil
                     },
                     10_000
                   )

          wait_until(fn -> occupancy_on(t_node, scope, group) == [] end)

          %{group: group, r_node: r_node, t_node: t_node}
        end,
        fn result, trace ->
          # The crash was followed by a genuinely FRESH cooldown, not a reuse
          # of the pre-crash one: two separate :cooldown entries for this
          # group on R (the pre-crash one and the post-restart re-arm).
          cooldown_entries =
            of_kind(trace, :muster_group_state)
            |> Enum.filter(
              &(&1.node == result.r_node and &1.group == result.group and &1.state == :cooldown)
            )

          assert length(cooldown_entries) >= 2,
                 "expected the restart to re-arm cooldown, not silently skip it or reclaim :occupied"

          # No rebalance and no snapshot for this group: a shard crash is not
          # a membership event, and the eventual retraction is shard-local
          # reconciliation plus one ordinary vacant-batch flush, not cluster
          # churn.
          view2_hash = :erlang.phash2(Enum.sort([result.t_node, result.r_node]))

          assert of_kind(trace, :muster_rebalance_start)
                 |> Enum.all?(&(&1.view_hash == view2_hash or &1.to == [&1.node])),
                 "a shard crash must not trigger a rebalance into any new view"

          assert of_kind(trace, :muster_node_state_received)
                 |> Enum.filter(&(result.group in &1.groups)) == [],
                 "a cooldown retraction across a shard crash must not need a cross-node snapshot"
        end
      )
    end
  end

  describe "cascading joins -- two-phase view adoption gates the holder on its old peer" do
    setup do
      scope = :"muster_cascade_#{System.unique_integer([:positive])}"
      # Long rpc_timeout so the parked view-change PREPARE RPC (from the gated
      # holder to the frozen peer) does not time out and crash the holder while we
      # hold the window open.
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100, rpc_timeout_ms: 30_000))
      %{scope: scope}
    end

    # Two-phase view adoption characterization of the rolling-deploy cascade.
    # Without the gate, a holder T could race ahead to the 4-node view while an
    # old peer R lagged, obliviously :ready for a superseded view -- the missed-
    # delivery window. The gate removes that window: T cannot commit (and route
    # joins under) a grown view until every OLD-view member has acked its move.
    # So freezing R now freezes T's ADOPTION, not just R's.
    #
    # We freeze R (parking both ways it could act on the cascade: registering C,
    # and applying T's transition) and show:
    #   * T is GATED -- while R never acks, T stays committed on {T,R}; it cannot
    #     adopt {T,R,C} or {T,R,C,D}. The group therefore stays routed to R, which
    #     still holds T's row, so a broadcast is never missed.
    #   * When C then D join, T only SUPERSEDES its still-uncommitted target; it
    #     never materialises the intermediate {T,R,C} view at all.
    #   * On release, R acks and T commits the FINAL view directly, re-handing the
    #     group straight to the final router D. The intermediate router C never
    #     receives the group (T never committed the view that routed to it) -- an
    #     even stronger "intermediate view never trusted" than before: it is never
    #     even reached.
    test "a frozen old peer gates the holder's view adoption; it converges to the final router",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          # Settled 2-node cluster {T, R}.
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope, rpc_timeout_ms: 30_000)
          await_ready([t_node, r_node])

          c_name = ~c"muster_cascade_c_#{System.unique_integer([:positive])}"
          c_node = :"#{c_name}@127.0.0.1"
          d_name = ~c"muster_cascade_d_#{System.unique_integer([:positive])}"
          d_node = :"#{d_name}@127.0.0.1"
          two_view = Enum.sort([t_node, r_node])
          view3 = Enum.sort([t_node, r_node, c_node])
          view4 = Enum.sort([t_node, r_node, c_node, d_node])
          hash3 = :erlang.phash2(view3)
          hash4 = :erlang.phash2(view4)

          # The group's router moves on EVERY membership change: R -> C -> D.
          group =
            pick_group([{two_view, r_node}, {view3, c_node}, {view4, d_node}])

          :ok = Muster.join(scope, group, spawn(fn -> Process.sleep(:infinity) end))
          assert {:ok, ^r_node} = Muster.router(scope, group)
          assert t_node in occupancy_on(r_node, scope, group)

          # Freeze R so it can neither register C (start its own view-change) nor
          # ack T's transition (let T commit). Either park freezes R's coordinator;
          # both together make it deterministic regardless of R's mailbox order.
          # Released together by :test_release_r.
          force_ordering(
            until: %{:"$kind" => :test_release_r},
            delay: %{:"$kind" => :muster_peer_registered, node: ^r_node, peer: ^c_node}
          )

          force_ordering(
            until: %{:"$kind" => :test_release_r},
            delay: %{:"$kind" => :muster_transition_applied, node: ^r_node, source: ^t_node}
          )

          # C joins. T tries to grow to {T,R,C}, preparing its old peer R -- which
          # is frozen and never acks, so T is GATED.
          {:ok, p_c, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(p_c, scope, rpc_timeout_ms: 30_000)

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_view_prepare, node: ^t_node, target: ^view3},
                     10_000
                   )

          # T is gated: still committed on {T,R}; the group is still on R.
          assert Enum.sort(Muster.members(scope)) == two_view
          assert t_node in occupancy_on(r_node, scope, group)

          # D joins. T only SUPERSEDES its (still-uncommitted) target to {T,R,C,D};
          # it never materialised {T,R,C}. Still gated on R.
          {:ok, p_d, ^d_node} = Peer.start(name: d_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(d_node)
          start_remote_muster(p_d, scope, rpc_timeout_ms: 30_000)

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_view_prepare, node: ^t_node, target: ^view4},
                     15_000
                   )

          assert Enum.sort(Muster.members(scope)) == two_view
          refute Muster.can_decide?(scope, hash4)
          refute Muster.can_decide?(scope, hash3)

          # Release R: it acks T's transition, T commits the FINAL view directly
          # (never the intermediate one), and the whole cluster converges.
          tp(:test_release_r, %{})
          await_ready(view4)

          # The group re-homed straight to the final router D.
          assert {:ok, ^d_node} = Muster.router(scope, group)
          wait_until(fn -> t_node in occupancy_on(d_node, scope, group) end)
          assert Muster.can_decide?(scope, hash4)

          # R (the only node that ever held the group's row) swept it once its
          # source demonstrably agrees on the final view.
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_drop_stale_entry,
                       node: ^r_node,
                       group: ^group,
                       source: ^t_node
                     },
                     10_000
                   )

          assert occupancy_on(r_node, scope, group) == []
          # The intermediate router C never received the group at all.
          assert occupancy_on(c_node, scope, group) == []

          %{
            group: group,
            t_node: t_node,
            r_node: r_node,
            c_node: c_node,
            d_node: d_node,
            hash3: hash3,
            hash4: hash4,
            view4: view4
          }
        end,
        fn result, trace ->
          status_changes = of_kind(trace, :muster_status_change)

          # T never trusted (went :ready for) the intermediate 3-node view --
          # with the gate it never committed it, so it could not.
          assert Enum.count(
                   status_changes,
                   &(&1.node == result.t_node and &1.to == :ready and &1.view_hash == result.hash3)
                 ) == 0

          # Every node's LAST status word is :ready for the final view.
          last_status =
            status_changes
            |> Enum.group_by(& &1.node)
            |> Map.new(fn {n, events} -> {n, List.last(events)} end)

          assert Enum.sort(Map.keys(last_status)) == result.view4

          for {_n, e} <- last_status do
            assert e.to == :ready
            assert e.view_hash == result.hash4
          end

          # T snapshotted the group EXACTLY ONCE -- straight to the final router D.
          # The intermediate router C never received it (T never committed the
          # view that routed the group there).
          group_snaps =
            of_kind(trace, :muster_node_state_received)
            |> Enum.filter(&(&1.source == result.t_node and result.group in &1.groups))

          assert [%{node: d}] = group_snaps
          assert d == result.d_node

          # Only R ever held (and thus swept) the group's row; C and D never did.
          drops =
            of_kind(trace, :muster_drop_stale_entry)
            |> Enum.filter(&(&1.group == result.group and &1.source == result.t_node))

          assert Enum.map(drops, & &1.node) |> Enum.uniq() == [result.r_node]
        end
      )
    end
  end

  describe "node death -- groups rebalance onto the remaining nodes" do
    setup do
      scope = :"muster_death_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # README "Trigger" + "Vacant-time RPC failure" cleanup: when a node leaves
    # the cluster, every survivor sees its Scope's monitor DOWN, wipes the
    # occupancy rows keyed by the dead node, recomputes the ring over the
    # remaining members, re-announces its held groups to their new routers,
    # and converges back to :ready. The three victim groups are picked from
    # ring math so each documents one facet:
    #   g_t    held by T, routed to D before / S after -- T must re-tell S
    #   g_s    held by S, routed to D before / T after -- S must re-tell T
    #   g_dead held by D alone, routed to T throughout -- T's :DOWN wipe must
    #          clear the {g_dead, D} row (nothing else ever cleans a dead
    #          source's rows; D can't flush a vacancy, it's gone)
    test "a dead node's routed groups move to survivors and its source rows are wiped",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          # Settled 2-node cluster {T, S} (S = the surviving peer).
          {:ok, p_s, s_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(s_node)
          start_remote_muster(p_s, scope)
          view2 = Enum.sort([t_node, s_node])
          await_ready(view2)

          # D's name is fixed upfront so the victim groups can be picked
          # before it boots.
          d_name = ~c"muster_death_d_#{System.unique_integer([:positive])}"
          d_node = :"#{d_name}@127.0.0.1"
          view3 = Enum.sort([t_node, s_node, d_node])
          g_t = pick_group([{view3, d_node}, {view2, s_node}])
          g_s = pick_group([{view3, d_node}, {view2, t_node}])
          g_dead = pick_group([{view3, t_node}, {view2, t_node}])

          {:ok, p_d, ^d_node} = Peer.start(name: d_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(d_node)
          start_remote_muster(p_d, scope)
          await_ready(view3)

          :ok = Muster.join(scope, g_t, spawn(fn -> Process.sleep(:infinity) end))
          :ok = :peer.call(p_s, MusterPeerAux, :join, [scope, g_s])
          :ok = :peer.call(p_d, MusterPeerAux, :join, [scope, g_dead])

          # Every router knows its group (join/3 only returns :ok once the
          # router has been told).
          assert t_node in occupancy_on(d_node, scope, g_t)
          assert s_node in occupancy_on(d_node, scope, g_s)
          assert d_node in occupancy_on(t_node, scope, g_dead)

          # Kill the node. Both survivors must detect the DOWN, rebalance to
          # {T, S} and re-converge -- their SECOND :ready at view2, hence nth: 2.
          :ok = stop_supervised({:peer, d_name})
          await_ready(view2, nth: 2)

          # The survivors agree the cluster is just {T, S}...
          assert Enum.sort(Muster.members(scope)) == view2
          assert :erpc.call(s_node, Muster, :members, [scope]) == view2

          # ...the groups whose router died moved onto survivors, and the new
          # routers were re-told by the holders...
          assert {:ok, ^s_node} = Muster.router(scope, g_t)
          assert t_node in occupancy_on(s_node, scope, g_t)
          assert {:ok, ^t_node} = Muster.router(scope, g_s)
          assert s_node in occupancy_on(t_node, scope, g_s)

          # ...and the dead node survives nowhere as a source: the group only
          # it held is gone, and no occupancy row on any survivor lists it.
          assert occupancy_on(t_node, scope, g_dead) == []
          assert occupancy_on(s_node, scope, g_dead) == []

          dumps = [
            {t_node, GenServer.call(Forum.Supervisor.name(scope), :dump)},
            {s_node, :erpc.call(s_node, GenServer, :call, [Forum.Supervisor.name(scope), :dump])}
          ]

          for {n, dump} <- dumps, {group, sources} <- dump.occupancy do
            refute d_node in sources,
                   "#{inspect(n)} still lists the dead node as a source of #{inspect(group)}"
          end

          # The cluster is fully functional: a fresh join for the group the
          # dead node used to hold succeeds against its current router.
          assert :ok = Muster.join(scope, g_dead, spawn(fn -> Process.sleep(:infinity) end))

          %{
            g_t: g_t,
            g_s: g_s,
            t_node: t_node,
            s_node: s_node,
            view2: view2,
            view3: view3
          }
        end,
        fn result, trace ->
          # Each survivor rebalanced view3 -> view2 exactly once (the `from`
          # match excludes the original 1 -> 2 node formation rebalances).
          for n <- [result.t_node, result.s_node] do
            assert of_kind(trace, :muster_rebalance_start)
                   |> Enum.count(
                     &(&1.node == n and &1.from == result.view3 and &1.to == result.view2)
                   ) == 1
          end

          # The post-death re-announces really carried the moved groups: T
          # re-told S about g_t, and S re-told T about g_s. A survivor gaining a
          # group on a leave is a settled router, so the re-announce travels as a
          # DELTA (`:muster_delta_received`), not a full snapshot.
          deliveries =
            of_kind(trace, :muster_delta_received) ++ of_kind(trace, :muster_node_state_received)

          assert Enum.any?(
                   deliveries,
                   &(&1.node == result.s_node and &1.source == result.t_node and
                       result.g_t in &1.groups)
                 )

          assert Enum.any?(
                   deliveries,
                   &(&1.node == result.t_node and &1.source == result.s_node and
                       result.g_s in &1.groups)
                 )
        end
      )
    end
  end

  describe "crashed peer -- a claim queued on the router outlives the :DOWN wipe" do
    setup do
      scope = :"muster_crash_queued_#{System.unique_integer([:positive])}"

      # A short sweep interval so reap_departed_sources/1 -- the GC that collects
      # this row -- gets its turn quickly, and a fast heartbeat so readiness is
      # re-evaluated (and stale entries re-judged) repeatedly alongside it. Neither
      # of the other two passes on the same :sweep_tombstones tick can touch the
      # row: reap_tombstones/1 only reaps tombstones, and drop_stale_router_entries
      # skips a source that has not announced our view (and g routes to us anyway).
      start_supervised!(
        spec(scope,
          vacant_flush_interval_ms: 100,
          view_heartbeat_interval_ms: 300,
          tombstone_window_ms: 500
        )
      )

      %{scope: scope}
    end

    # handle_info({:DOWN, ...}) evicts a crashed peer immediately,
    # which match_deletes every occupancy row attributable to the
    # dying pid. But occupied/5 writes the occupancy table DIRECTLY from its :erpc
    # executor process (upsert_if_newer, no coordinator hop), so nothing
    # serializes that write against the coordinator handling the :DOWN. A claim
    # request that reached us before the peer died can still be sitting in our run
    # queue when the wipe runs, and insert its row a moment after: a dead node
    # cannot send a new request, but one already delivered still executes.
    #
    # Muster.targets/3 returns Scope.occupancy/2 unfiltered, so until something
    # collects it the row is a live fan-out target for a node that no longer
    # exists. reap_departed_sources/1 is what collects it, on the periodic tick,
    # from the current view and connection set rather than from anything the
    # departure left behind.
    test "a claim queued before the crash lands after the wipe and is reaped by the departed-source sweep",
         %{scope: scope} do
      t_node = node()
      c_name = ~c"muster_crash_queued_claim_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, pc, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(pc, scope)
          await_ready([t_node, c_node])

          g = group_routed_to(scope, t_node)
          assert g, "no group routing to T found"
          refute c_node in Muster.occupancy(scope, g)

          # Hold the router-side write of C's claim. The span's :start fires ahead
          # of the upsert, so while parked the row is genuinely not in the table.
          force_ordering(
            delay: %{
              :"$kind" => :muster_occupied_apply,
              :"$span" => :start,
              node: ^t_node,
              source: ^c_node
            },
            until: %{:"$kind" => :test_release}
          )

          {:ok, _} = Task.start(fn -> :peer.call(pc, MusterPeerAux, :join, [scope, g]) end)

          # The claim is dispatched from C...
          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_occupied_dispatched, node: ^c_node, group: ^g},
                     10_000
                   )

          # ...and here is the one step we cannot observe: a force_ordering-delayed
          # event stays invisible to the collector until released, so there is no
          # trace point for "the request reached T and parked". Give the :erpc the
          # moment it needs to be sent. If it is not sent before C dies, the write
          # never happens at all and the assertion after the release says so
          # loudly rather than passing vacuously.
          Process.sleep(300)

          # C dies outright. No drain, so T learns about it from the monitor and
          # evicts it on the :DOWN.
          Node.monitor(c_node, true)
          :ok = stop_supervised({:peer, c_name})
          assert_receive {:nodedown, ^c_node}, 5_000

          # T has fully processed the departure: depart_peer/3 has run and wiped
          # every row attributable to C, and the ring is back to T alone.
          wait_until(fn -> Muster.members(scope) == [t_node] end)
          refute c_node in Muster.occupancy(scope, g)

          # Now the queued write executes after the wipe, exactly as it would if
          # the :erpc executor had simply been scheduled late.
          tp(:test_release, %{})

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_occupied, node: ^t_node, source: ^c_node, group: ^g},
                     5_000
                   )

          assert {:ok, %{rows: 1}} =
                   block_until(
                     %{
                       :"$kind" => :muster_departed_source_reaped,
                       node: ^t_node,
                       source: ^c_node
                     },
                     10_000
                   )

          assert Muster.members(scope) == [t_node]
          assert status(scope) == :ready

          vh = :persistent_term.get({Forum.Muster, scope, :view_hash})
          assert {:ok, srcs} = Muster.targets(scope, g, vh)

          refute c_node in srcs,
                 "#{inspect(c_node)} crashed and was wiped by the :DOWN, but a claim already " <>
                   "queued on #{inspect(t_node)} executed afterwards and survived the " <>
                   "departed-source reap: targets/3 returns #{inspect(srcs)}"
        end,
        fn _trace -> :ok end
      )
    end
  end

  describe "coordinator crash between a graceful eviction and its reap" do
    setup do
      scope = :"muster_reap_lost_#{System.unique_integer([:positive])}"

      # a fast heartbeat (which also sets singleton promotion, at 3x, so the restarted coordinator re-readies
      # quickly) and a short sweep interval, so every GC gets several turns inside the observation window.
      start_supervised!(
        spec(scope,
          vacant_flush_interval_ms: 100,
          view_heartbeat_interval_ms: 300,
          tombstone_window_ms: 500
        )
      )

      %{scope: scope}
    end

    # reap_departed_sources/1 must hold no per-departure state, because a
    # coordinator crash destroys all of it while the rows it guards survive.
    #
    # state.peers and the watermark leave_watermark/3 parks die with the
    # coordinator. The occupancy table does not: it is created in
    # Forum.Supervisor's init/1, and a crash restarts the coordinator, the shards
    # and the sentinel via :rest_for_one so init/1 does not re-run and the rows are left intact.
    #
    # What is left is a row for a node that drained and died, on a coordinator that
    # never heard of it.
    test "a Scope crash cannot strand a departed peer's row", %{scope: scope} do
      t_node = node()
      c_name = ~c"muster_reap_lost_c_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, pc, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(pc, scope)
          await_ready([t_node, c_node])

          g = group_routed_to(scope, t_node)
          assert g, "no group routing to T found"
          refute c_node in Muster.occupancy(scope, g)

          # Hold the router-side write of C's claim. The span's :start fires ahead
          # of the upsert, so while parked the row is genuinely not in the table.
          force_ordering(
            delay: %{
              :"$kind" => :muster_occupied_apply,
              :"$span" => :start,
              node: ^t_node,
              source: ^c_node
            },
            until: %{:"$kind" => :test_release}
          )

          # A real first-member join on C, so the parked write carries the seq and
          # coordinator pid C's shard actually stamped rather than fabricated ones.
          # The join blocks in :occupied_pending until we release, so run it off to
          # the side; we never use its result.
          {:ok, _} = Task.start(fn -> :peer.call(pc, MusterPeerAux, :join, [scope, g]) end)

          # The claim has left C (the shard is :occupied_pending and its worker is
          # in flight to T, where it will park at the forced :muster_occupied_apply
          # :start). We wait on this SOURCE-side event because force_ordering
          # withholds the parked event from the trace until it is released.
          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_occupied_dispatched, node: ^c_node, group: ^g},
                     10_000
                   )

          # The park itself is unobservable for the same reason, so there is no
          # trace point for "the request reached T". Give the :erpc the moment it
          # needs to be sent; if it was not, the block_until after the release says
          # so loudly rather than passing vacuously.
          Process.sleep(300)

          # C drains. It broadcasts one {:muster_leaving, self(), view_seq} and
          # nothing per-group -- a leaver skips recompute_members, so it never
          # rebalances and never dispatches a vacant_batch -- so nothing retracts
          # the parked claim or outranks its seq.
          assert :ok = :peer.call(pc, MusterPeerAux, :drain, [scope, [settle_ms: 200]])
          wait_until(fn -> Muster.members(scope) == [t_node] end)

          # The eviction match_deleted every row attributable to C, and the parked
          # write is not one of them yet.
          refute c_node in Muster.occupancy(scope, g)

          # Now the claim lands, exactly as it would if T's :erpc executor had
          # simply been scheduled after the eviction.
          tp(:test_release, %{})

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_occupied, node: ^t_node, source: ^c_node, group: ^g},
                     5_000
                   )

          assert c_node in Muster.occupancy(scope, g)

          # T's coordinator crashes while C is still alive, so the watch has not
          # fired yet and no reap has been scheduled. Both die here, along with
          # the departure watermark and state.peers.
          t_coord = Process.whereis(Forum.Supervisor.name(scope))
          ref = Process.monitor(t_coord)
          true = Process.exit(t_coord, :kill)
          assert_receive {:DOWN, ^ref, _, _, _}, 5_000

          wait_until(fn ->
            pid = Process.whereis(Forum.Supervisor.name(scope))
            is_pid(pid) and pid != t_coord
          end)

          assert c_node in Muster.occupancy(scope, g),
                 "the row did not survive the coordinator crash, so there is nothing to strand"

          # C actually dies. The restarted coordinator never monitored it and knows
          # nothing about the departure. It only knows that C is not in its view and not
          # connected, which is all the sweep needs.
          Node.monitor(c_node, true)
          :ok = stop_supervised({:peer, c_name})
          assert_receive {:nodedown, ^c_node}, 5_000

          # T re-converges as a singleton (heartbeat 300ms x 3), so targets/3 can
          # decide again...
          wait_until(fn -> status(scope) == :ready end, 15_000)
          assert Muster.members(scope) == [t_node]

          # we wait for the sweep that actually collects the row
          assert {:ok, %{rows: 1}} =
                   block_until(
                     %{
                       :"$kind" => :muster_departed_source_reaped,
                       node: ^t_node,
                       source: ^c_node
                     },
                     10_000
                   )

          vh = :persistent_term.get({Forum.Muster, scope, :view_hash})
          assert {:ok, srcs} = Muster.targets(scope, g, vh)

          refute c_node in srcs,
                 "#{c_node} drained and died, and #{t_node}'s coordinator " <>
                   "crashed in between, so nothing the departure left behind survived while " <>
                   "the Supervisor-owned table kept the row: targets/3 returns #{inspect(srcs)}"
        end,
        fn _trace -> :ok end
      )
    end
  end

  describe "network partition -- split rebalances independently, heal re-merges" do
    setup do
      scope = :"muster_split_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # README "Network partition": nodes that lose sight of each other detect
    # the peer DOWN, rebalance independently, and route to whoever they can
    # see; on heal, discovery -> rebalance merges the sub-clusters. Here the
    # split is between the two PEERS while T stays connected to both -- the
    # asymmetric case, harsher than a clean split: each peer's view {T, self}
    # and T's view {T, A, B} disagree, so the readiness barrier must keep
    # EVERY node in :converging (routers flood, never trust occupancy) until
    # the heal, and the stale-entry sweeps run during the split must not
    # delete T's snapshotted rows (T never agreed to the split views).
    test "peers that lose sight of each other rebalance apart and re-converge on heal", %{
      scope: scope
    } do
      t_node = node()

      check_trace(
        fn ->
          # Both peers run with -connect_all false: their globals neither
          # auto-mesh (the test wires the A<->B connection explicitly) nor
          # report the deliberate disconnect to T's global, whose
          # prevent_overlapping_partitions logic would otherwise tear down
          # T's own links to "fix" the partial connectivity.
          args = [~c"-connect_all", ~c"false"]

          {:ok, p_a, a_node} = Peer.start(aux_mod: @aux_mod, args: args)
          :ok = :snabbkaffe.forward_trace(a_node)
          start_remote_muster(p_a, scope)
          await_ready([t_node, a_node])

          {:ok, p_b, b_node} = Peer.start(aux_mod: @aux_mod, args: args)
          true = :erpc.call(b_node, Node, :connect, [a_node])
          :ok = :snabbkaffe.forward_trace(b_node)
          start_remote_muster(p_b, scope)

          view3 = Enum.sort([t_node, a_node, b_node])
          hash3 = :erlang.phash2(view3)
          await_ready(view3)

          # T holds one group routed to each peer.
          g_a = group_routed_to(scope, a_node)
          g_b = group_routed_to(scope, b_node)
          :ok = Muster.join(scope, g_a, spawn(fn -> Process.sleep(:infinity) end))
          :ok = Muster.join(scope, g_b, spawn(fn -> Process.sleep(:infinity) end))
          assert t_node in occupancy_on(a_node, scope, g_a)
          assert t_node in occupancy_on(b_node, scope, g_b)

          # Split A <-/-> B. Each peer sees the other's Scope DOWN and
          # rebalances down to {T, self}; T keeps the 3-node view nobody
          # agrees with any more. (Polling, not block_until: whether a peer's
          # earlier formation passed through the same {T, self} view -- and so
          # how many matching trace events exist -- is timing-dependent.)
          true = :erpc.call(a_node, Node, :disconnect, [b_node])

          wait_until(fn ->
            :erpc.call(a_node, Muster, :members, [scope]) == Enum.sort([t_node, a_node]) and
              :erpc.call(b_node, Muster, :members, [scope]) == Enum.sort([t_node, b_node]) and
              :erpc.call(a_node, MusterPeerAux, :status, [scope]) == :converging and
              :erpc.call(b_node, MusterPeerAux, :status, [scope]) == :converging and
              status(scope) == :converging
          end)

          # Nobody trusts an occupancy table while views disagree -- routers
          # flood (over-deliver, never miss)...
          refute Muster.can_decide?(scope, hash3)
          refute :erpc.call(a_node, Muster, :can_decide?, [scope, hash3])
          refute :erpc.call(b_node, Muster, :can_decide?, [scope, hash3])

          # ...but senders still route against their own settled ring.
          assert {:ok, ^a_node} = Muster.router(scope, g_a)

          # Heal. nodeup fires on both peers, discovery re-pairs them, every
          # node rebalances back into the 3-node view and re-converges -- the
          # SECOND :ready at view3, hence nth: 2.
          true = :erpc.call(a_node, Node, :connect, [b_node])
          await_ready(view3, nth: 2, timeout: 20_000)

          # The snapshotted rows survived the whole split/heal cycle, and the
          # merged cluster trusts its tables again.
          assert t_node in occupancy_on(a_node, scope, g_a)
          assert t_node in occupancy_on(b_node, scope, g_b)
          assert Muster.can_decide?(scope, hash3)
          assert :erpc.call(a_node, Muster, :members, [scope]) == view3
          assert :erpc.call(b_node, Muster, :members, [scope]) == view3

          %{g_a: g_a, g_b: g_b, t_node: t_node}
        end,
        fn result, trace ->
          # The sweeps run during the split never judged T's rows under a view
          # T hadn't agreed to: neither group was dropped anywhere.
          drops =
            of_kind(trace, :muster_drop_stale_entry)
            |> Enum.filter(&(&1.source == result.t_node and &1.group in [result.g_a, result.g_b]))

          assert drops == []
        end
      )
    end
  end

  describe "direct disconnect -- T loses its own peer, heals on reconnect" do
    setup do
      scope = :"muster_direct_split_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # Every "peer leaves" test elsewhere in this file drives departure via
    # stop_supervised({:peer, ...}) (kills the whole remote VM) or
    # Process.exit(pid, :kill) on a single process while the node stays
    # connected (router Scope crash recovery, the reverse-race tests). The
    # partition test above splits two OTHER peers while T stays connected to
    # both, so T's own {:DOWN, ..., :noconnection} path never fires there.
    #
    # Here T itself severs the transport to the peer holding its group, with
    # that peer's Muster process fully alive and never restarted. This proves
    # the reason-agnostic DOWN handling (scope.ex drops `_reason` outright) on
    # a genuine disconnect, not just a process/VM death, and that reconnecting
    # a LIVE peer (whose seq counters never reset, unlike a same-named restart
    # on a fresh VM) re-pairs and heals cleanly.
    #
    # forward_trace/1 cannot stay attached to R across the split: once forwarded,
    # EVERY tp() on R (Muster ticks fire constantly) performs a synchronous
    # `rpc:call` back to T, and any such call auto-reconnects a merely
    # Node.disconnect/1'd node (confirmed by direct repro -- Node.list() was back
    # within 50ms with forwarding left on). Snabbkaffex.unforward_trace/1 reverts
    # R to recording locally (poking `snabbkaffe_tp_fun` back to `local_tp/5`)
    # before disconnecting; call forward_trace/1 again once reconnected. Confirmed
    # by repro to hold the split for 2s+ with zero reconnects.
    test "T disconnects from the peer holding its group, then reconnects and heals",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)

          view2 = Enum.sort([t_node, r_node])
          await_ready(view2)

          group = group_routed_to(scope, r_node)
          member = spawn(fn -> Process.sleep(:infinity) end)
          :ok = Muster.join(scope, group, member)
          assert t_node in occupancy_on(r_node, scope, group)

          # Detach R's forwarding, THEN sever the transport outright -- R's
          # Muster process stays alive and running the whole time.
          unforward_trace(r_node)
          true = Node.disconnect(r_node)

          # T sees R's coordinator monitor DOWN via :noconnection and
          # rebalances down to itself.
          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_rebalance_start, node: ^t_node, to: [^t_node]},
                     10_000
                   )

          wait_until(fn -> Muster.members(scope) == [t_node] end)

          # Reconnect and re-attach forwarding: nodeup fires on both sides,
          # they re-pair via discover, and T's rebalance back into the
          # 2-node view re-snapshots R -- from R's perspective T is a freshly
          # (re)joined member, so this is a full snapshot, not a delta.
          true = Node.connect(r_node)
          :ok = :snabbkaffe.forward_trace(r_node)

          assert {:ok, %{groups: healed}} =
                   block_until(
                     %{:"$kind" => :muster_node_state_received, node: ^r_node, source: ^t_node},
                     10_000
                   )

          assert group in healed

          # Both re-converge to :ready for the 2-node view -- the SECOND time
          # (the first was the original formation), hence nth: 2.
          await_ready(view2, nth: 2, timeout: 20_000)

          assert t_node in occupancy_on(r_node, scope, group)

          %{group: group, r_node: r_node, t_node: t_node}
        end,
        fn result, trace ->
          # Exactly one post-heal snapshot from T landed on R and carried the
          # group.
          assert [%{groups: groups}] =
                   of_kind(trace, :muster_node_state_received)
                   |> Enum.filter(&(&1.node == result.r_node and &1.source == result.t_node))

          assert result.group in groups
        end
      )
    end
  end

  describe "network partition -- a departed-source reap during the split is repaired by the heal" do
    setup do
      scope = :"muster_split_reap_#{System.unique_integer([:positive])}"

      # A short sweep interval so reap_departed_sources/1 provably fires while
      # the peer is disconnected (the production default, rpc_timeout_ms x 5 =
      # 25s, would never fire inside a test-length split), and a fast heartbeat
      # so the restarted coordinator self-promotes to a :ready singleton quickly.
      start_supervised!(
        spec(scope,
          vacant_flush_interval_ms: 100,
          view_heartbeat_interval_ms: 300,
          tombstone_window_ms: 500
        )
      )

      %{scope: scope}
    end

    # reap_departed_sources/1 hard-deletes every row whose source is both out of
    # the view and disconnected. A netsplit puts a LIVE peer in exactly that
    # state, so the question is whether a reap that ran mid-split can lose
    # anything the heal does not put back. It cannot, for two reasons this test
    # exercises end to end: the sweep only ever collects what the peer-:DOWN
    # eviction could not attribute (here, because the coordinator that would
    # have run that eviction died), and a healed peer is re-announced with a
    # FULL snapshot -- it left `members` on the split, so do_rebalance sees it
    # as a new router (`router_node not in old_members`) and dispatches
    # receive_node_state (wipe + replace), never an add-only delta whose base
    # the reap would have invalidated.
    #
    # Reaching the "row survives the eviction" state black-box: T's coordinator
    # is parked inside its handling of R's :DOWN (the :muster_peer_down_apply
    # span's :start fires BEFORE the match_delete) and killed there, so the
    # Supervisor-owned occupancy table keeps R's row while the restarted
    # coordinator knows nothing about R. forward_trace/1 is detached from R
    # across the split for the same reason as the disconnect test above.
    test "a row reaped while the peer was split comes back in the heal's full snapshot",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)

          view2 = Enum.sort([t_node, r_node])
          hash2 = :erlang.phash2(view2)
          await_ready(view2)

          # T is the router for g and R holds it: T's table has {g, R}.
          g = group_routed_to(scope, t_node)
          assert g, "no group routing to T found"
          :ok = :peer.call(p_r, MusterPeerAux, :join, [scope, g])
          wait_until(fn -> r_node in Muster.occupancy(scope, g) end)
          assert {:ok, [^r_node]} = Muster.targets(scope, g, hash2)

          # Park T's eviction of R before its wipe, then split.
          force_ordering(
            delay: %{
              :"$kind" => :muster_peer_down_apply,
              :"$span" => :start,
              node: ^t_node,
              peer_node: ^r_node
            },
            until: %{:"$kind" => :test_release}
          )

          unforward_trace(r_node)
          coord = Process.whereis(Forum.Supervisor.name(scope))
          true = Node.disconnect(r_node)

          # The coordinator is now parked on R's :DOWN. Kill it there: the wipe
          # never runs, the table keeps R's row, and the restarted coordinator
          # starts as a singleton that has never heard of R (R is no longer in
          # Node.list(), so its init discovery reaches nobody).
          ref = Process.monitor(coord)
          true = Process.exit(coord, :kill)
          assert_receive {:DOWN, ^ref, _, _, _}, 5_000

          wait_until(fn ->
            pid = Process.whereis(Forum.Supervisor.name(scope))
            is_pid(pid) and pid != coord and Muster.members(scope) == [t_node]
          end)

          assert r_node in Muster.occupancy(scope, g),
                 "R's row did not survive the coordinator crash; there is nothing for the sweep to reap"

          # The sweep collects it: R is out of the view AND disconnected.
          assert {:ok, %{rows: 1}} =
                   block_until(
                     %{
                       :"$kind" => :muster_departed_source_reaped,
                       node: ^t_node,
                       source: ^r_node
                     },
                     10_000
                   )

          refute r_node in Muster.occupancy(scope, g)

          # Heal. Both sides get :nodeup, re-pair, and rebalance into {T,R}. From
          # R's side T left its members on the split, so its re-announce is a
          # FULL snapshot carrying g.
          true = Node.connect(r_node)
          :ok = :snabbkaffe.forward_trace(r_node)

          assert {:ok, %{groups: healed}} =
                   block_until(
                     %{:"$kind" => :muster_node_state_received, node: ^t_node, source: ^r_node},
                     15_000
                   )

          assert g in healed

          # Both re-converge to :ready for the 2-node view for the SECOND time
          # (the first was formation; the restarted T's singleton :ready carries
          # a different hash and does not count).
          await_ready(view2, nth: 2, timeout: 20_000)

          # The reaped row is back and authoritative.
          assert r_node in Muster.occupancy(scope, g)
          assert {:ok, [^r_node]} = Muster.targets(scope, g, hash2)

          # Release the (dead) ordering hook so check_trace teardown isn't wedged.
          tp(:test_release, %{})

          %{t_node: t_node, r_node: r_node, group: g}
        end,
        fn result, trace ->
          # The heal re-announced R to T with a full snapshot, not a delta: a
          # delta only adds, and would have had nothing to add for a row that
          # was in place before the split.
          refute Enum.any?(
                   of_kind(trace, :muster_delta_received),
                   &(&1.node == result.t_node and &1.source == result.r_node)
                 ),
                 "R re-announced to T with a DELTA after the heal; a reaped row can only be repaired by a full snapshot"

          assert Enum.any?(
                   of_kind(trace, :muster_node_state_received),
                   &(&1.node == result.t_node and &1.source == result.r_node and
                       result.group in &1.groups)
                 )
        end
      )
    end
  end

  describe "node restart with the same name -- announce-watermark seq regression" do
    setup do
      scope = :"muster_restart_#{System.unique_integer([:positive])}"
      # Small heartbeat so the "stuck despite the heartbeat backstop" proof is
      # quick: if anything could heal the stuck node, a 200ms heartbeat would.
      start_supervised!(
        spec(scope, vacant_flush_interval_ms: 100, view_heartbeat_interval_ms: 200)
      )

      %{scope: scope}
    end

    test "a same-named restart with a lower seq still re-converges (member_views cleared on :DOWN)",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          s_name = ~c"muster_restart_s_#{System.unique_integer([:positive])}"
          s_node = :"#{s_name}@127.0.0.1"

          # --- {T, S} forms and converges (S incarnation #1) ---------------
          {:ok, p_s, ^s_node} = Peer.start(name: s_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(s_node)
          start_remote_muster_fast_heartbeat(p_s, scope)
          await_ready([t_node, s_node])

          # Burn the global monotonic counter on S so its NEXT rebalance stamps
          # an announce watermark ~100M above the fresh-VM base. A same-named
          # restart starts from that base and never climbs anywhere near it
          # before re-announcing, so its seq is guaranteed lower.
          :ok = :peer.call(p_s, MusterPeerAux, :burn, [100_000_000])

          # --- Z joins -> {T, S, Z}: S re-announces with the HIGH watermark --
          z_name = ~c"muster_restart_z_#{System.unique_integer([:positive])}"
          {:ok, p_z, z_node} = Peer.start(name: z_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(z_node)
          start_remote_muster_fast_heartbeat(p_z, scope)

          view_tsz = Enum.sort([t_node, s_node, z_node])
          hash_tsz = :erlang.phash2(view_tsz)
          await_ready(view_tsz)

          # T now holds S's HIGH watermark for the {T,S,Z} view. Capture it.
          dump_tsz = GenServer.call(Forum.Supervisor.name(scope), :dump)
          {^hash_tsz, stale_seq, _writer} = dump_tsz.member_views[s_node]

          # --- Kill S (incarnation #1) then Z, so the final view is {T,S} ----
          # which differs from the stale {T,S,Z} view, exposing the regression
          # if T were to keep S's stale watermark.
          :ok = stop_supervised({:peer, s_name})
          wait_until(fn -> Enum.sort(Muster.members(scope)) == Enum.sort([t_node, z_node]) end)

          :ok = stop_supervised({:peer, z_name})
          wait_until(fn -> Muster.members(scope) == [t_node] end)

          # The fix: T dropped S's member_views entry when S left, so there is
          # no stale high-seq watermark left to strand the restart. (Against the
          # unfixed code this entry is still {hash_tsz, stale_seq}.)
          dump_alone = GenServer.call(Forum.Supervisor.name(scope), :dump)
          refute Map.has_key?(dump_alone.member_views, s_node)

          # --- S restarts under the SAME name (incarnation #2, fresh VM) -----
          tp(:test_s_rejoined, %{})
          {:ok, p_s2, ^s_node} = Peer.start(name: s_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(s_node)
          start_remote_muster_fast_heartbeat(p_s2, scope)

          view_ts = Enum.sort([t_node, s_node])
          hash_ts = :erlang.phash2(view_ts)

          # S (fresh) converges to :ready for {T,S}: it has no stale entry for T,
          # so it accepts T's announcements. Wait via the trace so we don't race
          # S's ring/Scope startup with an :erpc into it. nth: 2 because S's
          # incarnation #1 (same node name -> same hash) already emitted :ready
          # for {T,S} at the original formation; we want the post-restart one.
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_status_change,
                       to: :ready,
                       node: ^s_node,
                       view_hash: ^hash_ts
                     },
                     2,
                     15_000,
                     :infinity
                   )

          assert :erpc.call(s_node, Muster, :members, [scope]) == view_ts

          # T learns S is a member again (rebalances {T} -> {T,S})...
          wait_until(fn -> Enum.sort(Muster.members(scope)) == view_ts end)

          # The dangerous condition is genuinely present: S's fresh announce seq
          # is LOWER than the watermark T held from the dead incarnation (proven
          # with real values, no hard-coded base). The fix must make T
          # re-converge ANYWAY -- it cannot lean on seqs to tell incarnations
          # apart.
          s2_seq = :peer.call(p_s2, MusterPeerAux, :current_seq, [])
          assert s2_seq < stale_seq

          # RECOVERY: T must reach :ready for the live {T,S} view despite the
          # regressed seq -- its SECOND :ready for that view (the first was
          # incarnation #1's formation), hence nth: 2. With the fix, T cleared
          # member_views[S] when S left, so S's fresh announcement is accepted
          # rather than rejected by newest-seq-wins.
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_status_change,
                       to: :ready,
                       node: ^t_node,
                       view_hash: ^hash_ts
                     },
                     2,
                     15_000,
                     :infinity
                   )

          assert status(scope) == :ready
          assert Muster.can_decide?(scope, hash_ts)

          # T's member_views[S] now reflects S's FRESH announcement for the live
          # {T,S} view -- and carries the lower, post-restart seq, proving the
          # stale high-seq {T,S,Z} watermark was discarded, not merely matched.
          dump_final = GenServer.call(Forum.Supervisor.name(scope), :dump)
          assert {^hash_ts, healed_seq, _writer} = dump_final.member_views[s_node]
          assert healed_seq < stale_seq

          %{
            t_node: t_node,
            s_node: s_node,
            hash_ts: hash_ts,
            stale_seq: stale_seq,
            s2_seq: s2_seq
          }
        end,
        fn result, trace ->
          rejoin_at = Enum.find_index(trace, &(&1[:"$kind"] == :test_s_rejoined))
          assert rejoin_at

          status_changes = of_kind(trace, :muster_status_change)

          # The restarted S DID announce + converge to :ready for the final
          # {T,S} view (so the cluster genuinely converged -- except T).
          assert Enum.any?(
                   status_changes,
                   &(&1.node == result.s_node and &1.to == :ready and
                       &1.view_hash == result.hash_ts)
                 )

          # And T reached :ready for the live {T,S} view AFTER the rejoin -- it
          # recovered rather than stranding in :converging. (T's earlier :ready
          # for {T,S} was incarnation #1's formation, before the rejoin marker;
          # this asserts a fresh one after it.)
          t_ready_after_rejoin =
            trace
            |> Enum.with_index()
            |> Enum.any?(fn {e, idx} ->
              e[:"$kind"] == :muster_status_change and e[:node] == result.t_node and
                e[:to] == :ready and e[:view_hash] == result.hash_ts and idx > rejoin_at
            end)

          assert t_ready_after_rejoin,
                 "T never reached :ready for the live view after the same-named restart -- a stale member_views watermark stranded it"

          # The mechanism really fired: the restart's seq regressed below the
          # stale watermark, yet T recovered anyway.
          assert result.s2_seq < result.stale_seq
        end
      )
    end
  end

  describe "peer DOWN races a fresher re-registration" do
    setup do
      scope = :"muster_downrace_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 60_000))
      %{scope: scope}
    end

    # scope.ex's handle_info({:DOWN, ...}) must only drop
    # occupancy/member_views/applied_snapshot_seq entries attributable to the
    # exact dying pid, not every entry keyed by the dead peer's NODE
    # regardless of which incarnation (pid) produced them. If a fresher
    # incarnation of that same node has ALREADY re-registered (its
    # rediscovery can outrun the old pid's monitor DOWN, since discovery
    # travels the adapter channel while DOWN travels the monitor channel) and
    # delivered new data before the old pid's DOWN is finally processed, a
    # node-keyed wipe would destroy that fresh data permanently: membership
    # does not change (the node is still a peer via its new pid), so
    # recompute_members is a no-op and no rebalance/re-announce would ever
    # fire again to repair it.
    #
    # Reproducing the dangerous ORDER via real message timing is exactly the
    # adapter-/ordering-dependent property this exercises: with the
    # default ErlDist adapter, a dead peer's exit signal and a freshly
    # restarted coordinator's rediscovery share one TCP connection, and the
    # exit signal is generated essentially the instant the old pid dies while
    # the new coordinator's rediscovery is only broadcast after a real
    # init -> await_shards_ready sequence -- so DOWN-before-rediscovery is the
    # OVERWHELMINGLY likely real order, the opposite of the dangerous one.
    # Forcing the dangerous order by parking T's own DOWN handling would
    # deadlock T's single-threaded coordinator against the very re-pairing
    # it's waiting on (the same process cannot dequeue the re-pairing message
    # while parked handling the DOWN ahead of it in its mailbox).
    #
    # So this test drives the exact mailbox STATE the race produces through
    # Scope's real public entry points, deterministically:
    #
    #   1. R holds `group`, routed to T; occupancy lands on T normally.
    #   2. A stand-in pid, alive on r_node but distinct from R's real Scope
    #      pid, is registered on T via a genuine :muster_discover message --
    #      exactly what a freshly-restarted R's coordinator broadcasts on
    #      rediscovery. This reproduces "T registers R's new pid" without
    #      racing real message delivery order.
    #   3. R's post-restart full snapshot is delivered through the SAME public
    #      RPC entry point (receive_node_state/5) a genuine rebalance
    #      dispatches, carrying a fresh, higher seq for the group.
    #   4. R's REAL (original) Scope pid is killed, firing T's genuine monitor
    #      DOWN for it -- the exact handler under test.
    #
    # At the moment the real DOWN fires, T's peers table holds two live
    # entries for r_node (the stand-in, and the dying real pid) -- exactly
    # the state the real race produces -- so the freshly-delivered row must
    # survive it.
    test "a peer's fresh re-registration and delivered snapshot survive its old pid's later DOWN",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready(Enum.sort([t_node, r_node]))

          group = group_routed_to(scope, t_node)

          :ok = :peer.call(p_r, MusterPeerAux, :join, [scope, group])
          assert r_node in occupancy_on(t_node, scope, group)

          # A stand-in for R's post-restart incarnation: alive on r_node, but
          # NOT R's real Scope pid. Spawned via an MFA (not a closure) so it
          # does not depend on this test module's bytecode being loaded on
          # the remote peer.
          standin = :erlang.spawn(r_node, :timer, :sleep, [:infinity])

          own_view_hash = GenServer.call(Forum.Supervisor.name(scope), :dump).view_hash
          fresh_seq = :erpc.call(r_node, :erlang, :unique_integer, [[:monotonic]])

          # Step 2: T registers the stand-in as a SECOND live peer for r_node
          # (peers is keyed by pid), exactly as a fresh coordinator's
          # rediscovery broadcast would.
          :erlang.send(
            {Forum.Supervisor.name(scope), t_node},
            {:muster_discover, standin, own_view_hash, fresh_seq},
            [:noconnect]
          )

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_peer_registered, node: ^t_node, peer: ^r_node},
                     5_000
                   )

          # Step 3: the fresh incarnation's full snapshot lands and applies on
          # T through the exact public entry point a real rebalance uses,
          # attributed to the SAME stand-in pid as its discover above (a real
          # incarnation's discover and its snapshot always share one pid).
          assert :ok =
                   Forum.Muster.Scope.receive_node_state(
                     scope,
                     r_node,
                     [group],
                     own_view_hash,
                     fresh_seq + 1,
                     standin
                   )

          assert r_node in occupancy_on(t_node, scope, group)

          # Step 4: R's REAL (original) Scope pid dies -- T's genuine monitor
          # fires the DOWN this test is about.
          r_scope_pid = :erpc.call(r_node, Process, :whereis, [Forum.Supervisor.name(scope)])
          Process.monitor(r_scope_pid)
          true = :erpc.call(r_node, Process, :exit, [r_scope_pid, :kill])
          assert_receive {:DOWN, _, _, ^r_scope_pid, _}, 5_000

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_peer_down_apply,
                       :"$span" => {:complete, _},
                       node: ^t_node,
                       peer_node: ^r_node
                     },
                     5_000
                   )

          # THE PROPERTY UNDER TEST: the row delivered by R's newer, still-
          # registered incarnation must survive the old pid's DOWN.
          assert r_node in occupancy_on(t_node, scope, group),
                 "the old pid's DOWN wiped a row delivered by R's newer, still-registered incarnation"

          %{group: group, r_node: r_node, t_node: t_node}
        end,
        fn result, trace ->
          %{t_node: t_node, r_node: r_node} = result

          # The row really did arrive (via the simulated fresh incarnation's
          # snapshot) strictly before the DOWN handler ran.
          assert causality(
                   trace,
                   %{
                     :"$kind" => :muster_node_state_received,
                     node: ^t_node,
                     source: ^r_node
                   },
                   %{
                     :"$kind" => :muster_peer_down_apply,
                     :"$span" => :start,
                     node: ^t_node,
                     peer_node: ^r_node
                   }
                 )
        end
      )
    end

    # The pid-liveness heuristic only consults the PEER-REGISTRATION channel
    # (state.peers, populated by
    # discover/discover_ack). It has no visibility into the DATA channel
    # (occupied/4, vacant_batch/4, receive_node_state/5, apply_delta/5) --
    # none of which identify their sender by pid at all today, only by node.
    # A node's post-restart full snapshot can land and apply (via
    # receive_node_state/5, exactly as a real rebalance dispatches it) BEFORE
    # any discover/ack from its new incarnation has been processed -- these
    # are two fully independent, unordered channels. When the OLD pid's DOWN
    # fires in that window, "is another peer pid registered for this node"
    # reads false (nothing has registered the new incarnation yet), so the
    # heuristic wipes data that was already correctly, freshly delivered.
    #
    # Unlike the test above (which pre-registers a stand-in specifically so
    # the heuristic's check succeeds), this test never registers any peer for
    # R at all -- reproducing the case where the DATA channel wins the race
    # instead of the registration channel, which the heuristic cannot see
    # either way.
    test "a fresh snapshot applied with no peer re-registration yet must survive the old pid's DOWN",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready(Enum.sort([t_node, r_node]))

          group = group_routed_to(scope, t_node)

          :ok = :peer.call(p_r, MusterPeerAux, :join, [scope, group])
          assert r_node in occupancy_on(t_node, scope, group)

          own_view_hash = GenServer.call(Forum.Supervisor.name(scope), :dump).view_hash
          fresh_seq = :erpc.call(r_node, :erlang, :unique_integer, [[:monotonic]])

          # R's real (soon to die) Scope pid, captured up front so the
          # snapshot below can be attributed to a DIFFERENT stand-in pid --
          # representing R's new incarnation -- rather than to the very pid
          # this test is about to kill.
          r_scope_pid = :erpc.call(r_node, Process, :whereis, [Forum.Supervisor.name(scope)])
          standin = :erlang.spawn(r_node, :timer, :sleep, [:infinity])

          # R's (simulated) post-restart full snapshot lands and applies on T
          # through the exact public entry point a real rebalance uses --
          # WITHOUT any discover/ack ever registering a new peer for R. This
          # is what the RPC channel winning the race against the message
          # channel looks like.
          assert :ok =
                   Forum.Muster.Scope.receive_node_state(
                     scope,
                     r_node,
                     [group],
                     own_view_hash,
                     fresh_seq,
                     standin
                   )

          assert r_node in occupancy_on(t_node, scope, group)

          # R's REAL Scope pid dies -- T's genuine monitor fires the DOWN
          # this test is about. T's peers table has never contained any
          # OTHER pid for r_node, so the pid-liveness heuristic sees no
          # "newer incarnation live" and wipes unconditionally.
          Process.monitor(r_scope_pid)
          true = :erpc.call(r_node, Process, :exit, [r_scope_pid, :kill])
          assert_receive {:DOWN, _, _, ^r_scope_pid, _}, 5_000

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_peer_down_apply,
                       :"$span" => {:complete, _},
                       node: ^t_node,
                       peer_node: ^r_node
                     },
                     5_000
                   )

          # THE PROPERTY UNDER TEST: the row delivered via the data channel
          # must survive the old pid's DOWN even though nothing ever
          # registered a peer for it -- the heuristic's blind spot.
          assert r_node in occupancy_on(t_node, scope, group),
                 "the old pid's DOWN wiped a freshly-applied row because no discover/ack " <>
                   "had registered a peer for it yet -- the pid-liveness heuristic only " <>
                   "watches the registration channel, not the data channel"

          %{group: group, r_node: r_node, t_node: t_node}
        end,
        fn result, trace ->
          %{t_node: t_node, r_node: r_node} = result

          assert causality(
                   trace,
                   %{
                     :"$kind" => :muster_node_state_received,
                     node: ^t_node,
                     source: ^r_node
                   },
                   %{
                     :"$kind" => :muster_peer_down_apply,
                     :"$span" => :start,
                     node: ^t_node,
                     peer_node: ^r_node
                   }
                 )
        end
      )
    end
  end

  describe "re-discovery backstop (rediscover/1)" do
    setup do
      scope = :"muster_rediscover_#{System.unique_integer([:positive])}"
      # Fast heartbeat so the periodic re-discovery sweep fires on its own; the
      # test perturbs nothing -- it just observes the natural heartbeat.
      start_supervised!(
        spec(scope, view_heartbeat_interval_ms: 150, vacant_flush_interval_ms: 100)
      )

      %{scope: scope}
    end

    # The gap rediscover/1 closes: a coordinator that crashes and restarts IN
    # PLACE re-pairs only via the single :muster_discover its init broadcasts -- no
    # :nodeup re-fires (the dist connection never dropped) and peers dropped it on
    # its old pid's :DOWN, so they won't reach back out. If that lone discovery is
    # lost, nothing else heals the edge: the announce heartbeat and member_views
    # only ever talk to nodes ALREADY in `members`. rediscover/1 makes the
    # heartbeat re-offer discovery to every connected non-member, bounding
    # worst-case stranding to one interval.
    #
    # Black-box (see the file header): we can neither drop a message nor fabricate
    # a stranded coordinator without a mock or state surgery. So we observe the
    # mechanism directly -- a node connected at the dist layer but running no
    # Muster (a genuine connected non-member) must be re-offered :muster_discover
    # on the heartbeat. Together with the convergence tests above (a received
    # discover leads to pairing), this covers the heal end to end.
    test "the heartbeat re-offers discovery to a connected non-member", %{scope: scope} do
      check_trace(
        fn ->
          # A bare node: connected to us (Peer.start calls Node.connect) but
          # running no Muster scope, so it never enters `members` and never sends
          # a discover of its own -- the only thing that can reach it is our
          # heartbeat's rediscover/1.
          {:ok, _p1, n1} = Peer.start()
          wait_until(fn -> n1 in Node.list() end)
          refute n1 in Muster.members(scope)

          assert {:ok, _} = block_until(%{:"$kind" => :muster_rediscover, target: ^n1}, 5_000)
        end,
        fn _trace -> :ok end
      )
    end
  end

  describe "rebalance snapshot failure vs. a router that already departed (forced ordering)" do
    setup do
      scope = :"muster_departed_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # Sibling of "the source Scope crashes when its snapshot RPC fails..." above:
    # THAT test proves the crash-and-heal path is correct when the failed target
    # is still genuinely a member. This proves the narrower, adjacent case:
    # once do_rebalance has ALREADY reacted to a router's departure (dropped
    # it from `members`, pruned `owed_snapshots`), a stale failure report
    # about that SAME departure for a round dispatched before it must not
    # raise -- it is a late echo of news the coordinator already has, not a
    # fresh failure.
    #
    # In real distribution the peer-monitor :DOWN that drops the router and the
    # worker's own RPC failure are two independent messages caused by the SAME
    # target death, so which one lands first is an unforced race -- an
    # unconditional raise on the "DOWN first" interleaving would treat that
    # late echo as a fresh failure. To make the test deterministic rather than
    # relying on that race resolving one way, C's reply is parked before it can
    # ever complete, C is then killed outright, and -- using the
    # muster_rpc_worker_result test hook (emitted by the worker itself, a
    # process separate from Scope's own mailbox, so holding it cannot deadlock
    # Scope's own :DOWN handling) -- the worker's report of the resulting failure
    # is forced to land strictly after T's departure-triggered rebalance has
    # already dropped C from `members`.
    test "a snapshot RPC that fails after its target already left membership does not crash the coordinator",
         %{scope: scope} do
      t_node = node()

      c_name = ~c"muster_departed_c_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"
      group = pick_group([{[t_node, c_node], c_node}])

      check_trace(
        fn ->
          # T holds `group` alone; it will move onto C once C joins, forcing a
          # FULL snapshot dispatch (C is a brand-new router).
          member = spawn(fn -> Process.sleep(:infinity) end)
          :ok = Muster.join(scope, group, member)
          {:ok, r0} = Muster.router(scope, group)
          assert r0 == t_node

          # Park C's apply of T's incoming snapshot before it can reply. Never
          # released by this test -- C is about to be killed outright instead,
          # which is what finally frees this call (with a crash, not a reply).
          force_ordering(
            until: %{:"$kind" => :test_never_release_c},
            delay: %{
              :"$kind" => :muster_node_state_received,
              scope: ^scope,
              node: ^c_node,
              source: ^t_node
            }
          )

          # Hold T's own report of that RPC's eventual failure until AFTER T's
          # departure rebalance (triggered below by killing C) has already
          # dropped C from `members` -- this is what removes the real race.
          force_ordering(
            until: %{
              :"$kind" => :muster_rebalance_start,
              scope: ^scope,
              node: ^t_node,
              to: [^t_node]
            },
            delay: %{
              :"$kind" => :muster_rpc_worker_result,
              scope: ^scope,
              node: ^t_node,
              router: ^c_node
            }
          )

          coord = Process.whereis(Forum.Supervisor.name(scope))
          ref = Process.monitor(coord)

          {:ok, p_c, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(p_c, scope)

          # T's snapshot to C is genuinely dispatched and in flight (parked on
          # C, per the force_ordering above).
          wait_until(fn ->
            Forum.Supervisor.name(scope)
            |> GenServer.call(:dump)
            |> Map.fetch!(:owed_snapshots)
            |> Map.has_key?(c_node)
          end)

          # Kill C outright -- the WHOLE peer, not just its coordinator: C's own
          # Forum.Supervisor would otherwise restart a killed coordinator and
          # rejoin T within milliseconds (the very self-heal other tests in
          # this file rely on), undoing the departure before it could be
          # observed. This is the one real departure in this test: T's peer
          # monitor on C's coordinator pid fires a genuine :DOWN, and it is
          # also what finally makes the worker's blocked RPC call fail (C
          # never replies, and now never can).
          :ok = stop_supervised({:peer, c_name})

          # T's real :DOWN handling drops C and rebalances down to itself alone
          # -- the event the held worker report above is waiting on.
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_rebalance_start,
                       scope: ^scope,
                       node: ^t_node,
                       to: [^t_node]
                     },
                     10_000
                   )

          # muster_rebalance_start fires at the TOP of do_rebalance, before its
          # synchronous shard gather updates `state.members` -- poll rather than
          # assert immediately so this isn't racing that internal window.
          wait_until(fn -> c_node not in Muster.members(scope) end)

          # Released by the ordering above only now: the worker's report that
          # its snapshot RPC to the (already-departed) C failed.
          assert {:ok, %{ok?: false}} =
                   block_until(
                     %{
                       :"$kind" => :muster_rpc_worker_result,
                       scope: ^scope,
                       node: ^t_node,
                       router: ^c_node
                     },
                     10_000
                   )

          # The stale failure must not have crashed the coordinator.
          refute_receive {:DOWN, ^ref, :process, ^coord, _reason}, 500
          assert Process.alive?(coord)

          # And it stays fully functional afterwards.
          assert :ok =
                   Muster.join(
                     scope,
                     :"departed_recovered_#{System.unique_integer([:positive])}",
                     spawn(fn -> Process.sleep(:infinity) end)
                   )

          %{coord: coord, ref: ref, scope: scope, t_node: t_node, c_node: c_node}
        end,
        fn result, trace ->
          %{scope: scope, t_node: t_node, c_node: c_node} = result

          # The coordinator really did receive the stale failure report (not
          # just avoid crashing on something it never saw)...
          worker_results =
            of_kind(trace, :muster_rpc_worker_result)
            |> Enum.filter(&(&1.scope == scope and &1.node == t_node and &1.router == c_node))

          assert Enum.any?(worker_results, &(&1.ok? == false))

          # ...and it arrived strictly after T's departure rebalance, not
          # before -- proving this test exercised the ordering it claims to,
          # rather than happening to avoid the race by luck.
          assert causality(
                   trace,
                   %{
                     :"$kind" => :muster_rebalance_start,
                     scope: ^scope,
                     node: ^t_node,
                     to: [^t_node]
                   },
                   %{
                     :"$kind" => :muster_rpc_worker_result,
                     scope: ^scope,
                     node: ^t_node,
                     router: ^c_node,
                     ok?: false
                   }
                 )
        end
      )
    end
  end

  describe "long partition -- both sides settle to :ready independently before healing" do
    setup do
      scope = :"muster_longsplit_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))

      # Unlike the partition test above -- where only the two PEERS split and
      # T (this node) never loses anyone -- this test has T itself lose both
      # peers. T runs with :global's default connect_all: true, and :global
      # periodically re-syncs against every node it still knows via epmd on
      # this same host; left alone, it silently redials a Node.disconnect/1'd
      # peer within milliseconds (confirmed by direct repro), undoing the
      # split before either side can settle. The peers already run with
      # -connect_all false for the same reason on their end; this does the
      # equivalent for T for the duration of this test only.
      Application.put_env(:kernel, :connect_all, false)
      on_exit(fn -> Application.put_env(:kernel, :connect_all, true) end)

      %{scope: scope}
    end

    # The partition test above heals almost immediately after the split is
    # detected -- the readiness barrier is checked mid-:converging. Here T is
    # cut off from BOTH peers at once (instead of the two peers splitting from
    # each other while T stays connected to both), and each side is left long
    # enough to reach a genuinely settled :ready state on its own -- not
    # mid-rebalance -- before anything heals. While settled and mutually
    # unaware, EACH side takes on a claim the other side has never seen: T
    # joins a group that (by ring math) belongs to A once the cluster
    # re-merges, and A joins a group that belongs back to T. This proves the
    # merge-on-heal doesn't just restore the OLD occupancy rows (already
    # covered above) but correctly delivers claims created independently, in
    # both directions, by two sides that each fully rebalanced elsewhere
    # first -- with no stale-entry drop along the way.
    test "occupancy claims made independently on both sides of a settled split survive the merge",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          # Both peers run with -connect_all false, same as the partition test
          # above: their globals don't auto-mesh or fight the deliberate
          # disconnect via prevent_overlapping_partitions.
          args = [~c"-connect_all", ~c"false"]

          {:ok, p_a, a_node} = Peer.start(aux_mod: @aux_mod, args: args)
          :ok = :snabbkaffe.forward_trace(a_node)
          start_remote_muster(p_a, scope)
          await_ready([t_node, a_node])

          {:ok, p_b, b_node} = Peer.start(aux_mod: @aux_mod, args: args)
          true = :erpc.call(b_node, Node, :connect, [a_node])
          :ok = :snabbkaffe.forward_trace(b_node)
          start_remote_muster(p_b, scope)

          view3 = Enum.sort([t_node, a_node, b_node])
          hash3 = :erlang.phash2(view3)
          await_ready(view3)

          # Groups whose router in the FINAL (post-heal) view3 sits on the
          # opposite side of the split from whoever is about to join them --
          # each claim below can only survive the merge via a real cross-node
          # delta/snapshot, never by already being local to its eventual
          # router.
          #
          # Deliberately no baseline pre-split occupancy here (unlike the
          # partition test above): T holding a group already routed to A or B
          # would force T's own departure rebalance to re-announce it to
          # whichever peer survives in T's reduced view -- a real RPC racing
          # the second Node.disconnect/1 below and liable to auto-reconnect
          # the very node being cut loose. Keeping T empty until after the
          # split isolates the scenario this test is actually after.
          g_t_side = pick_group([{view3, a_node}])
          g_ab_side = pick_group([{view3, t_node}])

          # Detach forwarding before cutting the transport: a forwarded tp()
          # still RPCs back to T and would silently reconnect a merely
          # Node.disconnect/1'd peer (see unforward_trace/1 above).
          unforward_trace(a_node)
          unforward_trace(b_node)
          true = Node.disconnect(a_node)
          true = Node.disconnect(b_node)

          wait_until(
            fn -> status(scope) == :ready and Muster.members(scope) == [t_node] end,
            10_000
          )

          # Both sides detect the split and rebalance apart, all the way to a
          # settled :ready -- not just "converging" -- before either takes on
          # new work. Polled via :peer.call, which rides the peer's own
          # standard-io control channel rather than Erlang distribution, so it
          # keeps working straight through the cut on both sides.

          wait_until(
            fn ->
              remote_status(p_a, scope) == :ready and remote_status(p_b, scope) == :ready and
                :peer.call(p_a, Muster, :members, [scope]) == Enum.sort([a_node, b_node]) and
                :peer.call(p_b, Muster, :members, [scope]) == Enum.sort([a_node, b_node])
            end,
            10_000
          )

          # NOW, with both sides fully settled and mutually unaware, each side
          # takes on a claim the other has never seen.
          member_t = spawn(fn -> Process.sleep(:infinity) end)
          :ok = Muster.join(scope, g_t_side, member_t)
          :ok = :peer.call(p_a, MusterPeerAux, :join, [scope, g_ab_side])

          # Heal both links and re-attach forwarding for the post-heal trace.
          true = Node.connect(a_node)
          true = Node.connect(b_node)
          :ok = :snabbkaffe.forward_trace(a_node)
          :ok = :snabbkaffe.forward_trace(b_node)

          # All three nodes re-converge into the SAME 3-node view. Can't use
          # the event-driven await_ready here: Scope reacts to :nodeup the
          # instant Node.connect/1 returns, so a side can race through its
          # second :ready before forward_trace/1 above installs remote_tp on
          # it -- that tp() call fires under local_tp and is never forwarded,
          # hanging block_until on an event that already happened and won't
          # recur. Poll real state instead, which sidesteps the race entirely.
          wait_until(
            fn ->
              status(scope) == :ready and Enum.sort(Muster.members(scope)) == view3 and
                remote_status(p_a, scope) == :ready and remote_status(p_b, scope) == :ready and
                :erpc.call(a_node, Muster, :members, [scope]) == view3 and
                :erpc.call(b_node, Muster, :members, [scope]) == view3
            end,
            20_000
          )

          # Both independently-made claims landed on the router their group
          # hashes to in the merged view, each having necessarily crossed from
          # the isolated side that made it to the other.
          assert t_node in occupancy_on(a_node, scope, g_t_side)
          assert a_node in occupancy_on(t_node, scope, g_ab_side)

          assert Muster.can_decide?(scope, hash3)
          assert Enum.sort(Muster.members(scope)) == view3
          assert :erpc.call(a_node, Muster, :members, [scope]) == view3
          assert :erpc.call(b_node, Muster, :members, [scope]) == view3
        end,
        # Unlike the other describe blocks above, ordering here is entirely
        # real (no force_ordering) across two independent, uncontrolled
        # multi-step convergences (T's and A/B's), so a claim can legitimately
        # be judged stale under a transient intermediate view and be
        # re-inserted moments later by the causal apply that follows -- that
        # is the self-heal working as designed, not data loss. What this test
        # commits to is the property real, uncoordinated timing CAN prove:
        # the final merged state is correct (checked above). Asserting zero
        # transient drops would require pinning the interleaving down with
        # force_ordering, same as every other drops == [] assertion in this
        # file does; that is a narrower, complementary test, not this one.
        fn _trace -> :ok end
      )
    end
  end

  describe "join/3 rejects a genuinely remote pid" do
    setup do
      scope = :"muster_not_local_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # muster_test.exs can only prove join/3 accepts a local pid: a
    # locally-spawned pid can't masquerade as remote (node/1 always resolves
    # to us there). The :not_local guard itself -- `node(pid) != node()` --
    # needs a pid that actually encodes a different node's distribution id, so
    # this is the one place that can drive it: a bare peer with no Muster of
    # its own, just to mint a real remote pid.
    test "a pid belonging to another node is never registered", %{scope: scope} do
      {:ok, _peer, remote_node} = Peer.start()
      remote_pid = :erpc.call(remote_node, :erlang, :spawn, [fn -> Process.sleep(:infinity) end])

      assert node(remote_pid) == remote_node
      assert {:error, :not_local} = Muster.join(scope, :g1, remote_pid)
      refute Muster.local_member?(scope, :g1, remote_pid)
      assert Muster.local_member_count(scope, :g1) == 0
    end
  end

  describe "two-phase view adoption closes the stale-ready router window" do
    setup do
      scope = :"muster_stale_ready_#{System.unique_integer([:positive])}"
      # Long rpc_timeout so the parked view-change PREPARE RPC does not time out
      # (and crash S) while we hold the window open.
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100, rpc_timeout_ms: 30_000))
      %{scope: scope}
    end

    # The missed delivery this guards against: a router R that is :ready for view
    # {R,S} and is `group`'s router there could miss a member S that had advanced
    # to {R,S,T} and freshly joined `group` (which routes to T under {R,S,T},
    # never reaching R). Two-phase view adoption makes S PREPARE its old-view
    # members (here R) before it may COMMIT {R,S,T} and route joins under it.
    #
    # This test drives the exact adversarial interleaving and shows the miss is
    # now impossible. We freeze R on {R,S}-ready (parking BOTH its un-readying
    # paths: registering T, and applying S's transition -- the same coordinator
    # loop drives both, so it stays frozen ready). Because R never acks S's
    # transition, S is GATED: it cannot commit {R,S,T}, so it stays on {R,S} and
    # its fresh join to `group` routes to R -- which therefore holds S's row.
    #
    #   * Previously (no fix): S committed {R,S,T} regardless, claimed on T, and
    #     R (stale-ready) returned {:ok, []} -> missed S.
    #   * Now: the prepare gate keeps S on {R,S}; R gets S's claim; targets on R
    #     include S. No miss.
    #
    # Releasing the parks lets R apply S's transition (which INVALIDATES S at R,
    # so R floods) and register T; S then commits and the cluster converges. No
    # miss at any point.
    @tag :capture_log
    test "a fresh join cannot be missed by an old-view router while its move is un-acked",
         %{scope: scope} do
      r_node = node()

      # Fixed peer names so the victim group can be chosen from ring math upfront.
      s_name = ~c"muster_stale_ready_s_#{System.unique_integer([:positive])}"
      t_name = ~c"muster_stale_ready_t_#{System.unique_integer([:positive])}"
      s_node = :"#{s_name}@127.0.0.1"
      t_node = :"#{t_name}@127.0.0.1"

      two_view = Enum.sort([r_node, s_node])
      two_hash = :erlang.phash2(two_view)
      three_view = Enum.sort([r_node, s_node, t_node])
      three_hash = :erlang.phash2(three_view)

      # `group` routes to R in {R,S} but to T in {R,S,T}: exactly the "router
      # moved onto the newly-joined node" case that opened the window.
      group = pick_group([{two_view, r_node}, {three_view, t_node}])

      check_trace(
        fn ->
          # 1. Healthy 2-node cluster {R,S}; R is :ready and is `group`'s router.
          {:ok, p_s, ^s_node} = Peer.start(name: s_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(s_node)
          start_remote_muster(p_s, scope, rpc_timeout_ms: 30_000)
          await_ready([r_node, s_node])
          assert {:ok, ^r_node} = Muster.router(scope, group)

          # 2. Freeze R on {R,S}-ready: park BOTH ways it could leave that view --
          #    registering T (which would start R's own view-change), and applying
          #    S's transition (which would invalidate S at R). The single
          #    coordinator loop drives both, so whichever it hits first freezes it;
          #    released together by :test_release.
          force_ordering(
            until: %{:"$kind" => :test_release},
            delay: %{:"$kind" => :muster_peer_registered, node: ^r_node, peer: ^t_node}
          )

          force_ordering(
            until: %{:"$kind" => :test_release},
            delay: %{:"$kind" => :muster_transition_applied, node: ^r_node, source: ^s_node}
          )

          # 3. T joins. S discovers it and starts a PREPARE round toward {R,S,T},
          #    sending a note_transition to R -- which is frozen, so it never acks.
          {:ok, p_t, ^t_node} = Peer.start(name: t_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(t_node)
          start_remote_muster(p_t, scope, rpc_timeout_ms: 30_000)

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_view_prepare, node: ^s_node, target: ^three_view},
                     15_000
                   )

          # 4. S is GATED: with R un-acked it cannot commit {R,S,T}. Its committed
          #    ring is therefore still {R,S} (S floods as a sender meanwhile, but a
          #    join routes off the ring, not router/2), so the fresh join claims
          #    `group` on R (not T). join returns only once the router (R) is told.
          assert :peer.call(p_s, Forum.Muster, :members, [scope]) == two_view
          :ok = :peer.call(p_s, MusterPeerAux, :join, [scope, group])

          # --- No miss: R, still the ready router for {R,S}, HOLDS S. ---
          assert status(scope) == :ready
          assert Muster.view_hash(scope) == two_hash
          assert {:ok, ^r_node} = Muster.router(scope, group)
          assert :peer.call(p_s, Forum.Muster, :local_member_count, [scope, group]) == 1

          # The delivery set R would fan out to includes S. (Before the fix this
          # was []; the gate keeping S on {R,S} is what puts S's row on R.)
          assert {:ok, targets} = Muster.targets(scope, group, two_hash)
          assert s_node in targets

          # --- Release: R applies S's transition (S is now invalidated at R, so R
          #     stops trusting its table), registers T, and everyone converges. ---
          tp(:test_release, %{})

          await_ready(three_view)

          # Window fully closed: R is no longer `group`'s router; the real router T
          # holds S, and a broadcast routed to T reaches S.
          assert {:ok, ^t_node} = Muster.router(scope, group)
          wait_until(fn -> s_node in occupancy_on(t_node, scope, group) end)

          assert {:ok, healed} =
                   :erpc.call(t_node, Forum.Muster, :targets, [scope, group, three_hash])

          assert s_node in healed
        end,
        fn _trace -> :ok end
      )
    end
  end

  describe "grow then shrink back to the committed view -- the prepare round is cancelled" do
    setup do
      scope = :"muster_cancel_#{System.unique_integer([:positive])}"
      # Long rpc_timeout so T's parked prepare RPC to the frozen R does not time
      # out and crash T while we hold the window open.
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100, rpc_timeout_ms: 30_000))
      %{scope: scope}
    end

    # Growing the view runs a two-phase PREPARE before committing (B1). If the
    # node that triggered the growth leaves again BEFORE the round commits,
    # membership is back to the committed view and there is no ring to swap:
    # recompute_members takes the cancel branch (cancel_view_change/1) instead of
    # rebalancing. We freeze R fully as a bystander so ONLY T runs a pending
    # round, grow the view with a throwaway node C, then kill C while T is still
    # gated, and show T CANCELS -- returning to :ready for the original view with
    # its ring never swapped.
    @tag :capture_log
    test "a growth peer that leaves before commit cancels the round; T stays on the old view",
         %{scope: scope} do
      t_node = node()

      c_name = ~c"muster_cancel_c_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope, rpc_timeout_ms: 30_000)
          two_view = Enum.sort([t_node, r_node])
          two_hash = :erlang.phash2(two_view)
          three_view = Enum.sort([t_node, r_node, c_node])
          await_ready(two_view)

          # Freeze R fully: it can neither register C nor apply T's transition, so
          # T is the only node that runs (and gets stuck in) a prepare round.
          force_ordering(
            until: %{:"$kind" => :test_release},
            delay: %{:"$kind" => :muster_peer_registered, node: ^r_node, peer: ^c_node}
          )

          force_ordering(
            until: %{:"$kind" => :test_release},
            delay: %{:"$kind" => :muster_transition_applied, node: ^r_node, source: ^t_node}
          )

          # C joins. T grows toward {T,R,C} and PREPAREs R -- frozen, so T's round
          # can never commit.
          {:ok, p_c, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(p_c, scope, rpc_timeout_ms: 30_000)

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_view_prepare, node: ^t_node, target: ^three_view},
                     15_000
                   )

          # Gated: T has NOT swapped its ring (still {T,R}).
          assert Enum.sort(Muster.members(scope)) == two_view

          # C leaves before T commits. T's recompute is back to the committed
          # {T,R}: the round is CANCELLED, not rebalanced.
          :ok = stop_supervised({:peer, c_name})

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_view_cancel, node: ^t_node, target: ^three_view},
                     15_000
                   )

          # T returns to :ready for the original view; the ring was never swapped.
          await_ready(two_view, nodes: [t_node], nth: 2)
          assert status(scope) == :ready
          assert Muster.view_hash(scope) == two_hash
          assert Enum.sort(Muster.members(scope)) == two_view

          # Release R; the whole cluster settles back on {T,R} :ready.
          tp(:test_release, %{})
          await_ready(two_view, nth: 2)
          assert :erpc.call(r_node, Muster, :members, [scope]) == two_view
        end,
        fn _trace -> :ok end
      )
    end
  end

  describe "grow then shrink with a PARTIAL ack -- the cancel must repair the acked member" do
    setup do
      scope = :"muster_cancel_repair_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100, rpc_timeout_ms: 30_000))
      %{scope: scope}
    end

    # The subtle case cancel_view_change/1 must handle: an old view of THREE
    # ({T,R,S}) grows toward {T,R,S,C}, so T's prepare audience is {R,S}. R acks
    # (so R has INVALIDATED its member_views entry for T, stamped at the round's
    # seq), but S never acks, so T stays pending. When C then leaves, T cancels --
    # and R is left invalidated for T at a seq ABOVE T's committed view_seq. A bare
    # heartbeat marker carries the lower view_seq and R's newest-seq-wins guard
    # rejects it, so without the proactive repair (bump view_seq past the round's
    # seq + re-announce) R would flood for T forever. Reaching :ready again PROVES
    # the repair.
    #
    # We freeze only S (a full bystander: it neither acks nor starts its own
    # round). T and R are both live, so they PREPARE each other AND S: each acks
    # the other (mutual invalidation) but both stay pending on S's missing ack.
    # Killing C makes BOTH cancel and re-announce, mutually repairing -- so both
    # return to :ready for {T,R,S} while S is still frozen.
    @tag :capture_log
    test "an acked member left invalidated by a cancelled round is re-synced without a heartbeat",
         %{scope: scope} do
      t_node = node()

      s_name = ~c"muster_repair_s_#{System.unique_integer([:positive])}"
      s_node = :"#{s_name}@127.0.0.1"
      c_name = ~c"muster_repair_c_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope, rpc_timeout_ms: 30_000)

          {:ok, p_s, ^s_node} = Peer.start(name: s_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(s_node)
          start_remote_muster(p_s, scope, rpc_timeout_ms: 30_000)

          three_view = Enum.sort([t_node, r_node, s_node])
          four_view = Enum.sort([t_node, r_node, s_node, c_node])
          await_ready(three_view)

          # Freeze S fully: it can neither register C nor apply anyone's
          # transition, so it never acks (keeping T and R pending) and never
          # starts a round of its own that would invalidate T or R.
          force_ordering(
            until: %{:"$kind" => :test_release},
            delay: %{:"$kind" => :muster_peer_registered, node: ^s_node, peer: ^c_node}
          )

          force_ordering(
            until: %{:"$kind" => :test_release},
            delay: %{:"$kind" => :muster_transition_applied, node: ^s_node}
          )

          # C joins. T and R each grow toward {T,R,S,C}, prepare {other, S}, ack
          # each other, and stay pending on S.
          {:ok, p_c, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(p_c, scope, rpc_timeout_ms: 30_000)

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_view_prepare, node: ^t_node, target: ^four_view},
                     15_000
                   )

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_view_prepare, node: ^r_node, target: ^four_view},
                     15_000
                   )

          # Neither committed: rings still {T,R,S}.
          assert Enum.sort(Muster.members(scope)) == three_view
          assert :erpc.call(r_node, Muster, :members, [scope]) == three_view

          # C leaves. Both T and R cancel their rounds.
          :ok = stop_supervised({:peer, c_name})

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_view_cancel, node: ^t_node, target: ^four_view},
                     15_000
                   )

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_view_cancel, node: ^r_node, target: ^four_view},
                     15_000
                   )

          # THE REPAIR: with S still frozen, T and R re-sync each other purely off
          # their cancel's re-announce (bumped seq), returning to :ready for
          # {T,R,S}. Without the seq bump this times out (each stays invalidated
          # for the other and floods indefinitely).
          await_ready(three_view, nodes: [t_node, r_node], nth: 2)
          assert Enum.sort(Muster.members(scope)) == three_view

          # Release S; the whole cluster settles back on {T,R,S} :ready. S's now
          # stale (lower-seq) acks land after both rounds are gone and are dropped.
          tp(:test_release, %{})

          wait_until(fn ->
            Enum.sort(Muster.members(scope)) == three_view and status(scope) == :ready and
              :erpc.call(r_node, Muster, :members, [scope]) == three_view and
              :erpc.call(s_node, Muster, :members, [scope]) == three_view and
              remote_status(p_s, scope) == :ready
          end)
        end,
        fn _trace -> :ok end
      )
    end
  end

  describe "view-change prepare RPC failure (injected crash)" do
    setup do
      scope = :"muster_prepare_fail_#{System.unique_integer([:positive])}"
      start_supervised!(spec(scope, vacant_flush_interval_ms: 100))
      %{scope: scope}
    end

    # If a note_transition prepare RPC to a member that is STILL in the target
    # view fails, begin_view_change's transition_done handler re-raises and Scope
    # CRASHES -- the same "restart re-announces from a clean slate" recovery as a
    # failed rebalance snapshot (see the rebalance-RPC-failure test). We crash T's
    # first prepare worker toward R (R is in the target {T,R,C}); T's Scope must
    # crash, restart, and the retried prepare must let the cluster converge to the
    # 3-node view.
    #
    # Note the mutual prepare: R also prepares T, so when T's coordinator dies R's
    # prepare-to-T legitimately fails with T still in R's target and R crashes too
    # (the SAME documented behaviour, not a test artifact). Both restart and
    # re-converge, so we poll the settled state rather than count status events.
    @tag :capture_log
    test "the source Scope crashes when a prepare RPC to a still-targeted member fails, restarts, and re-converges",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p_r, r_node} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(r_node)
          start_remote_muster(p_r, scope)
          await_ready([t_node, r_node])

          c_name = ~c"muster_prepare_fail_c_#{System.unique_integer([:positive])}"
          c_node = :"#{c_name}@127.0.0.1"
          view3 = Enum.sort([t_node, r_node, c_node])

          # Crash T's FIRST prepare worker (R is in the target, so it re-raises).
          inject_crash(
            %{:"$kind" => :muster_rpc_worker_start, node: ^t_node, function: :note_transition},
            recover_after: 1
          )

          {:ok, p_c, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(p_c, scope)

          # The injected crash fires on T's prepare worker...
          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :snabbkaffe_crash, node: ^t_node, function: :note_transition},
                     10_000
                   )

          # ...and the whole cluster still converges to the 3-node view only after
          # the crashed Scope restarts and retries its (recovered) prepare.
          wait_until(
            fn ->
              Enum.sort(Muster.members(scope)) == view3 and status(scope) == :ready and
                :erpc.call(r_node, Muster, :members, [scope]) == view3 and
                :erpc.call(c_node, Muster, :members, [scope]) == view3
            end,
            20_000
          )

          # Fully functional after recovery.
          assert :ok = Muster.join(scope, :probe_group, spawn(fn -> Process.sleep(:infinity) end))
        end,
        fn trace ->
          # The injected crash fired at least once on T's prepare worker.
          assert of_kind(trace, :snabbkaffe_crash)
                 |> Enum.any?(&(&1[:node] == t_node and &1[:function] == :note_transition))
        end
      )
    end
  end

  describe "total coordinator wipe -- every Scope on the cluster crashes at once" do
    setup do
      scope = :"muster_wipe_#{System.unique_integer([:positive])}"
      # Fast heartbeat so the re-discovery backstop re-pairs the cold-restarted
      # coordinators promptly: after a whole-layer crash no node's :nodeup fires
      # (the node connections never dropped, only the processes died), so
      # re-pairing leans on the init discover broadcast plus rediscover/1.
      start_supervised!(
        spec(scope, vacant_flush_interval_ms: 100, view_heartbeat_interval_ms: 200)
      )

      %{scope: scope}
    end

    # README "Scope crash for other reasons": the single-crash tests all kill ONE
    # coordinator against healthy :ready peers that act as the source of truth and
    # re-snapshot the casualty. This proves the harder case -- EVERY coordinator on
    # a 3-node cluster dies at once, so there is no :ready anchor to lean on. Each
    # restarts cold (empty occupancy table, members [node()], :converging) but with
    # its Partition tables intact, and the cluster must re-converge purely from each
    # node re-asserting its OWN held groups (reannounce_local_groups_at_init) plus
    # mutual re-discovery. This is the whole-layer liveness guarantee: three nodes
    # restarting simultaneously must not wedge each other in a mutual :converging
    # standoff, and every source row must be rebuilt on its new router.
    @tag :capture_log
    test "all three coordinators crash together and the cluster re-converges from cold",
         %{scope: scope} do
      t_node = node()

      check_trace(
        fn ->
          {:ok, p1, n1} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(n1)
          start_remote_muster(p1, scope, view_heartbeat_interval_ms: 200)

          {:ok, p2, n2} = Peer.start(aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(n2)
          start_remote_muster(p2, scope, view_heartbeat_interval_ms: 200)

          view3 = Enum.sort([t_node, n1, n2])
          view_hash = :erlang.phash2(view3)
          await_ready(view3)

          # One group held by each node, each routed to a DIFFERENT node than its
          # holder, so healing every row requires a real cross-node re-announce
          # (not just a self-row re-assert):
          #   g_t held by T, routed to n1
          #   g_1 held by n1, routed to n2
          #   g_2 held by n2, routed to T
          g_t = pick_group([{view3, n1}])
          g_1 = pick_group([{view3, n2}])
          g_2 = pick_group([{view3, t_node}])
          assert g_t != g_1 and g_1 != g_2 and g_t != g_2

          :ok = Muster.join(scope, g_t, spawn(fn -> Process.sleep(:infinity) end))
          :ok = :peer.call(p1, MusterPeerAux, :join, [scope, g_1])
          :ok = :peer.call(p2, MusterPeerAux, :join, [scope, g_2])

          # Every router knows its group (join/3 only returns once it has been told).
          assert t_node in occupancy_on(n1, scope, g_t)
          assert n1 in occupancy_on(n2, scope, g_1)
          assert n2 in occupancy_on(t_node, scope, g_2)

          # Kill all three coordinators at once. Each takes its occupancy table with
          # it; the Partition tables (owned by the surviving Forum.Supervisor) and
          # the member pids live on, so each node still HOLDS its group.
          coords = [
            {t_node, Process.whereis(Forum.Supervisor.name(scope))},
            {n1, :erpc.call(n1, Process, :whereis, [Forum.Supervisor.name(scope)])},
            {n2, :erpc.call(n2, Process, :whereis, [Forum.Supervisor.name(scope)])}
          ]

          refs =
            for {n, pid} <- coords do
              ref = Process.monitor(pid)

              if n == t_node,
                do: Process.exit(pid, :kill),
                else: :erpc.call(n, Process, :exit, [pid, :kill])

              {pid, ref}
            end

          for {pid, ref} <- refs do
            assert_receive {:DOWN, ^ref, :process, ^pid, _}, 5_000
          end

          # No :ready anchor survives: the whole layer must re-pair and re-converge
          # from cold. Each node reaches :ready for the 3-node view a SECOND time
          # (the first was the original formation), hence nth: 2.
          await_ready(view3, nth: 2, timeout: 30_000)

          # All three agree on the full membership again.
          assert Enum.sort(Muster.members(scope)) == view3
          assert :erpc.call(n1, Muster, :members, [scope]) == view3
          assert :erpc.call(n2, Muster, :members, [scope]) == view3

          # Every source row was rebuilt on its router with no healthy peer to lean
          # on -- each holder re-announced its own group after the cold restart.
          assert t_node in occupancy_on(n1, scope, g_t)
          assert n1 in occupancy_on(n2, scope, g_1)
          assert n2 in occupancy_on(t_node, scope, g_2)

          # Fully functional: a fresh join succeeds against the healed cluster.
          assert :ok =
                   Muster.join(scope, :wipe_probe, spawn(fn -> Process.sleep(:infinity) end))

          %{view3: view3, view_hash: view_hash}
        end,
        fn result, trace ->
          # The trace independently confirms all three nodes reached :ready for the
          # 3-node view at least twice: once at formation, once after the total
          # crash. Anything less means a node stayed wedged in :converging.
          ready_by_node =
            of_kind(trace, :muster_status_change)
            |> Enum.filter(&(&1.to == :ready and &1.view_hash == result.view_hash))
            |> Enum.group_by(& &1.node)

          for n <- result.view3 do
            assert length(Map.get(ready_by_node, n, [])) >= 2,
                   "#{inspect(n)} did not reach :ready for the 3-node view both at formation " <>
                     "and after the total coordinator crash"
          end
        end
      )
    end
  end

  describe "graceful drain (drain/2)" do
    setup do
      scope = :"muster_drain_#{System.unique_integer([:positive])}"
      # Fast heartbeat on the local (test) node so its re-discovery backstop fires
      # several times inside the draining test's observation window. The drained
      # peer must ignore every one of those discover offers.
      #
      # A short tombstone window because it is also the interval of the sweep that
      # collects a departed source (reap_departed_sources/1).
      start_supervised!(
        spec(scope,
          vacant_flush_interval_ms: 100,
          view_heartbeat_interval_ms: 300,
          tombstone_window_ms: 500
        )
      )

      %{scope: scope}
    end

    # Draining evacuates a node's router role before it dies: peers rebalance it
    # out and the groups it routed stay reachable on the newly elected router
    # (held-elsewhere source rows are re-announced, so no broadcast is missed).
    # The leaver was already evicted by the graceful leave, so its eventual real
    # :DOWN is a no-op (it was demonitored and flushed) and the membership does
    # not flap when the process finally goes away.
    test "evacuates the router role, peers re-elect, re-announce and :DOWN is a no-op",
         %{scope: scope} do
      t_node = node()
      a_name = ~c"muster_drain_a_#{System.unique_integer([:positive])}"
      a_node = :"#{a_name}@127.0.0.1"
      c_name = ~c"muster_drain_c_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, pa, ^a_node} = Peer.start(name: a_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(a_node)
          start_remote_muster(pa, scope)
          await_ready([t_node, a_node])

          {:ok, pc, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(pc, scope)
          await_ready([t_node, a_node, c_node])

          # A group C is the router for, held (as a member) on A. So its source
          # row lives on C and must be re-announced to the new router when C leaves.
          g = group_routed_to(scope, c_node)
          assert g, "no group routing to C found"
          :ok = :peer.call(pa, MusterPeerAux, :join, [scope, g])
          assert a_node in occupancy_on(c_node, scope, g)

          # Drain C. Returns :ok only after both peers rebalanced it out and the
          # settle window elapsed.
          assert :ok = :peer.call(pc, MusterPeerAux, :drain, [scope, [settle_ms: 300]])

          # Peers converged onto the 2-node view without C.
          await_ready([t_node, a_node])
          assert Enum.sort(Muster.members(scope)) == Enum.sort([t_node, a_node])

          # The group C routed is reachable on the newly elected router, with A's
          # source row intact
          {:ok, r} = Muster.router(scope, g)
          assert r != c_node
          assert a_node in occupancy_on(r, scope, g)

          # The eventual real :DOWN (process actually stops) does nothing: C was
          # already departed on the graceful leave and demonitored, so the view
          # stays put. the local Scope's nodedown handler is a no-op.
          Node.monitor(c_node, true)
          :ok = stop_supervised({:peer, c_name})
          assert_receive {:nodedown, ^c_node}, 5_000
          assert Enum.sort(Muster.members(scope)) == Enum.sort([t_node, a_node])
          assert status(scope) == :ready
        end,
        fn _trace -> :ok end
      )
    end

    # drain returns :ok only once every peer acked; if a peer never acks within
    # :timeout_ms it returns {:timeout, unacked_nodes}. Park the peer's handling of
    # the leave so its ack never arrives, and assert the deadline path fires.
    test "returns {:timeout, unacked} when a peer never acks", %{scope: scope} do
      t_node = node()
      p_name = ~c"muster_drain_to_#{System.unique_integer([:positive])}"
      p_node = :"#{p_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, p1, ^p_node} = Peer.start(name: p_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(p_node)
          start_remote_muster(p1, scope)
          await_ready([t_node, p_node])

          # Block the peer's coordinator the instant it receives our leave, so it
          # can neither depart us nor ack until we release it.
          force_ordering(
            delay: %{:"$kind" => :muster_leaving_received, node: ^p_node},
            until: %{:"$kind" => :test_release}
          )

          assert {:timeout, [^p_node]} =
                   Muster.drain(scope, timeout_ms: 500, settle_ms: 100)

          tp(:test_release, %{})
        end,
        fn _trace -> :ok end
      )
    end

    # The unacked set on timeout must list exactly the peers that never acked.
    # A peer that did rebalance us out must not appear. A acks normally while B's
    # leave-handling is parked. drain must return {:timeout, [B]}, not [A, B] or [A].
    test "timeout lists only the peers that never acked", %{scope: scope} do
      t_node = node()
      a_name = ~c"muster_drain_ack_#{System.unique_integer([:positive])}"
      a_node = :"#{a_name}@127.0.0.1"
      b_name = ~c"muster_drain_noack_#{System.unique_integer([:positive])}"
      b_node = :"#{b_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, pa, ^a_node} = Peer.start(name: a_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(a_node)
          start_remote_muster(pa, scope)
          await_ready([t_node, a_node])

          {:ok, pb, ^b_node} = Peer.start(name: b_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(b_node)
          start_remote_muster(pb, scope)
          await_ready([t_node, a_node, b_node])

          # Park only B the instant it receives our leave, so B can neither depart
          # us nor ack until released. A is untouched and acks normally.
          force_ordering(
            delay: %{:"$kind" => :muster_leaving_received, node: ^b_node},
            until: %{:"$kind" => :test_release}
          )

          # A acks well within timeout_ms. B never does, so the unacked set (the
          # difference leave_expected -- leave_acked) must be exactly [B].
          assert {:timeout, [^b_node]} =
                   Muster.drain(scope, timeout_ms: 1_000, settle_ms: 100)

          tp(:test_release, %{})
        end,
        fn _trace -> :ok end
      )
    end

    test "a peer that dies mid-drain is dropped from the handoff wait", %{scope: scope} do
      t_node = node()
      a_name = ~c"muster_drain_live_#{System.unique_integer([:positive])}"
      a_node = :"#{a_name}@127.0.0.1"
      b_name = ~c"muster_drain_die_#{System.unique_integer([:positive])}"
      b_node = :"#{b_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, pa, ^a_node} = Peer.start(name: a_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(a_node)
          start_remote_muster(pa, scope)
          await_ready([t_node, a_node])

          {:ok, pb, ^b_node} = Peer.start(name: b_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(b_node)
          start_remote_muster(pb, scope)
          await_ready([t_node, a_node, b_node])

          # Park B the instant it receives our leave so it can neither depart us
          # nor ack as it will die still owing an ack. A is untouched and acks.
          force_ordering(
            delay: %{:"$kind" => :muster_leaving_received, node: ^b_node},
            until: %{:"$kind" => :test_release}
          )

          task =
            Task.async(fn -> Muster.drain(scope, timeout_ms: 30_000, settle_ms: 100) end)

          # Once we have broadcast the leave (B is now an expected peer), kill B.
          assert {:ok, _} =
                   block_until(%{:"$kind" => :muster_drain_begin, node: ^t_node}, 10_000)

          :ok = stop_supervised({:peer, b_name})

          # drain returns :ok (A acked, B departed) well within timeout_ms.
          assert :ok = Task.await(task, 10_000)

          tp(:test_release, %{})

          # A leaver never rebalances itself, not even to evict the peer that
          # died under it: T's ring is still the full 3-node view (B's death only
          # released it from the drain wait), and A, which evicted T on the
          # leave, was not handed a fresh snapshot/delta from T's would-be
          # rebalance. Such a write would carry a seq above the departure
          # watermark A parked, pass A's guard, and resurrect T's member_views
          # entry on A as a phantom until T actually dies.
          assert Enum.sort(Muster.members(scope)) == Enum.sort([t_node, a_node, b_node])
          dump_a = :erpc.call(a_node, GenServer, :call, [Forum.Supervisor.name(scope), :dump])

          refute Map.has_key?(dump_a.member_views, t_node),
                 "A evicted T on the leave, yet holds a member_views entry for it again: the " <>
                   "leaver rebalanced itself on B's death and re-announced to A"

          refute t_node in dump_a.members
        end,
        fn trace ->
          # B was dropped from the wait on its death...
          assert Enum.any?(of_kind(trace, :muster_drain_peer_lost), &(&1.peer_node == b_node))
          # ...the drain settled instead of timing out.
          assert Enum.any?(of_kind(trace, :muster_drain_settled), &(&1.node == t_node))
          refute Enum.any?(of_kind(trace, :muster_drain_timeout), &(&1.node == t_node))

          # ...and T ran no rebalance that drops B: the only rebalances on T are
          # the pre-drain growth ones ({T} -> {T,A} -> {T,A,B}).
          refute Enum.any?(
                   of_kind(trace, :muster_rebalance_start),
                   &(&1.node == t_node and b_node in &1.from and b_node not in &1.to)
                 ),
                 "the leaver rebalanced itself when B died mid-drain"
        end
      )
    end

    test "two nodes draining concurrently ack each other and both settle", %{scope: scope} do
      t_node = node()
      a_name = ~c"muster_drain_pair_a_#{System.unique_integer([:positive])}"
      a_node = :"#{a_name}@127.0.0.1"
      b_name = ~c"muster_drain_pair_b_#{System.unique_integer([:positive])}"
      b_node = :"#{b_name}@127.0.0.1"
      c_name = ~c"muster_drain_pair_c_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"
      d_name = ~c"muster_drain_pair_d_#{System.unique_integer([:positive])}"
      d_node = :"#{d_name}@127.0.0.1"

      check_trace(
        fn ->
          # A 5-node cluster: T, A, B survive; C and D drain together.
          {:ok, pa, ^a_node} = Peer.start(name: a_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(a_node)
          start_remote_muster(pa, scope)
          await_ready([t_node, a_node])

          {:ok, pb, ^b_node} = Peer.start(name: b_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(b_node)
          start_remote_muster(pb, scope)
          await_ready([t_node, a_node, b_node])

          {:ok, pc, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(pc, scope)
          await_ready([t_node, a_node, b_node, c_node])

          {:ok, pd, ^d_node} = Peer.start(name: d_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(d_node)
          start_remote_muster(pd, scope)
          await_ready([t_node, a_node, b_node, c_node, d_node])

          # One group routed by each leaver, both held on A: their source rows
          # live on the leavers and must be re-announced to the newly elected
          # routers as each leave is processed.
          gc = group_routed_to(scope, c_node)
          gd = group_routed_to(scope, d_node)
          assert gc, "no group routing to C found"
          assert gd, "no group routing to D found"
          :ok = :peer.call(pa, MusterPeerAux, :join, [scope, gc])
          :ok = :peer.call(pa, MusterPeerAux, :join, [scope, gd])
          assert a_node in occupancy_on(c_node, scope, gc)
          assert a_node in occupancy_on(d_node, scope, gd)

          # Hold C in its drain until D has entered its own (see above): both
          # expected-ack sets are then computed before either leave goes out, so
          # each leaver waits on the other.
          force_ordering(
            delay: %{:"$kind" => :muster_drain_begin, node: ^c_node},
            until: %{:"$kind" => :muster_drain_begin, node: ^d_node}
          )

          # The :peer.call timeout must outlast the drain's own ack timeout, so a
          # leaver that never gets its co-leaver's ack reports {:timeout, [peer]}
          # here rather than blowing up as a dead :peer.call.
          opts = [timeout_ms: 5_000, settle_ms: 300]
          drain = fn p -> :peer.call(p, MusterPeerAux, :drain, [scope, opts], 20_000) end
          dc = Task.async(fn -> drain.(pc) end)
          dd = Task.async(fn -> drain.(pd) end)

          # Neither times out: the co-leaver's ack arrives like any other.
          assert :ok = Task.await(dc, 25_000)
          assert :ok = Task.await(dd, 25_000)

          # The three survivors converged on the view without either leaver.
          await_ready([t_node, a_node, b_node])
          assert Enum.sort(Muster.members(scope)) == Enum.sort([t_node, a_node, b_node])

          # Both drained groups are reachable on a surviving router, with A's
          # source row intact: each of the two departures re-announced what the
          # survivors hold to the router elected by the view it produced.
          for g <- [gc, gd] do
            {:ok, r} = Muster.router(scope, g)
            assert r not in [c_node, d_node]
            assert a_node in occupancy_on(r, scope, g)
          end
        end,
        fn trace ->
          # The interleaving under test really happened: each leaver had the
          # other in the expected-ack set it snapshotted at drain start.
          begins = of_kind(trace, :muster_drain_begin)
          assert %{expected: c_expected} = Enum.find(begins, &(&1.node == c_node))
          assert %{expected: d_expected} = Enum.find(begins, &(&1.node == d_node))
          assert d_node in c_expected
          assert c_node in d_expected

          # Each leaver evicted and acked the other despite draining itself...
          received = of_kind(trace, :muster_leaving_received)
          assert Enum.any?(received, &(&1.node == c_node and &1.peer_node == d_node))
          assert Enum.any?(received, &(&1.node == d_node and &1.peer_node == c_node))

          # ...so both reached the settle window instead of timing out on an ack
          # that a `leaving` guard would have swallowed.
          for n <- [c_node, d_node] do
            assert Enum.any?(of_kind(trace, :muster_drain_settled), &(&1.node == n))
            refute Enum.any?(of_kind(trace, :muster_drain_timeout), &(&1.node == n))
          end
        end
      )
    end

    # A leaver must refuse a second drain: it would overwrite the parked caller
    # (the first drain/2 would never be replied to) and re-broadcast a leave to
    # peers that already evicted us and will never ack again. The first drain
    # must complete exactly as if the second had never happened.
    test "a second drain while one is in flight is refused and does not disturb the first",
         %{scope: scope} do
      t_node = node()
      p_name = ~c"muster_drain_twice_#{System.unique_integer([:positive])}"
      p_node = :"#{p_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, p1, ^p_node} = Peer.start(name: p_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(p_node)
          start_remote_muster(p1, scope)
          await_ready([t_node, p_node])

          # Park the peer's handling of the leave so the first drain is
          # observably still in flight when the second call arrives.
          force_ordering(
            delay: %{:"$kind" => :muster_leaving_received, node: ^p_node},
            until: %{:"$kind" => :test_release}
          )

          first = Task.async(fn -> Muster.drain(scope, timeout_ms: 10_000, settle_ms: 100) end)
          assert {:ok, _} = block_until(%{:"$kind" => :muster_drain_begin, node: ^t_node}, 10_000)

          assert {:error, :already_draining} =
                   Muster.drain(scope, timeout_ms: 100, settle_ms: 100)

          tp(:test_release, %{})
          assert :ok = Task.await(first, 15_000)
        end,
        fn trace ->
          # Exactly one drain ever began on T.
          assert length(Enum.filter(of_kind(trace, :muster_drain_begin), &(&1.node == t_node))) ==
                   1

          assert Enum.any?(of_kind(trace, :muster_drain_settled), &(&1.node == t_node))
          refute Enum.any?(of_kind(trace, :muster_drain_timeout), &(&1.node == t_node))
        end
      )
    end

    test "a deadline that fires during the settle window is a no-op", %{scope: scope} do
      t_node = node()
      c_name = ~c"muster_drain_stray_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, pc, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(pc, scope)
          await_ready([t_node, c_node])

          assert :ok =
                   :peer.call(pc, MusterPeerAux, :drain, [
                     scope,
                     [timeout_ms: 300, settle_ms: 700]
                   ])

          # The leaver's coordinator is still responsive and kept its own full view
          # (it never rebalanced itself).
          assert :erpc.call(c_node, Muster, :members, [scope]) == Enum.sort([t_node, c_node])
        end,
        fn trace ->
          # The drain settled (all peers acked, settle elapsed)...
          assert Enum.any?(of_kind(trace, :muster_drain_settled), &(&1.node == c_node))

          # ...and the mid-settle deadline was a no-op: no timeout was ever reported.
          refute Enum.any?(of_kind(trace, :muster_drain_timeout), &(&1.node == c_node))
        end
      )
    end

    # The settle window keeps Scope + the occupancy table alive after all peers
    # rebalanced the leaver out, so a broadcast routed to the leaver as router just
    # before the handoff still gets an answer and that answer is a flood, never
    # a decision. A leaver publishes :rebalancing at drain start and stays there:
    # from the first eviction on its table is no longer maintained, so it must
    # send every sender to the flood path. The table itself is intact and the
    # coordinator alive throughout. Observed via :muster_drain_acked, which fires
    # when settle opens.
    test "stays a responsive router through the settle window, but floods rather than decides",
         %{scope: scope} do
      t_node = node()
      c_name = ~c"muster_drain_settle_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, pc, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(pc, scope)
          await_ready([t_node, c_node])

          # C is the router for g. T holds it, so C's occupancy has {g, T}.
          g = group_routed_to(scope, c_node)
          assert g, "no group routing to C found"
          :ok = Muster.join(scope, g, spawn(fn -> Process.sleep(:infinity) end))
          assert t_node in occupancy_on(c_node, scope, g)
          vh = :peer.call(pc, MusterPeerAux, :view_hash, [scope])
          assert {:ok, [^t_node]} = :erpc.call(c_node, Forum.Muster, :targets, [scope, g, vh])

          # Drain C with a generous settle window, in a task so we can observe C
          # mid-settle. It replies :ok only after the window elapses.
          task =
            Task.async(fn ->
              :peer.call(pc, MusterPeerAux, :drain, [scope, [settle_ms: 1_500]])
            end)

          # The settle window has opened (all peers acked) but not yet elapsed.
          assert {:ok, _} =
                   block_until(%{:"$kind" => :muster_drain_acked, node: ^c_node}, 10_000)

          # C is alive and responsive: it kept its old view hash (it never
          # rebalanced itself) and its occupancy table is intact...
          assert :peer.call(pc, MusterPeerAux, :view_hash, [scope]) == vh
          assert t_node in occupancy_on(c_node, scope, g)

          # ...but it is :rebalancing for the whole drain, so a broadcast in
          # flight to it under the old view is told to flood, not handed a
          # target set it can no longer vouch for.
          assert :peer.call(pc, MusterPeerAux, :status, [scope]) == :rebalancing
          assert {:error, :flood} = :erpc.call(c_node, Forum.Muster, :targets, [scope, g, vh])

          assert :ok = Task.await(task, 10_000)
          assert :peer.call(pc, MusterPeerAux, :status, [scope]) == :rebalancing
        end,
        fn trace ->
          # The leaver flipped to :rebalancing exactly once, at drain start, and
          # never published anything after it.
          c_changes = Enum.filter(of_kind(trace, :muster_status_change), &(&1.node == c_node))
          assert List.last(c_changes).to == :rebalancing
        end
      )
    end

    # Why a leaver must flood. Peers evict it one at a time, and from the first
    # eviction its occupancy table is no longer maintained: Q, having evicted C,
    # sends its new first-member claim for g to the newly-elected router (per Q's
    # ring), never to C. T, which has not yet processed the leave, still routes g
    # to C and asks it under the old {T,C,Q} view hash, which C still holds,
    # since it never rebalances itself. If C were still :ready it would match
    # that hash and answer from a table missing Q's brand-new member: a silent
    # miss the crash path never has (a dead router fails the call and the sender
    # floods). C must answer {:error, :flood}.
    #
    # T's coordinator is parked on the leave with force_ordering, exactly the
    # state a slow peer is in for the length of one message hop. Everything T
    # does here (router/2, view_hash/1, the targets RPC) is what a broadcaster
    # does and touches no coordinator.
    test "a draining router floods for a broadcaster still on the old view", %{scope: scope} do
      t_node = node()
      c_name = ~c"muster_drain_stale_c_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"
      q_name = ~c"muster_drain_stale_q_#{System.unique_integer([:positive])}"
      q_node = :"#{q_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, pc, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(pc, scope)
          await_ready([t_node, c_node])

          {:ok, pq, ^q_node} = Peer.start(name: q_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(q_node)
          start_remote_muster(pq, scope)
          await_ready([t_node, c_node, q_node])

          g = group_routed_to(scope, c_node)
          assert g, "no group routing to C found"
          refute q_node in occupancy_on(c_node, scope, g)

          # Park T's handling of the leave: T stays on {T,C,Q}, :ready.
          force_ordering(
            delay: %{:"$kind" => :muster_leaving_received, node: ^t_node},
            until: %{:"$kind" => :test_release}
          )

          task =
            Task.async(fn ->
              :peer.call(pc, MusterPeerAux, :drain, [scope, [timeout_ms: 20_000, settle_ms: 100]])
            end)

          # Q evicts C.
          wait_until(
            fn ->
              :erpc.call(q_node, Muster, :members, [scope]) == Enum.sort([t_node, q_node])
            end,
            10_000
          )

          # A first member for g joins on Q. Q's ring no longer has C, so the
          # claim goes to whichever of {T,Q} now routes g but never to C.
          assert :ok = :peer.call(pq, MusterPeerAux, :join, [scope, g])
          refute q_node in occupancy_on(c_node, scope, g)

          # T is exactly where a slow broadcaster is: :ready on the old view,
          # routing g to C, tagging with the old hash which C still holds.
          assert status(scope) == :ready
          assert {:ok, ^c_node} = Muster.router(scope, g)
          t_vh = Muster.view_hash(scope)
          assert :peer.call(pc, MusterPeerAux, :view_hash, [scope]) == t_vh

          # C must not decide from a table Q has stopped maintaining.
          assert {:error, :flood} = :erpc.call(c_node, Forum.Muster, :targets, [scope, g, t_vh]),
                 "the draining router answered a stale-view broadcaster from its own table, " <>
                   "which no longer knows #{inspect(q_node)} holds #{g}: a silent miss"

          tp(:test_release, %{})
          assert :ok = Task.await(task, 30_000)
        end,
        fn _trace -> :ok end
      )
    end

    # A graceful leave must be final on the peer: nothing the leaver had already
    # put on the wire may resurrect it after the peer rebalanced it out.
    #
    # The hole this covers: rebalance announcements (snapshots and deltas alike)
    # are dispatched by monitored workers via :erpc, not over the
    # coordinator->coordinator dist channel that carries {:muster_leaving, ...}.
    # Those two channels have no ordering relation, so an announcement dispatched
    # by C's rebalance just before it drained can land on T after T processed the
    # leave and ran depart_peer/3. C is genuinely still alive to have that RPC
    # land (drain is pre-death).
    # depart_peer/3 deletes applied_snapshot_seq[C], which would leave the late
    # apply's only guard (`seq <= watermark`) disarmed, free to insert C's
    # occupancy rows plus a member_views entry. What holds here is
    # leave_watermark/3 re-arming that guard at the leave's seq. Nothing else
    # would.
    #
    # The announcement is dispatched by C's own rebalance out of the
    # 3-node view. We only schedule the landing order, by parking C's RPC worker
    # with force_ordering before it dispatches. That tracepoint fires in the
    # throwaway worker, not in the coordinator, so C stays free to drain while
    # this one RPC sits on the wire. One slow hop, which is all this needs.
    test "a late in-flight rebalance announcement cannot resurrect a gracefully drained node",
         %{scope: scope} do
      t_node = node()
      c_name = ~c"muster_drain_late_snap_c_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"
      x_name = ~c"muster_drain_late_snap_x_#{System.unique_integer([:positive])}"
      x_node = :"#{x_name}@127.0.0.1"
      view_tcx = Enum.sort([t_node, c_node, x_node])
      view_tc = Enum.sort([t_node, c_node])

      check_trace(
        fn ->
          {:ok, pc, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(pc, scope)
          await_ready([t_node, c_node])

          {:ok, px, ^x_node} = Peer.start(name: x_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(x_node)
          start_remote_muster(px, scope)
          await_ready(view_tcx)

          # g routes to X in {T,C,X} and to T in {T,C}, and C holds it. X's
          # departure is then exactly one group moving onto T on C's ring, so C's
          # rebalance out of the 3-node view has something to announce to T. The
          # last thing C puts on the wire before it drains.
          g = pick_group([{view_tcx, x_node}, {view_tc, t_node}])
          assert :ok = :peer.call(pc, MusterPeerAux, :join, [scope, g])
          wait_until(fn -> c_node in occupancy_on(x_node, scope, g) end)

          # Park that announcement in C's own RPC worker, ahead of the dispatch.
          # C was already a member of T's view and owed it nothing, so the
          # announcement is a delta, stamped with the round's snapshot_seq
          # which is also the view_seq C's {:muster_leaving, ...} will carry, and
          # therefore exactly the watermark the leave parks on T.
          force_ordering(
            delay: %{
              :"$kind" => :muster_rpc_worker_start,
              node: ^c_node,
              router: ^t_node,
              function: :apply_delta
            },
            until: %{:"$kind" => :test_release}
          )

          # X dies -> C rebalances into {T,C}, g's router moves X -> T, and C's
          # announcement of it to T parks in flight.
          :ok = stop_supervised({:peer, x_name})

          # C committed that round: it adopts the new view immediately after
          # spawning the dispatch workers, so by now the announcement has left the
          # coordinator. We wait on C's view rather than on the parked event
          # itself. force_ordering withholds that event from the trace until it
          # is released.
          wait_until(fn -> :erpc.call(c_node, Muster, :members, [scope]) == view_tc end, 10_000)

          # T has not seen it: it is the router for g holding no row for it (and,
          # with C's marker riding the parked announcement, correctly not ready).
          refute c_node in Muster.occupancy(scope, g)

          assert :ok = :peer.call(pc, MusterPeerAux, :drain, [scope, [settle_ms: 200]])
          wait_until(fn -> Muster.members(scope) == [t_node] end)

          # The parked announcement now goes out and lands on a T that has already
          # evicted C. C is still alive to make the call, exactly as it is for the
          # whole drain. Its worker reporting the RPC's return is our proof that T
          # processed it.
          tp(:test_release, %{})

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_rpc_worker_result,
                       node: ^c_node,
                       router: ^t_node,
                       function: :apply_delta
                     },
                     10_000
                   )

          assert Muster.members(scope) == [t_node]
          assert status(scope) == :ready

          # A drained node must not come back as a fan-out target.
          vh = :persistent_term.get({Forum.Muster, scope, :view_hash})
          assert {:ok, srcs} = Muster.targets(scope, g, vh)

          refute c_node in srcs,
                 "#{inspect(c_node)} drained gracefully, but its late in-flight rebalance " <>
                   "announcement resurrected its occupancy row on #{inspect(t_node)}: " <>
                   "targets/3 returns #{inspect(srcs)}"

          # The departure watermark is the one per-source watermark that outlives
          # its writer, and nothing but the departed-source sweep clears it. Once C
          # is dead and disconnected that sweep must collect it: a dead node's
          # per-node state is garbage, not something to keep for the life of the
          # process.
          Node.monitor(c_node, true)
          :ok = stop_supervised({:peer, c_name})
          assert_receive {:nodedown, ^c_node}, 5_000

          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_departed_source_reaped,
                       node: ^t_node,
                       source: ^c_node
                     },
                     10_000
                   )

          dump = GenServer.call(Forum.Supervisor.name(scope), :dump)

          refute Map.has_key?(dump.applied_snapshot_seq, c_node),
                 "the departure watermark for #{inspect(c_node)} outlived its death and the " <>
                   "departed-source sweep left it behind"

          %{c_node: c_node, t_node: t_node}
        end,
        fn result, trace ->
          # The late announcement was rejected at the guard rather than applied and cleaned up afterwards.
          # C's rebalance out of the 3-node view is the only announcement it ever
          # dispatched to T (it held nothing before that, and no earlier round
          # moved a group of its onto T), so a single apply from C on T anywhere in
          # this trace is the one we parked getting through.
          applies =
            of_kind(trace, :muster_delta_received) ++
              of_kind(trace, :muster_node_state_received)

          refute Enum.any?(applies, &(&1.source == result.c_node and &1.node == result.t_node)),
                 "the late announcement was applied and the departure watermark did not reject it"
        end
      )
    end

    # A first-member join fires a synchronous :occupied claim from the source's
    # shard, in its own :erpc worker, stamped with a seq taken at dispatch time.
    # That write lands straight in the router's occupancy table: it never touches
    # applied_snapshot_seq, so the departure watermark a graceful leave parks
    # (leave_watermark/3) cannot see it, and it carries a seq far above that
    # watermark anyway. A claim dispatched in the instant before drain/2 closed
    # the join gate can therefore land on us after we evicted the leaver, and no
    # guard can reject it. What catches it is reap_departed_sources/1, once the
    # leaver is both out of our view and disconnected. Disconnection is what
    # provably ends the window, since an :erpc cannot land from a dead node.
    # Nothing else would collect the row.
    #
    # The claim here is a real first-member join on the leaver. We only schedule
    # the landing order, by parking its router-side write with force_ordering
    # until after the eviction.
    test "a late in-flight claim cannot resurrect a gracefully drained node", %{scope: scope} do
      t_node = node()
      c_name = ~c"muster_drain_late_claim_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, pc, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(pc, scope)
          await_ready([t_node, c_node])

          g = group_routed_to(scope, t_node)
          assert g, "no group routing to T found"
          refute c_node in Muster.occupancy(scope, g)

          # Hold the router-side write of C's claim. The span's :start fires ahead
          # of the upsert, so while parked the row is genuinely not in the table.
          force_ordering(
            delay: %{
              :"$kind" => :muster_occupied_apply,
              :"$span" => :start,
              node: ^t_node,
              source: ^c_node
            },
            until: %{:"$kind" => :test_release}
          )

          # A real first-member join, dispatched while C is still a member and the
          # join gate is still open, so the write carries the seq and coordinator
          # pid C's shard actually stamped. It blocks in :occupied_pending until we
          # release, so run it off to the side; we never use its result.
          {:ok, _} = Task.start(fn -> :peer.call(pc, MusterPeerAux, :join, [scope, g]) end)

          # The claim has left C (the shard is :occupied_pending and its worker is
          # in flight to T, where it will park at the forced :muster_occupied_apply
          # :start). We wait on this source-side event because force_ordering
          # withholds the parked event from the trace until it is released.
          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_occupied_dispatched, node: ^c_node, group: ^g},
                     10_000
                   )

          # The park itself is unobservable for the same reason, so there is no
          # trace point for "the request reached T". Give the :erpc the moment it
          # needs to be sent; if it was not, the block_until after the release says
          # so loudly rather than passing vacuously.
          Process.sleep(300)

          assert :ok = :peer.call(pc, MusterPeerAux, :drain, [scope, [settle_ms: 200]])
          wait_until(fn -> Muster.members(scope) == [t_node] end)

          # The eviction match_deleted every row attributable to C, and the parked
          # write is not one of them yet.
          refute c_node in Muster.occupancy(scope, g)

          # Now the claim lands, after the eviction. C is still alive at this
          # point, exactly as it is for the whole drain.
          tp(:test_release, %{})

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_occupied, node: ^t_node, source: ^c_node, group: ^g},
                     5_000
                   )

          Node.monitor(c_node, true)
          :ok = stop_supervised({:peer, c_name})
          assert_receive {:nodedown, ^c_node}, 5_000

          # The periodic departed-source sweep is what collects this row -- T's
          # heartbeat and drop_stale_router_entries have both had several turns by
          # now and neither can judge it.
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_departed_source_reaped,
                       node: ^t_node,
                       source: ^c_node
                     },
                     10_000
                   )

          assert Muster.members(scope) == [t_node]
          assert status(scope) == :ready

          vh = :persistent_term.get({Forum.Muster, scope, :view_hash})
          assert {:ok, srcs} = Muster.targets(scope, g, vh)

          refute c_node in srcs,
                 "#{inspect(c_node)} drained gracefully and is dead, but a late in-flight " <>
                   "claim resurrected its occupancy row on #{inspect(t_node)}: " <>
                   "targets/3 returns #{inspect(srcs)}"

          %{c_node: c_node, group: g}
        end,
        fn result, trace ->
          %{c_node: c_node, group: g} = result

          # No watermark can stop a claim, so this row really did land: the test
          # would otherwise pass vacuously if the write had been rejected.
          assert Enum.any?(
                   of_kind(trace, :muster_occupied),
                   &(&1.source == c_node and &1.group == g)
                 ),
                 "the late claim never landed; the test proves nothing about reaping"

          # ...and it is gone because the departed-source sweep collected it once C
          # was out of the view and disconnected.
          assert Enum.any?(
                   of_kind(trace, :muster_departed_source_reaped),
                   &(&1.source == c_node)
                 ),
                 "no departed-source reap for the drained peer: the row must have " <>
                   "been removed by something else"
        end
      )
    end

    # Why the "reap_departed_sources/1" repeats instead of firing once per departure.
    #
    # occupied/5 writes the occupancy table straight from the :erpc executor
    # process (upsert_if_newer, no coordinator hop), so nothing orders that write
    # against a sweep. A claim that reached T before C died can sit in T's run
    # queue past a sweep and insert its row just after: a dead node cannot send a
    # new request, but an already delivered one still runs. A one-shot reap keyed
    # to the departure is spent by then, and nothing else would collect the row:
    # drop_stale_router_entries cannot judge a source that will never announce our
    # view again, and the tombstone reaper only reaps tombstones.
    # reap_departed_sources/1 runs periodically and re-derives its answer from the
    # current view and connection set, so the next sweep collects the row.
    #
    # :muster_occupied_apply is a span whose :start fires before the upsert, so a
    # test can park a real claim's router-side write. We park C's claim, drain and
    # kill C, let a sweep run with the write still parked, then release it.
    test "a claim queued past one sweep is collected by the next", %{scope: scope} do
      t_node = node()
      c_name = ~c"muster_drain_queued_claim_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, pc, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          :ok = :snabbkaffe.forward_trace(c_node)
          start_remote_muster(pc, scope)
          await_ready([t_node, c_node])

          g = group_routed_to(scope, t_node)
          assert g, "no group routing to T found"

          # Hold the router-side write of C's claim. The span's :start fires ahead
          # of the upsert, so while parked the row is genuinely not in the table.
          force_ordering(
            delay: %{
              :"$kind" => :muster_occupied_apply,
              :"$span" => :start,
              node: ^t_node,
              source: ^c_node
            },
            until: %{:"$kind" => :test_release}
          )

          # C's first-member join cannot return while its claim is parked, and its
          # :peer.call dies with the node below, so run it off to the side --
          # Task.start is unlinked, so neither can fail the test.
          {:ok, _} = Task.start(fn -> :peer.call(pc, MusterPeerAux, :join, [scope, g]) end)

          # The claim is dispatched from C...
          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_occupied_dispatched, node: ^c_node, group: ^g},
                     10_000
                   )

          # Here is the one step we cannot observe: a force_ordering-delayed
          # event stays invisible to the collector until released, so there is no
          # trace point for "the request reached T and parked". Give the :erpc the
          # moment it needs to be sent. If it is not sent before C dies, the write
          # never happens at all and the assertion below says so loudly rather
          # than passing vacuously.
          Process.sleep(300)

          assert :ok = :peer.call(pc, MusterPeerAux, :drain, [scope, [settle_ms: 100]])
          wait_until(fn -> Muster.members(scope) == [t_node] end)

          Node.monitor(c_node, true)
          :ok = stop_supervised({:peer, c_name})
          assert_receive {:nodedown, ^c_node}, 5_000

          # Let a sweep run while the write is still parked, so the row lands
          # strictly after a collection rather than before one
          assert {:ok, _} =
                   block_until(
                     %{
                       :"$kind" => :muster_departed_source_reaped,
                       node: ^t_node,
                       source: ^c_node
                     },
                     10_000
                   )

          # The row is still parked, so that sweep found nothing to reap.
          refute c_node in Muster.occupancy(scope, g)

          # Now the queued write executes -- after C's death and after a sweep,
          # exactly as it would if the erpc executor had been scheduled late.
          tp(:test_release, %{})

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_occupied, node: ^t_node, source: ^c_node, group: ^g},
                     5_000
                   )

          # Only the next sweep can collect it now.
          wait_until(fn -> c_node not in Muster.occupancy(scope, g) end, 15_000)

          assert Muster.members(scope) == [t_node]
          assert status(scope) == :ready

          vh = :persistent_term.get({Forum.Muster, scope, :view_hash})
          assert {:ok, srcs} = Muster.targets(scope, g, vh)

          refute c_node in srcs,
                 "#{inspect(c_node)} is dead, but a claim queued on #{inspect(t_node)} before " <>
                   "the death executed after a sweep had already run and was never collected " <>
                   "by a later one, leaving unreachable garbage: targets/3 returns " <>
                   "#{inspect(srcs)}"
        end,
        fn _trace -> :ok end
      )
    end

    # Draining is non-resurrecting: once leaving, the node suppresses outbound
    # self-assertion and ignores inbound discovery, so no peer can re-pair it.
    # T re-offers discovery every heartbeat (300ms) to every connected
    # non-member; C must ignore all of them and stay out of T's membership.
    test "a drained node is not resurrected by discovery", %{scope: scope} do
      t_node = node()
      c_name = ~c"muster_drain_lame_#{System.unique_integer([:positive])}"
      c_node = :"#{c_name}@127.0.0.1"

      check_trace(
        fn ->
          {:ok, pc, ^c_node} = Peer.start(name: c_name, aux_mod: @aux_mod)
          start_remote_muster(pc, scope)

          wait_until(fn ->
            Enum.sort(Muster.members(scope)) == Enum.sort([t_node, c_node])
          end)

          assert :ok = :peer.call(pc, MusterPeerAux, :drain, [scope, [settle_ms: 200]])
          wait_until(fn -> Muster.members(scope) == [t_node] end)

          assert {:ok, _} =
                   block_until(
                     %{:"$kind" => :muster_rediscover, node: ^t_node, target: ^c_node},
                     3,
                     10_000,
                     0
                   )

          assert Muster.members(scope) == [t_node]

          # The departing node kept its own full ring/view (it does not rebalance
          # itself); only the peers rebalanced it out.
          assert :erpc.call(c_node, Muster, :members, [scope]) == Enum.sort([t_node, c_node])
        end,
        fn _trace -> :ok end
      )
    end

    test "join is rejected once draining", %{scope: scope} do
      assert :ok = Muster.drain(scope)

      assert {:error, :draining} =
               Muster.join(scope, :drain_probe, spawn(fn -> Process.sleep(:infinity) end))

      assert status(scope) == :rebalancing
      assert {:error, :already_draining} = Muster.drain(scope)
    end
  end

  # A group that routes to `r_node` in {t_node, r_node} (so a claim from T travels
  # to R as a remote :occupied and T's OWN occupancy table holds no self-row for
  # it) AND lives on shard index 0, so the coordinator gathers it before the
  # shard-1 gather the phantom test parks. partitions: 2 there, so the shard index
  # is `:erlang.phash2(group, 2)` (mirrors Forum.Supervisor.shard/2).
  defp pick_phantom_group(t_node, r_node) do
    probe = probe_ring([t_node, r_node])

    group =
      Enum.find(Stream.map(1..50_000, &:"phantom_group_#{&1}"), fn g ->
        match?({:ok, ^r_node}, Ring.find_node(probe, g)) and :erlang.phash2(g, 2) == 0
      end)

    GenServer.stop(probe)
    assert group, "no group routing to R on shard 0 found in 50k candidates"
    group
  end

  # Find a group that routes to `joiner` in the final cluster view but to
  # `phantom` once the phantom node is added to the ring.
  defp pick_victim_group(joiner, phantom, others) do
    final = [joiner | others]
    pick_group([{final, joiner}, {[phantom | final], phantom}])
  end

  # Find a group whose ring router is `dest` under every `{view, dest}`
  # condition simultaneously. Probes throwaway rings configured like Scope's
  # (replicas: 128). Lets a test choose its victim group from ring math before
  # the involved nodes even boot.
  defp pick_group(conditions) do
    rings = Enum.map(conditions, fn {view, dest} -> {probe_ring(Enum.sort(view)), dest} end)

    group =
      Enum.find(Stream.map(1..20_000, &:"race_group_#{&1}"), fn g ->
        Enum.all?(rings, fn {ring, dest} -> match?({:ok, ^dest}, Ring.find_node(ring, g)) end)
      end)

    Enum.each(rings, fn {ring, _} -> GenServer.stop(ring) end)
    assert group, "no group satisfying all router conditions found in 20k candidates"
    group
  end

  defp probe_ring(view) do
    name = :"muster_probe_#{System.unique_integer([:positive])}"
    {:ok, _} = Ring.start_link(name: name, replicas: 128)
    {:ok, _} = Ring.set_nodes(name, view)
    name
  end
end
