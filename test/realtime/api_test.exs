defmodule Realtime.ApiTest do
  use Realtime.DataCase, async: false

  use Mimic

  setup :set_mimic_from_context

  alias Realtime.Api
  alias Realtime.Api.Extensions, as: ApiExtensions
  alias Realtime.Api.FeatureFlag
  alias Realtime.Api.Tenant
  alias Realtime.Crypto
  alias Realtime.Env
  alias Realtime.GenCounter
  alias Realtime.GenRpc
  alias Realtime.Nodes
  alias Realtime.RateCounter
  alias Realtime.Tenants.Connect
  alias Extensions.PostgresCdcRls

  @db_conf Application.compile_env(:realtime, Realtime.Repo)

  defp create_tenants(_) do
    tenant1 = tenant_fixture(%{max_concurrent_users: 10_000_000})
    tenant2 = tenant_fixture(%{max_concurrent_users: 20_000_000})
    tenant3 = tenant_fixture(%{max_concurrent_users: 30_000_000})
    %{tenants: [tenant1, tenant2, tenant3]}
  end

  describe "list_tenants/0" do
    setup [:create_tenants]

    test "returns all tenants", %{tenants: tenants} do
      assert Api.list_tenants()

      Enum.each(tenants, fn tenant ->
        assert tenant in Api.list_tenants()
      end)
    end
  end

  describe "list_tenants/1" do
    setup [:create_tenants]

    test "list_tenants/1 returns filtered tenants", %{tenants: tenants} do
      assert hd(Api.list_tenants(search: hd(tenants).external_id)) == hd(tenants)

      assert Api.list_tenants(order_by: "max_concurrent_users", order: "desc", limit: 2) ==
               Enum.sort_by(tenants, & &1.max_concurrent_users, :desc) |> Enum.take(2)
    end
  end

  describe "list_existing_external_ids/1" do
    setup [:create_tenants]

    test "returns only the ids that have a tenant", %{tenants: [tenant1, tenant2, _]} do
      result = Api.list_existing_external_ids([tenant1.external_id, "nope", tenant2.external_id])

      assert Enum.sort(result) == Enum.sort([tenant1.external_id, tenant2.external_id])
    end

    test "returns an empty list when no id matches" do
      assert Api.list_existing_external_ids(["nope", "also-nope"]) == []
    end

    test "returns an empty list for an empty input" do
      assert Api.list_existing_external_ids([]) == []
    end

    test "does not read the replica", %{tenants: [tenant | _]} do
      # A tenant created moments ago must never read as absent, so the query has to hit the primary.
      Mimic.reject(&Realtime.Repo.Replica.replica/0)

      assert Api.list_existing_external_ids([tenant.external_id]) == [tenant.external_id]
    end
  end

  describe "get_tenant!/1" do
    setup [:create_tenants]

    test "returns the tenant with given id", %{tenants: [tenant | _]} do
      result = tenant.id |> Api.get_tenant!() |> Map.delete(:extensions)
      expected = tenant |> Map.delete(:extensions)
      assert result == expected
    end
  end

  describe "create_tenant/1" do
    test "valid data creates a tenant" do
      port = Env.unused_port()

      external_id = random_string()

      expect(Realtime.Tenants.Cache, :global_cache_update, fn tenant ->
        assert tenant.external_id == external_id
      end)

      valid_attrs = %{
        external_id: external_id,
        name: external_id,
        extensions: [
          %{
            "type" => "postgres_cdc_rls",
            "settings" => %{
              "db_host" => @db_conf[:hostname],
              "db_name" => @db_conf[:database],
              "db_user" => @db_conf[:username],
              "db_password" => @db_conf[:password],
              "db_port" => "#{port}",
              "poll_interval" => 100,
              "poll_max_changes" => 100,
              "poll_max_record_bytes" => 1_048_576,
              "region" => "us-east-1"
            }
          }
        ],
        postgres_cdc_default: "postgres_cdc_rls",
        jwt_secret: "new secret",
        max_concurrent_users: 200,
        max_events_per_second: 100
      }

      assert {:ok, %Tenant{} = tenant} = Api.create_tenant(valid_attrs)

      assert tenant.external_id == external_id
      assert Crypto.decrypt!(tenant.jwt_secret) == "new secret"
      assert tenant.name == external_id
      assert tenant.broadcast_adapter == :gen_rpc
    end

    test "invalid data returns error changeset" do
      reject(&Realtime.Tenants.Cache.global_cache_update/1)
      assert {:error, %Ecto.Changeset{}} = Api.create_tenant(%{external_id: nil, jwt_secret: nil, name: nil})
    end
  end

  describe "get_tenant_by_external_id/2" do
    setup [:create_tenants]

    test "fetch by external id", %{tenants: [tenant | _]} do
      %Tenant{extensions: [%ApiExtensions{} = extension]} =
        Api.get_tenant_by_external_id(tenant.external_id)

      assert Map.has_key?(extension.settings, "db_password")
      assert Crypto.decrypt!(extension.settings["db_password"]) == "postgres"
    end

    test "fetch by external id using replica", %{tenants: [tenant | _]} do
      %Tenant{extensions: [%ApiExtensions{} = extension]} =
        Api.get_tenant_by_external_id(tenant.external_id, use_replica?: true)

      assert Map.has_key?(extension.settings, "db_password")
      assert Crypto.decrypt!(extension.settings["db_password"]) == "postgres"
    end

    test "fetch by external id using no replica", %{tenants: [tenant | _]} do
      %Tenant{extensions: [%ApiExtensions{} = extension]} =
        Api.get_tenant_by_external_id(tenant.external_id, use_replica?: false)

      assert Map.has_key?(extension.settings, "db_password")
      assert Crypto.decrypt!(extension.settings["db_password"]) == "postgres"
    end

    test "rejects unknown options", %{tenants: [tenant | _]} do
      assert_raise ArgumentError, fn -> Api.get_tenant_by_external_id(tenant.external_id, use_replica: false) end
    end
  end

  describe "update_tenant_by_external_id/2" do
    setup [:create_tenants]

    test "valid data updates the tenant using external_id", %{tenants: [tenant | _]} do
      update_attrs = %{
        external_id: tenant.external_id,
        jwt_secret: "some updated jwt_secret",
        name: "some updated name"
      }

      assert {:ok, %Tenant{} = tenant} = Api.update_tenant_by_external_id(tenant.external_id, update_attrs)
      assert tenant.external_id == tenant.external_id

      assert Crypto.decrypt!(tenant.jwt_secret) == "some updated jwt_secret"
      assert tenant.name == "some updated name"
    end

    test "invalid data returns error changeset", %{tenants: [tenant | _]} do
      assert {:error, %Ecto.Changeset{}} =
               Api.update_tenant_by_external_id(tenant.external_id, %{external_id: nil, jwt_secret: nil, name: nil})
    end

    test "valid data and jwks change will send disconnect event", %{tenants: [tenant | _]} do
      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, "realtime:operations:" <> tenant.external_id)
      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{jwt_jwks: %{keys: ["test"]}})

      assert %Phoenix.Socket.Broadcast{
        payload: %{message: "Server requested disconnect", status: "ok", extension: "system"},
        event: "system",
        topic: nil
      }
    end

    test "valid data and jwt_secret change will send disconnect event", %{tenants: [tenant | _]} do
      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, "realtime:operations:" <> tenant.external_id)
      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{jwt_secret: "potato"})

      assert %Phoenix.Socket.Broadcast{
        payload: %{message: "Server requested disconnect", status: "ok", extension: "system"},
        event: "system",
        topic: nil
      }
    end

    test "valid data and suspend change will send disconnect event", %{tenants: [tenant | _]} do
      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, "realtime:operations:" <> tenant.external_id)
      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{suspend: true})

      assert %Phoenix.Socket.Broadcast{
        payload: %{message: "Server requested disconnect", status: "ok", extension: "system"},
        event: "system",
        topic: nil
      }
    end

    test "valid data but not updating jwt_secret or jwt_jwks won't send event", %{tenants: [tenant | _]} do
      :ok = Phoenix.PubSub.subscribe(Realtime.PubSub, "realtime:operations:" <> tenant.external_id)
      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{max_events_per_second: 100})
      refute_receive _any
    end

    test "valid data and jwt_secret change will restart the database connection", %{tenants: [tenant | _]} do
      expect(Connect, :shutdown, fn external_id ->
        assert external_id == tenant.external_id
        :ok
      end)

      expect(PostgresCdcRls, :handle_stop, fn external_id, timeout ->
        assert external_id == tenant.external_id
        assert timeout == 5_000
        :ok
      end)

      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{jwt_secret: "potato"})
    end

    test "valid data and suspend change will restart the database connection", %{tenants: [tenant | _]} do
      expect(Connect, :shutdown, fn external_id ->
        assert external_id == tenant.external_id
        :ok
      end)

      expect(PostgresCdcRls, :handle_stop, fn external_id, timeout ->
        assert external_id == tenant.external_id
        assert timeout == 5_000
        :ok
      end)

      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{suspend: true})
    end

    test "valid data and tenant data change will not restart the database connection", %{tenants: [tenant | _]} do
      reject(&Connect.shutdown/1)
      reject(&PostgresCdcRls.handle_stop/2)

      expect(Realtime.Tenants.Cache, :global_cache_update, fn tenant ->
        assert tenant.max_concurrent_users == 101
      end)

      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{max_concurrent_users: 101})
    end

    test "valid data and extensions data change will restart the database connection", %{tenants: [tenant | _]} do
      extensions = [
        %{
          "type" => "postgres_cdc_rls",
          "settings" => %{
            "db_host" => "127.0.0.1",
            "db_name" => "postgres",
            "db_user" => "supabase_admin",
            "db_password" => "postgres",
            "db_port" => "5432",
            "poll_interval" => 100,
            "poll_max_changes" => 100,
            "poll_max_record_bytes" => 1_048_576,
            "region" => "us-east-1",
            "publication" => "supabase_realtime_test",
            "ssl_enforced" => false
          }
        }
      ]

      expect(Connect, :shutdown, fn external_id ->
        assert external_id == tenant.external_id
        :ok
      end)

      expect(PostgresCdcRls, :handle_stop, fn external_id, timeout ->
        assert external_id == tenant.external_id
        assert timeout == 5_000
        :ok
      end)

      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{extensions: extensions})
    end

    test "valid data and jwt_jwks change will restart the database connection", %{tenants: [tenant | _]} do
      expect(Connect, :shutdown, fn external_id ->
        assert external_id == tenant.external_id
        :ok
      end)

      expect(PostgresCdcRls, :handle_stop, fn external_id, timeout ->
        assert external_id == tenant.external_id
        assert timeout == 5_000
        :ok
      end)

      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{jwt_jwks: %{keys: ["test"]}})
    end

    test "valid data and jwt_secret change will restart DB connection even if handle_stop times out", %{
      tenants: [tenant | _]
    } do
      expect(Connect, :shutdown, fn external_id ->
        assert external_id == tenant.external_id
        :ok
      end)

      expect(PostgresCdcRls, :handle_stop, fn _external_id, _timeout ->
        # Simulate timeout exit like DynamicSupervisor.stop/3 does
        exit(:timeout)
      end)

      # Update should still succeed even if handle_stop times out
      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{jwt_secret: "potato"})
    end

    test "valid data and change to tenant data will refresh cache", %{tenants: [tenant | _]} do
      expect(Realtime.Tenants.Cache, :global_cache_update, fn tenant ->
        assert tenant.name == "new_name"
      end)

      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{name: "new_name"})
    end

    test "valid data and no changes to tenant will not refresh cache", %{tenants: [tenant | _]} do
      reject(&Realtime.Tenants.Cache.global_cache_update/1)
      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{name: tenant.name})
    end

    test "change to max_events_per_second publishes update to respective rate counters", %{tenants: [tenant | _]} do
      expect(RateCounter, :publish_update, fn key ->
        assert key == Realtime.Tenants.events_per_second_key(tenant.external_id)
      end)

      expect(RateCounter, :publish_update, fn key ->
        assert key == Realtime.Tenants.db_events_per_second_key(tenant.external_id)
      end)

      reject(&RateCounter.publish_update/1)

      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{max_events_per_second: 123})
    end

    test "change to max_joins_per_second publishes update to rate counters", %{tenants: [tenant | _]} do
      expect(RateCounter, :publish_update, fn key ->
        assert key == Realtime.Tenants.joins_per_second_key(tenant.external_id)
      end)

      reject(&RateCounter.publish_update/1)

      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{max_joins_per_second: 123})
    end

    test "change to max_presence_events_per_second publishes update to rate counters", %{tenants: [tenant | _]} do
      expect(RateCounter, :publish_update, fn key ->
        assert key == Realtime.Tenants.presence_events_per_second_key(tenant.external_id)
      end)

      reject(&RateCounter.publish_update/1)

      assert {:ok, %Tenant{}} =
               Api.update_tenant_by_external_id(tenant.external_id, %{max_presence_events_per_second: 123})
    end

    test "change to extensions publishes update to rate counters", %{tenants: [tenant | _]} do
      extensions = [
        %{
          "type" => "postgres_cdc_rls",
          "settings" => %{
            "db_host" => "127.0.0.1",
            "db_name" => "postgres",
            "db_user" => "supabase_admin",
            "db_password" => "postgres",
            "db_port" => "1234",
            "poll_interval" => 100,
            "poll_max_changes" => 100,
            "poll_max_record_bytes" => 1_048_576,
            "region" => "us-east-1",
            "publication" => "supabase_realtime_test",
            "ssl_enforced" => false
          }
        }
      ]

      expect(RateCounter, :publish_update, fn key ->
        assert key == Realtime.Tenants.connect_errors_per_second_key(tenant.external_id)
      end)

      expect(RateCounter, :publish_update, fn key ->
        assert key == Realtime.Tenants.subscription_errors_per_second_key(tenant.external_id)
      end)

      expect(RateCounter, :publish_update, fn key ->
        assert key == Realtime.Tenants.authorization_errors_per_second_key(tenant.external_id)
      end)

      reject(&RateCounter.publish_update/1)

      assert {:ok, %Tenant{}} = Api.update_tenant_by_external_id(tenant.external_id, %{extensions: extensions})
    end
  end

  describe "delete_tenant_by_external_id/1" do
    test "deletes the tenant" do
      tenant = tenant_fixture()
      assert true == Api.delete_tenant_by_external_id(tenant.external_id)
      assert false == Api.delete_tenant_by_external_id("undef_tenant")
      assert_raise Ecto.NoResultsError, fn -> Api.get_tenant!(tenant.id) end
    end
  end

  describe "preload_counters/1" do
    setup [:create_tenants]

    test "preloads counters for a given tenant ", %{tenants: [tenant | _]} do
      tenant = Repo.reload!(tenant)
      assert Api.preload_counters(nil) == nil

      expect(GenCounter, :get, fn _ -> 1 end)
      expect(RateCounter, :get, fn _ -> {:ok, %RateCounter{avg: 2}} end)
      counters = Api.preload_counters(tenant)
      assert counters.events_per_second_rolling == 2
      assert counters.events_per_second_now == 1

      assert Api.preload_counters(nil, :any) == nil
    end
  end

  describe "rename_settings_field/2" do
    test "renames setting fields" do
      tenant = tenant_fixture()

      Api.rename_settings_field("poll_interval_ms", "poll_interval")

      assert %{extensions: [extension]} = Api.get_tenant_by_external_id(tenant.external_id)
      assert Map.has_key?(extension.settings, "poll_interval")
      refute Map.has_key?(extension.settings, "poll_interval_ms")
    end
  end

  describe "requires_disconnect/1" do
    defmodule TestRequiresDisconnect do
      import Api

      def check(changeset) when requires_disconnect(changeset), do: true
      def check(_changeset), do: false
    end

    test "returns true if jwt_secret is changed" do
      changeset = %Ecto.Changeset{valid?: true, changes: %{jwt_secret: "new_secret"}}
      assert TestRequiresDisconnect.check(changeset)
    end

    test "returns true if jwt_jwks is changed" do
      changeset = %Ecto.Changeset{valid?: true, changes: %{jwt_jwks: %{keys: ["test"]}}}
      assert TestRequiresDisconnect.check(changeset)
    end

    test "returns true if private_only is changed" do
      changeset = %Ecto.Changeset{valid?: true, changes: %{private_only: true}}
      assert TestRequiresDisconnect.check(changeset)
    end

    test "returns true if suspend is changed" do
      changeset = %Ecto.Changeset{valid?: true, changes: %{suspend: true}}
      assert TestRequiresDisconnect.check(changeset)
    end

    test "returns false if valid? is false" do
      changeset = %Ecto.Changeset{valid?: false, changes: %{jwt_secret: "new_secret"}}
      refute TestRequiresDisconnect.check(changeset)
    end
  end

  describe "requires_restarting_db_connection/1" do
    defmodule TestRequiresRestartingDbConnection do
      import Api

      def check(changeset) when requires_restarting_db_connection(changeset), do: true
      def check(_changeset), do: false
    end

    test "returns true if extensions is changed" do
      changeset = %Ecto.Changeset{valid?: true, changes: %{extensions: []}}
      assert TestRequiresRestartingDbConnection.check(changeset)
    end

    test "returns true if jwt_secret are changed" do
      changeset = %Ecto.Changeset{valid?: true, changes: %{jwt_secret: "new_secret"}}
      assert TestRequiresRestartingDbConnection.check(changeset)
    end

    test "returns true if jwt_jwks are changed" do
      changeset = %Ecto.Changeset{valid?: true, changes: %{jwt_jwks: %{keys: ["test"]}}}
      assert TestRequiresRestartingDbConnection.check(changeset)
    end

    test "returns true if suspend is changed" do
      changeset = %Ecto.Changeset{valid?: true, changes: %{suspend: true}}
      assert TestRequiresRestartingDbConnection.check(changeset)
    end

    test "returns true if multiple relevant fields are changed" do
      changeset = %Ecto.Changeset{valid?: true, changes: %{jwt_secret: "new_secret", jwt_jwks: %{keys: ["test"]}}}
      assert TestRequiresRestartingDbConnection.check(changeset)
    end

    test "returns false if no relevant fields are changed" do
      changeset = %Ecto.Changeset{valid?: true, changes: %{postgres_cdc_default: "potato"}}
      refute TestRequiresRestartingDbConnection.check(changeset)
    end

    test "returns false if valid? is false" do
      changeset = %Ecto.Changeset{valid?: false, changes: %{jwt_secret: "new_secret"}}
      refute TestRequiresRestartingDbConnection.check(changeset)
    end
  end

  describe "update_migrations_ran/1" do
    test "updates migrations_ran to the count of all migrations" do
      tenant = tenant_fixture(%{migrations_ran: 0})

      expect(Realtime.Tenants.Cache, :global_cache_update, fn tenant ->
        assert tenant.migrations_ran == 1
        :ok
      end)

      assert {:ok, tenant} = Api.update_migrations_ran(tenant.external_id, 1)
      assert tenant.migrations_ran == 1
    end

    test "returns {:error, :tenant_not_found} when tenant does not exist" do
      assert {:error, :tenant_not_found} = Api.update_migrations_ran("removed", 11)
    end
  end

  describe "list_feature_flags/0" do
    test "returns all flags ordered by name" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "zebra_flag", enabled: false})
      {:ok, _} = Api.upsert_feature_flag(%{name: "alpha_flag", enabled: true})

      names = Api.list_feature_flags() |> Enum.map(& &1.name)
      assert "alpha_flag" in names
      assert "zebra_flag" in names
      assert Enum.find_index(names, &(&1 == "alpha_flag")) < Enum.find_index(names, &(&1 == "zebra_flag"))
    end
  end

  describe "get_feature_flag/1" do
    test "returns the flag when it exists" do
      {:ok, flag} = Api.upsert_feature_flag(%{name: "my_flag", enabled: true})
      assert %FeatureFlag{name: "my_flag"} = Api.get_feature_flag("my_flag")
      assert Api.get_feature_flag("my_flag").id == flag.id
    end

    test "returns nil when flag does not exist" do
      refute Api.get_feature_flag("nonexistent")
    end
  end

  describe "upsert_feature_flag/1" do
    test "inserts a new flag" do
      assert {:ok, %FeatureFlag{name: "new_flag", enabled: false}} =
               Api.upsert_feature_flag(%{name: "new_flag", enabled: false})
    end

    test "updates an existing flag" do
      {:ok, _} = Api.upsert_feature_flag(%{name: "existing", enabled: false})

      assert {:ok, %FeatureFlag{name: "existing", enabled: true}} =
               Api.upsert_feature_flag(%{name: "existing", enabled: true})

      assert Api.list_feature_flags() |> Enum.count(&(&1.name == "existing")) == 1
    end

    test "returns error changeset when name is missing" do
      assert {:error, changeset} = Api.upsert_feature_flag(%{enabled: false})
      assert "can't be blank" in errors_on(changeset).name
    end

    test "defaults rollout_percentage to 100 when omitted" do
      assert {:ok, %FeatureFlag{rollout_percentage: 100}} =
               Api.upsert_feature_flag(%{name: "default_rollout_flag", enabled: true})
    end

    test "accepts a rollout_percentage within 0..100" do
      assert {:ok, %FeatureFlag{rollout_percentage: 25}} =
               Api.upsert_feature_flag(%{name: "partial_rollout_flag", enabled: true, rollout_percentage: 25})
    end

    test "rejects a rollout_percentage below 0" do
      assert {:error, changeset} =
               Api.upsert_feature_flag(%{name: "invalid_rollout_flag", enabled: true, rollout_percentage: -1})

      assert "must be greater than or equal to 0" in errors_on(changeset).rollout_percentage
    end

    test "rejects a rollout_percentage above 100" do
      assert {:error, changeset} =
               Api.upsert_feature_flag(%{name: "invalid_rollout_flag", enabled: true, rollout_percentage: 101})

      assert "must be less than or equal to 100" in errors_on(changeset).rollout_percentage
    end

    test "defaults bucket_key to nil when omitted" do
      assert {:ok, %FeatureFlag{bucket_key: nil}} =
               Api.upsert_feature_flag(%{name: "default_bucket_key_flag", enabled: true})
    end

    test "accepts an explicit bucket_key" do
      assert {:ok, %FeatureFlag{bucket_key: "shared_cohort"}} =
               Api.upsert_feature_flag(%{name: "bucket_key_flag", enabled: true, bucket_key: "shared_cohort"})
    end

    test "updating a flag without bucket_key clears any previously set bucket_key" do
      {:ok, _} =
        Api.upsert_feature_flag(%{name: "bucket_key_reset_flag", enabled: true, bucket_key: "shared_cohort"})

      assert {:ok, %FeatureFlag{bucket_key: nil}} =
               Api.upsert_feature_flag(%{name: "bucket_key_reset_flag", enabled: true})
    end
  end

  describe "delete_feature_flag/1" do
    test "removes the flag" do
      {:ok, flag} = Api.upsert_feature_flag(%{name: "to_delete", enabled: false})
      assert {:ok, _} = Api.delete_feature_flag(flag)
      refute Api.get_feature_flag("to_delete")
    end
  end

  describe "non-master region routing" do
    setup do
      previous_region = Application.get_env(:realtime, :region)
      previous_master_region = Application.get_env(:realtime, :master_region)

      Application.put_env(:realtime, :region, "ap-southeast-2")
      Application.put_env(:realtime, :master_region, "us-east-1")

      on_exit(fn ->
        Application.put_env(:realtime, :region, previous_region)
        Application.put_env(:realtime, :master_region, previous_master_region)
      end)

      fake_master = :"master@127.0.0.1"
      Mimic.stub(Nodes, :node_from_region, fn "us-east-1", _key -> {:ok, fake_master} end)

      %{master_node: fake_master}
    end

    test "upsert_feature_flag dispatches to master with empty opts", %{master_node: master_node} do
      Mimic.expect(GenRpc, :call, fn ^master_node, Api, :upsert_feature_flag, args, opts ->
        assert args == [%{name: "rpc_flag", enabled: true}]
        assert opts == []
        {:ok, %FeatureFlag{name: "rpc_flag", enabled: true}}
      end)

      assert {:ok, %FeatureFlag{name: "rpc_flag", enabled: true}} =
               Api.upsert_feature_flag(%{name: "rpc_flag", enabled: true})
    end

    test "delete_feature_flag dispatches to master with empty opts", %{master_node: master_node} do
      flag = %FeatureFlag{id: Ecto.UUID.generate(), name: "rpc_delete", enabled: false}

      Mimic.expect(GenRpc, :call, fn ^master_node, Api, :delete_feature_flag, args, opts ->
        assert args == [flag]
        assert opts == []
        {:ok, flag}
      end)

      assert {:ok, ^flag} = Api.delete_feature_flag(flag)
    end

    test "create_tenant dispatches to master with tenant_id opt", %{master_node: master_node} do
      external_id = "rpc_tenant_#{System.unique_integer([:positive])}"
      attrs = %{"external_id" => external_id, "name" => external_id}

      Mimic.expect(GenRpc, :call, fn ^master_node, Api, :create_tenant, _args, opts ->
        assert opts == [tenant_id: external_id]
        {:ok, %Tenant{external_id: external_id}}
      end)

      assert {:ok, %Tenant{external_id: ^external_id}} = Api.create_tenant(attrs)
    end

    test "list_existing_external_ids dispatches to master with empty opts", %{master_node: master_node} do
      Mimic.expect(GenRpc, :call, fn ^master_node, Api, :list_existing_external_ids, args, opts ->
        assert args == [["abc", "def"]]
        assert opts == []
        ["abc"]
      end)

      assert Api.list_existing_external_ids(["abc", "def"]) == ["abc"]
    end

    test "list_existing_external_ids surfaces an unreachable master", %{master_node: master_node} do
      Mimic.expect(GenRpc, :call, fn ^master_node, Api, :list_existing_external_ids, _args, _opts ->
        {:error, :rpc_error, :timeout}
      end)

      assert Api.list_existing_external_ids(["abc"]) == {:error, :timeout}
    end
  end
end
