defmodule SupavisorTest do
  use ExUnit.Case, async: true

  require Supavisor

  import ExUnit.CaptureLog
  import Supavisor.Asserts

  alias Supavisor.Errors.{
    WorkerNotFoundError,
    PoolRanchNotFoundError,
    PoolConfigNotFoundError
  }

  @fake_id Supavisor.id(
             type: :single,
             tenant: "nonexistent_tenant",
             user: "user",
             mode: :transaction,
             db: "db",
             search_path: nil
           )

  describe "inspect_id/1" do
    test "key and value are never split across lines" do
      id =
        Supavisor.id(
          type: :single,
          tenant: "some_very_long_tenant_name_that_could_cause_wrapping",
          user: "postgres",
          mode: :session,
          db: "some_very_long_tenant_name_that_could_cause_wrapping",
          search_path: nil
        )

      assert Supavisor.inspect_id(id) == """
             Supavisor.id(
               type: :single,
               tenant: "some_very_long_tenant_name_that_could_cause_wrapping",
               mode: :session,
               user: "postgres",
               db: "some_very_long_tenant_name_that_could_cause_wrapping"
             )\
             """
    end

    test "omits nil values" do
      id =
        Supavisor.id(
          type: :single,
          tenant: "my_tenant",
          user: "postgres",
          mode: :session,
          db: "my_db",
          search_path: nil
        )

      assert Supavisor.inspect_id(id) == """
             Supavisor.id(type: :single, tenant: "my_tenant", mode: :session, user: "postgres", db: "my_db")\
             """
    end

    test "includes search_path when set" do
      id =
        Supavisor.id(
          type: :single,
          tenant: "my_tenant",
          user: "postgres",
          mode: :session,
          db: "my_db",
          search_path: "public"
        )

      assert Supavisor.inspect_id(id) ==
               """
               Supavisor.id(type: :single, tenant: "my_tenant", mode: :session, user: "postgres", db: "my_db", search_path: "public")\
               """
    end

    test "falls back to inspect for invalid ids" do
      assert Supavisor.inspect_id(:not_an_id) == ":not_an_id"
    end
  end

  describe "stop/1" do
    test "returns WorkerNotFoundError for nonexistent id" do
      assert {:error, %WorkerNotFoundError{id: @fake_id}} =
               result = Supavisor.stop(@fake_id)

      assert_valid_error(result)
    end
  end

  describe "get_local_workers/1" do
    test "returns WorkerNotFoundError for nonexistent id" do
      assert {:error, %WorkerNotFoundError{id: @fake_id}} =
               result = Supavisor.get_local_workers(@fake_id)

      assert_valid_error(result)
    end
  end

  describe "get_pool_ranch/1" do
    test "returns PoolRanchNotFoundError for nonexistent id" do
      assert {:error, %PoolRanchNotFoundError{id: @fake_id}} =
               result = Supavisor.get_pool_ranch(@fake_id)

      assert_valid_error(result)
    end
  end

  describe "start_local_pool/3" do
    test "returns PoolConfigNotFoundError when tenant config not found" do
      secrets = %{user: "user"}

      assert {:error, %PoolConfigNotFoundError{id: @fake_id}} =
               result = Supavisor.start_local_pool(@fake_id, secrets, nil)

      assert_valid_error(result)
    end

    test "sets project/user logger metadata at :info level" do
      secrets = %{user: "user"}

      log =
        capture_log([level: :info], fn -> Supavisor.start_local_pool(@fake_id, secrets, nil) end)

      assert log =~ "Starting pool(s) for"
      assert log =~ "project=nonexistent_tenant"
      assert log =~ "user=user"
    end
  end
end
