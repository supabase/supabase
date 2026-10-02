defmodule Realtime.PromEx.Plugins.TenantTest do
  use Realtime.DataCase, async: false
  use Mimic

  setup :set_mimic_from_context

  alias Forum.Census
  alias Realtime.FeatureFlags
  alias Realtime.GenCounter
  alias Realtime.PromEx.Plugins.Tenant
  alias Realtime.PromEx.Plugins.TenantGlobal
  alias Realtime.RateCounter
  alias Realtime.Rpc
  alias Realtime.Tenants.Authorization
  alias Realtime.Tenants.Authorization.Policies
  alias Realtime.Tenants.Authorization.Policies

  defmodule MetricsTest do
    use PromEx, otp_app: :realtime_test_phoenix

    @impl true
    def plugins, do: [{Tenant, poll_rate: 50}, {TenantGlobal, poll_rate: 50}]
  end

  setup_all do
    start_supervised!(MetricsTest)
    :ok
  end

  def handle_telemetry(event, metadata, content, pid: pid), do: send(pid, {event, metadata, content})

  @aux_mod (quote do
              defmodule FakeUserCounter do
                def fake_add(external_id) do
                  pid = spawn(fn -> Process.sleep(2000) end)
                  :ok = Census.join(:users, external_id, pid)
                end

                def fake_db_event(external_id) do
                  rate = Realtime.Tenants.db_events_per_second_rate(external_id, 100)

                  rate
                  |> tap(&RateCounter.new(&1))
                  |> tap(&GenCounter.add(&1.id))
                  |> RateCounterHelper.tick!()
                end

                def fake_event(external_id) do
                  rate = Realtime.Tenants.events_per_second_rate(external_id, 123)

                  rate
                  |> tap(&RateCounter.new(&1))
                  |> tap(&GenCounter.add(&1.id))
                  |> RateCounterHelper.tick!()
                end

                def fake_presence_event(external_id) do
                  rate = Realtime.Tenants.presence_events_per_second_rate(external_id, 123)

                  rate
                  |> tap(&RateCounter.new(&1))
                  |> tap(&GenCounter.add(&1.id))
                  |> RateCounterHelper.tick!()
                end

                def fake_broadcast_from_database(external_id) do
                  Realtime.Telemetry.execute(
                    [:realtime, :tenants, :broadcast_from_database],
                    %{
                      # millisecond
                      latency_committed_at: 9,
                      # microsecond
                      latency_inserted_at: 9000
                    },
                    %{tenant: external_id}
                  )
                end

                def fake_input_bytes(external_id) do
                  Realtime.Telemetry.execute([:realtime, :channel, :input_bytes], %{size: 10}, %{tenant: external_id})
                end

                def fake_output_bytes(external_id) do
                  Realtime.Telemetry.execute([:realtime, :channel, :output_bytes], %{size: 10}, %{tenant: external_id})
                end
              end
            end)

  Code.eval_quoted(@aux_mod)

  describe "execute_tenant_metrics/0" do
    setup do
      tenant = TestTenantDb.checkout_tenant()
      :telemetry.attach(__MODULE__, [:realtime, :connections], &__MODULE__.handle_telemetry/4, pid: self())

      on_exit(fn -> :telemetry.detach(__MODULE__) end)

      {:ok, _} = Realtime.Tenants.Connect.lookup_or_start_connection(tenant.external_id)
      {:ok, node} = Clustered.start(@aux_mod, extra_config: [{:realtime, :users_scope_broadcast_interval_in_ms, 50}])
      %{tenant: tenant, node: node}
    end

    test "returns a list of tenant metrics and handles bad tenant ids", %{
      tenant: %{external_id: external_id},
      node: node
    } do
      :ok = Census.join(:users, external_id, self())
      # Add bad tenant id
      bad_tenant_id = random_string()
      :ok = Census.join(:users, bad_tenant_id, self())

      _ = Rpc.call(node, FakeUserCounter, :fake_add, [external_id])

      # Census broadcasts per-group counts on an interval, so the peer's join lands here
      # asynchronously; snapshot the metrics only once both nodes are counted.
      assert_eventually Census.member_count(:users, external_id) == 2, timeout: 1_000
      Tenant.execute_tenant_metrics()

      assert_receive {[:realtime, :connections], %{connected: 1, limit: 200, connected_cluster: 2},
                      %{tenant: ^external_id}},
                     500

      refute_receive {[:realtime, :connections], %{connected: 1, limit: 200, connected_cluster: 2},
                      %{tenant: ^bad_tenant_id}}
    end

    test "reports zero for tenants that recently lost their last local websocket", %{
      tenant: %{external_id: external_id},
      node: node
    } do
      start_supervised!({Realtime.MetricsCleaner, [metrics_cleaner_schedule_timer_in_ms: 60_000]})

      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      :ok = Census.join(:users, external_id, pid)
      _ = Rpc.call(node, FakeUserCounter, :fake_add, [external_id])

      assert_eventually Census.member_count(:users, external_id) == 2, timeout: 1_000
      Tenant.execute_tenant_metrics()

      assert_receive {[:realtime, :connections], %{connected: 1, limit: 200, connected_cluster: 2},
                      %{tenant: ^external_id}},
                     500

      :ok = Census.leave(:users, external_id, pid)
      Tenant.execute_tenant_metrics()

      # Local count is zero, the other node still holds one connection
      assert_receive {[:realtime, :connections], %{connected: 0, limit: 200, connected_cluster: 1},
                      %{tenant: ^external_id}},
                     500
    end
  end

  describe "event_metrics/0" do
    setup do
      tenant = TestTenantDb.checkout_tenant(run_migrations: true)
      {:ok, db_conn} = Realtime.Database.connect(tenant, "realtime_test", :stop)

      authorization_context =
        Authorization.build_authorization_params(%{
          tenant_id: tenant.external_id,
          topic: "test_topic",
          jwt: "jwt",
          claims: [],
          headers: [{"header-1", "value-1"}],
          role: "anon"
        })

      %{authorization_context: authorization_context, db_conn: db_conn, tenant: tenant}
    end

    test "event exists after counter added", %{tenant: %{external_id: external_id}} do
      metric_value = metric_value("realtime_channel_events", tenant: external_id) || 0
      FakeUserCounter.fake_event(external_id)

      assert_eventually metric_value("realtime_channel_events", tenant: external_id) == metric_value + 1
    end

    test "global event exists after counter added", %{tenant: %{external_id: external_id}} do
      metric_value = metric_value("realtime_channel_global_events") || 0

      FakeUserCounter.fake_event(external_id)

      assert_eventually metric_value("realtime_channel_global_events") >= metric_value + 1
    end

    test "db_event exists after counter added", %{tenant: %{external_id: external_id}} do
      metric_value = metric_value("realtime_channel_db_events", tenant: external_id) || 0
      FakeUserCounter.fake_db_event(external_id)
      assert_eventually metric_value("realtime_channel_db_events", tenant: external_id) == metric_value + 1
    end

    test "global db_event exists after counter added", %{tenant: %{external_id: external_id}} do
      metric_value = metric_value("realtime_channel_global_db_events") || 0

      FakeUserCounter.fake_db_event(external_id)
      assert_eventually metric_value("realtime_channel_global_db_events") >= metric_value + 1
    end

    test "presence_event exists after counter added", %{tenant: %{external_id: external_id}} do
      metric_value = metric_value("realtime_channel_presence_events", tenant: external_id) || 0

      FakeUserCounter.fake_presence_event(external_id)
      assert_eventually metric_value("realtime_channel_presence_events", tenant: external_id) == metric_value + 1
    end

    test "global presence_event exists after counter added", %{tenant: %{external_id: external_id}} do
      metric_value = metric_value("realtime_channel_global_presence_events") || 0
      FakeUserCounter.fake_presence_event(external_id)
      assert_eventually metric_value("realtime_channel_global_presence_events") >= metric_value + 1
    end

    test "metric read_authorization_check exists after check", context do
      metric = "realtime_tenants_read_authorization_check_count"
      metric_value = metric_value(metric, tenant: context.tenant.external_id) || 0

      {:ok, _} =
        Authorization.get_read_authorizations(
          %Policies{},
          context.db_conn,
          context.authorization_context
        )

      assert_eventually metric_value(metric, tenant: context.tenant.external_id) == metric_value + 1

      assert metric_value("realtime_tenants_read_authorization_check_bucket",
               tenant: context.tenant.external_id,
               le: "250.0"
             ) > 0
    end

    test "metric write_authorization_check exists after check", context do
      metric = "realtime_tenants_write_authorization_check_count"
      metric_value = metric_value(metric, tenant: context.tenant.external_id) || 0

      {:ok, _} =
        Authorization.get_write_authorizations(
          %Policies{},
          context.db_conn,
          context.authorization_context,
          :broadcast
        )

      assert_eventually metric_value(metric, tenant: context.tenant.external_id) == metric_value + 1

      assert metric_value("realtime_tenants_write_authorization_check_bucket",
               tenant: context.tenant.external_id,
               le: "250.0"
             ) > 0
    end

    test "metric replay exists after check", context do
      external_id = context.tenant.external_id
      metric = "realtime_tenants_replay_count"
      metric_value = metric_value(metric, tenant: external_id) || 0

      assert {:ok, _, _} = Realtime.Messages.replay(context.db_conn, external_id, "test", 0, 1)

      assert_eventually metric_value(metric, tenant: external_id) == metric_value + 1

      assert metric_value("realtime_tenants_replay_bucket", tenant: external_id, le: "250.0") > 0
    end

    test "metric realtime_tenants_broadcast_from_database_latency_committed_at exists after check", context do
      external_id = context.tenant.external_id
      metric = "realtime_tenants_broadcast_from_database_latency_committed_at_count"
      metric_value = metric_value(metric, tenant: external_id) || 0

      FakeUserCounter.fake_broadcast_from_database(context.tenant.external_id)
      assert_eventually metric_value(metric, tenant: external_id) == metric_value + 1

      assert metric_value("realtime_tenants_broadcast_from_database_latency_committed_at_bucket",
               tenant: external_id,
               le: "10.0"
             ) > 0
    end

    test "metric realtime_tenants_broadcast_from_database_latency_inserted_at exists after check", context do
      external_id = context.tenant.external_id
      metric = "realtime_tenants_broadcast_from_database_latency_inserted_at_count"
      metric_value = metric_value(metric, tenant: external_id) || 0

      FakeUserCounter.fake_broadcast_from_database(context.tenant.external_id)
      assert_eventually metric_value(metric, tenant: external_id) == metric_value + 1

      assert metric_value("realtime_tenants_broadcast_from_database_latency_inserted_at_bucket",
               tenant: external_id,
               le: "10.0"
             ) > 0
    end

    test "tenant metric payload size", context do
      external_id = context.tenant.external_id
      metric = "realtime_tenants_payload_size_count"
      metric_value = metric_value(metric, message_type: "presence", tenant: external_id) || 0

      message = %{topic: "a topic", event: "an event", payload: ["a", %{"b" => "c"}, 1, 23]}
      RealtimeWeb.TenantBroadcaster.pubsub_broadcast(external_id, "a topic", message, Phoenix.PubSub, :presence)

      assert_eventually metric_value(metric, message_type: "presence", tenant: external_id) == metric_value + 1

      assert metric_value("realtime_tenants_payload_size_bucket", tenant: external_id, le: "250") > 0
    end

    test "global metric payload size", context do
      external_id = context.tenant.external_id

      metric = "realtime_payload_size_count"
      metric_value = metric_value(metric, message_type: "broadcast") || 0

      message = %{topic: "a topic", event: "an event", payload: ["a", %{"b" => "c"}, 1, 23]}
      RealtimeWeb.TenantBroadcaster.pubsub_broadcast(external_id, "a topic", message, Phoenix.PubSub, :broadcast)

      assert_eventually metric_value(metric, message_type: "broadcast") == metric_value + 1

      assert metric_value("realtime_payload_size_bucket", le: "250.0") > 0
    end

    test "broadcast fan-out counter increments when track_fanout_metric is enabled", %{
      tenant: %{external_id: external_id}
    } do
      stub(FeatureFlags, :enabled?, fn "track_fanout_metric", ^external_id -> true end)

      metric = "realtime_broadcast_fanout_node_delivery_total"
      metric_value = metric_value(metric, tenant: external_id, hit: true) || 0

      :telemetry.execute([:realtime, :broadcast, :fanout, :node_delivery], %{local_tenant_users: 2}, %{
        tenant: external_id,
        hit: true
      })

      assert_eventually metric_value(metric, tenant: external_id, hit: true) == metric_value + 1
    end

    test "broadcast fan-out counter is not recorded when track_fanout_metric is disabled", %{
      tenant: %{external_id: external_id}
    } do
      stub(FeatureFlags, :enabled?, fn "track_fanout_metric", ^external_id -> false end)

      metric = "realtime_broadcast_fanout_node_delivery_total"
      metric_value = metric_value(metric, tenant: external_id, hit: true) || 0

      :telemetry.execute([:realtime, :broadcast, :fanout, :node_delivery], %{local_tenant_users: 2}, %{
        tenant: external_id,
        hit: true
      })

      assert_always((metric_value(metric, tenant: external_id, hit: true) || 0) == metric_value)
    end

    test "global broadcast fan-out counter increments tagged by hit only", %{tenant: %{external_id: external_id}} do
      metric = "realtime_broadcast_global_fanout_node_delivery_total"
      metric_value = metric_value(metric, hit: false) || 0

      :telemetry.execute([:realtime, :broadcast, :fanout, :node_delivery], %{local_tenant_users: 0}, %{
        tenant: external_id,
        hit: false
      })

      assert_eventually metric_value(metric, hit: false) >= metric_value + 1
    end

    test "channel input bytes", context do
      external_id = context.tenant.external_id

      FakeUserCounter.fake_input_bytes(external_id)
      FakeUserCounter.fake_input_bytes(external_id)

      assert_eventually metric_value("realtime_channel_input_bytes", tenant: external_id) == 20
    end

    test "channel output bytes", context do
      external_id = context.tenant.external_id

      FakeUserCounter.fake_output_bytes(external_id)
      FakeUserCounter.fake_output_bytes(external_id)

      assert_eventually metric_value("realtime_channel_output_bytes", tenant: external_id) == 20
    end
  end

  describe "subscription pooler metrics" do
    setup do
      tenant = TestTenantDb.checkout_tenant()
      on_exit(fn -> Peep.prune_tags(MetricsTest.__metrics_collector_name__(), [%{tenant: tenant.external_id}]) end)
      %{tenant: tenant}
    end

    test "subscribers gauge reports the latest value", %{tenant: %{external_id: external_id}} do
      Realtime.Telemetry.execute([:realtime, :subscriptions, :manager, :subscribers], %{count: 7}, %{
        tenant: external_id
      })

      assert metric_value("realtime_subscriptions_manager_subscribers", tenant: external_id) == 7
    end

    test "poller stop counter increments tagged by reason", %{tenant: %{external_id: external_id}} do
      Realtime.Telemetry.execute([:realtime, :replication, :poller, :stop], %{duration: 1}, %{
        tenant: external_id,
        reason: {:shutdown, :max_retries_reached}
      })

      assert metric_value(
               "realtime_replication_poller_stop_total",
               tenant: external_id,
               reason: "max_retries_reached"
             ) == 1
    end

    test "poller exception counter increments on crash", %{tenant: %{external_id: external_id}} do
      Realtime.Telemetry.execute([:realtime, :replication, :poller, :exception], %{duration: 1}, %{tenant: external_id})

      assert metric_value("realtime_replication_poller_exception_total", tenant: external_id) == 1
    end

    test "query exception counter increments tagged by reason", %{tenant: %{external_id: external_id}} do
      Realtime.Telemetry.execute([:realtime, :replication, :poller, :query, :exception], %{}, %{
        tenant: external_id,
        reason: :object_in_use
      })

      assert metric_value("realtime_replication_poller_query_exception_total",
               tenant: external_id,
               reason: "object_in_use"
             ) == 1
    end

    test "prepare exception counter increments", %{tenant: %{external_id: external_id}} do
      Realtime.Telemetry.execute([:realtime, :replication, :poller, :prepare, :exception], %{}, %{
        tenant: external_id,
        reason: :some_error
      })

      assert metric_value("realtime_replication_poller_prepare_exception_total", tenant: external_id) == 1
    end

    test "changes dispatch sum increments by dispatched count", %{tenant: %{external_id: external_id}} do
      Realtime.Telemetry.execute([:realtime, :replication, :poller, :changes, :dispatch], %{count: 5}, %{
        tenant: external_id
      })

      assert metric_value("realtime_replication_poller_changes_dispatch", tenant: external_id) == 5
    end

    test "changes skip sum increments by skipped count tagged by reason", %{tenant: %{external_id: external_id}} do
      Realtime.Telemetry.execute([:realtime, :replication, :poller, :changes, :skip], %{count: 3}, %{
        tenant: external_id,
        reason: :rate_limited
      })

      assert metric_value("realtime_replication_poller_changes_skip", tenant: external_id, reason: "rate_limited") == 3
    end

    test "dead pid sum increments tagged by phantom reason", %{tenant: %{external_id: external_id}} do
      Realtime.Telemetry.execute([:realtime, :subscriptions, :manager, :dead_pid], %{quantity: 1}, %{
        tenant: external_id,
        reason: :phantom
      })

      assert metric_value("realtime_subscriptions_manager_dead_pid", tenant: external_id, reason: "phantom") == 1
    end

    test "dead pid sum increments tagged by not_found reason", %{tenant: %{external_id: external_id}} do
      Realtime.Telemetry.execute([:realtime, :subscriptions, :manager, :dead_pid], %{quantity: 1}, %{
        tenant: external_id,
        reason: :not_found
      })

      assert metric_value("realtime_subscriptions_manager_dead_pid", tenant: external_id, reason: "not_found") == 1
    end
  end

  describe "execute_global_connection_metrics/0" do
    test "emits global connection counts without a tenant tag" do
      pid = spawn_link(fn -> Process.sleep(:infinity) end)
      :ok = Census.join(:users, "global-test-tenant", pid)

      TenantGlobal.execute_global_connection_metrics()

      assert_eventually metric_value("realtime_connections_global_connected") >= 0
      assert metric_value("realtime_connections_global_connected_cluster") >= 0
    end
  end

  defp metric_value(metric, expected_tags \\ nil) do
    MetricsHelper.search(PromEx.get_metrics(MetricsTest), metric, expected_tags)
  end
end
