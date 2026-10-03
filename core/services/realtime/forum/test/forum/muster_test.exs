defmodule Forum.MusterTest do
  # Cannot be async: Mimic runs in global mode here (the RPC workers Muster
  # spawns are arbitrary processes, so stubs must apply cluster-wide), and the
  # injection of fake remote members manipulates global ring/state.
  use ExUnit.Case, async: false
  use Mimic

  import ExUnit.CaptureLog

  alias Forum.Muster
  alias Forum.Muster.Scope
  alias Forum.Adapter.ErlDist

  @fake_node :fake@nowhere

  setup :set_mimic_from_context

  setup ctx do
    scope = :"muster_test_#{System.unique_integer([:positive])}"

    # Default transport stubs. `call/6` (the RPC primitive) returns :ok; tests
    # re-stub it to inject failures or holds. `send/3` is a no-op -- its targets
    # are always fake remote nodes -- but it is stubbed so its invocations are
    # recorded and inspectable via `Mimic.calls/3`. `register/1` and
    # `broadcast/*` are left un-stubbed: they pass through to the real
    # ErlDist (register actually names the Scope process; broadcast is a no-op
    # with no connected nodes).
    stub_call(:ok)
    stub(ErlDist, :send, fn _scope, _node, _message -> :ok end)

    base_opts = [
      partitions: 2,
      vacancy_cooldown_ms: Map.get(ctx, :cooldown_ms, 50),
      # Long by default so the periodic flush never fires mid-test; tests that
      # exercise the flush drive it deterministically via trigger_flush/1.
      vacant_flush_interval_ms: Map.get(ctx, :flush_ms, 60_000),
      # Same: long so the view heartbeat never fires mid-test; the heartbeat
      # test drives it deterministically via trigger_view_heartbeat/1.
      view_heartbeat_interval_ms: Map.get(ctx, :heartbeat_ms, 60_000),
      singleton_promotion_timeout_ms: Map.get(ctx, :singleton_promotion_timeout_ms, 100),
      rpc_timeout_ms: Map.get(ctx, :rpc_timeout, 500),
      # Long by default so the periodic tombstone sweep never reaps mid-test; the
      # GC test shrinks it and drives the sweep deterministically.
      tombstone_window_ms: Map.get(ctx, :tombstone_window_ms, 60_000),
      message_module: ErlDist
    ]

    %{scope: scope, base_opts: base_opts}
  end

  # Stub the RPC transport `ErlDist.call/6`. `response` mirrors the old
  # RecordingAdapter contract:
  #   * `:ok` / `{:error, term}` -- returned directly.
  #   * `{:fn, fun}` -- `fun` is invoked synchronously in the calling (worker)
  #     process, letting tests inject sleeps or arbitrary logic.
  defp stub_call({:fn, fun}) do
    stub(ErlDist, :call, fn _scope, _node, _module, _function, _args, _timeout -> fun.() end)
  end

  defp stub_call(response) do
    stub(ErlDist, :call, fn _scope, _node, _module, _function, _args, _timeout -> response end)
  end

  defp spec(scope, opts) do
    %{
      id: scope,
      start: {Muster, :start_link, [scope, opts]},
      type: :supervisor
    }
  end

  defp ring_name(scope), do: :"#{scope}_muster_ring"

  defp inject_fake_remote(scope, fake_node \\ @fake_node) do
    members = Enum.sort([node(), fake_node])
    {:ok, _} = ExHashRing.Ring.set_nodes(ring_name(scope), members)

    :sys.replace_state(Forum.Supervisor.name(scope), fn s ->
      %{s | members: members}
    end)
  end

  defp set_rebalancing(scope, flag) do
    status = if flag, do: :rebalancing, else: :ready
    :persistent_term.put({Forum.Muster, scope, :status}, status)
  end

  # Finds a group whose current router lookup routes to `target_node`.
  defp group_for_router(scope, target_node) do
    Stream.iterate(0, &(&1 + 1))
    |> Stream.map(&:"g#{&1}")
    |> Enum.find(fn group ->
      case Muster.router(scope, group) do
        {:ok, ^target_node} -> true
        _ -> false
      end
    end)
  end

  # Drain and return the ErlDist.call/6 invocations recorded since the last
  # drain, each as the 6-element argument list
  # `[scope, node, module, function, args, timeout]`. `Mimic.calls/3` is
  # consuming, so this behaves like the old `drain_adapter_events`.
  defp drain_calls, do: Mimic.calls(ErlDist, :call, 6)

  # Drain and return the ErlDist.send/3 invocations recorded since the last
  # drain, each as `[scope, node, message]`.
  defp drain_sends, do: Mimic.calls(ErlDist, :send, 3)

  # A stand-in writer pid for tests that call occupied/5, vacant_batch/5,
  # receive_node_state/6 or apply_delta/6 directly against a fake remote
  # source (e.g. :src@nowhere) that has no real Scope coordinator to supply
  # one. What matters to these entry points is that a pid is provided at
  # all -- the writer-attribution behavior itself is covered separately in
  # muster_distributed_test.exs, with real coordinator pids.
  defp fake_pid, do: spawn(fn -> Process.sleep(:infinity) end)

  # Poll the drained call log (accumulating across the consuming drains) until a
  # recorded ErlDist.call/6 whose argument list satisfies `pred` appears. Used
  # for RPCs dispatched asynchronously (via the Scope mailbox / spawned worker).
  defp wait_call(pred, timeout) do
    deadline = System.monotonic_time(:millisecond) + timeout
    do_wait_call(pred, deadline, [])
  end

  defp do_wait_call(pred, deadline, acc) do
    acc = acc ++ drain_calls()

    case Enum.find(acc, pred) do
      nil ->
        if System.monotonic_time(:millisecond) >= deadline do
          :timeout
        else
          Process.sleep(5)
          do_wait_call(pred, deadline, acc)
        end

      call ->
        {:ok, call}
    end
  end

  defp assert_call(pred, timeout \\ 1_000) do
    case wait_call(pred, timeout) do
      {:ok, call} -> call
      :timeout -> flunk("no ErlDist.call/6 matching the predicate within #{timeout}ms")
    end
  end

  defp trigger_flush(scope) do
    # The vacant flush is per-shard now; fan the trigger to every shard.
    Enum.each(Forum.Supervisor.shards(scope), &Kernel.send(&1, :flush_vacant))
  end

  defp trigger_view_heartbeat(scope) do
    Kernel.send(Forum.Supervisor.name(scope), :view_heartbeat)
  end

  defp group_states(scope) do
    GenServer.call(Forum.Supervisor.name(scope), :status).group_states
  end

  # Poll the Scope's group_states until `group` reaches `expected`. `expected`
  # may be a value or a predicate fun.
  defp wait_for_group_state(scope, group, expected, timeout \\ 1_000) do
    deadline = System.monotonic_time(:millisecond) + timeout
    do_wait_for_group_state(scope, group, expected, deadline)
  end

  defp do_wait_for_group_state(scope, group, expected, deadline) do
    actual = Map.get(group_states(scope), group)

    cond do
      match_state?(expected, actual) ->
        actual

      System.monotonic_time(:millisecond) >= deadline ->
        flunk(
          "group #{inspect(group)} state #{inspect(actual)} did not match #{inspect(expected)} in time"
        )

      true ->
        Process.sleep(5)
        do_wait_for_group_state(scope, group, expected, deadline)
    end
  end

  defp match_state?(pred, actual) when is_function(pred, 1), do: pred.(actual)
  defp match_state?(expected, actual), do: expected == actual

  # True if any recorded call announced `group` to its new router via
  # Scope.receive_node_state.
  defp announced?(calls, group) do
    Enum.any?(calls, fn
      [_scope, _target, Scope, :receive_node_state, [_s, _src, groups | _], _timeout] ->
        group in groups

      _ ->
        false
    end)
  end

  # Find `count` distinct groups whose current router is `target_node`.
  defp groups_for_router(scope, target_node, count) do
    Stream.iterate(0, &(&1 + 1))
    |> Stream.map(&:"g#{&1}")
    |> Stream.filter(fn group ->
      match?({:ok, ^target_node}, Muster.router(scope, group))
    end)
    |> Enum.take(count)
  end

  # Find a group that hashes to the shard at `index` (same phash2(group, N) the
  # claim path uses), so a crash test can pin a group to the shard it kills.
  defp group_on_shard(scope, index) do
    target = Forum.Supervisor.shard_name(scope, index)

    Stream.iterate(0, &(&1 + 1))
    |> Stream.map(&:"shardg#{&1}")
    |> Enum.find(fn g -> Forum.Supervisor.shard(scope, g) == target end)
  end

  # Poll until `name` is re-registered to a pid other than `old_pid` (i.e. the
  # supervisor has restarted it).
  defp wait_for_new_pid(name, old_pid, timeout \\ 2_000) do
    deadline = System.monotonic_time(:millisecond) + timeout
    do_wait_for_new_pid(name, old_pid, deadline)
  end

  defp do_wait_for_new_pid(name, old_pid, deadline) do
    case Process.whereis(name) do
      pid when is_pid(pid) and pid != old_pid ->
        pid

      _ ->
        if System.monotonic_time(:millisecond) >= deadline do
          flunk("#{inspect(name)} did not restart with a new pid in time")
        else
          Process.sleep(5)
          do_wait_for_new_pid(name, old_pid, deadline)
        end
    end
  end

  # Poll the lock-free :status persistent_term until it reaches `expected`. Read
  # directly (not via a :status GenServer.call) so it works even while the
  # coordinator is blocked inside a synchronous rebalance gather.
  defp wait_status(scope, expected, timeout \\ 1_000) do
    deadline = System.monotonic_time(:millisecond) + timeout
    do_wait_status(scope, expected, deadline)
  end

  defp do_wait_status(scope, expected, deadline) do
    cond do
      :persistent_term.get({Forum.Muster, scope, :status}, nil) == expected ->
        :ok

      System.monotonic_time(:millisecond) >= deadline ->
        flunk("status did not reach #{inspect(expected)} in time")

      true ->
        Process.sleep(2)
        do_wait_status(scope, expected, deadline)
    end
  end

  # Poll `fun` until it returns true (or the deadline elapses).
  defp wait_until(fun, timeout \\ 1_000) do
    deadline = System.monotonic_time(:millisecond) + timeout
    do_wait_until(fun, deadline)
  end

  defp do_wait_until(fun, deadline) do
    cond do
      fun.() ->
        true

      System.monotonic_time(:millisecond) >= deadline ->
        flunk("condition not met in time")

      true ->
        Process.sleep(5)
        do_wait_until(fun, deadline)
    end
  end

  # Retry Muster.join/3 until it succeeds. Right after a coordinator crash, the
  # supervisor's :rest_for_one restarts the coordinator and then every shard,
  # one child at a time -- so the coordinator's name can already be registered
  # again while a shard is still being restarted, and a claim landing in that
  # narrow window can transiently see :scope_exit. The same window any real
  # caller must already tolerate and retry through.
  defp wait_until_join_ok(scope, group, pid, timeout \\ 2_000) do
    deadline = System.monotonic_time(:millisecond) + timeout
    do_wait_until_join_ok(scope, group, pid, deadline)
  end

  defp do_wait_until_join_ok(scope, group, pid, deadline) do
    case Muster.join(scope, group, pid) do
      :ok ->
        :ok

      error ->
        if System.monotonic_time(:millisecond) >= deadline do
          flunk("join did not succeed in time, last error: #{inspect(error)}")
        else
          Process.sleep(5)
          do_wait_until_join_ok(scope, group, pid, deadline)
        end
    end
  end

  describe "start_link/2" do
    test "starts with custom partition count", %{scope: scope, base_opts: opts} do
      pid = start_supervised!(spec(scope, opts))
      assert Process.alive?(pid)
      assert length(Forum.Supervisor.partitions(scope)) == 2
    end

    test "starts with all-default options (start_link/1)", %{scope: scope} do
      pid =
        start_supervised!(%{
          id: scope,
          start: {Muster, :start_link, [scope]},
          type: :supervisor
        })

      assert Process.alive?(pid)
      assert {:ok, n} = Muster.router(scope, :anything)
      assert n == node()
    end

    test "raises on invalid partition count", %{scope: scope} do
      assert_raise ArgumentError, ~r/expected :partitions to be a positive integer/, fn ->
        Muster.start_link(scope, partitions: 0)
      end
    end

    test "raises on invalid vacancy_cooldown_ms", %{scope: scope} do
      assert_raise ArgumentError, ~r/expected :vacancy_cooldown_ms/, fn ->
        Muster.start_link(scope, vacancy_cooldown_ms: -1)
      end
    end

    test "raises on invalid vacant_flush_interval_ms", %{scope: scope} do
      assert_raise ArgumentError, ~r/expected :vacant_flush_interval_ms/, fn ->
        Muster.start_link(scope, vacant_flush_interval_ms: 0)
      end
    end

    test "raises on invalid view_heartbeat_interval_ms", %{scope: scope} do
      assert_raise ArgumentError, ~r/expected :view_heartbeat_interval_ms/, fn ->
        Muster.start_link(scope, view_heartbeat_interval_ms: 0)
      end
    end

    test "raises on invalid singleton_promotion_timeout_ms", %{scope: scope} do
      assert_raise ArgumentError, ~r/expected :singleton_promotion_timeout_ms/, fn ->
        Muster.start_link(scope, singleton_promotion_timeout_ms: 0)
      end
    end

    test "raises on invalid rebalance_gather_timeout_ms", %{scope: scope} do
      assert_raise ArgumentError, ~r/expected :rebalance_gather_timeout_ms/, fn ->
        Muster.start_link(scope, rebalance_gather_timeout_ms: 0)
      end
    end

    test "raises on invalid shards_ready_timeout_ms", %{scope: scope} do
      assert_raise ArgumentError, ~r/expected :shards_ready_timeout_ms/, fn ->
        Muster.start_link(scope, shards_ready_timeout_ms: 0)
      end
    end

    test "raises on invalid max_restarts", %{scope: scope} do
      assert_raise ArgumentError, ~r/expected :max_restarts/, fn ->
        Muster.start_link(scope, max_restarts: -1)
      end
    end

    test "raises on invalid max_seconds", %{scope: scope} do
      assert_raise ArgumentError, ~r/expected :max_seconds/, fn ->
        Muster.start_link(scope, max_seconds: 0)
      end
    end

    test "exposes router lookup", %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      assert {:ok, n} = Muster.router(scope, :anything)
      assert n == node()
    end
  end

  describe "child_spec/1" do
    # The sanctioned supervisor-integration surface (`{Forum.Muster, scope}` or
    # `{Forum.Muster, [scope, opts]}` in a children list resolves through this),
    # as opposed to the hand-built map `spec/2` every other test in this file
    # uses to pass per-test options through to start_link.

    test "child_spec(scope) (bare atom) starts a working tree", %{scope: scope} do
      start_supervised!(Muster.child_spec(scope))
      assert {:ok, n} = Muster.router(scope, :anything)
      assert n == node()
    end

    test "child_spec([scope]) (single-element list) starts a working tree", %{scope: scope} do
      start_supervised!(Muster.child_spec([scope]))
      assert {:ok, n} = Muster.router(scope, :anything)
      assert n == node()
    end

    test "child_spec([scope, opts]) threads options through", %{scope: scope} do
      start_supervised!(Muster.child_spec([scope, [partitions: 3]]))
      assert length(Forum.Supervisor.partitions(scope)) == 3
    end
  end

  describe "router/2 and members/1" do
    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      :ok
    end

    test "returns {:ok, node()} on a single-node cluster", %{scope: scope} do
      assert {:ok, n} = Muster.router(scope, :any_group)
      assert n == node()
    end

    test "members/1 returns the sorted cluster member list", %{scope: scope} do
      assert Muster.members(scope) == [node()]
    end

    test "returns {:rebalancing, members} when the flag is set", %{scope: scope} do
      members = Enum.sort([node(), @fake_node])
      {:ok, _} = ExHashRing.Ring.set_nodes(ring_name(scope), members)
      set_rebalancing(scope, true)

      assert {:rebalancing, ^members} = Muster.router(scope, :any_group)
      assert Muster.members(scope) == members

      set_rebalancing(scope, false)
      assert {:ok, _node} = Muster.router(scope, :any_group)
    end

    test "status/1 reflects the lifecycle flag and defaults to :unknown", %{scope: scope} do
      set_rebalancing(scope, true)
      assert Muster.status(scope) == :rebalancing

      set_rebalancing(scope, false)
      assert Muster.status(scope) == :ready

      assert Muster.status(:muster_scope_never_started) == :unknown
    end
  end

  describe "remote entry points write directly to occupancy_table (no Scope mailbox)" do
    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      :ok
    end

    test "occupied/4 inserts a {group, source_node} row", %{scope: scope} do
      assert :ok = Scope.occupied(scope, :rg1, :src@nowhere, 1, fake_pid())
      assert :src@nowhere in Scope.occupancy(scope, :rg1)
    end

    test "Muster.occupancy/2 exposes the raw router-held rows", %{scope: scope} do
      assert :ok = Scope.occupied(scope, :rg_pub, :src@nowhere, 1, fake_pid())
      # Public, non-barrier-gated read; delegates to Scope.occupancy/2.
      assert Muster.occupancy(scope, :rg_pub) == Scope.occupancy(scope, :rg_pub)
      assert :src@nowhere in Muster.occupancy(scope, :rg_pub)
    end

    test "vacant_batch/4 deletes multiple {group, source_node} rows", %{scope: scope} do
      src = fake_pid()
      :ok = Scope.occupied(scope, :rg2a, :src@nowhere, 1, src)
      :ok = Scope.occupied(scope, :rg2b, :src@nowhere, 1, src)
      assert :src@nowhere in Scope.occupancy(scope, :rg2a)
      assert :src@nowhere in Scope.occupancy(scope, :rg2b)

      assert :ok = Scope.vacant_batch(scope, [:rg2a, :rg2b], :src@nowhere, 2, src)
      refute :src@nowhere in Scope.occupancy(scope, :rg2a)
      refute :src@nowhere in Scope.occupancy(scope, :rg2b)
    end

    test "vacant_batch/4 only deletes rows for the given source", %{scope: scope} do
      src_a = fake_pid()
      src_b = fake_pid()
      :ok = Scope.occupied(scope, :rg3, :src_a@nowhere, 1, src_a)
      :ok = Scope.occupied(scope, :rg3, :src_b@nowhere, 1, src_b)

      assert :ok = Scope.vacant_batch(scope, [:rg3], :src_a@nowhere, 2, src_a)
      assert Scope.occupancy(scope, :rg3) == [:src_b@nowhere]
    end

    test "vacant_batch/4 with a stale (lower) seq does NOT delete a newer occupied",
         %{scope: scope} do
      src = fake_pid()
      # The core of the timeout race: a re-claim wrote a fresh, higher-seq
      # occupied; a stale vacant DELETE (lower seq) arrives late and must be
      # ignored so it cannot clobber the live entry.
      :ok = Scope.occupied(scope, :race_g, :src@nowhere, 10, src)
      assert :ok = Scope.vacant_batch(scope, [:race_g], :src@nowhere, 5, src)
      assert :src@nowhere in Scope.occupancy(scope, :race_g)

      # A vacant at or above the stored seq still deletes (the real vacancy).
      assert :ok = Scope.vacant_batch(scope, [:race_g], :src@nowhere, 10, src)
      refute :src@nowhere in Scope.occupancy(scope, :race_g)
    end

    test "a stale (lower) seq occupied INSERT does NOT resurrect a fresh vacant DELETE",
         %{scope: scope} do
      src = fake_pid()
      # The reverse of the race above. A fresh, higher-seq vacant DELETE leaves a
      # seq-stamped tombstone; a stale, lower-seq occupied INSERT that lands after
      # it (an orphaned, un-cancelled :occupied RPC) must be a no-op -- the
      # tombstone's seq guards the INSERT, so the vacated group is not resurrected.
      :ok = Scope.occupied(scope, :rev_g, :src@nowhere, 5, src)
      assert :ok = Scope.vacant_batch(scope, [:rev_g], :src@nowhere, 10, src)
      refute :src@nowhere in Scope.occupancy(scope, :rev_g)

      # Stale INSERT (seq 7 < tombstone seq 10) must not bring it back.
      assert :ok = Scope.occupied(scope, :rev_g, :src@nowhere, 7, src)
      refute :src@nowhere in Scope.occupancy(scope, :rev_g)

      # A genuine re-claim (seq above the tombstone) DOES win.
      assert :ok = Scope.occupied(scope, :rev_g, :src@nowhere, 11, src)
      assert :src@nowhere in Scope.occupancy(scope, :rev_g)
    end

    test "receive_node_state/5 replaces all rows for a source", %{scope: scope} do
      src = fake_pid()
      # Seed something the snapshot should clear.
      :ok = Scope.occupied(scope, :stale_g, :src@nowhere, 1, src)

      # receive_node_state applies the snapshot via a synchronous call into
      # Scope (it serializes the apply to keep overlapping rebalances safe), so
      # the occupancy table reflects it by the time this returns.
      assert :ok =
               Scope.receive_node_state(scope, :src@nowhere, [:fresh_a, :fresh_b], 0, 2, src)

      refute :src@nowhere in Scope.occupancy(scope, :stale_g)
      assert :src@nowhere in Scope.occupancy(scope, :fresh_a)
      assert :src@nowhere in Scope.occupancy(scope, :fresh_b)
    end

    test "apply_delta/5 ADDS rows without wiping the existing baseline (add-only)",
         %{scope: scope} do
      src = fake_pid()
      # A prior full snapshot established the previous generation's rows -- the
      # baseline a later delta relies on. (In the field this is the round the
      # gaining router acked before it became eligible for a delta.)
      assert :ok = Scope.receive_node_state(scope, :src@nowhere, [:base_a, :base_b], 0, 2, src)
      assert :src@nowhere in Scope.occupancy(scope, :base_a)
      assert :src@nowhere in Scope.occupancy(scope, :base_b)

      # A DELTA carries ONLY a newly-moved group. Unlike receive_node_state it
      # must NOT wipe: the moved-in group is added and every baseline row survives.
      # This add-onto-baseline is exactly the property that makes it safe to send
      # a delta of only the moved groups: the receiver already holds the rest.
      assert :ok = Scope.apply_delta(scope, :src@nowhere, [:moved_c], 0, 3, src)

      assert :src@nowhere in Scope.occupancy(scope, :moved_c)
      assert :src@nowhere in Scope.occupancy(scope, :base_a)
      assert :src@nowhere in Scope.occupancy(scope, :base_b)
    end

    test "apply_delta/5 with a stale (not-newer) round is dropped WHOLESALE",
         %{scope: scope} do
      src = fake_pid()
      # A prior round from this source advanced the per-source watermark
      # (applied_snapshot_seq) to seq 5.
      assert :ok = Scope.receive_node_state(scope, :src@nowhere, [:kept], 0, 5, src)
      assert :src@nowhere in Scope.occupancy(scope, :kept)

      # A reordered, stale DELTA (seq 5, NOT strictly greater than the watermark)
      # is dropped ENTIRELY -- even though :late has no row, so its per-row seq
      # guard alone would admit it. The wholesale per-source guard is what stops a
      # stale round from adding groups a newer round already superseded.
      assert :ok = Scope.apply_delta(scope, :src@nowhere, [:late], 0, 5, src)
      refute :src@nowhere in Scope.occupancy(scope, :late)

      # A genuinely newer DELTA (seq above the watermark) is applied.
      assert :ok = Scope.apply_delta(scope, :src@nowhere, [:fresh], 0, 6, src)
      assert :src@nowhere in Scope.occupancy(scope, :fresh)
    end

    test "writes from different sources don't interfere", %{scope: scope} do
      src_a = fake_pid()
      src_b = fake_pid()
      :ok = Scope.occupied(scope, :shared, :src_a@nowhere, 1, src_a)
      :ok = Scope.occupied(scope, :shared, :src_b@nowhere, 1, src_b)

      assert Enum.sort(Scope.occupancy(scope, :shared)) ==
               [:src_a@nowhere, :src_b@nowhere]

      :ok = Scope.vacant_batch(scope, [:shared], :src_a@nowhere, 2, src_a)
      assert Scope.occupancy(scope, :shared) == [:src_b@nowhere]
    end

    test "Scope mailbox is unaffected by remote-entry writes", %{scope: scope} do
      # If the writes still went through the mailbox, a held :status call
      # would queue behind them. Issue many writes concurrently, then assert
      # :status responds promptly.
      src = fake_pid()

      tasks =
        for i <- 1..200 do
          Task.async(fn -> Scope.occupied(scope, :"hot_#{i}", :src@nowhere, 1, src) end)
        end

      Task.await_many(tasks, 5_000)

      t0 = System.monotonic_time(:millisecond)
      reply = GenServer.call(Forum.Supervisor.name(scope), :status, 500)
      t1 = System.monotonic_time(:millisecond)

      assert is_map(reply)
      # Mailbox processing should be near-instant since writes never queued.
      assert t1 - t0 < 100
    end
  end

  describe "vacancy tombstone GC" do
    @describetag tombstone_window_ms: 200

    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      :ok
    end

    # A tombstone is retained for the window (so a late, lower-seq INSERT still
    # loses to it), then reaped by the periodic sweep so it does not leak. We read
    # the raw row -- occupancy/2 reports a tombstone as absent either way, so it
    # cannot distinguish "still tombstoned" from "reaped".
    test "a tombstone is retained for the window then reaped", %{scope: scope} do
      table = Scope.occupancy_table_name(scope)
      key = {:gc_g, :src@nowhere}
      src = fake_pid()

      # Make the source a cluster member. reap_departed_sources/1 rides the same
      # :sweep_tombstones tick and deletes rows whose source is both outside the
      # view and disconnected -- which a bare :src@nowhere is -- so without this
      # the sweeps below would reap the row outright and the test would no longer
      # be measuring the tombstone window at all.
      inject_fake_remote(scope, :src@nowhere)

      :ok = Scope.occupied(scope, :gc_g, :src@nowhere, 1, src)
      assert :ok = Scope.vacant_batch(scope, [:gc_g], :src@nowhere, 2, src)

      # Tombstone present immediately after the vacancy (meta is the created_at ms).
      assert [{^key, 2, created_at, _writer}] = :ets.lookup(table, key)
      assert is_integer(created_at)

      # A sweep before the window elapses must NOT reap it (and a stale, lower-seq
      # INSERT still loses to it).
      Kernel.send(Forum.Supervisor.name(scope), :sweep_tombstones)
      assert :ok = Scope.occupied(scope, :gc_g, :src@nowhere, 1, src)
      refute :src@nowhere in Scope.occupancy(scope, :gc_g)
      assert [{^key, _, _, _writer}] = :ets.lookup(table, key)

      # After the window, the sweep reaps it.
      Process.sleep(500)
      Kernel.send(Forum.Supervisor.name(scope), :sweep_tombstones)

      wait_until(fn -> :ets.lookup(table, key) == [] end)
    end
  end

  describe "single-node join/leave (router == self)" do
    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      :ok
    end

    test "join registers locally and updates occupancy table", %{scope: scope} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, :g1, pid)
      assert Muster.local_member?(scope, :g1, pid)
      assert Muster.local_member_count(scope, :g1) == 1
      assert Muster.local_members(scope, :g1) == [pid]
      assert node() in Scope.occupancy(scope, :g1)
    end

    test "join does not fire RPC when router is self", %{scope: scope} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      _ = drain_calls()
      assert :ok = Muster.join(scope, :g1, pid)

      assert drain_calls() == []
    end

    test "subsequent joins skip Scope entirely", %{scope: scope} do
      pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, :g1, pid1)
      assert :ok = Muster.join(scope, :g1, pid2)
      assert Muster.local_member_count(scope, :g1) == 2
    end

    test "leave + cooldown then re-join is silent", %{scope: scope} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, :g1, pid)
      assert :ok = Muster.leave(scope, :g1, pid)
      # Wait past cooldown
      Process.sleep(120)
      assert :ok = Muster.join(scope, :g1, pid)
      assert Muster.local_member_count(scope, :g1) == 1
    end

    test "accepts a local pid (contrast: a genuinely remote pid is rejected, see " <>
           "muster_distributed_test.exs's \"join/3 rejects a genuinely remote pid\")",
         %{scope: scope} do
      # A locally-spawned pid can't masquerade as a remote one (node/1 always
      # resolves to us here), so the :not_local guard itself needs a real
      # second node; that case lives in the distributed suite.
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, :g1, pid)
    end

    test "cold join of an already-dead pid self-heals (no orphan occupancy)",
         %{scope: scope} do
      pid = spawn(fn -> :ok end)
      ref = Process.monitor(pid)
      assert_receive {:DOWN, ^ref, :process, ^pid, _}, 1_000

      # Scope registers the (already-dead) pid as part of the claim, so its
      # monitor fires and drives retraction -- the router is never left occupied
      # with no live local member.
      assert :ok = Muster.join(scope, :g1, pid)

      # Monitor-driven vacancy moves the group out of :occupied, and the
      # occupancy row is eventually dropped -- no permanent orphan.
      wait_for_group_state(scope, :g1, :vacant_queued)
      assert Muster.local_member_count(scope, :g1) == 0

      trigger_flush(scope)
      wait_for_group_state(scope, :g1, nil)
      refute node() in Scope.occupancy(scope, :g1)
    end
  end

  describe "dump/1" do
    @describetag cooldown_ms: 60_000

    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      :ok
    end

    # dump/1 is an IEx-only introspection helper with no other caller, so
    # nothing else in the suite exercises format_dump/1 or
    # group_state_label/1; a rename of a State field they interpolate (e.g.
    # `s.ring_nodes`) would only be caught by actually calling this. Drives it
    # through an empty scope (the "(none)" / "(empty)" branches) and one with
    # both an :occupied and a :cooldown group (the populated branches and two
    # of the group_state_label/1 clauses).
    test "prints a snapshot without crashing, empty and populated", %{scope: scope} do
      empty_output = ExUnit.CaptureIO.capture_io(fn -> assert :ok = Muster.dump(scope) end)
      assert empty_output =~ "Muster #{inspect(scope)}"
      assert empty_output =~ "(none)"
      assert empty_output =~ "(empty)"

      occupied_pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, :dump_occupied, occupied_pid)

      cooldown_pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, :dump_cooldown, cooldown_pid)
      assert :ok = Muster.leave(scope, :dump_cooldown, cooldown_pid)
      assert :cooldown = wait_for_group_state(scope, :dump_cooldown, :cooldown)

      populated_output = ExUnit.CaptureIO.capture_io(fn -> assert :ok = Muster.dump(scope) end)
      assert populated_output =~ ":occupied (1): [:dump_occupied]"
      assert populated_output =~ ":cooldown (1): [:dump_cooldown]"
      assert populated_output =~ "dump_occupied"
      assert populated_output =~ inspect(node())
    end
  end

  describe "summary/1" do
    @describetag cooldown_ms: 60_000

    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      :ok
    end

    test "returns cheap counts (no per-shard gather, no occupancy copy)", %{scope: scope} do
      # Empty scope: everything zero, one process hop only.
      summary = Muster.summary(scope)
      assert summary.scope == scope
      assert summary.members == [node()]
      assert summary.peers == 0
      assert summary.owed_snapshots == 0
      assert summary.occupancy_row_count == 0
      assert summary.group_state_counts.total == 0
      assert summary.group_state_counts.occupied == 0

      # One occupied group (self router -> writes an occupancy row).
      occupied_pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, :s_occupied, occupied_pid)

      # One cooldown group: it kept its claim (and its occupancy row) while cooling.
      cooldown_pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, :s_cooldown, cooldown_pid)
      assert :ok = Muster.leave(scope, :s_cooldown, cooldown_pid)
      assert :cooldown = wait_for_group_state(scope, :s_cooldown, :cooldown)

      summary = Muster.summary(scope)
      assert summary.group_state_counts.occupied == 1
      assert summary.group_state_counts.cooldown == 1
      assert summary.group_state_counts.total == 2
      # Both self-routed groups still hold a present occupancy row, attributed to
      # this node as the source.
      assert summary.occupancy_row_count == 2
      assert summary.occupancy_rows_by_node == %{node() => 2}
      assert summary.status in [:ready, :converging]
    end
  end

  describe "Scope.occupancy_row_count/1 and Scope.occupancy_rows_by_node/1" do
    # These back summary/1 but are exercised directly here for the edge cases the
    # happy-path summary test cannot reach: tombstone exclusion, per-source
    # bucketing, and a source that is no longer a ring member (its present rows
    # count toward the total but not toward any per-node bucket).
    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      # Ring becomes [node(), @fake_node]; occupancy_rows_by_node only buckets
      # over these two.
      inject_fake_remote(scope)
      :ok
    end

    test "counts present rows, buckets by source, and excludes tombstones", %{scope: scope} do
      src = fake_pid()

      # Two present rows from a ring member, one from a node that is NOT in the
      # ring (a stale source whose rebalance has not landed / that has left).
      :ok = Scope.occupied(scope, :a, @fake_node, 1, src)
      :ok = Scope.occupied(scope, :b, @fake_node, 1, src)
      :ok = Scope.occupied(scope, :c, :src@nowhere, 1, src)

      # Every present row is counted, regardless of whether its source is still
      # a ring member.
      assert Scope.occupancy_row_count(scope) == 3

      # Per-node buckets cover only the ring's members. node() holds none; the
      # off-ring :src@nowhere row is invisible here, so the per-node sum (2)
      # trails occupancy_row_count (3) exactly by that orphaned row -- the
      # behavior summary/1's docstring calls out.
      by_node = Scope.occupancy_rows_by_node(scope)
      assert by_node == %{node() => 0, @fake_node => 2}
      assert by_node |> Map.values() |> Enum.sum() == 2

      # Vacating leaves a tombstone (a non-:present row). It must not be counted
      # by either function.
      :ok = Scope.vacant_batch(scope, [:b], @fake_node, 2, src)
      assert Scope.occupancy_row_count(scope) == 2
      assert Scope.occupancy_rows_by_node(scope) == %{node() => 0, @fake_node => 1}
    end
  end

  describe "Scope.group_state_counts/1" do
    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      :ok
    end

    @tag cooldown_ms: 60_000
    test "an empty scope is all-zero with a zero total", %{scope: scope} do
      counts = Scope.group_state_counts(scope)

      assert counts == %{
               occupied: 0,
               cooldown: 0,
               vacant_queued: 0,
               vacant_flushing: 0,
               occupied_pending: 0,
               total: 0
             }
    end

    @tag cooldown_ms: 60_000
    test "counts :occupied and :cooldown groups; total is the sum of the parts",
         %{scope: scope} do
      occupied_pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, :gsc_occupied, occupied_pid)

      # Long cooldown keeps this group in :cooldown after the leave.
      cooldown_pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, :gsc_cooldown, cooldown_pid)
      assert :ok = Muster.leave(scope, :gsc_cooldown, cooldown_pid)
      assert :cooldown = wait_for_group_state(scope, :gsc_cooldown, :cooldown)

      counts = Scope.group_state_counts(scope)
      assert counts.occupied == 1
      assert counts.cooldown == 1
      assert counts.vacant_queued == 0
      assert counts.vacant_flushing == 0
      assert counts.occupied_pending == 0
      assert counts.total == 2

      # The documented invariant: total is exactly the sum of the labelled parts.
      labelled = Map.delete(counts, :total)
      assert counts.total == labelled |> Map.values() |> Enum.sum()
    end

    @tag cooldown_ms: 50
    test "counts :vacant_queued groups (past cooldown, not yet flushed)", %{scope: scope} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, :gsc_vacant, pid)
      assert :ok = Muster.leave(scope, :gsc_vacant, pid)

      # Short cooldown: the group moves cooldown -> vacant_queued, and the long
      # default flush interval leaves it parked there.
      assert :vacant_queued = wait_for_group_state(scope, :gsc_vacant, :vacant_queued)

      counts = Scope.group_state_counts(scope)
      assert counts.vacant_queued == 1
      assert counts.total == 1
      assert counts.occupied == 0
      assert counts.cooldown == 0
    end

    # The `:occupied_pending` state is stored as a `{:occupied_pending, waiters}`
    # tuple, counted by a distinct match spec from the bare-atom labels; this is
    # the only test that exercises that branch.
    @tag rpc_timeout: 5_000
    test "counts :occupied_pending groups (claim RPC in flight)", %{scope: scope} do
      inject_fake_remote(scope)
      g = group_for_router(scope, @fake_node)

      # Hold the :occupied RPC so the claim stays in flight and the group parks
      # in :occupied_pending.
      stub_call(
        {:fn,
         fn ->
           Process.sleep(2_000)
           :ok
         end}
      )

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      join = Task.async(fn -> Muster.join(scope, g, pid) end)

      assert {:occupied_pending, [_]} =
               wait_for_group_state(scope, g, &match?({:occupied_pending, [_]}, &1))

      counts = Scope.group_state_counts(scope)
      assert counts.occupied_pending == 1
      assert counts.total == 1
      assert counts.occupied == 0

      assert :ok = Task.await(join, 5_000)
    end
  end

  describe "router == remote (fake node injection)" do
    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      inject_fake_remote(scope)

      %{
        remote_group: group_for_router(scope, @fake_node),
        self_group: group_for_router(scope, node())
      }
    end

    test "first join dispatches a single occupied RPC and waits for reply",
         %{scope: scope, remote_group: g} do
      _ = drain_calls()

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)

      assert [[^scope, @fake_node, Scope, :occupied, [^scope, ^g, _, _ | _], _]] = drain_calls()

      assert Muster.local_member_count(scope, g) == 1
    end

    test "second join (count > 0) skips the RPC", %{scope: scope, remote_group: g} do
      pid1 = spawn_link(fn -> Process.sleep(:infinity) end)
      pid2 = spawn_link(fn -> Process.sleep(:infinity) end)

      assert :ok = Muster.join(scope, g, pid1)
      _ = drain_calls()

      assert :ok = Muster.join(scope, g, pid2)

      assert drain_calls() == []
    end

    @tag rpc_timeout: 5_000
    test "concurrent joins dedup to a single RPC", %{scope: scope, remote_group: g} do
      _ = drain_calls()
      test_pid = self()
      hold_ms = 200

      stub_call(
        {:fn,
         fn ->
           Kernel.send(test_pid, :rpc_started)
           Process.sleep(hold_ms)
           :ok
         end}
      )

      callers =
        for _ <- 1..50 do
          Task.async(fn ->
            pid = spawn_link(fn -> Process.sleep(:infinity) end)
            Muster.join(scope, g, pid)
          end)
        end

      assert_receive :rpc_started, 1_000

      results = Enum.map(callers, &Task.await(&1, 5_000))
      assert Enum.all?(results, &(&1 == :ok))

      call_count =
        Enum.count(
          drain_calls(),
          &match?([^scope, _, Scope, :occupied, [^scope, ^g, _, _ | _], _], &1)
        )

      assert call_count == 1
    end

    test "RPC failure returns :rpc_failed and does not insert into partition",
         %{scope: scope, remote_group: g} do
      stub_call({:error, :noconnection})

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert {:error, :rpc_failed} = Muster.join(scope, g, pid)
      assert Muster.local_member_count(scope, g) == 0
      refute Muster.local_member?(scope, g, pid)
    end

    test "next join retries the RPC after a previous failure",
         %{scope: scope, remote_group: g} do
      stub_call({:error, :noconnection})
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert {:error, :rpc_failed} = Muster.join(scope, g, pid)

      _ = drain_calls()

      stub_call(:ok)
      assert :ok = Muster.join(scope, g, pid)

      assert [[^scope, @fake_node, Scope, :occupied, [^scope, ^g, _, _ | _], _]] = drain_calls()

      assert Muster.local_member_count(scope, g) == 1
    end

    @tag rpc_timeout: 5_000
    test "member is registered only after the occupied RPC confirms",
         %{scope: scope, remote_group: g} do
      test_pid = self()
      hold_ms = 150

      stub_call(
        {:fn,
         fn ->
           Kernel.send(test_pid, :rpc_started)
           Process.sleep(hold_ms)
           :ok
         end}
      )

      member = spawn_link(fn -> Process.sleep(:infinity) end)
      task = Task.async(fn -> Muster.join(scope, g, member) end)

      assert_receive :rpc_started, 1_000
      # The claim RPC is still in flight. Scope registers only after it confirms
      # (register-after-success), so the member is not local yet.
      refute Muster.local_member?(scope, g, member)

      assert :ok = Task.await(task, 5_000)
      assert Muster.local_member?(scope, g, member)
      assert Muster.local_member_count(scope, g) == 1
    end

    test "cold join of an already-dead pid registers via Scope and self-heals",
         %{scope: scope, remote_group: g} do
      pid = spawn(fn -> :ok end)
      ref = Process.monitor(pid)
      assert_receive {:DOWN, ^ref, :process, ^pid, _}, 1_000

      # The claim RPC succeeds and Scope registers the (dead) pid; its monitor
      # then fires, so the group is retracted rather than left orphaned at the
      # router with no live member.
      assert :ok = Muster.join(scope, g, pid)
      assert_call(&match?([^scope, @fake_node, Scope, :occupied, [^scope, ^g, _, _ | _], _], &1))

      wait_for_group_state(scope, g, fn s -> s in [:cooldown, :vacant_queued] end)
      assert Muster.local_member_count(scope, g) == 0
    end

    @tag rpc_timeout: 5_000
    test "Scope mailbox is not blocked by a slow RPC",
         %{scope: scope, remote_group: g} do
      test_pid = self()

      stub_call(
        {:fn,
         fn ->
           Kernel.send(test_pid, :rpc_started)
           Process.sleep(500)
           :ok
         end}
      )

      pid = spawn_link(fn -> Process.sleep(:infinity) end)

      slow_join =
        Task.async(fn -> Muster.join(scope, g, pid) end)

      assert_receive :rpc_started, 1_000

      # While the slow RPC is in flight, ask Scope for status -- should reply quickly.
      scope_name = Forum.Supervisor.name(scope)

      t0 = System.monotonic_time(:millisecond)
      reply = GenServer.call(scope_name, :status, 500)
      t1 = System.monotonic_time(:millisecond)

      assert is_map(reply)
      assert t1 - t0 < 200

      assert :ok = Task.await(slow_join, 5_000)
    end
  end

  describe "vacancy cooldown" do
    @describetag cooldown_ms: 100

    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      inject_fake_remote(scope)

      %{remote_group: group_for_router(scope, @fake_node)}
    end

    test "leave + re-join within cooldown does not fire RPC",
         %{scope: scope, remote_group: g} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)

      assert :ok = Muster.join(scope, g, pid)
      _ = drain_calls()

      assert :ok = Muster.leave(scope, g, pid)
      # Wait briefly to let telemetry → scope cast settle, then re-join.
      Process.sleep(20)
      assert :ok = Muster.join(scope, g, pid)

      assert drain_calls() == []
    end

    test "leave then wait past cooldown queues a vacancy, flushed as a batch RPC",
         %{scope: scope, remote_group: g} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)

      assert :ok = Muster.join(scope, g, pid)
      _ = drain_calls()
      assert :ok = Muster.leave(scope, g, pid)

      # After cooldown the group is queued -- no RPC has been sent yet.
      assert :vacant_queued = wait_for_group_state(scope, g, :vacant_queued)

      # The flush sends one batched vacant RPC to the router.
      trigger_flush(scope)

      [^scope, @fake_node, Scope, :vacant_batch, [^scope, groups, src, _ | _], _] =
        assert_call(fn
          [^scope, @fake_node, Scope, :vacant_batch, [^scope, _, _, _ | _], _] -> true
          _ -> false
        end)

      assert g in groups
      assert src == node()
    end

    test "a failed vacant batch re-queues the group for the next flush",
         %{scope: scope, remote_group: g} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)
      assert :ok = Muster.leave(scope, g, pid)
      assert :vacant_queued = wait_for_group_state(scope, g, :vacant_queued)

      # Fail the batch: the group must return to :vacant_queued (the retry).
      stub_call({:error, :noconnection})
      _ = drain_calls()
      trigger_flush(scope)

      assert_call(fn
        [^scope, @fake_node, Scope, :vacant_batch, [^scope, _, _, _ | _], _] -> true
        _ -> false
      end)

      assert :vacant_queued = wait_for_group_state(scope, g, :vacant_queued)

      # Now let it succeed: the group is dropped from the state machine.
      stub_call(:ok)
      _ = drain_calls()
      trigger_flush(scope)

      assert_call(fn
        [^scope, @fake_node, Scope, :vacant_batch, [^scope, _, _, _ | _], _] -> true
        _ -> false
      end)

      assert nil == wait_for_group_state(scope, g, &is_nil/1)
    end

    test "vacancies to the same router flush in per-shard batches", %{scope: scope} do
      [g1, g2] = groups_for_router(scope, @fake_node, 2)

      p1 = spawn_link(fn -> Process.sleep(:infinity) end)
      p2 = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g1, p1)
      assert :ok = Muster.join(scope, g2, p2)
      assert :ok = Muster.leave(scope, g1, p1)
      assert :ok = Muster.leave(scope, g2, p2)

      assert :vacant_queued = wait_for_group_state(scope, g1, :vacant_queued)
      assert :vacant_queued = wait_for_group_state(scope, g2, :vacant_queued)

      _ = drain_calls()
      trigger_flush(scope)
      Process.sleep(100)

      batches =
        drain_calls()
        |> Enum.filter(&match?([^scope, @fake_node, Scope, :vacant_batch, _, _], &1))

      flushed = Enum.flat_map(batches, fn [_, _, _, _, [_, groups, _, _ | _], _] -> groups end)

      # Both vacancies reach the router. Each shard that holds queued vacancies
      # sends ONE batch per router, so the count is bounded by the shard count
      # (not one RPC per group): g1 and g2 share a batch if they hash to the same
      # shard, else one batch each.
      assert g1 in flushed
      assert g2 in flushed
      assert length(batches) <= length(Forum.Supervisor.shards(scope))
    end
  end

  describe "rebalance × in-flight claim/cooldown races" do
    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      :ok
    end

    defp trigger_rebalance(scope, new_members) do
      Kernel.send(Forum.Supervisor.name(scope), {:__rebalance_for_test, new_members})
    end

    # Probe a probe-ring built from `members` to find a group whose router
    # would land on `target_node`. We can't query Muster's own ring here yet
    # because the rebalance has not run -- we need a group that will move *to*
    # the fake node once it does.
    defp group_for_router_under(members, target_node) do
      probe = :"_probe_#{System.unique_integer([:positive])}_muster_ring"
      {:ok, _} = ExHashRing.Ring.start_link(name: probe, replicas: 128)
      {:ok, _} = ExHashRing.Ring.set_nodes(probe, members)

      group =
        Stream.iterate(0, &(&1 + 1))
        |> Stream.map(&:"g#{&1}")
        |> Enum.find(fn g ->
          {:ok, n} = ExHashRing.Ring.find_node(probe, g)
          n == target_node
        end)

      ExHashRing.Ring.stop(probe)
      group
    end

    test "rebalance announces :occupied groups to the new router", %{scope: scope} do
      # Pick a group that will land on @fake_node once it joins the cluster.
      g = group_for_router_under([node(), @fake_node], @fake_node)

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)

      _ = drain_calls()
      trigger_rebalance(scope, [node(), @fake_node])

      [^scope, target, Scope, :receive_node_state, [^scope, src, groups | _], _] =
        assert_call(
          fn
            [^scope, _, Scope, :receive_node_state, [^scope, _, _ | _], _] -> true
            _ -> false
          end,
          500
        )

      assert target == @fake_node
      assert src == node()
      assert g in groups
    end

    test "rebalance announces :cooldown groups to the new router", %{scope: scope} do
      g = group_for_router_under([node(), @fake_node], @fake_node)

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)
      assert :ok = Muster.leave(scope, g, pid)

      # Let the telemetry → Scope cast settle so group_states[g] == :cooldown.
      Process.sleep(20)
      _ = drain_calls()

      trigger_rebalance(scope, [node(), @fake_node])

      [^scope, @fake_node, Scope, :receive_node_state, [^scope, _src, groups | _], _] =
        assert_call(
          fn
            [^scope, @fake_node, Scope, :receive_node_state, [^scope, _, _ | _], _] -> true
            _ -> false
          end,
          500
        )

      assert g in groups
    end

    test ":vacant_queued groups are NOT announced on rebalance", %{scope: scope} do
      inject_fake_remote(scope)
      g = group_for_router(scope, @fake_node)

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)
      assert :ok = Muster.leave(scope, g, pid)

      # After cooldown the group sits in :vacant_queued (the flush interval is
      # long; we never flush it here). We don't hold the group, so it must not
      # be announced via :receive_node_state.
      assert :vacant_queued = wait_for_group_state(scope, g, :vacant_queued)
      _ = drain_calls()

      trigger_rebalance(scope, [node(), :fake2@nowhere])

      Process.sleep(100)
      refute announced?(drain_calls(), g)
    end

    test ":vacant_flushing groups are NOT announced on rebalance", %{scope: scope} do
      inject_fake_remote(scope)
      g = group_for_router(scope, @fake_node)

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)
      assert :ok = Muster.leave(scope, g, pid)
      assert :vacant_queued = wait_for_group_state(scope, g, :vacant_queued)

      # Hold the batch RPC so the group stays :vacant_flushing across the
      # rebalance. (g is the only group and is excluded from the announce-set,
      # so the rebalance itself issues no :receive_node_state calls -- the held
      # response only stalls the vacant batch worker.)
      stub_call(
        {:fn,
         fn ->
           Process.sleep(2_000)
           :ok
         end}
      )

      trigger_flush(scope)

      assert :vacant_flushing = wait_for_group_state(scope, g, :vacant_flushing)

      _ = drain_calls()

      trigger_rebalance(scope, [node(), :fake2@nowhere])

      Process.sleep(100)
      refute announced?(drain_calls(), g)

      # The in-flight batch was normalized back to :vacant_queued for a later flush.
      assert :vacant_queued = wait_for_group_state(scope, g, :vacant_queued)
    end

    test "rebalance start log reports the membership delta, not the full sets",
         %{scope: scope} do
      # Growth: [node()] -> [node(), fake]. The log leads with signed counts and
      # names only the added node -- never dumps the whole member set.
      growth =
        capture_log(fn ->
          trigger_rebalance(scope, [node(), @fake_node])
          Process.sleep(50)
        end)

      assert growth =~ "rebalance start: 2 members (was 1), +1: added [:#{@fake_node}]"
      # The old format dumped both full member sets inline; the delta must not.
      refute growth =~ "rebalance start: members ["

      # Mixed: [node(), fake] -> [node(), fake2]. One in, one out in a single
      # transition -- both sides show up in the delta.
      mixed =
        capture_log(fn ->
          trigger_rebalance(scope, [node(), :fake2@nowhere])
          Process.sleep(50)
        end)

      assert mixed =~ "rebalance start: 2 members (was 2), +1/-1:"
      assert mixed =~ "added [:fake2@nowhere]"
      assert mixed =~ "removed [:#{@fake_node}]"
    end

    # A re-join arriving while a vacant batch is in flight must NOT park behind
    # the batch: it re-claims immediately by dispatching :occupied. That
    # :occupied is dispatched after the batch, so it carries a higher seq and the
    # router's guard makes its INSERT win over the in-flight (lower-seq) DELETE
    # regardless of arrival order. Because the group moves straight to
    # :occupied_pending with a worker in flight, it can never wedge across a
    # rebalance (an earlier design parked the caller in :vacant_flushing and
    # could leave it with no worker to settle it when the router didn't move).
    test "re-join during an in-flight vacant flush re-claims immediately",
         %{scope: scope} do
      inject_fake_remote(scope)
      members_3 = [node(), @fake_node, :third@nowhere]

      # Router stays @fake_node across the rebalance -- the formerly-wedging path.
      g = find_group_flipping_router([node(), @fake_node], @fake_node, members_3, @fake_node)

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)
      assert :ok = Muster.leave(scope, g, pid)
      assert :vacant_queued = wait_for_group_state(scope, g, :vacant_queued)

      # Hold every RPC so the vacant batch is still in flight when we re-join and
      # the re-claim's :occupied is still in flight across the rebalance.
      stub_call(
        {:fn,
         fn ->
           Process.sleep(2_000)
           :ok
         end}
      )

      trigger_flush(scope)
      assert :vacant_flushing = wait_for_group_state(scope, g, :vacant_flushing)
      _ = drain_calls()

      # Re-join while the batch is in flight → straight to :occupied_pending
      # (not parked in :vacant_flushing).
      rejoin =
        Task.async(fn ->
          Muster.join(scope, g, spawn_link(fn -> Process.sleep(:infinity) end))
        end)

      assert {:occupied_pending, [_]} =
               wait_for_group_state(scope, g, &match?({:occupied_pending, [_]}, &1))

      # The :occupied was dispatched immediately to the (current) router.
      assert {:ok, _} =
               wait_call(
                 fn
                   [_s, @fake_node, Scope, :occupied, [_, ^g, _, _ | _], _] -> true
                   _ -> false
                 end,
                 3_000
               )

      # Rebalance with the router unchanged: :occupied_pending is left for the
      # in-flight :occupied worker to settle (the formerly-wedging case).
      trigger_rebalance(scope, members_3)

      assert :ok = Task.await(rejoin, 10_000)
      assert :occupied = wait_for_group_state(scope, g, :occupied, 5_000)
    end

    # rpc_timeout sets the inner Task.await bound during parallel rebalance
    # (`rpc_timeout + 1s`). The held RPC below sleeps 2_000ms, so we need
    # rpc_timeout large enough that the await window covers it.
    @tag rpc_timeout: 5_000
    test ":occupied_pending claims survive rebalance (caller gets :ok)",
         %{scope: scope} do
      inject_fake_remote(scope)

      # Pick a group whose router under the 2-node ring is @fake_node
      # (so the initial :occupied RPC dispatches to @fake_node) AND whose
      # router under the 3-node ring is :third@nowhere (so the rebalance
      # announces it to the new router and settles the parked waiter).
      members_3 = [node(), @fake_node, :third@nowhere]

      g =
        find_group_flipping_router(
          [node(), @fake_node],
          @fake_node,
          members_3,
          :third@nowhere
        )

      hold = self()
      ref = make_ref()

      # Hold the initial :occupied RPC indefinitely. The rebalance fires
      # while we're stuck and should settle the waiter via
      # :receive_node_state to :third@nowhere.
      stub_call(
        {:fn,
         fn ->
           Kernel.send(hold, {:rpc_held, ref})
           Process.sleep(2_000)
           :ok
         end}
      )

      task =
        Task.async(fn ->
          Muster.join(scope, g, spawn_link(fn -> Process.sleep(:infinity) end))
        end)

      assert_receive {:rpc_held, ^ref}, 1_000

      # Rebalance: switch to a 3-node ring. The router of `g` flips to
      # :third@nowhere; rebalance announces `g` via :receive_node_state and
      # settles the pending waiter with :ok.
      trigger_rebalance(scope, members_3)

      # Waiter gets :ok from the settle step (not :rebalance_in_progress).
      assert :ok = Task.await(task, 5_000)

      # The new router must have received :receive_node_state with g.
      received_announce =
        received_announce_for?(:third@nowhere, g, 1_000)

      assert received_announce,
             "expected :receive_node_state to :third@nowhere with #{inspect(g)}"
    end

    defp find_group_flipping_router(members_old, old_dest, members_new, new_dest) do
      uid = System.unique_integer([:positive])
      old_probe = :"_probe_old_#{uid}_muster_ring"
      new_probe = :"_probe_new_#{uid}_muster_ring"
      {:ok, _} = ExHashRing.Ring.start_link(name: old_probe, replicas: 128)
      {:ok, _} = ExHashRing.Ring.set_nodes(old_probe, members_old)
      {:ok, _} = ExHashRing.Ring.start_link(name: new_probe, replicas: 128)
      {:ok, _} = ExHashRing.Ring.set_nodes(new_probe, members_new)

      result =
        Stream.iterate(0, &(&1 + 1))
        |> Stream.map(&:"flip#{&1}")
        |> Enum.find(fn g ->
          with {:ok, ^old_dest} <- ExHashRing.Ring.find_node(old_probe, g),
               {:ok, ^new_dest} <- ExHashRing.Ring.find_node(new_probe, g) do
            true
          else
            _ -> false
          end
        end)

      ExHashRing.Ring.stop(old_probe)
      ExHashRing.Ring.stop(new_probe)
      result
    end

    # Poll the recorded call log for a :receive_node_state announcement of
    # `group` to `target`. Returns true if one arrives within `timeout`.
    defp received_announce_for?(target, group, timeout) do
      match?(
        {:ok, _},
        wait_call(
          fn
            [_scope, ^target, Scope, :receive_node_state, [_s, _src, groups | _], _] ->
              group in groups

            _ ->
              false
          end,
          timeout
        )
      )
    end

    # Rebalance with three remote destinations, each sleeping 200ms inside
    # the adapter. With parallel rebalance the total duration is ~200ms;
    # with sequential rebalance it would be ~600ms. A < 400ms ceiling is a
    # comfortable factor-of-2 margin for CI noise.
    @tag rpc_timeout: 5_000
    test "parallel rebalance -- slow destinations don't block each other",
         %{scope: scope} do
      # Seed a group occupied locally so the rebalance has something to
      # announce; without any candidates the rebalance is trivially fast
      # regardless of parallelism.
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, :rb_slow, pid)

      # Every remote :receive_node_state RPC sleeps 200ms then returns :ok.
      stub_call(
        {:fn,
         fn ->
           Process.sleep(200)
           :ok
         end}
      )

      members = [node(), :fake_a@nowhere, :fake_b@nowhere, :fake_c@nowhere]

      start_ms = System.monotonic_time(:millisecond)
      trigger_rebalance(scope, members)

      # Poll persistent_term :status until it leaves :rebalancing (the fake
      # peers never announce, so it settles on :converging, not :ready).
      Stream.repeatedly(fn -> :persistent_term.get({Forum.Muster, scope, :status}) end)
      |> Stream.take_while(&(&1 == :rebalancing))
      |> Enum.each(fn _ -> Process.sleep(5) end)

      duration_ms = System.monotonic_time(:millisecond) - start_ms

      assert duration_ms < 400,
             "expected parallel rebalance ~200ms, got #{duration_ms}ms (sequential would be ~600ms)"
    end
  end

  describe "rebalance full vs. delta dispatch" do
    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      :ok
    end

    # Poll the coordinator's :dump until owed_snapshots drains, i.e. every
    # fire-and-forget RPC from the last rebalance has been acked (its worker
    # returned :ok and its :node_state_done cleared the entry). A router is only
    # eligible for a DELTA once it is no longer owed.
    defp wait_owed_empty(scope, timeout \\ 2_000) do
      deadline = System.monotonic_time(:millisecond) + timeout
      name = Forum.Supervisor.name(scope)

      Stream.repeatedly(fn ->
        owed = GenServer.call(name, :dump).owed_snapshots
        owed == %{} or System.monotonic_time(:millisecond) >= deadline or Process.sleep(10)
      end)
      |> Enum.find(&(&1 == true))
      |> case do
        true -> :ok
        _ -> flunk("owed_snapshots did not drain within #{timeout}ms")
      end
    end

    # Routers of `groups` under a probe ring built from `members`.
    defp routers_under(members, groups) do
      probe = :"_probe_fd_#{System.unique_integer([:positive])}_muster_ring"
      {:ok, _} = ExHashRing.Ring.start_link(name: probe, replicas: 128)
      {:ok, _} = ExHashRing.Ring.set_nodes(probe, Enum.sort(members))
      routed = Map.new(groups, fn g -> {g, elem(ExHashRing.Ring.find_node(probe, g), 1)} end)
      ExHashRing.Ring.stop(probe)
      routed
    end

    # A settled member that GAINS groups when another node leaves gets a DELTA
    # carrying only the groups that moved onto it, never the ones it already
    # held. This is the node-leave / churn win: re-sending the full set would be
    # pure waste.
    test "a settled router that gains groups on a leave gets a delta of only the moved-in groups",
         %{scope: scope} do
      a = :a@nowhere
      b = :b@nowhere
      view3 = [node(), a, b]
      view2 = [node(), a]

      # Hold a spread of groups locally (single-node: all :occupied, source = us).
      groups = Enum.map(1..120, &:"fd#{&1}")

      Enum.each(groups, fn g ->
        :ok = Muster.join(scope, g, spawn(fn -> Process.sleep(:infinity) end))
      end)

      # Up to {us, a, b}: a and b are brand-new routers -> FULL snapshots. Drain
      # to :ready and wait for both snapshots to be acked so a is not owed.
      rebalance_sync(scope, view3)
      wait_owed_empty(scope)

      routed3 = routers_under(view3, groups)
      _ = drain_calls()

      # b leaves -> {us, a}. b's groups redistribute to us/a; a keeps its own.
      trigger_rebalance(scope, view2)
      GenServer.call(Forum.Supervisor.name(scope), :status)

      routed2 = routers_under(view2, groups)
      moved_into_a = for g <- groups, routed2[g] == a, routed3[g] != a, do: g
      a_kept = for g <- groups, routed2[g] == a, routed3[g] == a, do: g

      # Sanity: this scenario only proves anything if a both kept some rows and
      # gained others.
      assert moved_into_a != []
      assert a_kept != []

      [^scope, ^a, Scope, :apply_delta, [^scope, src, delta_groups | _], _] =
        assert_call(
          fn
            [^scope, ^a, Scope, :apply_delta, [^scope, _, _ | _], _] -> true
            _ -> false
          end,
          1_000
        )

      assert src == node()
      # The delta is exactly the moved-in groups...
      assert Enum.sort(delta_groups) == Enum.sort(moved_into_a)
      # ...and carries NONE of the groups a already held.
      assert Enum.all?(a_kept, &(&1 not in delta_groups))
    end

    # When a prior round to a router is still in flight (owed_snapshots), its
    # baseline is unknown, so even a leave that would normally delta falls back to
    # a FULL snapshot for that router.
    test "an owed router falls back to a full snapshot", %{scope: scope} do
      a = :a@nowhere
      b = :b@nowhere

      # Block the RPC to `a` forever so its first snapshot never acks: a stays in
      # owed_snapshots. (`b` returns :ok normally.)
      test_pid = self()

      stub(ErlDist, :call, fn _scope, target, _m, _f, _args, _t ->
        if target == a do
          send(test_pid, :a_called)
          Process.sleep(:infinity)
        else
          :ok
        end
      end)

      groups = Enum.map(1..120, &:"ow#{&1}")

      Enum.each(groups, fn g ->
        :ok = Muster.join(scope, g, spawn(fn -> Process.sleep(:infinity) end))
      end)

      # Up to {us, a, b}: a gets a FULL snapshot whose worker blocks -> a is owed.
      trigger_rebalance(scope, [node(), a, b])
      assert_receive :a_called, 1_000

      # a is still owed (its worker is parked). Confirm via :dump, then leave b.
      assert Map.has_key?(GenServer.call(Forum.Supervisor.name(scope), :dump).owed_snapshots, a)
      _ = drain_calls()

      trigger_rebalance(scope, [node(), a])
      GenServer.call(Forum.Supervisor.name(scope), :status)

      # Even though a is an existing member gaining groups, the in-flight prior
      # round forces a FULL snapshot, not a delta. (do_rebalance dispatches exactly
      # one RPC per changed router, so a :receive_node_state to `a` precludes an
      # :apply_delta to it.)
      assert_call(
        fn
          [^scope, ^a, Scope, :receive_node_state, [^scope, _, _ | _], _] -> true
          _ -> false
        end,
        1_000
      )
    end
  end

  describe "rebalance occupancy snapshot completeness" do
    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      :ok
    end

    # This node holds two groups, both routed to :x@nowhere AFTER the rebalance.
    # g1's router does not change (x before and after); g2's router changes
    # (z -> x). x is a settled router (it received no rebalance snapshot, so it is
    # not owed), so the leave sends it a DELTA of only the moved-in group g2. g1 is
    # NOT re-sent: x already holds {g1, node()} and the delta path never wipes, so
    # re-sending it would be pure waste (contrast the full-snapshot path, which
    # wipes and therefore must re-include every held group routed to x).
    test "a leave sends the gaining router a delta of only the moved-in group, not the kept one",
         %{scope: scope} do
      members_old = Enum.sort([node(), :x@nowhere, :z@nowhere])
      members_new = Enum.sort([node(), :x@nowhere])

      # g1: x both before and after (router UNCHANGED).
      g1 = find_group_flipping_router(members_old, :x@nowhere, members_new, :x@nowhere)
      # g2: z before, x after (router CHANGES onto x).
      g2 = find_group_flipping_router(members_old, :z@nowhere, members_new, :x@nowhere)

      assert g1 && g2 && g1 != g2

      # Establish the old 3-node membership, then hold both groups locally.
      # rebalance_sync (not trigger_rebalance) so the ring is the old view BEFORE
      # the joins: the claim now runs in a shard, a different process from the
      # coordinator that handles the rebalance, so an async trigger would race it.
      rebalance_sync(scope, members_old)

      p1 = spawn_link(fn -> Process.sleep(:infinity) end)
      p2 = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g1, p1)
      assert :ok = Muster.join(scope, g2, p2)

      _ = drain_calls()

      # Drop :z@nowhere. g2 moves onto x; g1 stays on x. x is a settled member
      # (it received no rebalance snapshot: the joins travelled as :occupied, not
      # tracked in owed_snapshots), so it gets a DELTA, not a full snapshot.
      trigger_rebalance(scope, members_new)

      [^scope, :x@nowhere, Scope, :apply_delta, [^scope, src, groups | _], _] =
        assert_call(
          fn
            [^scope, :x@nowhere, Scope, :apply_delta, [^scope, _, _ | _], _] -> true
            _ -> false
          end,
          500
        )

      assert src == node()
      assert g2 in groups, "the moved group must be announced to its new router"

      refute g1 in groups,
             "the unchanged group is NOT re-sent: x already holds {g1, node()} and " <>
               "the delta path never wipes, so re-sending it would be pure waste"
    end

    test "a router that gains nothing is not sent a snapshot", %{scope: scope} do
      # Add a node: groups only ever move *to* the new node, never onto the
      # pre-existing node(). So the unrelated remote router that gains nothing
      # must receive no receive_node_state call.
      members_old = Enum.sort([node(), :keep@nowhere])
      members_new = Enum.sort([node(), :keep@nowhere, :new@nowhere])

      # A group that stays on :keep@nowhere across the change.
      g = find_group_flipping_router(members_old, :keep@nowhere, members_new, :keep@nowhere)
      assert g

      # rebalance_sync so the old view is the live ring before the join (the
      # claim runs in a shard, a different process from the rebalancing coordinator).
      rebalance_sync(scope, members_old)
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)
      _ = drain_calls()

      trigger_rebalance(scope, members_new)
      Process.sleep(100)

      refute Enum.any?(drain_calls(), fn
               [_, :keep@nowhere, Scope, :receive_node_state, _, _] -> true
               _ -> false
             end)
    end
  end

  describe "drop_stale_router_entries source-agreement guard" do
    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      :ok
    end

    # A router must not delete a source's occupancy row while sweeping under a
    # view the source has NOT agreed to. The reachable case (now that snapshot
    # apply is serialized through Scope, which kills the old concurrent
    # write-vs-sweep race) is *ahead-of-source membership*: we adopt a view
    # containing a node the source hasn't seen yet, under which the group hashes
    # away from us -- but the source's last-announced view still routes it to us,
    # so the row is live and deleting it would lose data permanently (the source
    # has no reason to re-announce). The distributed suite covers the real-
    # cluster end-states black-box; this drives the guard deterministically.
    test "a stale-view sweep spares a row whose source disagrees on the view",
         %{scope: scope} do
      src = :t@nowhere
      final_view = Enum.sort([node(), src])
      stale_view = Enum.sort([node(), src, :d@nowhere])

      # `g` routes to us under the source's (final) view, but to the phantom D
      # under the stale view we transiently adopt.
      g = find_group_flipping_router(final_view, node(), stale_view, :d@nowhere)
      assert g

      # Adopt the source's view and apply its snapshot: the row lands with the
      # source's final-view marker recorded in member_views.
      rebalance_sync(scope, final_view)

      assert :ok =
               Scope.receive_node_state(
                 scope,
                 src,
                 [g],
                 :erlang.phash2(final_view),
                 100,
                 fake_pid()
               )

      assert src in Scope.occupancy(scope, g)

      # Adopt the stale view (we learned of D before the source did). The sweep
      # sees `g` hash to D, not us -- a drop candidate -- but the source still
      # agrees only on the final view, so the guard must spare the row.
      rebalance_sync(scope, stale_view)
      assert src in Scope.occupancy(scope, g)

      # Converging back to the source's view keeps it.
      rebalance_sync(scope, final_view)
      assert src in Scope.occupancy(scope, g)
    end
  end

  describe "router-readiness barrier" do
    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      :ok
    end

    defp send_marker(scope, source, members) do
      Kernel.send(
        Forum.Supervisor.name(scope),
        {:rebalance_marker, source, self(), :erlang.phash2(Enum.sort(members)),
         :erlang.unique_integer([:monotonic])}
      )
    end

    defp ready?(scope), do: :persistent_term.get({Forum.Muster, scope, :status}) == :ready

    # trigger_rebalance is an async send; a synchronous :status call after it
    # flushes the Scope mailbox (FIFO), guaranteeing do_rebalance has run.
    defp rebalance_sync(scope, members) do
      trigger_rebalance(scope, members)
      GenServer.call(Forum.Supervisor.name(scope), :status)
    end

    test "a fresh single-node cluster starts flood-only before singleton promotion",
         %{scope: scope} do
      refute ready?(scope)
      refute Muster.can_decide?(scope, Muster.view_hash(scope))
      assert {:error, :flood} = Muster.targets(scope, :tg, Muster.view_hash(scope))
    end

    test "a singleton scope self-promotes to ready after the timeout" do
      scope = :"muster_singleton_promote_#{System.unique_integer([:positive])}"

      start_supervised!(
        spec(scope,
          partitions: 2,
          vacancy_cooldown_ms: 50,
          vacant_flush_interval_ms: 60_000,
          view_heartbeat_interval_ms: 60_000,
          singleton_promotion_timeout_ms: 50,
          rpc_timeout_ms: 500,
          tombstone_window_ms: 60_000,
          message_module: ErlDist
        )
      )

      refute ready?(scope)
      assert_ready(scope, 500)
      assert Muster.can_decide?(scope, Muster.view_hash(scope))
    end

    test "can_decide? is false when the sender's view hash disagrees", %{scope: scope} do
      refute Muster.can_decide?(scope, Muster.view_hash(scope) + 1)
    end

    test "targets returns {:ok, occupancy} when the barrier is satisfied", %{scope: scope} do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, :tg, pid)
      assert_ready(scope, 35_000)

      assert {:ok, nodes} = Muster.targets(scope, :tg, Muster.view_hash(scope))
      assert node() in nodes
    end

    test "targets returns {:ok, []} for a group nobody holds", %{scope: scope} do
      assert_ready(scope, 35_000)
      assert {:ok, []} = Muster.targets(scope, :nobody, Muster.view_hash(scope))
    end

    test "targets returns {:error, :flood} when the sender's view disagrees", %{scope: scope} do
      assert {:error, :flood} = Muster.targets(scope, :tg, Muster.view_hash(scope) + 1)
    end

    test "targets returns {:error, :flood} while converging, even though the ring is settled",
         %{scope: scope} do
      members = Enum.sort([node(), :a@nowhere, :b@nowhere])
      rebalance_sync(scope, members)

      # Ring is settled (router/2 says :ok) but the barrier is not satisfied yet.
      assert Muster.router(scope, :tg) |> elem(0) == :ok
      refute ready?(scope)
      assert {:error, :flood} = Muster.targets(scope, :tg, Muster.view_hash(scope))
    end

    test "rebalance clears readiness until every peer's marker arrives", %{scope: scope} do
      members = Enum.sort([node(), :a@nowhere, :b@nowhere])
      rebalance_sync(scope, members)

      # status flips back to :stable, but the barrier is not satisfied yet.
      assert Muster.router(scope, :g) |> elem(0) == :ok
      refute ready?(scope)
      refute Muster.can_decide?(scope, Muster.view_hash(scope))

      send_marker(scope, :a@nowhere, members)
      refute_ready(scope)

      send_marker(scope, :b@nowhere, members)
      assert_ready(scope)
      assert Muster.can_decide?(scope, Muster.view_hash(scope))
    end

    test "view_hash updates on rebalance and markers for it are honored", %{scope: scope} do
      h0 = Muster.view_hash(scope)
      members = Enum.sort([node(), :a@nowhere])
      rebalance_sync(scope, members)
      h1 = Muster.view_hash(scope)

      assert h1 != h0
      assert h1 == :erlang.phash2(members)

      send_marker(scope, :a@nowhere, members)
      assert_ready(scope)
    end

    test "a marker for a different view does not count toward readiness", %{scope: scope} do
      members = Enum.sort([node(), :a@nowhere, :b@nowhere])
      rebalance_sync(scope, members)

      # a announces a stale view; it's recorded but disagrees with ours.
      send_marker(scope, :a@nowhere, [node(), :a@nowhere])
      send_marker(scope, :b@nowhere, members)
      refute_ready(scope)

      # a re-announces the current view → now everyone agrees.
      send_marker(scope, :a@nowhere, members)
      assert_ready(scope)
    end

    test "an announcement received before we adopt its view is retained (no lost marker)",
         %{scope: scope} do
      members = Enum.sort([node(), :a@nowhere, :b@nowhere])

      # Both peers announce the NEW view while we are still single-node and
      # have not adopted it. The old set+reset+discard barrier would drop these
      # (wrong current view, source not yet a member) and leave us permanently
      # stuck not-ready; latest-view-map retains them.
      send_marker(scope, :a@nowhere, members)
      send_marker(scope, :b@nowhere, members)
      GenServer.call(Forum.Supervisor.name(scope), :status)

      rebalance_sync(scope, members)

      # Retained announcements satisfy the barrier immediately on adoption.
      assert_ready(scope)
    end

    test "view heartbeat re-announces our current view to every member", %{scope: scope} do
      members = Enum.sort([node(), :a@nowhere, :b@nowhere])
      rebalance_sync(scope, members)
      vh = Muster.view_hash(scope)
      _ = drain_sends()

      trigger_view_heartbeat(scope)
      GenServer.call(Forum.Supervisor.name(scope), :status)

      heartbeat_targets =
        drain_sends()
        |> Enum.flat_map(fn
          [^scope, target, {:rebalance_marker, src, _pid, ^vh, _seq}] when src == node() ->
            [target]

          _ ->
            []
        end)
        |> Enum.sort()

      assert heartbeat_targets == [:a@nowhere, :b@nowhere]
    end

    test "members with no snapshot get an async marker", %{scope: scope} do
      # No groups held, so no member is an affected router: every remote member
      # gets the cheap async marker.
      members = Enum.sort([node(), :a@nowhere, :b@nowhere])
      _ = drain_sends()
      trigger_rebalance(scope, members)
      Process.sleep(50)

      marker_targets =
        drain_sends()
        |> Enum.flat_map(fn
          [^scope, target, {:rebalance_marker, src, _pid, _hash, _seq}] when src == node() ->
            [target]

          _ ->
            []
        end)
        |> Enum.sort()

      assert marker_targets == [:a@nowhere, :b@nowhere]
    end

    test "receive_node_state self-marks its source (the RPC is the marker)", %{scope: scope} do
      members = Enum.sort([node(), :src@nowhere])
      rebalance_sync(scope, members)
      refute ready?(scope)

      # A data snapshot from the only peer marks it ready -- no separate
      # :rebalance_marker message involved.
      assert :ok =
               Scope.receive_node_state(
                 scope,
                 :src@nowhere,
                 [],
                 Muster.view_hash(scope),
                 1,
                 fake_pid()
               )

      assert_ready(scope)
    end

    test "a router that receives a rebalance RPC is not also sent a separate marker",
         %{scope: scope} do
      members_old = Enum.sort([node(), :x@nowhere, :z@nowhere])
      members_new = Enum.sort([node(), :x@nowhere])
      g = find_group_flipping_router(members_old, :z@nowhere, members_new, :x@nowhere)
      assert g

      # rebalance_sync so the old view is the live ring before the join (the
      # claim runs in a shard, a different process from the rebalancing coordinator).
      rebalance_sync(scope, members_old)
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)
      _ = drain_calls()
      _ = drain_sends()

      trigger_rebalance(scope, members_new)
      Process.sleep(50)
      calls = drain_calls()
      sends = drain_sends()

      # x is an affected router gaining a moved group from a settled baseline, so
      # it gets a DELTA RPC (which carries the marker)...
      assert Enum.any?(calls, fn
               [^scope, :x@nowhere, Scope, :apply_delta, _, _] -> true
               _ -> false
             end)

      # ...and is NOT also sent a redundant async marker (it is in owed_snapshots
      # while the delta is in flight, so announce_view skips it).
      refute Enum.any?(sends, fn
               [^scope, :x@nowhere, {:rebalance_marker, _, _, _, _}] -> true
               _ -> false
             end)
    end

    # The discover-ack piggyback withholds our current view/watermark from a
    # discoverer we still owe a full snapshot to (owed_snapshots). This is
    # the same owed-suppression guard as the test right above, on the
    # OTHER message that carries a view/watermark (announce_view's heartbeat
    # marker vs. the discover-ack reply).
    #
    # A locally-spawned pid can't masquerade as a genuinely remote node
    # (node/1 always resolves to us -- see muster_distributed_test.exs's note
    # on why its rebalance-for-test hook exists), so, like set_rebalancing/2
    # above, we drive the owed_snapshots branch directly instead of pairing a
    # second real node: the branch under test only inspects
    # `Map.has_key?(state.owed_snapshots, node(peer))`, and using our own node
    # as both the "owed" key and the discoverer's node exercises that exact
    # branch (register_peer/1's self-discovery guard makes the rest of the
    # handler a safe no-op for a self-sourced pid).
    test "an ack to a still-owed discoverer withholds the view/watermark piggyback",
         %{scope: scope} do
      :sys.replace_state(Forum.Supervisor.name(scope), fn s ->
        %{
          s
          | owed_snapshots:
              Map.put(s.owed_snapshots, node(), :erlang.unique_integer([:monotonic]))
        }
      end)

      _ = drain_sends()
      send(Forum.Supervisor.name(scope), {:muster_discover, self(), Muster.view_hash(scope), 0})
      GenServer.call(Forum.Supervisor.name(scope), :status)

      assert [[^scope, dest, {:muster_discover_ack, _pid, view_hash, seq}]] = drain_sends()
      assert dest == node()

      # Without this guard, a still-owed discoverer could fold in a view it
      # already agrees with -- and declare the barrier satisfied -- before
      # the snapshot carrying the actual data ever lands (the discover-ack
      # race). The piggyback is withheld (nil/nil) here, mirroring
      # announce_view.
      assert view_hash == nil
      assert seq == nil
    end

    # Companion to the test above: the receiving side of a withheld piggyback
    # must leave member_views alone rather than seed it with the nil sentinel
    # (see the handle_info({:muster_discover_ack, _, nil, nil}, _) clause).
    test "an ack with a withheld piggyback does not clobber member_views",
         %{scope: scope} do
      sentinel_pid = self()

      :sys.replace_state(Forum.Supervisor.name(scope), fn s ->
        %{s | member_views: Map.put(s.member_views, node(), {:sentinel, 12_345, sentinel_pid})}
      end)

      send(Forum.Supervisor.name(scope), {:muster_discover_ack, self(), nil, nil})
      dump = GenServer.call(Forum.Supervisor.name(scope), :dump)

      assert dump.member_views[node()] == {:sentinel, 12_345, sentinel_pid}
    end

    defp assert_ready(scope, timeout \\ 500) do
      deadline = System.monotonic_time(:millisecond) + timeout
      do_wait_ready(scope, true, deadline)
    end

    defp refute_ready(scope) do
      # Give any in-flight marker a chance to (wrongly) flip readiness.
      Process.sleep(20)
      refute ready?(scope)
    end

    defp do_wait_ready(scope, expected, deadline) do
      cond do
        ready?(scope) == expected ->
          :ok

        System.monotonic_time(:millisecond) >= deadline ->
          flunk("readiness did not reach #{expected} in time")

        true ->
          Process.sleep(5)
          do_wait_ready(scope, expected, deadline)
      end
    end
  end

  describe "coordinator/shard split" do
    setup %{scope: scope, base_opts: opts} do
      start_supervised!(spec(scope, opts))
      :ok
    end

    test "occupied and apply_snapshot inserts are seq-guarded (a stale write never lowers a newer row)",
         %{scope: scope} do
      # A snapshot (dispatched by the coordinator) and an :occupied (dispatched by
      # a shard) can write the same {group, source} concurrently during a
      # rebalance. Both inserts are seq-guarded, so neither clobbers the newer of
      # the two.

      # A newer :occupied is not lowered by a stale (lower-seq) snapshot. Both
      # writes are attributed to the same pid: on a real node, occupied/5 (a
      # shard dispatch) and receive_node_state/6 (a coordinator dispatch) for
      # the same source are always the same live Scope incarnation.
      src1 = :guard1@nowhere
      src1_pid = fake_pid()
      :ok = Scope.occupied(scope, :sg1, src1, 100, src1_pid)
      :ok = Scope.receive_node_state(scope, src1, [:sg1], 0, 50, src1_pid)
      assert src1 in Scope.occupancy(scope, :sg1)

      # A newer snapshot is not lowered by a stale (late, lower-seq) :occupied.
      src2 = :guard2@nowhere
      src2_pid = fake_pid()
      :ok = Scope.receive_node_state(scope, src2, [:sg2], 0, 200, src2_pid)
      :ok = Scope.occupied(scope, :sg2, src2, 150, src2_pid)
      assert src2 in Scope.occupancy(scope, :sg2)
    end

    test "a shard rebuilds its group_states from its partition after a crash", %{scope: scope} do
      g = :rebuild_g
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)
      assert :occupied = wait_for_group_state(scope, g, :occupied)

      shard = Forum.Supervisor.shard(scope, g)
      shard_pid = Process.whereis(shard)
      ref = Process.monitor(shard_pid)
      Process.exit(shard_pid, :kill)
      assert_receive {:DOWN, ^ref, :process, ^shard_pid, :killed}, 1_000

      # The supervisor restarts the shard; init rebuilds :occupied from its aligned
      # partition (whose ETS tables are owned by the Supervisor and survive the
      # shard crash). The live member is untouched -- Partition is a separate process.
      assert :occupied = wait_for_group_state(scope, g, :occupied, 2_000)
      assert Muster.local_member?(scope, g, pid)
    end

    test "the ring is decoupled from the coordinator and survives its crash",
         %{scope: scope} do
      ring = Process.whereis(ring_name(scope))
      assert is_pid(ring)

      coord = Process.whereis(Forum.Supervisor.name(scope))
      ref = Process.monitor(coord)
      Process.exit(coord, :kill)
      assert_receive {:DOWN, ^ref, :process, ^coord, :killed}, 1_000

      # The ring is a supervised sibling (not linked to the coordinator), so a
      # coordinator crash does not take it down under the shards that read it
      # directly -- it is the SAME process, so there is no cascade of shard
      # ring-read crashes.
      assert Process.alive?(ring)
      assert Process.whereis(ring_name(scope)) == ring
    end

    test "a ring crash restarts the coordinator and shards and re-seeds the ring",
         %{scope: scope} do
      # The ring is the coordinator's sole dependency: it stores the node set in an
      # ETS table owned by the ring process (so the set dies with the process), and
      # the coordinator is the ONLY writer of that set (Ring.set_nodes, at init and
      # on rebalance). So a ring crash that restarts the ring ALONE would bring it
      # back empty with nothing to re-seed it until the next membership change. The
      # supervision tree must therefore restart the coordinator (and shards) after
      # the ring, so the coordinator's init re-seeds the ring to [node()].
      ring = Process.whereis(ring_name(scope))
      coord = Process.whereis(Forum.Supervisor.name(scope))
      shards = Enum.map(Forum.Supervisor.shards(scope), &Process.whereis/1)

      assert Muster.members(scope) == [node()]

      ref = Process.monitor(ring)
      Process.exit(ring, :kill)
      assert_receive {:DOWN, ^ref, :process, ^ring, :killed}, 1_000

      # The ring comes back as a fresh process...
      new_ring = wait_for_new_pid(ring_name(scope), ring)
      assert is_pid(new_ring)

      # ...and the coordinator + every shard restart after it (rest_for_one), so
      # the coordinator's init runs again.
      new_coord = wait_for_new_pid(Forum.Supervisor.name(scope), coord)
      assert is_pid(new_coord)

      new_shards = Enum.map(Forum.Supervisor.shards(scope), &Process.whereis/1)

      Enum.zip(shards, new_shards)
      |> Enum.each(fn {old, new} ->
        assert is_pid(new)
        assert new != old
      end)

      # The restarted coordinator re-seeds the otherwise-empty ring with its node
      # set, so routing recovers instead of stalling on an empty ring.
      assert wait_until(fn -> Muster.members(scope) == [node()] end, 2_000)
    end

    test "a bare coordinator crash also restarts every shard",
         %{scope: scope} do
      # The scope's Supervisor is a single flat :rest_for_one listing the ring,
      # then the coordinator, then the shards. So a coordinator crash restarts
      # the coordinator AND every child listed after it -- i.e. every shard --
      # with no extra code: it falls straight out of the child order. One
      # reset story to reason about: "the coordinator restarted" always means
      # the shards did too, not "sometimes it does (ring crash), sometimes it
      # doesn't (bare coordinator crash)".
      ring = Process.whereis(ring_name(scope))
      coord = Process.whereis(Forum.Supervisor.name(scope))
      shard_names = Forum.Supervisor.shards(scope)
      shards = Enum.map(shard_names, &Process.whereis/1)

      ref = Process.monitor(coord)
      Process.exit(coord, :kill)
      assert_receive {:DOWN, ^ref, :process, ^coord, :killed}, 1_000

      new_coord = wait_for_new_pid(Forum.Supervisor.name(scope), coord)
      assert is_pid(new_coord)

      # Every shard restarts too, purely because it is listed after the
      # coordinator in the supervisor's child order.
      Enum.zip(shard_names, shards)
      |> Enum.each(fn {name, old} ->
        new = wait_for_new_pid(name, old)
        assert is_pid(new)
        assert new != old
      end)

      # The ring is untouched: it is listed BEFORE the coordinator, so nothing
      # after it in the list cascades back up to it.
      assert Process.whereis(ring_name(scope)) == ring

      # The rebuilt shards still work end-to-end.
      g = :coord_crash_restarts_shards_g
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)
      assert :occupied = wait_for_group_state(scope, g, :occupied, 2_000)
    end

    test "a coordinator crash mid-drain reopens the join gate on restart",
         %{scope: scope} do
      # drain/2 closes the join gate by setting the :accepting_joins
      # persistent_term to false.
      # Because it lives outside the coordinator's process state, a crash before
      # the node actually dies would otherwise leave it stuck false forever: the
      # restarted incarnation re-pairs and routes normally, yet every join would
      # keep returning {:error, :draining} for the life of the OS process. init/1
      # must reopen the gate.
      :persistent_term.put({Forum.Muster, scope, :accepting_joins}, false)
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert {:error, :draining} = Muster.join(scope, :drain_crash_g, pid)

      coord = Process.whereis(Forum.Supervisor.name(scope))
      ref = Process.monitor(coord)
      Process.exit(coord, :kill)
      assert_receive {:DOWN, ^ref, :process, ^coord, :killed}, 1_000

      new_coord = wait_for_new_pid(Forum.Supervisor.name(scope), coord)
      assert is_pid(new_coord)

      assert :ok = wait_until_join_ok(scope, :drain_crash_g, pid)
      assert :persistent_term.get({Forum.Muster, scope, :accepting_joins}) == true
    end

    test "a rejoin during a coordinator restart does not leave targets/3 silently dropping a live member",
         %{scope: scope} do
      # Forum.Muster.Shard.handle_join/4's
      # `:cooldown` branch reclaims a group without notifying the router, on
      # the assumption "the router already knows we hold this group". That
      # assumption does not survive a coordinator restart: init/1 resets the
      # ring to [node()], so the restarted coordinator is (once ready) its
      # own router again for a group whose self-row was tombstoned while it
      # was routed elsewhere -- rebuild_group_states's own re-assertion only
      # covers groups with LIVE members, and this one has none until the
      # rejoin below. Without the branch's own write, the occupancy row for
      # this now-self-routed group stays empty, so Muster.targets/3 returns
      # {:ok, []} for a group with a live local member: broadcasts to it are
      # silently dropped, permanently -- nothing else is ever going to
      # re-assert that row for us once we're alone again.
      #
      # A fake peer (via `trigger_rebalance/2`, the sanctioned single-node
      # stand-in for a real one -- see its own comment above) moves `g`'s
      # router away first, so the row genuinely needs re-asserting rather
      # than merely surviving untouched from the original claim (cooldown by
      # itself never retracts it).
      g = group_for_router_under([node(), @fake_node], @fake_node)
      shard_name = Forum.Supervisor.shard(scope, g)

      member1 = spawn(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, member1)
      assert :occupied = wait_for_group_state(scope, g, :occupied)
      assert :ok = Muster.leave(scope, g, member1)
      assert :cooldown = wait_for_group_state(scope, g, :cooldown)

      # The fake peer joins and `g`'s router moves to it: our own now-stale
      # self-row is tombstoned by do_rebalance's own drop_stale_router_entries
      # sweep (unconditional -- our own rows are always judgeable, unlike a
      # remote source's, which needs its agreement first). The synchronous
      # :status call right after flushes the coordinator's mailbox (FIFO),
      # guaranteeing do_rebalance has already run before we check.
      trigger_rebalance(scope, [node(), @fake_node])
      _ = GenServer.call(Forum.Supervisor.name(scope), :status)
      assert Scope.occupancy(scope, g) == []

      old_shard = Process.whereis(shard_name)
      coord = Process.whereis(Forum.Supervisor.name(scope))
      ref = Process.monitor(coord)
      Process.exit(coord, :kill)
      assert_receive {:DOWN, ^ref, :process, ^coord, :killed}, 1_000

      # Wait for the SHARD's own restart to finish before rejoining, so the
      # join deterministically lands on the freshly-restarted shard's
      # `:cooldown` branch: init/1 (rebuild_group_states) sees no live member
      # yet for `g` and leaves it durably `:cooldown`, so nothing but that
      # branch's own write can assert the row here. (A join landing mid-crash
      # on the dying pre-restart shard is the OTHER race --
      # rebuild_group_states's live-member re-assertion already covers that
      # one; forcing this ordering isolates the branch actually under test.)
      # The restarted coordinator's own init/1 also resets the ring to
      # [node()] -- the fake peer never was a real connection to lose -- so
      # `g` routes back to us.
      wait_for_new_pid(shard_name, old_shard)

      member2 = spawn(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, member2)
      assert Muster.local_member?(scope, g, member2)

      assert wait_until(fn -> Muster.can_decide?(scope, Muster.view_hash(scope)) end, 500)

      assert Muster.targets(scope, g, Muster.view_hash(scope)) == {:ok, [node()]}
    end

    test "a shard crash does not restart any other shard, the coordinator, or the ring",
         %{scope: scope} do
      # Shards live under their own nested :one_for_one supervisor (the outer
      # :rest_for_one's last child), so a shard crash is handled entirely inside
      # it and never reaches the coordinator, the ring, or a sibling shard.
      ring = Process.whereis(ring_name(scope))
      coord = Process.whereis(Forum.Supervisor.name(scope))
      [shard0_name, shard1_name] = Forum.Supervisor.shards(scope)
      shard0 = Process.whereis(shard0_name)
      shard1 = Process.whereis(shard1_name)

      ref = Process.monitor(shard0)
      Process.exit(shard0, :kill)
      assert_receive {:DOWN, ^ref, :process, ^shard0, :killed}, 1_000

      new_shard0 = wait_for_new_pid(shard0_name, shard0)
      assert is_pid(new_shard0)

      # Sibling shard, coordinator, and ring are all untouched.
      assert Process.whereis(shard1_name) == shard1
      assert Process.whereis(Forum.Supervisor.name(scope)) == coord
      assert Process.whereis(ring_name(scope)) == ring

      # The restarted shard still works end-to-end.
      g = :shard_crash_isolated_g
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)
      assert :occupied = wait_for_group_state(scope, g, :occupied, 2_000)
    end

    test "after coordinator restart, local senders flood until singleton promotion fires" do
      scope = :"muster_coord_restart_flood_#{System.unique_integer([:positive])}"

      start_supervised!(
        spec(scope,
          partitions: 2,
          vacancy_cooldown_ms: 50,
          vacant_flush_interval_ms: 60_000,
          view_heartbeat_interval_ms: 60_000,
          singleton_promotion_timeout_ms: 200,
          rpc_timeout_ms: 500,
          tombstone_window_ms: 60_000,
          message_module: ErlDist
        )
      )

      inject_fake_remote(scope)
      g = group_for_router(scope, @fake_node)
      assert g

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)

      coord = Process.whereis(Forum.Supervisor.name(scope))
      ref = Process.monitor(coord)
      Process.exit(coord, :kill)
      assert_receive {:DOWN, ^ref, :process, ^coord, :killed}, 1_000

      _new_coord = wait_for_new_pid(Forum.Supervisor.name(scope), coord)

      assert {:ok, n} = Muster.router(scope, g)
      assert n == node()
      assert {:error, :flood} = Muster.targets(scope, g, Muster.view_hash(scope))
    end

    test "a shard crash during the rebalance gather crashes the coordinator and the cluster self-heals",
         %{scope: scope} do
      # The most dangerous moment for a shard crash: the coordinator's SYNCHRONOUS
      # {:rebalance} gather, where it is mid-way through collecting every shard's
      # held set. Pin a group to shard 0 (the first shard gathered) and hold it
      # :occupied, then crash shard 0 out from under the in-flight gather.
      g = group_on_shard(scope, 0)
      assert g

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)
      assert :occupied = wait_for_group_state(scope, g, :occupied)

      shard = Forum.Supervisor.shard(scope, g)
      shard_pid = Process.whereis(shard)

      coord = Process.whereis(Forum.Supervisor.name(scope))
      coord_ref = Process.monitor(coord)

      # Suspend shard 0 so the gather BLOCKS on it: the coordinator cannot get
      # past the suspended shard, so the kill below is guaranteed to land while the
      # gather call is in flight (no race with a fast, healthy gather).
      :ok = :sys.suspend(shard_pid)

      # Kick off a rebalance. do_rebalance flips status to :rebalancing, swaps the
      # ring, then blocks gathering the suspended shard 0.
      trigger_rebalance(scope, Enum.sort([node(), :gc@nowhere]))

      # Once status is :rebalancing the coordinator has entered do_rebalance and
      # (within microseconds of pure-local work) is parked on shard 0's call.
      wait_status(scope, :rebalancing)
      Process.sleep(20)

      # Kill the shard the gather is blocked on. The coordinator's GenServer.call
      # gets an :exit, which the gather deliberately does NOT catch -- so it crashes
      # (the documented "restart re-announces from a clean slate" behaviour).
      Process.exit(shard_pid, :kill)
      assert_receive {:DOWN, ^coord_ref, :process, ^coord, _reason}, 1_000

      # The supervisor restarts both the coordinator and the shard. After they
      # settle the group is re-adopted :occupied (the shard rebuilds it from its
      # partition, whose ETS survived both crashes), the live member is still
      # tracked, and the restarted coordinator's occupancy table has the self row
      # again (reannounced from the partition at init).
      new_coord = wait_for_new_pid(Forum.Supervisor.name(scope), coord)
      assert is_pid(new_coord)

      assert :occupied = wait_for_group_state(scope, g, :occupied, 2_000)
      assert Muster.local_member?(scope, g, pid)
      assert node() in Scope.occupancy(scope, g)
    end

    test "a shard crash while a claim is in flight fails the caller cleanly and a retry heals",
         %{scope: scope} do
      # Route the group to a fake remote so the claim dispatches an :occupied RPC
      # and parks the caller in :occupied_pending.
      inject_fake_remote(scope)
      g = group_for_router(scope, @fake_node)
      assert g

      # Block the :occupied RPC so the claim stays parked: the caller is blocked on
      # the shard's GenServer.call and the shard sits in :occupied_pending.
      stub_call({:fn, fn -> Process.sleep(:infinity) end})

      test = self()

      caller =
        spawn(fn ->
          member = spawn_link(fn -> Process.sleep(:infinity) end)
          send(test, {:claim_result, Muster.join(scope, g, member)})
        end)

      caller_ref = Process.monitor(caller)

      assert {:occupied_pending, _} =
               wait_for_group_state(scope, g, &match?({:occupied_pending, _}, &1))

      shard = Forum.Supervisor.shard(scope, g)
      shard_pid = Process.whereis(shard)
      ref = Process.monitor(shard_pid)
      Process.exit(shard_pid, :kill)
      assert_receive {:DOWN, ^ref, :process, ^shard_pid, :killed}, 1_000

      # The blocked caller is released with a clean error -- it does NOT hang for the
      # full @claim_call_timeout.
      assert_receive {:claim_result, {:error, {:scope_exit, _}}}, 1_000
      assert_receive {:DOWN, ^caller_ref, :process, ^caller, _}, 1_000

      # The crash left no member registered for g (the pid is only registered after
      # the router confirms the claim), but the durable states table persisted the
      # :occupied_pending shape -- and the in-flight :occupied RPC may have landed on
      # the router. So the restarted shard reconciles the now-empty group to
      # :vacant_queued, which the next flush turns into a vacant batch that retracts
      # any row that was written. (It does NOT silently forget the group, which
      # would otherwise leak a stale router entry.)
      restarted = wait_for_new_pid(shard, shard_pid)
      assert is_pid(restarted)
      assert :vacant_queued = wait_for_group_state(scope, g, :vacant_queued, 2_000)

      # A retry now succeeds end-to-end and leaves the group :occupied.
      stub_call(:ok)
      member = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, member)
      assert :occupied = wait_for_group_state(scope, g, :occupied, 2_000)
      assert Muster.local_member?(scope, g, member)
    end

    test "the occupancy table is owned by the supervisor and survives a coordinator crash",
         %{scope: scope} do
      # The shards write the occupancy table directly. If it were owned by the
      # coordinator, a coordinator crash would delete it out from under the live
      # shards (ArgumentError on their next write). It is owned by the long-lived
      # Supervisor instead, so it survives unchanged.
      g = :occ_survives_g
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, pid)
      assert :occupied = wait_for_group_state(scope, g, :occupied)
      assert node() in Scope.occupancy(scope, g)

      table = Scope.occupancy_table_name(scope)
      tid_before = :ets.whereis(table)
      assert tid_before != :undefined

      coord = Process.whereis(Forum.Supervisor.name(scope))
      ref = Process.monitor(coord)
      Process.exit(coord, :kill)
      assert_receive {:DOWN, ^ref, :process, ^coord, :killed}, 1_000

      new_coord = wait_for_new_pid(Forum.Supervisor.name(scope), coord)
      assert is_pid(new_coord)

      # SAME table identity -- it was never recreated, so no shard write could have
      # raced a vanished table.
      assert :ets.whereis(table) == tid_before
      # The self row is re-asserted from the partition at coordinator init, and a
      # fresh claim on another group still works (shards are healthy) -- retried
      # like any real caller, since the supervisor's :rest_for_one is still
      # restarting the shards after the coordinator (see "a bare coordinator
      # crash also restarts every shard") and a claim can transiently race that.
      assert node() in Scope.occupancy(scope, g)
      other = spawn_link(fn -> Process.sleep(:infinity) end)
      assert :ok = wait_until_join_ok(scope, :occ_survives_g2, other)
      assert :occupied = wait_for_group_state(scope, :occ_survives_g2, :occupied, 2_000)
    end

    test "a self-routed group is retracted after the shard crashes mid-cooldown",
         %{scope: scope} do
      # Occupy a (self-routed) group, then let its last member leave so the shard
      # is mid-retraction (:cooldown / :vacant_queued). On a shard restart the OLD
      # rebuild forgot the group entirely, orphaning the self occupancy row. The
      # durable states table now preserves it, so the restart drives it to a
      # vacant flush that deletes the row.
      g = :self_retract_g
      member = spawn(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, member)
      assert :occupied = wait_for_group_state(scope, g, :occupied)
      assert node() in Scope.occupancy(scope, g)

      Process.exit(member, :kill)
      # Member gone, shard now mid-retraction; the self occupancy row still stands
      # (only a flush removes it, and the flush interval is long in these tests).
      assert wait_for_group_state(scope, g, &(&1 in [:cooldown, :vacant_queued])) in [
               :cooldown,
               :vacant_queued
             ]

      shard = Forum.Supervisor.shard(scope, g)
      shard_pid = Process.whereis(shard)
      ref = Process.monitor(shard_pid)
      Process.exit(shard_pid, :kill)
      assert_receive {:DOWN, ^ref, :process, ^shard_pid, :killed}, 1_000

      # Restart REMEMBERS the group (not forgotten): it reconciles to a retraction
      # state rather than dropping it.
      assert wait_for_group_state(scope, g, &(&1 in [:cooldown, :vacant_queued]), 2_000) in [
               :cooldown,
               :vacant_queued
             ]

      # Once it reaches :vacant_queued, a flush deletes the orphaned self row.
      assert :vacant_queued = wait_for_group_state(scope, g, :vacant_queued, 2_000)
      trigger_flush(scope)
      assert wait_until(fn -> node() not in Scope.occupancy(scope, g) end)
    end

    test "a remote-routed group is re-flushed to its router after the shard crashes",
         %{scope: scope} do
      # The case the old design leaked permanently: a group routed to a REMOTE
      # router, forgotten on a shard restart, leaving a stale {group, this_node}
      # row on that router with no local record to retract it. The durable states
      # table keeps the record, so the restart re-flushes a vacant_batch.
      inject_fake_remote(scope)
      g = group_for_router(scope, @fake_node)
      assert g

      member = spawn(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, member)
      assert :occupied = wait_for_group_state(scope, g, :occupied)

      Process.exit(member, :kill)
      assert :vacant_queued = wait_for_group_state(scope, g, :vacant_queued, 2_000)

      shard = Forum.Supervisor.shard(scope, g)
      shard_pid = Process.whereis(shard)
      ref = Process.monitor(shard_pid)
      Process.exit(shard_pid, :kill)
      assert_receive {:DOWN, ^ref, :process, ^shard_pid, :killed}, 1_000

      assert :vacant_queued = wait_for_group_state(scope, g, :vacant_queued, 2_000)

      # The restarted shard re-flushes the remembered remote assertion: a
      # vacant_batch RPC to the fake router carrying g.
      drain_calls()
      trigger_flush(scope)

      assert_call(fn
        [_s, @fake_node, Scope, :vacant_batch, [_scope, groups, _src, _seq | _], _t] ->
          g in groups

        _ ->
          false
      end)
    end

    test "a vacancy dropped while the shard is down is caught by restart reconciliation",
         %{scope: scope} do
      # If the last member dies while the shard is down, the DOWN that would
      # retract the group could be lost with the shard's mailbox. Since the
      # shard owns the member monitor (no separate Partition), restart
      # recovers it: rebuild_membership re-monitors the surviving entries
      # table record, the dead pid's immediate DOWN drives the normal
      # removal, and the durable :occupied group is driven to retraction
      # instead of trusting it forever.
      g = :dropped_vacant_g
      member = spawn(fn -> Process.sleep(:infinity) end)
      assert :ok = Muster.join(scope, g, member)
      assert :occupied = wait_for_group_state(scope, g, :occupied)
      assert node() in Scope.occupancy(scope, g)

      shard = Forum.Supervisor.shard(scope, g)
      shard_pid = Process.whereis(shard)

      # Freeze the shard so it cannot process the member's death...
      :ok = :sys.suspend(shard_pid)
      # ...kill the member: its tagged DOWN lands in the SUSPENDED shard's mailbox
      # where it sits unprocessed, and the entries table record is left behind.
      Process.exit(member, :kill)

      # Kill the suspended shard: its mailbox (with the unprocessed DOWN) is
      # discarded -- the vacancy is now truly LOST, exactly as in the restart-window
      # race. The durable state is still :occupied and the entries record survives.
      ref = Process.monitor(shard_pid)
      Process.exit(shard_pid, :kill)
      assert_receive {:DOWN, ^ref, :process, ^shard_pid, :killed}, 1_000

      # The restarted shard re-monitors the surviving (now-dead) entry; its
      # immediate DOWN removes the member, drives the group vacant, and a flush
      # retracts the row -- instead of leaving the durable :occupied trusted forever.
      assert :vacant_queued = wait_for_group_state(scope, g, :vacant_queued, 2_000)
      trigger_flush(scope)
      assert wait_until(fn -> node() not in Scope.occupancy(scope, g) end)
    end

    test "rebalance gather timeout is configurable and crashes the coordinator when exceeded",
         %{scope: scope, base_opts: base_opts} do
      # A slow/blocked shard must not hang the coordinator for the full default
      # window. With a small :rebalance_gather_timeout_ms the gather gives up fast
      # and crashes the coordinator (the documented "restart from a clean slate").
      gt_scope = :"#{scope}_gather_timeout"
      opts = Keyword.put(base_opts, :rebalance_gather_timeout_ms, 150)
      start_supervised!(spec(gt_scope, opts))

      # Suspend a shard so the gather blocks on it.
      shard_pid = Process.whereis(Forum.Supervisor.shard_name(gt_scope, 0))
      shard_ref = Process.monitor(shard_pid)
      :ok = :sys.suspend(shard_pid)

      coord = Process.whereis(Forum.Supervisor.name(gt_scope))
      ref = Process.monitor(coord)

      trigger_rebalance(gt_scope, Enum.sort([node(), :gt@nowhere]))
      wait_status(gt_scope, :rebalancing)

      # Crash arrives ~150ms in -- well under the 15s default -- proving the timeout
      # is in force.
      assert_receive {:DOWN, ^ref, :process, ^coord, reason}, 1_000
      assert {:timeout, {GenServer, :call, [_shard, {:rebalance, _}, 150]}} = reason

      assert_receive {:DOWN, ^shard_ref, :process, ^shard_pid, :shutdown}, 1_000
    end
  end

  describe "restart intensity (:max_restarts/:max_seconds)" do
    test "a tiny :max_restarts terminates the scope's own supervisor once exceeded",
         %{scope: scope, base_opts: opts} do
      sup_pid =
        start_supervised!(spec(scope, Keyword.merge(opts, max_restarts: 0, max_seconds: 1)))

      ref = Process.monitor(sup_pid)

      coord = Process.whereis(Forum.Supervisor.name(scope))
      Process.exit(coord, :kill)

      assert_receive {:DOWN, ^ref, :process, ^sup_pid, _reason}, 1_000
    end

    test "a generous :max_restarts keeps recovering past the OTP default budget",
         %{scope: scope, base_opts: opts} do
      sup_pid =
        start_supervised!(spec(scope, Keyword.merge(opts, max_restarts: 100, max_seconds: 1)))

      sup_ref = Process.monitor(sup_pid)

      # OTP's own Supervisor default (3 restarts / 5 seconds) would give up well
      # before this many kills land within ~1 second; the generous override here
      # must keep restarting the coordinator instead.
      for _ <- 1..5 do
        coord = Process.whereis(Forum.Supervisor.name(scope))
        coord_ref = Process.monitor(coord)
        Process.exit(coord, :kill)
        assert_receive {:DOWN, ^coord_ref, :process, ^coord, :killed}, 1_000
        assert is_pid(wait_for_new_pid(Forum.Supervisor.name(scope), coord))
      end

      refute_received {:DOWN, ^sup_ref, :process, ^sup_pid, _reason}
      assert Process.alive?(sup_pid)
    end
  end
end
