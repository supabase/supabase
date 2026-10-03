Application.put_env(:peep, :test_storages, [
  {Realtime.Monitoring.Peep.PartitionedTables, [tables: 4]},
  {Realtime.Monitoring.Peep.PartitionedTables, [tables: 4, routing_tag: :tenant_id]},
  {Realtime.Monitoring.Peep.PartitionedTables, [tables: 1]}
])

Code.require_file("../../../../deps/peep/test/shared/storage_test.exs", __DIR__)

defmodule Realtime.Monitoring.Peep.PartitionedTablesTest do
  use ExUnit.Case, async: true

  alias Realtime.Monitoring.Peep.PartitionedTables
  alias Telemetry.Metrics

  describe "get_all_metrics" do
    test "collects metrics from all tables" do
      counter = Metrics.counter("all_metrics.test.counter")
      last_value = Metrics.last_value("all_metrics.test.gauge")

      n_tables = 4
      tenant_a = "tenant-alpha"
      tenant_b = "tenant-beta"

      assert :erlang.phash2(tenant_a, n_tables) != :erlang.phash2(tenant_b, n_tables)

      name = :"test_all_metrics_#{System.unique_integer([:positive])}"

      {:ok, _} =
        Peep.start_link(
          name: name,
          metrics: [counter, last_value],
          storage: {PartitionedTables, [tables: n_tables, routing_tag: :tenant_id]}
        )

      tags_a = %{tenant_id: tenant_a}
      tags_b = %{tenant_id: tenant_b}

      for _ <- 1..3, do: Peep.insert_metric(name, counter, 1, tags_a)
      for _ <- 1..7, do: Peep.insert_metric(name, counter, 1, tags_b)
      for _ <- 1..11, do: Peep.insert_metric(name, counter, 1, %{})
      Peep.insert_metric(name, last_value, 42, tags_a)
      Peep.insert_metric(name, last_value, 99, tags_b)
      Peep.insert_metric(name, last_value, 111, %{})

      all = Peep.get_all_metrics(name)

      assert all[counter][tags_a] == 3
      assert all[counter][tags_b] == 7
      assert all[counter][%{}] == 11
      assert all[last_value][tags_a] == 42
      assert all[last_value][tags_b] == 99
      assert all[last_value][%{}] == 111
    end
  end

  describe "routing tag" do
    test "routes different tag values to different tables" do
      n_tables = 4
      routing_tag = :tenant_id
      {tids, ^routing_tag} = PartitionedTables.new(tables: n_tables, routing_tag: routing_tag)

      counter = Metrics.counter("routing.test.counter")
      id = :erlang.phash2(counter)

      tenant_a = "tenant-alpha"
      tenant_b = "tenant-beta"

      index_a = :erlang.phash2(tenant_a, n_tables)
      index_b = :erlang.phash2(tenant_b, n_tables)

      # Ensure the two tenants map to different tables for this test to be meaningful
      assert index_a != index_b,
             "tenant-alpha and tenant-beta must hash to different table indices"

      tags_a = %{tenant_id: tenant_a}
      tags_b = %{tenant_id: tenant_b}

      for _ <- 1..10 do
        PartitionedTables.insert_metric({tids, routing_tag}, id, counter, 1, tags_a)
        PartitionedTables.insert_metric({tids, routing_tag}, id, counter, 1, tags_b)
      end

      # Each tenant's data is in its own table
      assert :ets.lookup(elem(tids, index_a), {id, tags_a}) != []
      assert :ets.lookup(elem(tids, index_b), {id, tags_b}) != []

      # Cross-table: each tenant's key must NOT exist in the other's table
      assert :ets.lookup(elem(tids, index_a), {id, tags_b}) == []
      assert :ets.lookup(elem(tids, index_b), {id, tags_a}) == []
    end

    test "falls back to first table when routing tag is absent from tags" do
      n_tables = 4
      routing_tag = :tenant_id
      {tids, ^routing_tag} = PartitionedTables.new(tables: n_tables, routing_tag: routing_tag)

      counter = Metrics.counter("fallback.test.counter")
      id = :erlang.phash2(counter)
      tags = %{env: :prod}

      PartitionedTables.insert_metric({tids, routing_tag}, id, counter, 1, tags)

      assert :ets.lookup(elem(tids, 0), {id, tags}) != []

      for i <- 1..(n_tables - 1) do
        assert :ets.lookup(elem(tids, i), {id, tags}) == []
      end
    end

    test "prune_tags targets only the relevant table for patterns with routing tag" do
      n_tables = 4
      routing_tag = :tenant_id
      {tids, ^routing_tag} = PartitionedTables.new(tables: n_tables, routing_tag: routing_tag)

      counter = Metrics.counter("prune.targeted.test.counter")
      id = :erlang.phash2(counter)

      tenant_a = "tenant-alpha"
      tenant_b = "tenant-beta"

      index_a = :erlang.phash2(tenant_a, n_tables)
      index_b = :erlang.phash2(tenant_b, n_tables)
      assert index_a != index_b

      tags_a = %{tenant_id: tenant_a}
      tags_b = %{tenant_id: tenant_b}

      PartitionedTables.insert_metric({tids, routing_tag}, id, counter, 1, tags_a)
      PartitionedTables.insert_metric({tids, routing_tag}, id, counter, 1, tags_b)

      # Prune only tenant A using a targeted pattern
      :ok = PartitionedTables.prune_tags({tids, routing_tag}, [tags_a])

      assert :ets.lookup(elem(tids, index_a), {id, tags_a}) == []
      assert :ets.lookup(elem(tids, index_b), {id, tags_b}) != []
    end

    test "prune_tags targets table 0 when pattern has no routing tag" do
      n_tables = 4
      routing_tag = :tenant_id
      {tids, ^routing_tag} = PartitionedTables.new(tables: n_tables, routing_tag: routing_tag)

      counter = Metrics.counter("prune.broadcast.test.counter")
      id = :erlang.phash2(counter)

      # Tags with no routing key → written to table 0
      tags = %{env: :prod}
      PartitionedTables.insert_metric({tids, routing_tag}, id, counter, 1, tags)

      assert :ets.lookup(elem(tids, 0), {id, tags}) != []

      # Pattern without routing tag → deletes from table 0 only
      :ok = PartitionedTables.prune_tags({tids, routing_tag}, [%{env: :prod}])

      assert :ets.lookup(elem(tids, 0), {id, tags}) == []
    end
  end
end
