defmodule Extensions.PostgresCdcRls.ReplicationPollerTest do
  # Tweaking application env
  use Realtime.DataCase, async: false

  use Mimic

  import ExUnit.CaptureLog

  alias Extensions.PostgresCdcRls.MessageDispatcher
  alias Extensions.PostgresCdcRls.ReplicationPoller, as: Poller
  alias Extensions.PostgresCdcRls.Replications
  alias Extensions.PostgresCdcRls.Subscriptions

  alias Realtime.Adapters.Changes.{
    DeletedRecord,
    NewRecord,
    UpdatedRecord
  }

  alias Realtime.Database
  alias Realtime.RateCounter

  alias RealtimeWeb.TenantBroadcaster

  import Poller, only: [generate_record: 1]

  setup :set_mimic_from_context

  setup_all do
    tenant = TestTenantDb.checkout_tenant_unboxed(run_migrations: true)
    %{tenant: tenant}
  end

  @change_json ~s({"table":"test","type":"INSERT","record":{"id": 34, "details": "test"},"columns":[{"name": "id", "type": "int4"}, {"name": "details", "type": "text"}],"errors":null,"schema":"public","commit_timestamp":"2025-10-13T07:50:28.066Z"})

  describe "poll" do
    setup %{tenant: tenant} do
      :telemetry.attach_many(
        __MODULE__,
        [
          [:realtime, :replication, :poller, :query, :stop],
          [:realtime, :replication, :poller, :query, :exception],
          [:realtime, :replication, :poller, :prepare, :exception],
          [:realtime, :replication, :poller, :stop],
          [:realtime, :replication, :poller, :exception],
          [:realtime, :replication, :poller, :changes, :dispatch],
          [:realtime, :replication, :poller, :changes, :skip]
        ],
        &__MODULE__.handle_telemetry/4,
        pid: self()
      )

      on_exit(fn -> :telemetry.detach(__MODULE__) end)

      # The tenant is shared across the module via setup_all, so reset its rate
      # counters per-test (checkout_tenant used to do this on every checkout).
      RateCounterHelper.stop(tenant.external_id)

      {:ok, tenant} = Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{"max_events_per_second" => 123})

      subscribers_pids_table = :ets.new(__MODULE__, [:public, :bag])
      subscribers_nodes_table = :ets.new(__MODULE__, [:public, :set])

      args =
        hd(tenant.extensions).settings
        |> Map.put("id", tenant.external_id)
        |> Map.put("subscribers_pids_table", subscribers_pids_table)
        |> Map.put("subscribers_nodes_table", subscribers_nodes_table)

      # unless specified it will return empty results
      empty_results = {:ok, %Postgrex.Result{rows: [], num_rows: 0}}
      stub(Replications, :list_changes, fn _, _ -> empty_results end)

      # Default to a publication with tables so the poller actually polls.
      # Tests that need an empty publication override this stub explicitly.
      stub(Subscriptions, :fetch_publication_tables, fn _, _ -> {:ok, %{{"public", "test"} => [1234]}} end)

      stub(Replications, :synchronous_standby, fn _ -> {:ok, false} end)
      stub(Database, :orioledb, fn _ -> {:ok, false} end)

      %{args: args, tenant: tenant}
    end

    test "handles prepare_replication failure and retries", %{args: args} do
      tenant_id = args["id"]

      stub(Replications, :prepare_replication, fn _, _ -> {:ok, %Postgrex.Result{}} end)
      expect(Replications, :prepare_replication, fn _, _ -> {:error, "prepare failed"} end)

      start_link_supervised!({Poller, args})

      assert_receive {
                       :telemetry,
                       [:realtime, :replication, :poller, :query, :stop],
                       %{duration: _},
                       %{tenant: ^tenant_id}
                     },
                     2000
    end

    test "gives up and stops when prepare_replication keeps failing", %{args: args} do
      stub(Replications, :prepare_replication, fn _, _ -> {:error, "prepare failed"} end)

      pid = start_supervised!({Poller, args}, restart: :temporary)
      ref = Process.monitor(pid)

      # Drive the retry count to the limit, then trigger one more failing prepare
      :sys.replace_state(pid, fn state -> %{state | retry_count: 6} end)
      send(pid, :retry)

      assert_receive {:DOWN, ^ref, :process, ^pid, {:shutdown, :max_retries_reached}}, 1000
    end

    test "a fetch error on the prepare path goes through the retry machinery", %{args: args} do
      # Start idle so no slot or poll loop is running.
      expect(Subscriptions, :fetch_publication_tables, fn _, _ -> {:ok, %{}} end)

      pid = start_supervised!({Poller, args}, restart: :temporary)
      ref = Process.monitor(pid)

      # A fetch error while preparing is treated like a prepare failure: at the retry
      # limit, one more failing prepare stops the poller.
      expect(Subscriptions, :fetch_publication_tables, fn _, _ -> {:error, :boom} end)
      :sys.replace_state(pid, fn state -> %{state | retry_count: 6} end)
      send(pid, :retry)

      assert_receive {:DOWN, ^ref, :process, ^pid, {:shutdown, :max_retries_reached}}, 1000
    end

    test "terminates replication slot when retry count exceeds threshold", %{args: args} do
      tenant_id = args["id"]

      slot_in_use_error =
        {:error,
         %Postgrex.Error{
           postgres: %{
             code: :object_in_use,
             message: "replication slot is active for PID 12345"
           }
         }}

      stub(Replications, :get_pg_stat_activity_diff, fn _conn, _pid -> {:ok, 42} end)
      stub(Replications, :list_changes, fn _, _ -> slot_in_use_error end)
      expect(Replications, :terminate_backend, fn _conn, _slot -> {:ok, :terminated} end)

      pid = start_link_supervised!({Poller, args})

      # Wait for the first poll
      assert_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 1000

      # Advance retry_count past threshold and send another poll
      :sys.replace_state(pid, fn state -> %{state | retry_count: 4} end)
      send(pid, :poll)

      assert_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 2000
    end

    test "gives up and stops after max retries", %{args: args} do
      tenant_id = args["id"]
      error = {:error, %Postgrex.Error{message: "boom"}}
      stub(Replications, :list_changes, fn _, _ -> error end)

      pid = start_supervised!({Poller, args}, restart: :temporary)
      ref = Process.monitor(pid)

      # Drive the retry count to the limit, then trigger one more failing poll
      :sys.replace_state(pid, fn state -> %{state | retry_count: 6} end)
      send(pid, :poll)

      assert_receive {:telemetry, [:realtime, :replication, :poller, :stop], %{duration: _},
                      %{tenant: ^tenant_id, reason: {:shutdown, :max_retries_reached}}},
                     1000

      assert_receive {:DOWN, ^ref, :process, ^pid, {:shutdown, :max_retries_reached}}, 1000
    end

    test "handles no new changes", %{args: args, tenant: tenant} do
      tenant_id = args["id"]
      reject(&TenantBroadcaster.pubsub_direct_broadcast/6)
      reject(&TenantBroadcaster.pubsub_broadcast/5)
      start_link_supervised!({Poller, args})

      assert_receive {
                       :telemetry,
                       [:realtime, :replication, :poller, :query, :stop],
                       %{duration: _},
                       %{tenant: ^tenant_id}
                     },
                     500

      rate = Realtime.Tenants.db_events_per_second_rate(tenant)

      assert {:ok,
              %RateCounter{
                sum: sum,
                limit: %{
                  value: 123,
                  measurement: :avg,
                  triggered: false
                }
              }} = RateCounterHelper.tick!(rate)

      assert sum == 0
    end

    test "handles new changes with missing ets table", %{args: args, tenant: tenant} do
      tenant_id = args["id"]

      :ets.delete(args["subscribers_nodes_table"])

      results =
        build_result([
          <<71, 36, 83, 212, 168, 9, 17, 240, 165, 186, 118, 202, 193, 157, 232, 187>>,
          <<251, 188, 190, 118, 168, 119, 17, 240, 188, 87, 118, 202, 193, 157, 232, 187>>
        ])

      expect(Replications, :list_changes, fn _, _ -> results end)
      reject(&TenantBroadcaster.pubsub_direct_broadcast/6)

      # Broadcast to the whole cluster due to missing node information
      expect(TenantBroadcaster, :pubsub_broadcast, fn ^tenant_id,
                                                      "realtime:postgres:" <> ^tenant_id,
                                                      {"INSERT", change_json, _sub_ids},
                                                      MessageDispatcher,
                                                      :postgres_changes ->
        assert Jason.decode!(change_json) == Jason.decode!(@change_json)
        :ok
      end)

      start_link_supervised!({Poller, args})

      # First poll with changes
      assert_receive {
                       :telemetry,
                       [:realtime, :replication, :poller, :query, :stop],
                       %{duration: _},
                       %{tenant: ^tenant_id}
                     },
                     500

      # Second poll without changes
      assert_receive {
                       :telemetry,
                       [:realtime, :replication, :poller, :query, :stop],
                       %{duration: _},
                       %{tenant: ^tenant_id}
                     },
                     500

      rate = Realtime.Tenants.db_events_per_second_rate(tenant)
      assert {:ok, %RateCounter{sum: sum}} = RateCounterHelper.tick!(rate)
      assert sum == 2
    end

    test "handles new changes with no subscription nodes", %{args: args, tenant: tenant} do
      tenant_id = args["id"]

      results =
        build_result([
          <<71, 36, 83, 212, 168, 9, 17, 240, 165, 186, 118, 202, 193, 157, 232, 187>>,
          <<251, 188, 190, 118, 168, 119, 17, 240, 188, 87, 118, 202, 193, 157, 232, 187>>
        ])

      expect(Replications, :list_changes, fn _, _ -> results end)
      reject(&TenantBroadcaster.pubsub_direct_broadcast/6)

      # Broadcast to the whole cluster due to missing node information
      expect(TenantBroadcaster, :pubsub_broadcast, fn ^tenant_id,
                                                      "realtime:postgres:" <> ^tenant_id,
                                                      {"INSERT", change_json, _sub_ids},
                                                      MessageDispatcher,
                                                      :postgres_changes ->
        assert Jason.decode!(change_json) == Jason.decode!(@change_json)
        :ok
      end)

      start_link_supervised!({Poller, args})

      # First poll with changes
      assert_receive {
                       :telemetry,
                       [:realtime, :replication, :poller, :query, :stop],
                       %{duration: _},
                       %{tenant: ^tenant_id}
                     },
                     500

      # Second poll without changes
      assert_receive {
                       :telemetry,
                       [:realtime, :replication, :poller, :query, :stop],
                       %{duration: _},
                       %{tenant: ^tenant_id}
                     },
                     500

      rate = Realtime.Tenants.db_events_per_second_rate(tenant)
      assert {:ok, %RateCounter{sum: sum}} = RateCounterHelper.tick!(rate)
      assert sum == 2
    end

    test "handles new changes with missing subscription nodes", %{args: args, tenant: tenant} do
      tenant_id = args["id"]

      results =
        build_result([
          sub1 = <<71, 36, 83, 212, 168, 9, 17, 240, 165, 186, 118, 202, 193, 157, 232, 187>>,
          <<251, 188, 190, 118, 168, 119, 17, 240, 188, 87, 118, 202, 193, 157, 232, 187>>
        ])

      :ets.insert(args["subscribers_nodes_table"], {sub1, node()})

      expect(Replications, :list_changes, fn _, _ -> results end)
      reject(&TenantBroadcaster.pubsub_direct_broadcast/6)

      # Broadcast to the whole cluster due to missing node information
      expect(TenantBroadcaster, :pubsub_broadcast, fn ^tenant_id,
                                                      "realtime:postgres:" <> ^tenant_id,
                                                      {"INSERT", change_json, _sub_ids},
                                                      MessageDispatcher,
                                                      :postgres_changes ->
        assert Jason.decode!(change_json) == Jason.decode!(@change_json)
        :ok
      end)

      start_link_supervised!({Poller, args})

      # First poll with changes
      assert_receive {
                       :telemetry,
                       [:realtime, :replication, :poller, :query, :stop],
                       %{duration: _},
                       %{tenant: ^tenant_id}
                     },
                     500

      # Second poll without changes
      assert_receive {
                       :telemetry,
                       [:realtime, :replication, :poller, :query, :stop],
                       %{duration: _},
                       %{tenant: ^tenant_id}
                     },
                     500

      rate = Realtime.Tenants.db_events_per_second_rate(tenant)
      assert {:ok, %RateCounter{sum: sum}} = RateCounterHelper.tick!(rate)
      assert sum == 2
    end

    test "handles new changes with subscription nodes information", %{args: args, tenant: tenant} do
      tenant_id = args["id"]

      results =
        build_result([
          sub1 = <<71, 36, 83, 212, 168, 9, 17, 240, 165, 186, 118, 202, 193, 157, 232, 187>>,
          sub2 = <<251, 188, 190, 118, 168, 119, 17, 240, 188, 87, 118, 202, 193, 157, 232, 187>>,
          sub3 = <<49, 59, 209, 112, 173, 77, 17, 240, 191, 41, 118, 202, 193, 157, 232, 187>>
        ])

      # All subscriptions have node information
      :ets.insert(args["subscribers_nodes_table"], {sub1, node()})
      :ets.insert(args["subscribers_nodes_table"], {sub2, :"someothernode@127.0.0.1"})
      :ets.insert(args["subscribers_nodes_table"], {sub3, node()})

      expect(Replications, :list_changes, fn _, _ -> results end)
      reject(&TenantBroadcaster.pubsub_broadcast/5)

      topic = "realtime:postgres:" <> tenant_id

      # # Broadcast to the exact nodes only
      expect(TenantBroadcaster, :pubsub_direct_broadcast, 2, fn
        _node, ^tenant_id, ^topic, {"INSERT", change_json, _sub_ids}, MessageDispatcher, :postgres_changes ->
          assert Jason.decode!(change_json) == Jason.decode!(@change_json)
          :ok
      end)

      start_link_supervised!({Poller, args})

      # First poll with changes
      assert_receive {
                       :telemetry,
                       [:realtime, :replication, :poller, :query, :stop],
                       %{duration: _},
                       %{tenant: ^tenant_id}
                     },
                     500

      # Second poll without changes
      assert_receive {
                       :telemetry,
                       [:realtime, :replication, :poller, :query, :stop],
                       %{duration: _},
                       %{tenant: ^tenant_id}
                     },
                     500

      calls = calls(TenantBroadcaster, :pubsub_direct_broadcast, 6)

      assert Enum.count(calls) == 2

      node_subs = Enum.map(calls, fn [node, _, _, {"INSERT", _change_json, sub_ids}, _, _] -> {node, sub_ids} end)

      assert {node(), MapSet.new([sub1, sub3])} in node_subs
      assert {:"someothernode@127.0.0.1", MapSet.new([sub2])} in node_subs

      rate = Realtime.Tenants.db_events_per_second_rate(tenant)
      assert {:ok, %RateCounter{sum: sum}} = RateCounterHelper.tick!(rate)
      assert sum == 3
    end

    test "does not poll WAL when publication has no tables", %{args: args} do
      tenant_id = args["id"]

      expect(Subscriptions, :fetch_publication_tables, fn _, _ -> {:ok, %{}} end)
      reject(&Replications.list_changes/2)

      start_link_supervised!({Poller, args})

      refute_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 200
    end

    test "drops replication slot and stops polling when tables vanish", %{args: args} do
      tenant_id = args["id"]

      expect(Replications, :drop_replication_slot, fn _conn, _slot -> {:ok, :dropped} end)

      pid = start_link_supervised!({Poller, args})

      # First poll happens with the default non-empty stub.
      assert_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 500

      expect(Subscriptions, :fetch_publication_tables, fn _, _ -> {:ok, %{}} end)
      reject(&Replications.list_changes/2)

      send(pid, :check_oids)
      # Force the GenServer to process :check_oids before we assert.
      :sys.get_state(pid)

      refute_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 200
    end

    test "cancels a pending retry when tables vanish so it can't recreate the slot", %{args: args} do
      tenant_id = args["id"]

      expect(Replications, :drop_replication_slot, fn _conn, _slot -> {:ok, :dropped} end)

      pid = start_link_supervised!({Poller, args})

      # First poll happens with the default non-empty stub.
      assert_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 500

      # Simulate a retry already scheduled from a prior list_changes/5 error.
      :sys.replace_state(pid, fn state ->
        %{state | retry_ref: Process.send_after(pid, :retry, 50), retry_count: 3}
      end)

      expect(Subscriptions, :fetch_publication_tables, fn _, _ -> {:ok, %{}} end)
      reject(&Replications.list_changes/2)

      send(pid, :check_oids)

      # retry_ref is cancelled/cleared and retry_count reset; no :retry fires.
      assert %{retry_ref: nil, retry_count: 0} = :sys.get_state(pid)
      refute_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 200
    end

    test "resumes polling when tables appear via :check_oids", %{args: args} do
      tenant_id = args["id"]

      expect(Subscriptions, :fetch_publication_tables, fn _, _ -> {:ok, %{}} end)

      pid = start_link_supervised!({Poller, args})

      refute_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 200

      # Tables are added to the publication. Next :check_oids should trigger
      # prepare_replication + an initial poll.
      expect(Subscriptions, :fetch_publication_tables, fn _, _ -> {:ok, %{{"public", "test"} => [1234]}} end)
      send(pid, :check_oids)

      assert_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 1000
    end

    test "a successful prepare resets a prior failure streak", %{args: args} do
      tenant_id = args["id"]

      # Start idle (empty publication) so no slot exists yet.
      expect(Subscriptions, :fetch_publication_tables, fn _, _ -> {:ok, %{}} end)

      pid = start_link_supervised!({Poller, args})

      refute_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 200

      # Simulate a leftover failure streak from earlier prepare/list_changes errors:
      # a pending :retry and an inflated retry_count.
      :sys.replace_state(pid, fn state ->
        %{state | retry_ref: Process.send_after(pid, :retry, 60_000), retry_count: 5}
      end)

      # Tables appear: :check_oids re-runs prepare_replication, which succeeds and
      # must wipe the failure streak.
      expect(Subscriptions, :fetch_publication_tables, fn _, _ -> {:ok, %{{"public", "test"} => [1234]}} end)
      send(pid, :check_oids)

      assert_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 1000

      assert %{retry_ref: nil, retry_count: 0} = :sys.get_state(pid)
    end

    test "shuts down when slot drop fails so the temp slot is released with the connection",
         %{args: args} do
      pid = start_supervised!({Poller, args}, restart: :temporary)

      assert_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, _}, 500

      expect(Subscriptions, :fetch_publication_tables, fn _, _ -> {:ok, %{}} end)
      expect(Replications, :drop_replication_slot, fn _, _ -> {:error, :boom} end)

      ref = Process.monitor(pid)
      send(pid, :check_oids)

      assert_receive {:DOWN, ^ref, :process, ^pid, {:shutdown, :drop_replication_slot_failed}}, 1000
    end

    test "refreshes oids without touching the slot when the publication stays non-empty", %{args: args} do
      tenant_id = args["id"]

      # While the publication keeps having tables the slot must never be dropped
      # or recreated; :check_oids only refreshes the oid map in place.
      reject(&Replications.drop_replication_slot/2)

      pid = start_link_supervised!({Poller, args})

      # First poll happens with the default non-empty stub.
      assert_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 500

      # Publication still has tables but the oid set changed (e.g. a table was added).
      new_oids = %{{"public", "test"} => [1234], {"public", "other"} => [5678]}
      expect(Subscriptions, :fetch_publication_tables, fn _, _ -> {:ok, new_oids} end)

      send(pid, :check_oids)

      # oids map is refreshed in place and the periodic check stays armed.
      state = :sys.get_state(pid)
      assert state.oids == new_oids
      assert is_reference(state.check_oid_ref)
    end

    test "keeps oids and the slot when :check_oids fetch errors", %{args: args} do
      tenant_id = args["id"]

      # A fetch error must never be mistaken for an emptied publication, so the slot
      # is left intact and the oid map is preserved.
      reject(&Replications.drop_replication_slot/2)

      pid = start_link_supervised!({Poller, args})

      assert_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 500

      old_oids = :sys.get_state(pid).oids

      expect(Subscriptions, :fetch_publication_tables, fn _, _ -> {:error, :boom} end)
      send(pid, :check_oids)

      state = :sys.get_state(pid)
      assert state.oids == old_oids
      assert is_reference(state.check_oid_ref)
    end

    test "arms the periodic :check_oids timer when polling starts", %{args: args} do
      tenant_id = args["id"]

      pid = start_link_supervised!({Poller, args})

      assert_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 500

      assert is_reference(:sys.get_state(pid).check_oid_ref)
    end

    test "tells list_changes when commits wait for a synchronous standby", %{args: args} do
      stub(Replications, :synchronous_standby, fn _ -> {:ok, true} end)
      report_standby()

      start_link_supervised!({Poller, args})

      assert_receive {:standby, true}, 1000
    end

    test "tells list_changes when there is no synchronous standby", %{args: args} do
      report_standby()

      start_link_supervised!({Poller, args})

      assert_receive {:standby, false}, 1000
    end

    test "reads as without a standby and warns on OrioleDB with a synchronous standby", %{args: args} do
      stub(Replications, :synchronous_standby, fn _ -> {:ok, true} end)
      stub(Database, :orioledb, fn _ -> {:ok, true} end)
      report_standby()

      log =
        capture_log(fn ->
          start_link_supervised!({Poller, args})
          assert_receive {:standby, false}, 1000
        end)

      assert log =~ "SyncStandbyUnsupported: "
    end

    test "checks the standby when it prepares the slot, not on every publication check", %{args: args} do
      parent = self()

      stub(Replications, :synchronous_standby, fn _ ->
        send(parent, :standby_checked)
        {:ok, false}
      end)

      pid = start_link_supervised!({Poller, args})
      assert_receive :standby_checked, 1000

      send(pid, :check_oids)
      :sys.get_state(pid)

      refute_receive :standby_checked, 100
    end

    test "checks the standby again when it prepares the slot again", %{args: args} do
      report_standby()

      pid = start_link_supervised!({Poller, args})
      assert_receive {:standby, false}, 1000

      stub(Replications, :synchronous_standby, fn _ -> {:ok, true} end)
      send(pid, :retry)

      assert_receive {:standby, true}, 2000
    end

    test "retries instead of polling when the synchronous standby check fails", %{args: args} do
      stub(Replications, :synchronous_standby, fn _ -> {:ok, true} end)
      expect(Replications, :synchronous_standby, fn _ -> {:error, %Postgrex.Error{message: "check failed"}} end)
      report_standby()

      log =
        capture_log(fn ->
          start_link_supervised!({Poller, args})
          assert_receive {:standby, true}, 2000
        end)

      refute_received {:standby, false}
      assert log =~ "PoolingReplicationPreparationError: "
    end

    test "retries instead of polling when the OrioleDB check fails", %{args: args} do
      stub(Replications, :synchronous_standby, fn _ -> {:ok, true} end)
      stub(Database, :orioledb, fn _ -> {:ok, true} end)
      expect(Database, :orioledb, fn _ -> {:error, %Postgrex.Error{message: "check failed"}} end)
      report_standby()

      log =
        capture_log(fn ->
          start_link_supervised!({Poller, args})
          assert_receive {:standby, false}, 2000
        end)

      refute_received {:standby, true}
      assert log =~ "PoolingReplicationPreparationError: "
      assert log =~ "SyncStandbyUnsupported: "
    end

    test "arms the periodic :check_oids timer even when the publication is empty", %{args: args} do
      tenant_id = args["id"]

      expect(Subscriptions, :fetch_publication_tables, fn _, _ -> {:ok, %{}} end)
      reject(&Replications.list_changes/2)

      pid = start_link_supervised!({Poller, args})

      refute_receive {:telemetry, [:realtime, :replication, :poller, :query, :stop], _, %{tenant: ^tenant_id}}, 200

      # Even idle (no slot), the poller must keep checking for tables to appear.
      assert is_reference(:sys.get_state(pid).check_oid_ref)
    end
  end

  defp report_standby do
    parent = self()

    stub(Replications, :list_changes, fn _, opts ->
      send(parent, {:standby, opts[:synchronous_standby]})
      {:ok, %Postgrex.Result{rows: [], num_rows: 0}}
    end)
  end

  @columns [
    %{"name" => "id", "type" => "int8"},
    %{"name" => "details", "type" => "text"},
    %{"name" => "user_id", "type" => "int8"}
  ]

  @ts "2021-11-05T17:20:51.52406+00:00"

  @subscription_id "417e76fd-9bc5-4b3e-bd5d-a031389c4a6b"
  @subscription_ids MapSet.new(["417e76fd-9bc5-4b3e-bd5d-a031389c4a6b"])

  @old_record %{"id" => 12}
  @record %{"details" => "test", "id" => 12, "user_id" => 1}

  describe "generate_record/1" do
    test "INSERT" do
      wal_record = [
        "INSERT",
        "public",
        "todos",
        Jason.encode!(@columns),
        Jason.encode!(@record),
        nil,
        @ts,
        [@subscription_id],
        [],
        1
      ]

      assert %NewRecord{
               columns: columns,
               commit_timestamp: @ts,
               schema: "public",
               table: "todos",
               type: "INSERT",
               subscription_ids: @subscription_ids,
               record: record,
               errors: nil
             } = generate_record(wal_record)

      # Encode then decode to get rid of the fragment
      assert record |> Jason.encode!() |> Jason.decode!() == @record
      assert columns |> Jason.encode!() |> Jason.decode!() == @columns
    end

    test "UPDATE" do
      wal_record = [
        "UPDATE",
        "public",
        "todos",
        Jason.encode!(@columns),
        Jason.encode!(@record),
        Jason.encode!(@old_record),
        @ts,
        [@subscription_id],
        [],
        1
      ]

      assert %UpdatedRecord{
               columns: columns,
               commit_timestamp: @ts,
               schema: "public",
               table: "todos",
               type: "UPDATE",
               subscription_ids: @subscription_ids,
               record: record,
               old_record: old_record,
               errors: nil
             } = generate_record(wal_record)

      # Encode then decode to get rid of the fragment
      assert record |> Jason.encode!() |> Jason.decode!() == @record
      assert old_record |> Jason.encode!() |> Jason.decode!() == @old_record
      assert columns |> Jason.encode!() |> Jason.decode!() == @columns
    end

    test "DELETE" do
      wal_record = [
        "DELETE",
        "public",
        "todos",
        Jason.encode!(@columns),
        nil,
        Jason.encode!(@old_record),
        @ts,
        [@subscription_id],
        [],
        1
      ]

      assert %DeletedRecord{
               columns: columns,
               commit_timestamp: @ts,
               schema: "public",
               table: "todos",
               type: "DELETE",
               subscription_ids: @subscription_ids,
               old_record: old_record,
               errors: nil
             } = generate_record(wal_record)

      # Encode then decode to get rid of the fragment
      assert old_record |> Jason.encode!() |> Jason.decode!() == @old_record
      assert columns |> Jason.encode!() |> Jason.decode!() == @columns
    end

    test "INSERT, large payload error present" do
      wal_record = [
        "INSERT",
        "public",
        "todos",
        Jason.encode!(@columns),
        Jason.encode!(@record),
        nil,
        @ts,
        [@subscription_id],
        ["Error 413: Payload Too Large"],
        1
      ]

      assert %NewRecord{
               columns: columns,
               commit_timestamp: @ts,
               schema: "public",
               table: "todos",
               type: "INSERT",
               subscription_ids: @subscription_ids,
               record: record,
               errors: ["Error 413: Payload Too Large"]
             } = generate_record(wal_record)

      # Encode then decode to get rid of the fragment
      assert record |> Jason.encode!() |> Jason.decode!() == @record
      assert columns |> Jason.encode!() |> Jason.decode!() == @columns
    end

    test "INSERT, other errors present" do
      wal_record = [
        "INSERT",
        "public",
        "todos",
        Jason.encode!(@columns),
        Jason.encode!(@record),
        nil,
        @ts,
        [@subscription_id],
        ["Error..."],
        1
      ]

      assert %NewRecord{
               columns: columns,
               commit_timestamp: @ts,
               schema: "public",
               table: "todos",
               type: "INSERT",
               subscription_ids: @subscription_ids,
               record: record,
               errors: ["Error..."]
             } = generate_record(wal_record)

      # Encode then decode to get rid of the fragment
      assert record |> Jason.encode!() |> Jason.decode!() == @record
      assert columns |> Jason.encode!() |> Jason.decode!() == @columns
    end

    test "UPDATE, large payload error present" do
      wal_record = [
        "UPDATE",
        "public",
        "todos",
        Jason.encode!(@columns),
        Jason.encode!(@record),
        Jason.encode!(@old_record),
        @ts,
        [@subscription_id],
        ["Error 413: Payload Too Large"],
        1
      ]

      assert %UpdatedRecord{
               columns: columns,
               commit_timestamp: @ts,
               schema: "public",
               table: "todos",
               type: "UPDATE",
               subscription_ids: @subscription_ids,
               record: record,
               old_record: old_record,
               errors: ["Error 413: Payload Too Large"]
             } = generate_record(wal_record)

      # Encode then decode to get rid of the fragment
      assert record |> Jason.encode!() |> Jason.decode!() == @record
      assert old_record |> Jason.encode!() |> Jason.decode!() == @old_record
      assert columns |> Jason.encode!() |> Jason.decode!() == @columns
    end

    test "UPDATE, other errors present" do
      wal_record = [
        "UPDATE",
        "public",
        "todos",
        Jason.encode!(@columns),
        Jason.encode!(@record),
        Jason.encode!(@old_record),
        @ts,
        [@subscription_id],
        ["Error..."],
        1
      ]

      assert %UpdatedRecord{
               columns: columns,
               commit_timestamp: @ts,
               schema: "public",
               table: "todos",
               type: "UPDATE",
               subscription_ids: @subscription_ids,
               record: record,
               old_record: old_record,
               errors: ["Error..."]
             } = generate_record(wal_record)

      # Encode then decode to get rid of the fragment
      assert record |> Jason.encode!() |> Jason.decode!() == @record
      assert old_record |> Jason.encode!() |> Jason.decode!() == @old_record
      assert columns |> Jason.encode!() |> Jason.decode!() == @columns
    end

    test "DELETE, large payload error present" do
      wal_record = [
        "DELETE",
        "public",
        "todos",
        Jason.encode!(@columns),
        nil,
        Jason.encode!(@old_record),
        @ts,
        [@subscription_id],
        ["Error 413: Payload Too Large"],
        1
      ]

      assert %DeletedRecord{
               columns: columns,
               commit_timestamp: @ts,
               schema: "public",
               table: "todos",
               type: "DELETE",
               subscription_ids: @subscription_ids,
               old_record: old_record,
               errors: ["Error 413: Payload Too Large"]
             } = generate_record(wal_record)

      # Encode then decode to get rid of the fragment
      assert old_record |> Jason.encode!() |> Jason.decode!() == @old_record
      assert columns |> Jason.encode!() |> Jason.decode!() == @columns
    end

    test "DELETE, other errors present" do
      wal_record = [
        "DELETE",
        "public",
        "todos",
        Jason.encode!(@columns),
        nil,
        Jason.encode!(@old_record),
        @ts,
        [@subscription_id],
        ["Error..."],
        1
      ]

      assert %DeletedRecord{
               columns: columns,
               commit_timestamp: @ts,
               schema: "public",
               table: "todos",
               type: "DELETE",
               subscription_ids: @subscription_ids,
               old_record: old_record,
               errors: ["Error..."]
             } = generate_record(wal_record)

      # Encode then decode to get rid of the fragment
      assert old_record |> Jason.encode!() |> Jason.decode!() == @old_record
      assert columns |> Jason.encode!() |> Jason.decode!() == @columns
    end
  end

  describe "generate_record/1 JSON encoding" do
    test "subscription_ids is excluded from JSON encoding for INSERT" do
      wal_record = [
        "INSERT",
        "public",
        "todos",
        Jason.encode!(@columns),
        Jason.encode!(@record),
        nil,
        @ts,
        [@subscription_id],
        [],
        1
      ]

      record = generate_record(wal_record)
      encoded = Jason.decode!(Jason.encode!(record))

      refute Map.has_key?(encoded, "subscription_ids")
      assert encoded["type"] == "INSERT"
      assert encoded["schema"] == "public"
      assert encoded["table"] == "todos"
    end

    test "subscription_ids is excluded from JSON encoding for UPDATE" do
      wal_record = [
        "UPDATE",
        "public",
        "todos",
        Jason.encode!(@columns),
        Jason.encode!(@record),
        Jason.encode!(@old_record),
        @ts,
        [@subscription_id],
        [],
        1
      ]

      record = generate_record(wal_record)
      encoded = Jason.decode!(Jason.encode!(record))

      refute Map.has_key?(encoded, "subscription_ids")
      assert encoded["type"] == "UPDATE"
    end

    test "subscription_ids is excluded from JSON encoding for DELETE" do
      wal_record = [
        "DELETE",
        "public",
        "todos",
        Jason.encode!(@columns),
        nil,
        Jason.encode!(@old_record),
        @ts,
        [@subscription_id],
        [],
        1
      ]

      record = generate_record(wal_record)
      encoded = Jason.decode!(Jason.encode!(record))

      refute Map.has_key?(encoded, "subscription_ids")
      assert encoded["type"] == "DELETE"
    end
  end

  describe "get_pg_stat_activity_diff/2" do
    setup %{tenant: tenant} do
      {:ok, conn} = Database.connect(tenant, "realtime_rls", :stop)
      %{conn: conn}
    end

    test "returns error when pid is not in pg_stat_activity", %{conn: conn} do
      assert {:error, :pid_not_found} = Replications.get_pg_stat_activity_diff(conn, 0)
    end
  end

  describe "error handling" do
    setup %{tenant: tenant} do
      args =
        hd(tenant.extensions).settings
        |> Map.put("id", tenant.external_id)
        |> Map.put("subscribers_pids_table", :ets.new(__MODULE__, [:public, :bag]))
        |> Map.put("subscribers_nodes_table", :ets.new(__MODULE__, [:public, :set]))

      %{args: args}
    end

    test "stops cleanly when database connection fails", %{args: args} do
      expect(Realtime.Database, :connect_db, fn _settings -> {:error, :econnrefused} end)

      pid = start_supervised!({Poller, args}, restart: :temporary)
      ref = Process.monitor(pid)

      assert_receive {:DOWN, ^ref, :process, ^pid, {:shutdown, :econnrefused}}, 1000
    end
  end

  describe "slot_name_suffix/0" do
    setup do
      slot_name_suffix = Application.get_env(:realtime, :slot_name_suffix)

      on_exit(fn -> Application.put_env(:realtime, :slot_name_suffix, slot_name_suffix) end)
    end

    test "uses Application.get_env/2 with key :slot_name_suffix" do
      slot_name_suffix = Generators.random_string()
      Application.put_env(:realtime, :slot_name_suffix, slot_name_suffix)
      assert Poller.slot_name_suffix() == "_" <> slot_name_suffix
    end

    test "defaults to no suffix" do
      assert Poller.slot_name_suffix() == ""
    end
  end

  def handle_telemetry(event, measures, metadata, pid: pid), do: send(pid, {:telemetry, event, measures, metadata})

  defp build_result(subscription_ids) do
    {:ok,
     %Postgrex.Result{
       command: :select,
       columns: [
         "type",
         "schema",
         "table",
         "columns",
         "record",
         "old_record",
         "commit_timestamp",
         "subscription_ids",
         "errors",
         "slot_changes_count"
       ],
       rows: [
         [
           "INSERT",
           "public",
           "test",
           "[{\"name\": \"id\", \"type\": \"int4\"}, {\"name\": \"details\", \"type\": \"text\"}]",
           "{\"id\": 34, \"details\": \"test\"}",
           nil,
           "2025-10-13T07:50:28.066Z",
           subscription_ids,
           [],
           1
         ]
       ],
       num_rows: 1,
       connection_id: 123,
       messages: []
     }}
  end
end
