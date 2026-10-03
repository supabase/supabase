defmodule Extensions.PostgresCdcRls.SynchronousCommitDeliveryTest do
  # Postgres Changes delivers every committed change, including one whose COMMIT waited for a
  # synchronous standby.
  #
  # PostgreSQL writes the commit record to disk before that wait, so logical decoding can return
  # the INSERT while the writer is still in the proc array and no snapshot can see the row. A
  # policy that reads the row then matches nothing and the change is authorized for zero
  # subscribers, yet list_changes still consumes it from the slot.
  #
  # Both tests need RLS: without a policy that reads the row, apply_rls authorizes straight from
  # the WAL record and never looks the row up, so neither would exercise the window.
  #
  # `realtime.settled_changes` closes it by leaving a transaction that is still in flight in the
  # slot, so the next poll delivers it rather than authorizing it against a row nobody can see.
  use Realtime.DataCase, async: false

  alias Extensions.PostgresCdcRls.Replications
  alias Extensions.PostgresCdcRls.Subscriptions
  alias Realtime.Database

  @publication "supabase_realtime_test"
  @claims %{"role" => "anon", "audience" => "allowed"}

  setup do
    tenant = TestTenantDb.checkout_tenant(run_migrations: true)
    {:ok, conn} = Database.connect(tenant, "realtime_rls", :stop)
    Integrations.setup_postgres_changes(conn)

    # setup_postgres_changes leaves public.test without RLS, which is the one thing these tests
    # need: a policy that has to read the row before the change can be authorized.
    Postgrex.query!(conn, "ALTER TABLE public.test ENABLE ROW LEVEL SECURITY", [])

    Postgrex.query!(
      conn,
      """
      CREATE POLICY audience_read ON public.test TO anon
      USING (details = current_setting('request.jwt.claims', true)::jsonb ->> 'audience')
      """,
      []
    )

    slot = "sync_commit_#{System.unique_integer([:positive])}"
    {:ok, _} = subscribe(conn)

    %{conn: conn, tenant: tenant, slot: slot}
  end

  # A Multigres cluster commits behind a synchronous standby on every write and points
  # synchronized_standby_slots at its followers, so the window is open here without arranging
  # anything. On a single-server image there is no window and this would pass vacuously.
  @tag :requires_synchronous_standby
  test "concurrent writes all reach the subscriber", %{conn: conn, tenant: tenant, slot: slot} do
    {:ok, _} = Replications.prepare_replication(conn, slot)

    {:ok, writer} = Database.connect(tenant, "realtime_test", :stop)
    inserts = 200
    parent = self()

    spawn(fn ->
      for _ <- 1..inserts, do: Postgrex.query!(writer, "INSERT INTO public.test (details) VALUES ('allowed')", [])
      send(parent, :writes_done)
    end)

    delivered = collect(conn, slot, 0)

    assert delivered == inserts,
           "#{inserts - delivered} of #{inserts} INSERTs were consumed from the slot but never " <>
             "reached the subscriber"
  end

  # The same window on a plain single server, which shows the fix is Realtime's rather than
  # anything the cluster does for us. Naming a standby that does not exist parks the commit
  # indefinitely, so the poll is guaranteed to land inside a window that is microseconds wide in
  # production. Needs the docker backend for ALTER SYSTEM. Skipped on OrioleDB, where a
  # transaction that writes only OrioleDB tables has no Postgres xid and cannot be deferred.
  @tag :requires_docker_backend
  @tag :skip_orioledb
  test "a change committing behind a synchronous standby is deferred, not dropped", %{
    conn: conn,
    tenant: tenant,
    slot: slot
  } do
    on_exit(fn ->
      {:ok, reset} = Database.connect(tenant, "realtime_test", :stop)
      Postgrex.query(reset, "SELECT pg_cancel_backend(pid) FROM (#{waiting_in_syncrep()}) w", [])
      Postgrex.query(reset, "ALTER SYSTEM RESET synchronous_standby_names", [])
      Postgrex.query(reset, "SELECT pg_reload_conf()", [])
    end)

    {:ok, _} = Replications.prepare_replication(conn, slot)

    Postgrex.query!(conn, "ALTER SYSTEM SET synchronous_standby_names = 'FIRST 1 (absent_standby)'", [])
    Postgrex.query!(conn, "SELECT pg_reload_conf()", [])

    assert_eventually %{rows: [["FIRST 1 (absent_standby)"]]} =
                        Postgrex.query!(conn, "SHOW synchronous_standby_names", [])

    {:ok, writer} = Database.connect(tenant, "realtime_test", :stop)
    spawn(fn -> Postgrex.query(writer, "INSERT INTO public.test (details) VALUES ('allowed')", [], timeout: 30_000) end)

    assert_eventually %{num_rows: 1} = Postgrex.query!(conn, waiting_in_syncrep(), [])

    # The commit record is already on disk and decodable, but no snapshot can see the row.
    assert %{rows: [[0]]} = Postgrex.query!(conn, "SELECT count(*)::int FROM public.test", [])
    assert authorized(conn, slot) == 0

    Postgrex.query!(conn, "SELECT pg_cancel_backend(pid) FROM (#{waiting_in_syncrep()}) w", [])
    assert_eventually %{rows: [[1]]} = Postgrex.query!(conn, "SELECT count(*)::int FROM public.test", [])

    # Left in the slot rather than consumed, so it arrives now instead of being lost.
    assert_eventually authorized(conn, slot) == 1
  end

  # P inserts first and its COMMIT parks behind the standby; Q inserts after it and commits
  # locally, so Q's commit lands in front of P's while P's change sits earlier in the WAL. The
  # read has to stop right after Q's commit: one change further and it would take P too.
  @tag :requires_docker_backend
  @tag :skip_orioledb
  test "a settled commit in front of a parked one is delivered alone", %{conn: conn, tenant: tenant, slot: slot} do
    on_exit(fn ->
      {:ok, reset} = Database.connect(tenant, "realtime_test", :stop)
      Postgrex.query(reset, "SELECT pg_cancel_backend(pid) FROM (#{waiting_in_syncrep()}) w", [])
      Postgrex.query(reset, "ALTER SYSTEM RESET synchronous_standby_names", [])
      Postgrex.query(reset, "SELECT pg_reload_conf()", [])
    end)

    {:ok, _} = Replications.prepare_replication(conn, slot)

    Postgrex.query!(conn, "ALTER SYSTEM SET synchronous_standby_names = 'FIRST 1 (absent_standby)'", [])
    Postgrex.query!(conn, "SELECT pg_reload_conf()", [])

    assert_eventually %{rows: [["FIRST 1 (absent_standby)"]]} =
                        Postgrex.query!(conn, "SHOW synchronous_standby_names", [])

    {:ok, parked} = Database.connect(tenant, "realtime_parked", :stop)
    {:ok, local} = Database.connect(tenant, "realtime_local", :stop)
    parent = self()

    p =
      spawn(fn ->
        Postgrex.transaction(
          parked,
          fn tx ->
            %{rows: [[id]]} =
              Postgrex.query!(tx, "INSERT INTO public.test (details) VALUES ('allowed') RETURNING id", [])

            send(parent, {:p_inserted, id})
            receive do: (:commit -> :ok)
          end,
          timeout: 30_000
        )
      end)

    assert_receive {:p_inserted, p_id}, 5_000

    {:ok, q_id} =
      Postgrex.transaction(local, fn tx ->
        Postgrex.query!(tx, "SET LOCAL synchronous_commit = local", [])
        %{rows: [[id]]} = Postgrex.query!(tx, "INSERT INTO public.test (details) VALUES ('allowed') RETURNING id", [])
        id
      end)

    send(p, :commit)
    assert_eventually %{num_rows: 1} = Postgrex.query!(conn, waiting_in_syncrep(), [])

    assert delivered_ids(conn, slot) == [q_id]
    assert delivered_ids(conn, slot) == []

    Postgrex.query!(conn, "SELECT pg_cancel_backend(pid) FROM (#{waiting_in_syncrep()}) w", [])
    assert_eventually %{rows: [[2]]} = Postgrex.query!(conn, "SELECT count(*)::int FROM public.test", [])

    assert delivered_ids(conn, slot) == [p_id]
    assert delivered_ids(conn, slot) == []
  end

  # Transactions on tables outside the publication decode to nothing, so they must not count
  # against max_changes: a published change behind them arrives in the same poll.
  test "a change behind transactions on other tables arrives in one poll", %{conn: conn, tenant: tenant, slot: slot} do
    Postgrex.query!(conn, "CREATE TABLE public.unpublished (id serial primary key)", [])
    Postgrex.query!(conn, "CREATE PUBLICATION sync_commit_test_only FOR TABLE public.test", [])
    {:ok, _} = Replications.prepare_replication(conn, slot)
    {:ok, writer} = Database.connect(tenant, "realtime_test", :stop)

    for _ <- 1..1000, do: Postgrex.query!(writer, "INSERT INTO public.unpublished DEFAULT VALUES", [])
    Postgrex.query!(writer, "INSERT INTO public.test (details) VALUES ('allowed')", [])

    assert authorized(conn, slot, publication: "sync_commit_test_only", max_changes: 100) == 1
  end

  # A non-transactional logical message is decoded as soon as it is written, tagged with the xid
  # of the transaction that wrote it. That transaction is still open, but the message says
  # nothing about where it starts, so it must not hold back the changes behind it.
  test "a message from an open transaction does not hold back delivery", %{conn: conn, tenant: tenant, slot: slot} do
    {:ok, _} = Replications.prepare_replication(conn, slot)
    {:ok, holder} = Database.connect(tenant, "realtime_holder", :stop)
    {:ok, writer} = Database.connect(tenant, "realtime_test", :stop)
    parent = self()

    held =
      spawn(fn ->
        Postgrex.transaction(
          holder,
          fn tx ->
            Postgrex.query!(tx, "SELECT pg_current_xact_id()", [])
            Postgrex.query!(tx, "SELECT pg_logical_emit_message(false, 'realtime_test', 'open')", [])
            send(parent, :emitted)
            receive do: (:release -> :ok)
          end,
          timeout: 30_000
        )

        send(parent, :committed)
      end)

    assert_receive :emitted, 5_000
    Postgrex.query!(writer, "INSERT INTO public.test (details) VALUES ('allowed')", [])

    assert authorized(conn, slot) == 1

    send(held, :release)
    assert_receive :committed, 5_000
  end

  @tag :requires_docker_backend
  test "synchronous_standby/1 follows synchronous_standby_names", %{conn: conn, tenant: tenant} do
    on_exit(fn ->
      {:ok, reset} = Database.connect(tenant, "realtime_test", :stop)
      Postgrex.query(reset, "ALTER SYSTEM RESET synchronous_standby_names", [])
      Postgrex.query(reset, "SELECT pg_reload_conf()", [])
    end)

    assert {:ok, false} = Replications.synchronous_standby(conn)

    Postgrex.query!(conn, "ALTER SYSTEM SET synchronous_standby_names = 'FIRST 1 (absent_standby)'", [])
    Postgrex.query!(conn, "SELECT pg_reload_conf()", [])
    assert_eventually Replications.synchronous_standby(conn) == {:ok, true}

    Postgrex.query!(conn, "ALTER SYSTEM RESET synchronous_standby_names", [])
    Postgrex.query!(conn, "SELECT pg_reload_conf()", [])
    assert_eventually Replications.synchronous_standby(conn) == {:ok, false}
  end

  @tag :requires_synchronous_standby
  test "synchronous_standby/1 sees the standby a Multigres cluster waits for", %{conn: conn} do
    assert {:ok, true} = Replications.synchronous_standby(conn)
  end

  # An in-flight transaction puts a row in the same invisible state a synchronous commit does,
  # without needing a standby. list_changes must leave that change in the slot rather than
  # resolving a policy against a row it cannot see, and must deliver it once it settles.
  test "an invisible change is deferred and delivered once it settles", %{conn: conn, tenant: tenant, slot: slot} do
    {:ok, _} = Replications.prepare_replication(conn, slot)
    {:ok, settled_writer} = Database.connect(tenant, "realtime_settled", :stop)
    {:ok, holder} = Database.connect(tenant, "realtime_holder", :stop)

    Postgrex.query!(settled_writer, "INSERT INTO public.test (details) VALUES ('allowed')", [])

    parent = self()

    held =
      spawn(fn ->
        Postgrex.transaction(
          holder,
          fn tx ->
            Postgrex.query!(tx, "INSERT INTO public.test (details) VALUES ('allowed')", [])
            send(parent, :inserted)
            receive do: (:release -> :ok)
          end,
          timeout: 30_000
        )

        send(parent, :committed)
      end)

    assert_receive :inserted, 5_000

    # Only the settled row is delivered, and the in-flight one is not consumed.
    assert authorized(conn, slot) == 1
    assert authorized(conn, slot) == 0

    send(held, :release)
    assert_receive :committed, 5_000

    # Still in the slot, so it arrives now rather than being lost.
    assert_eventually authorized(conn, slot) == 1
  end

  # Deferral keys on visibility, never on authorization. A change the policy denies reaches
  # nobody, but it must still leave the slot: retrying it would wedge the poller on any row no
  # subscriber is entitled to, which is the common case on a multi-tenant table.
  test "a change the policy denies is consumed rather than retried", %{conn: conn, tenant: tenant, slot: slot} do
    {:ok, _} = Replications.prepare_replication(conn, slot)
    {:ok, writer} = Database.connect(tenant, "realtime_test", :stop)

    Postgrex.query!(writer, "INSERT INTO public.test (details) VALUES ('denied')", [])
    Postgrex.query!(writer, "INSERT INTO public.test (details) VALUES ('allowed')", [])

    # Both changes leave the slot; only the authorized one is delivered.
    assert {1, 2} = poll(conn, slot)

    # Nothing is left behind, so the denied change is not waiting to be retried.
    assert {0, 0} = poll(conn, slot)
  end

  defp subscribe(conn) do
    {:ok, params} =
      Subscriptions.parse_subscription_params(%{"event" => "INSERT", "schema" => "public", "table" => "test"})

    Subscriptions.create(
      conn,
      @publication,
      [%{claims: @claims, id: UUID.uuid1(), subscription_params: params}],
      self(),
      self()
    )
  end

  defp waiting_in_syncrep do
    "SELECT pid FROM pg_stat_activity WHERE wait_event = 'SyncRep' AND backend_type = 'client backend'"
  end

  # slot_changes_count rides on every row, including the sentinel, and counts what the poll took
  # from the slot regardless of who it reached.
  defp poll(conn, slot) do
    {:ok, %Postgrex.Result{rows: rows}} =
      Replications.list_changes(conn,
        slot_name: slot,
        publication: @publication,
        max_changes: 1000,
        max_record_bytes: 1_048_576,
        synchronous_standby: true
      )

    delivered =
      Enum.count(rows, fn
        ["INSERT", "public", "test", _cols, _record, _old, _ts, subscription_ids, _errors, _count] ->
          subscription_ids != []

        _sentinel ->
          false
      end)

    consumed = rows |> Enum.map(&List.last/1) |> Enum.max(fn -> 0 end)
    {delivered, consumed}
  end

  # A change authorized for nobody is not returned at all - only the sentinel's consumed count
  # moves - so counting the authorized rows is what shows the loss.
  defp authorized(conn, slot, opts \\ []), do: conn |> authorized_rows(slot, opts) |> length()

  defp delivered_ids(conn, slot) do
    conn
    |> authorized_rows(slot, [])
    |> Enum.map(fn [_, _, _, _, record | _] -> record |> Jason.decode!() |> Map.fetch!("id") end)
  end

  defp authorized_rows(conn, slot, opts) do
    {:ok, %Postgrex.Result{rows: rows}} =
      Replications.list_changes(conn,
        slot_name: slot,
        publication: Keyword.get(opts, :publication, @publication),
        max_changes: Keyword.get(opts, :max_changes, 1000),
        max_record_bytes: 1_048_576,
        synchronous_standby: true
      )

    Enum.filter(rows, fn
      ["INSERT", "public", "test", _cols, _record, _old, _ts, subscription_ids, _errors, _count] ->
        subscription_ids != []

      _sentinel ->
        false
    end)
  end

  defp collect(conn, slot, delivered) do
    delivered = delivered + authorized(conn, slot)

    receive do
      :writes_done -> drain(conn, slot, delivered)
    after
      0 -> collect(conn, slot, delivered)
    end
  end

  # Stop only after several consecutive empty polls: one proves nothing while the writer's WAL
  # is still being decoded.
  defp drain(conn, slot, delivered, empty \\ 0)
  defp drain(_conn, _slot, delivered, 5), do: delivered

  defp drain(conn, slot, delivered, empty) do
    case authorized(conn, slot) do
      0 -> drain(conn, slot, delivered, empty + 1)
      n -> drain(conn, slot, delivered + n, 0)
    end
  end
end
