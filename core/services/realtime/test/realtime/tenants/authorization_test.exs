defmodule Realtime.Tenants.AuthorizationTest do
  use RealtimeWeb.ConnCase, async: true
  use Mimic

  setup :set_mimic_from_context

  import ExUnit.CaptureLog

  alias Realtime.Api.Message
  alias Realtime.Database
  alias Realtime.Tenants.Repo
  alias Realtime.Tenants.Authorization
  alias Realtime.Tenants.Authorization.Policies
  alias Realtime.Tenants.Authorization.Policies.BroadcastPolicies
  alias Realtime.Tenants.Authorization.Policies.PresencePolicies

  setup [:checkout_tenant_and_connect, :rls_context]

  describe "get_authorizations/3" do
    @tag role: "authenticated",
         policies: [
           :authenticated_read_broadcast_and_presence,
           :authenticated_write_broadcast_and_presence
         ]
    test "authenticated user has expected policies", context do
      {:ok, policies} =
        Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)

      {:ok, policies} =
        Authorization.get_write_authorizations(policies, context.db_conn, context.authorization_context, :broadcast)

      {:ok, policies} =
        Authorization.get_write_authorizations(policies, context.db_conn, context.authorization_context, :presence)

      assert %Policies{
               broadcast: %BroadcastPolicies{read: true, write: true},
               presence: %PresencePolicies{read: true, write: true}
             } == policies
    end

    @tag role: "authenticated",
         policies: [:authenticated_read_matching_user_sub],
         sub: "ccbdfd51-c5aa-4d61-8c17-647664466a26"
    test "authenticated user sub is available", context do
      assert {:ok, %Policies{broadcast: %BroadcastPolicies{read: true, write: nil}}} =
               Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)

      authorization_context = %{context.authorization_context | sub: "135f6d25-5840-4266-a8ca-b9a45960e424"}

      assert {:ok, %Policies{broadcast: %BroadcastPolicies{read: false, write: nil}}} =
               Authorization.get_read_authorizations(%Policies{}, context.db_conn, authorization_context)
    end

    @tag role: "authenticated",
         policies: [:read_matching_user_role]
    test "user role is exposed", context do
      assert {:ok, %Policies{broadcast: %BroadcastPolicies{read: true, write: nil}}} =
               Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)

      authorization_context = %{context.authorization_context | role: "anon"}

      assert {:ok, %Policies{broadcast: %BroadcastPolicies{read: false, write: nil}}} =
               Authorization.get_read_authorizations(%Policies{}, context.db_conn, authorization_context)
    end

    @tag role: "authenticated",
         policies: [:authenticated_read_broadcast, :authenticated_write_broadcast]
    test "checks only the requested broadcast write policy", context do
      {:ok, policies} =
        Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context,
          presence_enabled?: false
        )

      {:ok, policies} =
        Authorization.get_write_authorizations(policies, context.db_conn, context.authorization_context, :broadcast)

      # Presence is left unevaluated since it was not checked.
      assert %Policies{
               broadcast: %BroadcastPolicies{read: true, write: true},
               presence: %PresencePolicies{read: nil, write: nil}
             } == policies
    end

    @tag role: "authenticated", policies: [:authenticated_write_presence]
    test "checks only the requested presence write policy", context do
      {:ok, policies} =
        Authorization.get_write_authorizations(%Policies{}, context.db_conn, context.authorization_context, :presence)

      assert %Policies{
               broadcast: %BroadcastPolicies{read: nil, write: nil},
               presence: %PresencePolicies{read: nil, write: true}
             } == policies
    end

    @tag role: "authenticated", policies: [:authenticated_write_broadcast, :authenticated_write_persistence]
    test "checks only the requested persistence write policy", context do
      {:ok, policies} =
        Authorization.get_write_authorizations(
          %Policies{},
          context.db_conn,
          context.authorization_context,
          :persistence
        )

      # The persistence policy lands on broadcast.persist, leaving broadcast.write unevaluated.
      assert %Policies{
               broadcast: %BroadcastPolicies{read: nil, write: nil, persist: true},
               presence: %PresencePolicies{read: nil, write: nil}
             } == policies
    end

    @tag role: "authenticated", policies: [:authenticated_write_broadcast]
    test "denies persistence when only the broadcast write policy exists", context do
      {:ok, policies} =
        Authorization.get_write_authorizations(%Policies{}, context.db_conn, context.authorization_context, :broadcast)

      {:ok, policies} =
        Authorization.get_write_authorizations(policies, context.db_conn, context.authorization_context, :persistence)

      assert %Policies{
               broadcast: %BroadcastPolicies{read: nil, write: true, persist: false},
               presence: %PresencePolicies{read: nil, write: nil}
             } == policies
    end

    @tag role: "anon",
         policies: [
           :authenticated_read_broadcast_and_presence,
           :authenticated_write_broadcast_and_presence
         ]
    test "anon user has no policies", context do
      {:ok, policies} =
        Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)

      {:ok, policies} =
        Authorization.get_write_authorizations(policies, context.db_conn, context.authorization_context, :broadcast)

      {:ok, policies} =
        Authorization.get_write_authorizations(policies, context.db_conn, context.authorization_context, :presence)

      assert %Policies{
               broadcast: %BroadcastPolicies{read: false, write: false},
               presence: %PresencePolicies{read: false, write: false}
             } == policies
    end

    @tag role: "anon", policies: []
    test "db process is down", context do
      pid = spawn(fn -> :ok end)

      {:error, :increase_connection_pool} =
        Authorization.get_read_authorizations(%Policies{}, pid, context.authorization_context)

      {:error, :increase_connection_pool} =
        Authorization.get_write_authorizations(%Policies{}, pid, context.authorization_context, :broadcast)
    end

    @tag role: "anon", policies: []
    test "get_read_authorizations rate limit when db has many connection errors", context do
      update_db_pool_size(context.tenant, 5)
      pid = spawn(fn -> :ok end)

      log =
        capture_log(fn ->
          for _ <- 1..6 do
            {:error, :increase_connection_pool} =
              Authorization.get_read_authorizations(%Policies{}, pid, context.authorization_context)
          end

          rate_counter = Realtime.Tenants.authorization_errors_per_second_rate(context.tenant)
          RateCounterHelper.tick!(rate_counter)
          reject(&Database.transaction/4)

          for _ <- 1..10 do
            {:error, :increase_connection_pool} =
              Authorization.get_read_authorizations(%Policies{}, pid, context.authorization_context)
          end
        end)

      assert log =~ "IncreaseConnectionPool: Too many database timeouts"
      assert length(String.split(log, "IncreaseConnectionPool: Too many database timeouts")) <= 3
    end

    @tag role: "anon", policies: []
    test "get_write_authorizations rate limit when db has many connection errors", context do
      update_db_pool_size(context.tenant, 5)
      pid = spawn(fn -> :ok end)

      log =
        capture_log(fn ->
          for _ <- 1..6 do
            {:error, :increase_connection_pool} =
              Authorization.get_write_authorizations(%Policies{}, pid, context.authorization_context, :broadcast)
          end

          rate_counter = Realtime.Tenants.authorization_errors_per_second_rate(context.tenant)
          RateCounterHelper.tick!(rate_counter)
          reject(&Database.transaction/4)

          for _ <- 1..10 do
            {:error, :increase_connection_pool} =
              Authorization.get_write_authorizations(%Policies{}, pid, context.authorization_context, :broadcast)
          end
        end)

      assert log =~ "IncreaseConnectionPool: Too many database timeouts"
      assert length(String.split(log, "IncreaseConnectionPool: Too many database timeouts")) == 2
    end
  end

  describe "database error" do
    @tag role: "authenticated",
         policies: [
           :authenticated_read_broadcast_and_presence,
           :authenticated_write_broadcast_and_presence
         ],
         timeout: :timer.minutes(1)
    test "handles small pool size", context do
      db_conn = saturable_conn(context.tenant)
      TestHelpers.hold_connections!(db_conn)

      log =
        capture_log(fn ->
          t1 =
            Task.async(fn ->
              assert {:error, :increase_connection_pool} =
                       Authorization.get_read_authorizations(
                         %Policies{},
                         db_conn,
                         context.authorization_context
                       )
            end)

          t2 =
            Task.async(fn ->
              assert {:error, :increase_connection_pool} =
                       Authorization.get_write_authorizations(
                         %Policies{},
                         db_conn,
                         context.authorization_context,
                         :broadcast
                       )
            end)

          Task.await_many([t1, t2], 20_000)
          rate_counter = Realtime.Tenants.authorization_errors_per_second_rate(context.tenant)
          RateCounterHelper.tick!(rate_counter)
        end)

      external_id = context.tenant.external_id
      assert log =~ "project=#{external_id} external_id=#{external_id} [error] ErrorExecutingTransaction"

      assert log =~
               "project=#{external_id} external_id=#{external_id} [critical] IncreaseConnectionPool: Too many database timeouts"
    end

    @tag role: "authenticated",
         policies: [:broken_read_presence, :broken_write_presence]
    test "broken RLS policy sets policies to false and shows error to user", context do
      assert {:error, :rls_policy_error, %Postgrex.Error{}} =
               Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)

      assert {:error, :rls_policy_error, %Postgrex.Error{}} =
               Authorization.get_write_authorizations(
                 %Policies{},
                 context.db_conn,
                 context.authorization_context,
                 :presence
               )

      assert {:error, :rls_policy_error, %Postgrex.Error{}} =
               Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)

      assert {:error, :rls_policy_error, %Postgrex.Error{}} =
               Authorization.get_write_authorizations(
                 %Policies{},
                 context.db_conn,
                 context.authorization_context,
                 :presence
               )

      assert {:error, :rls_policy_error, %Postgrex.Error{}} =
               Authorization.get_write_authorizations(
                 %Policies{},
                 context.db_conn,
                 context.authorization_context,
                 :presence
               )
    end
  end

  describe "ensure database stays clean" do
    @tag role: "authenticated",
         policies: [
           :authenticated_read_broadcast_and_presence,
           :authenticated_write_broadcast_and_presence
         ]
    test "authenticated user has expected policies", context do
      {:ok, _} = Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)

      {:ok, policies} =
        Authorization.get_write_authorizations(%Policies{}, context.db_conn, context.authorization_context, :broadcast)

      {:ok, _} =
        Authorization.get_write_authorizations(policies, context.db_conn, context.authorization_context, :presence)

      {:ok, db_conn} = Database.connect(context.tenant, "realtime_test")
      assert {:ok, []} = Repo.all(db_conn, Message, Message)
    end
  end

  describe "database error classification" do
    @tag role: "anon", policies: []
    test "invalid_parameter_value Postgrex error is classified as rls_policy_error", context do
      stub(Database, :transaction, fn _, _, _, _ ->
        {:error,
         %Postgrex.Error{postgres: %{code: :invalid_parameter_value, message: "role \"super_admin\" does not exist"}}}
      end)

      assert {:error, :rls_policy_error, %Postgrex.Error{}} =
               Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)

      assert {:error, :rls_policy_error, %Postgrex.Error{}} =
               Authorization.get_write_authorizations(
                 %Policies{},
                 context.db_conn,
                 context.authorization_context,
                 :broadcast
               )
    end

    @tag role: "anon", policies: []
    test "query_canceled is classified as query_canceled", context do
      query_canceled = %Postgrex.Error{
        postgres: %{code: :query_canceled, message: "canceling statement due to user request"}
      }

      stub(Database, :transaction, fn _, _, _, _ ->
        {:error, query_canceled}
      end)

      assert {:error, :query_canceled, %Postgrex.Error{}} =
               Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)

      assert {:error, :query_canceled, %Postgrex.Error{}} =
               Authorization.get_write_authorizations(
                 %Policies{},
                 context.db_conn,
                 context.authorization_context,
                 :broadcast
               )
    end

    @tag role: "anon", policies: []
    test "check_violation on messages is classified as missing_partition", context do
      check_violation = %Postgrex.Error{
        postgres: %{
          code: :check_violation,
          table: "messages",
          message: "no partition of relation \"messages\" found for row"
        }
      }

      stub(Database, :transaction, fn _, _, _, _ ->
        {:error, check_violation}
      end)

      assert {:error, :missing_partition} =
               Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)

      assert {:error, :missing_partition} =
               Authorization.get_write_authorizations(
                 %Policies{},
                 context.db_conn,
                 context.authorization_context,
                 :broadcast
               )
    end

    @tag role: "anon", policies: []
    test "DBConnection.ConnectionError is classified as tenant_database_unavailable", context do
      stub(Database, :transaction, fn _, _, _, _ ->
        {:error, %DBConnection.ConnectionError{message: "ssl recv: closed", severity: :error, reason: :error}}
      end)

      assert {:error, :tenant_database_unavailable} =
               Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)

      assert {:error, :tenant_database_unavailable} =
               Authorization.get_write_authorizations(
                 %Policies{},
                 context.db_conn,
                 context.authorization_context,
                 :broadcast
               )
    end

    @tag role: "anon", policies: []
    test "ssl recv: closed ConnectionError from Repo on read is classified as tenant_database_unavailable", context do
      conn_error = %DBConnection.ConnectionError{message: "ssl recv: closed", severity: :error, reason: :closed}
      stub(Repo, :insert_all_entries, fn _, _, _, _ -> {:error, conn_error} end)

      assert {:error, :tenant_database_unavailable} =
               Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)
    end

    @tag role: "anon", policies: []
    test "ssl recv: closed ConnectionError from Repo on write is classified as tenant_database_unavailable", context do
      conn_error = %DBConnection.ConnectionError{message: "ssl recv: closed", severity: :error, reason: :closed}
      stub(Repo, :insert, fn _, _, _, _ -> {:error, conn_error} end)

      assert {:error, :tenant_database_unavailable} =
               Authorization.get_write_authorizations(
                 %Policies{},
                 context.db_conn,
                 context.authorization_context,
                 :broadcast
               )
    end

    @tag role: "anon", policies: []
    test "ssl recv: closed ConnectionError from Repo.all on read is classified as tenant_database_unavailable",
         context do
      conn_error = %DBConnection.ConnectionError{message: "ssl recv: closed", severity: :error, reason: :closed}
      stub(Repo, :all, fn _, _, _ -> {:error, conn_error} end)

      assert {:error, :tenant_database_unavailable} =
               Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)
    end
  end

  describe "telemetry" do
    @tag role: "authenticated",
         policies: [
           :authenticated_read_broadcast_and_presence,
           :authenticated_write_broadcast_and_presence
         ]

    test "sends telemetry event", context do
      on_exit(fn -> :telemetry.detach(__MODULE__) end)

      events = [
        [:realtime, :tenants, :write_authorization_check],
        [:realtime, :tenants, :read_authorization_check]
      ]

      :telemetry.attach_many(
        __MODULE__,
        events,
        fn event, measurements, metadata, _config ->
          send(self(), {:telemetry_event, event, measurements, metadata})
        end,
        %{}
      )

      {:ok, _} = Authorization.get_read_authorizations(%Policies{}, context.db_conn, context.authorization_context)

      {:ok, _} =
        Authorization.get_write_authorizations(
          %Policies{},
          context.db_conn,
          context.authorization_context,
          :broadcast
        )

      external_id = context.authorization_context.tenant_id

      assert_receive {:telemetry_event, [:realtime, :tenants, :read_authorization_check], %{latency: _},
                      %{tenant: ^external_id}}

      assert_receive {:telemetry_event, [:realtime, :tenants, :write_authorization_check], %{latency: _},
                      %{tenant: ^external_id}}
    end
  end

  defp update_db_pool_size(tenant, db_pool) do
    extension = hd(tenant.extensions)

    settings = Map.put(extension.settings, "db_pool", db_pool)

    extensions = [Map.from_struct(%{extension | :settings => settings})]

    {:ok, tenant} = Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{extensions: extensions})

    Realtime.Tenants.Cache.update_cache(tenant)
  end

  # A one-connection pool that sheds a queued checkout in a few hundred milliseconds so tests
  # can assert how Authorization reports a `:queue_timeout` error.
  defp saturable_conn(tenant) do
    {:ok, settings} = Database.from_tenant(tenant, "realtime_test", :stop)
    # Linked to the test process, so it comes down with the test; no explicit teardown needed.
    {:ok, db_conn} = Database.connect_db(settings, queue_target: 50, queue_interval: 100)
    db_conn
  end
end
