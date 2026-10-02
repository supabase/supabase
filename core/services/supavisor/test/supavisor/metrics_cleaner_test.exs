defmodule Supavisor.MetricsCleanerTest do
  use ExUnit.Case, async: false

  require Supavisor
  alias Supavisor.PromEx.Plugins.Tenant, as: Metrics

  @subject Supavisor.MetricsCleaner

  doctest @subject

  setup ctx do
    :telemetry.attach(ctx, [:supavisor, :metrics_cleaner, :stop], &__MODULE__.handler/4, %{
      parent: self()
    })

    :ok
  end

  def handler(_, measurements, _, %{parent: pid}) do
    send(pid, {:metrics, measurements})
  end

  test "metrics for unknown tenant are removed" do
    :ok =
      Metrics.emit_telemetry_for_tenant(
        Supavisor.id(
          type: :single,
          tenant: "non-existent",
          user: "foo",
          mode: :transaction,
          db: "bar"
        ),
        2137,
        ""
      )

    metrics = Supavisor.Monitoring.PromEx.get_metrics()

    assert IO.iodata_to_binary(metrics) =~ ~r/non-existent/

    # First clean marks orphans (removes from tags_tid), second clean sweeps them
    @subject.clean()
    assert_receive {:metrics, _}
    @subject.clean()
    assert_receive {:metrics, _}

    metrics = Supavisor.Monitoring.PromEx.get_metrics()

    refute IO.iodata_to_binary(metrics) =~ ~r/non-existent/
  end

  test "sums/counters for unknown tenant are removed" do
    :ok =
      Supavisor.Monitoring.Telem.handler_action(
        :db_handler,
        :stopped,
        Supavisor.id(
          type: :single,
          tenant: "non-existent",
          user: "foo",
          mode: :transaction,
          db: "bar"
        )
      )

    metrics = Supavisor.Monitoring.PromEx.get_metrics()

    assert IO.iodata_to_binary(metrics) =~ ~r/non-existent/

    @subject.clean()
    assert_receive {:metrics, _}
    @subject.clean()
    assert_receive {:metrics, _}

    metrics = Supavisor.Monitoring.PromEx.get_metrics()

    refute IO.iodata_to_binary(metrics) =~ ~r/non-existent/
  end

  test "metrics with no reverse tag mapping are cleaned up" do
    {_, {_tags_tid, metric_tids, reverse_tags_tid, cache_tid}} =
      Peep.Persistent.storage(Supavisor.Monitoring.PromEx.Metrics)

    # Simulate a metric entry whose reverse tag mapping is missing.
    # This can happen if tags_tid and reverse_tags_tid get out of sync.
    orphan_tags_id = System.unique_integer()
    metric_tid = elem(metric_tids, 0)
    # Use metric_id 0 — the actual id doesn't matter for the cleaner
    :ets.insert(metric_tid, {{0, orphan_tags_id}, 42})

    # Verify the metric entry exists but has no reverse tag or cache mapping
    assert :ets.lookup(metric_tid, {0, orphan_tags_id}) != []
    assert :ets.lookup(reverse_tags_tid, orphan_tags_id) == []
    assert :ets.lookup(cache_tid, orphan_tags_id) == []

    # First clean: mark phase — tags_id has no reverse mapping so it is
    # immediately considered orphaned. No tags_tid entry to delete.
    @subject.clean()
    assert_receive {:metrics, _}

    # The metric entry still exists after the mark phase
    assert :ets.lookup(metric_tid, {0, orphan_tags_id}) != []

    # Second clean: sweep phase — removes the metric entry
    @subject.clean()
    assert_receive {:metrics, _}

    assert :ets.lookup(metric_tid, {0, orphan_tags_id}) == []
  end

  test "tag tables are cleaned up for orphaned tenants" do
    {_, {tags_tid, _metric_tids, reverse_tags_tid, cache_tid}} =
      Peep.Persistent.storage(Supavisor.Monitoring.PromEx.Metrics)

    :ok =
      Metrics.emit_telemetry_for_tenant(
        Supavisor.id(
          type: :single,
          tenant: "orphan-tags-test",
          user: "foo",
          mode: :transaction,
          db: "bar"
        ),
        42,
        ""
      )

    # Trigger a scrape so the cache_tid gets populated via the export path
    metrics = Supavisor.Monitoring.PromEx.get_metrics()
    assert IO.iodata_to_binary(metrics) =~ "orphan-tags-test"

    # The tags map stored in ETS matches the telemetry metadata filtered to @tags
    tags_map = %{
      tenant: "orphan-tags-test",
      user: "foo",
      mode: :transaction,
      type: :single,
      db_name: "bar",
      search_path: nil,
      app_name: ""
    }

    [{^tags_map, tags_id}] = :ets.lookup(tags_tid, tags_map)

    # Verify entries exist in all three tag tables before cleanup
    assert :ets.lookup(tags_tid, tags_map) != []
    assert :ets.lookup(reverse_tags_tid, tags_id) != []
    assert :ets.lookup(cache_tid, tags_id) != []

    # First clean marks (deletes from tags_tid), second clean sweeps the rest
    @subject.clean()
    assert_receive {:metrics, _}

    # After mark: tags_tid is cleaned, but reverse_tags and cache remain
    assert :ets.lookup(tags_tid, tags_map) == []
    assert :ets.lookup(reverse_tags_tid, tags_id) != []
    assert :ets.lookup(cache_tid, tags_id) != []

    @subject.clean()
    assert_receive {:metrics, _}

    # After sweep: all three tag tables should be cleaned up
    assert :ets.lookup(tags_tid, tags_map) == []
    assert :ets.lookup(reverse_tags_tid, tags_id) == []
    assert :ets.lookup(cache_tid, tags_id) == []
  end
end
