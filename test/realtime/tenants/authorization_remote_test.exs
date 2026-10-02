defmodule Realtime.Tenants.AuthorizationRemoteTest do
  # async: false due to usage of Clustered
  use RealtimeWeb.ConnCase, async: false
  use Mimic

  setup :set_mimic_from_context

  import ExUnit.CaptureLog

  # Booting a peer node is expensive (~seconds) and generic across these tests, so start one
  # shared node for the whole module and reuse it. async: false already serializes the module.
  setup_all do
    {:ok, node} = Clustered.start()
    %{node: node}
  end

  alias Realtime.Database
  alias Realtime.Tenants
  alias Realtime.Tenants.Authorization
  alias Realtime.Tenants.Authorization.Policies
  alias Realtime.Tenants.Authorization.Policies.BroadcastPolicies
  alias Realtime.Tenants.Authorization.Policies.PresencePolicies
  alias Realtime.Tenants.Connect

  setup [:remote_rls_context]

  describe "get_authorizations" do
    @tag role: "authenticated",
         policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "authenticated user has expected policies", context do
      {:ok, policies} =
        Authorization.get_read_authorizations(
          %Policies{},
          context.db_conn,
          context.authorization_context
        )

      assert %Policies{
               broadcast: %BroadcastPolicies{read: true, write: nil},
               presence: %PresencePolicies{read: true, write: nil}
             } == policies

      {:ok, policies} =
        Authorization.get_write_authorizations(
          policies,
          context.db_conn,
          context.authorization_context,
          :broadcast
        )

      {:ok, policies} =
        Authorization.get_write_authorizations(
          policies,
          context.db_conn,
          context.authorization_context,
          :presence
        )

      assert %Policies{
               broadcast: %BroadcastPolicies{read: true, write: true},
               presence: %PresencePolicies{read: true, write: true}
             } == policies
    end

    @tag role: "anon",
         policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "anon user has no policies", context do
      {:ok, policies} =
        Authorization.get_read_authorizations(
          %Policies{},
          context.db_conn,
          context.authorization_context
        )

      assert %Policies{
               broadcast: %BroadcastPolicies{read: false, write: nil},
               presence: %PresencePolicies{read: false, write: nil}
             } == policies

      {:ok, policies} =
        Authorization.get_write_authorizations(
          policies,
          context.db_conn,
          context.authorization_context,
          :broadcast
        )

      {:ok, policies} =
        Authorization.get_write_authorizations(
          policies,
          context.db_conn,
          context.authorization_context,
          :presence
        )

      assert %Policies{
               broadcast: %BroadcastPolicies{read: false, write: false},
               presence: %PresencePolicies{read: false, write: false}
             } == policies
    end

    @tag role: "anon",
         policies: []
    test "db process is down", context do
      db_conn = :erpc.call(context.node, :erlang, :self, [])

      {:error, :increase_connection_pool} =
        Authorization.get_read_authorizations(%Policies{}, db_conn, context.authorization_context)

      {:error, :increase_connection_pool} =
        Authorization.get_write_authorizations(%Policies{}, db_conn, context.authorization_context, :broadcast)
    end

    @tag role: "anon", policies: []
    test "get_read_authorizations rate limit when db has many connection errors", context do
      pid = :erpc.call(context.node, :erlang, :self, [])

      log =
        capture_log(fn ->
          for _ <- 1..6 do
            {:error, :increase_connection_pool} =
              Authorization.get_read_authorizations(%Policies{}, pid, context.authorization_context)
          end

          rate_counter = Realtime.Tenants.authorization_errors_per_second_rate(context.tenant)
          RateCounterHelper.tick!(rate_counter)

          for _ <- 1..10 do
            {:error, :increase_connection_pool} =
              Authorization.get_read_authorizations(%Policies{}, pid, context.authorization_context)
          end
        end)

      assert log =~ "IncreaseConnectionPool: Too many database timeouts"
      assert length(String.split(log, "IncreaseConnectionPool: Too many database timeouts")) == 2
    end

    @tag role: "anon", policies: []
    test "get_write_authorizations rate limit when db has many connection errors", context do
      pid = spawn(fn -> :ok end)

      log =
        capture_log(fn ->
          for _ <- 1..6 do
            {:error, :increase_connection_pool} =
              Authorization.get_write_authorizations(%Policies{}, pid, context.authorization_context, :broadcast)
          end

          rate_counter = Realtime.Tenants.authorization_errors_per_second_rate(context.tenant)
          RateCounterHelper.tick!(rate_counter)

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
         policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence],
         db_queue_target: 50,
         timeout: :timer.minutes(1)
    test "handles small pool size", context do
      TestHelpers.hold_connections!(context.db_conn)

      log =
        capture_log(fn ->
          t1 =
            Task.async(fn ->
              assert {:error, :increase_connection_pool} =
                       Authorization.get_read_authorizations(
                         %Policies{},
                         context.db_conn,
                         context.authorization_context
                       )
            end)

          t2 =
            Task.async(fn ->
              assert {:error, :increase_connection_pool} =
                       Authorization.get_write_authorizations(
                         %Policies{},
                         context.db_conn,
                         context.authorization_context,
                         :broadcast
                       )
            end)

          Task.await_many([t1, t2], 20_000)
          rate_counter = Realtime.Tenants.authorization_errors_per_second_rate(context.tenant)
          RateCounterHelper.tick!(rate_counter)
        end)

      external_id = context.tenant.external_id

      assert log =~
               "project=#{external_id} external_id=#{external_id} [critical] IncreaseConnectionPool: Too many database timeouts"
    end

    @tag role: "authenticated",
         policies: [:broken_read_presence, :broken_write_presence]
    test "broken RLS policy returns error", context do
      assert {:error, :rls_policy_error, %Postgrex.Error{}} =
               Authorization.get_read_authorizations(
                 %Policies{},
                 context.db_conn,
                 context.authorization_context
               )

      assert {:error, :rls_policy_error, %Postgrex.Error{}} =
               Authorization.get_write_authorizations(
                 %Policies{},
                 context.db_conn,
                 context.authorization_context,
                 :presence
               )

      assert {:error, :rls_policy_error, %Postgrex.Error{}} =
               Authorization.get_read_authorizations(
                 %Policies{},
                 context.db_conn,
                 context.authorization_context
               )

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

  defp remote_rls_context(%{node: node} = context) do
    tenant =
      TestTenantDb.checkout_tenant_unboxed(run_migrations: true)
      |> maybe_set_queue_target(Map.get(context, :db_queue_target))

    {:ok, local_db_conn} = Database.connect(tenant, "realtime_test", :stop)
    topic = random_string()

    clean_table(local_db_conn, "realtime", "messages")

    claims = %{sub: random_string(), role: context.role, exp: Joken.current_time() + 1_000}

    authorization_context =
      Authorization.build_authorization_params(%{
        tenant_id: tenant.external_id,
        topic: topic,
        claims: claims,
        headers: [{"header-1", "value-1"}],
        role: claims.role
      })

    Realtime.Tenants.create_messages_partitions(local_db_conn)
    create_rls_policies(local_db_conn, context.policies, %{topic: topic})

    region = Tenants.region(tenant)
    {:ok, db_conn} = :erpc.call(node, Connect, :connect, [tenant.external_id, region])

    assert node(db_conn) == node

    %{
      tenant: tenant,
      topic: topic,
      db_conn: db_conn,
      node: node,
      authorization_context: authorization_context
    }
  end

  # Writing extensions back re-encrypts the credential fields, so they have to go in as
  # plaintext or the next connection attempt resolves a ciphertext as a hostname.
  defp maybe_set_queue_target(tenant, nil), do: tenant

  defp maybe_set_queue_target(tenant, target) do
    extensions =
      Enum.map(tenant.extensions, fn extension ->
        settings =
          extension.settings
          |> Database.decrypt_settings()
          |> Map.put("db_queue_target", target)

        %{"type" => extension.type, "settings" => settings}
      end)

    # The tenant row was created outside the sandbox, so update it outside too.
    {:ok, tenant} =
      Ecto.Adapters.SQL.Sandbox.unboxed_run(Realtime.Repo, fn ->
        Realtime.Api.update_tenant_by_external_id(tenant.external_id, %{extensions: extensions})
      end)

    tenant
  end
end
