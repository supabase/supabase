defmodule Supavisor.CircuitBreakerTest do
  use ExUnit.Case, async: false

  alias Supavisor.CircuitBreaker
  alias Supavisor.CircuitBreaker.SlidingWindow
  alias Supavisor.Errors.CircuitBreakerError

  setup do
    :ets.delete_all_objects(Supavisor.CircuitBreaker.Blocks)
    :ets.delete_all_objects(Supavisor.CircuitBreaker.Windows)
    :ok
  end

  describe "check/2" do
    test "returns :ok when no failures recorded" do
      assert :ok = CircuitBreaker.check("tenant1", :get_secrets)
    end

    test "returns :ok when circuit is closed" do
      CircuitBreaker.record_failure("tenant1", :get_secrets)
      assert :ok = CircuitBreaker.check("tenant1", :get_secrets)
    end

    test "returns error when circuit is open" do
      for _ <- 1..5 do
        CircuitBreaker.record_failure("tenant1", :get_secrets)
      end

      assert {:error, %CircuitBreakerError{operation: :get_secrets, blocked_until: blocked_until}} =
               CircuitBreaker.check("tenant1", :get_secrets)

      assert is_integer(blocked_until)
      assert blocked_until > System.system_time(:second)
    end

    test "returns :ok after block period expires" do
      expired = System.system_time(:second) - 1
      :ets.insert(Supavisor.CircuitBreaker.Blocks, {{"tenant1", :get_secrets}, expired})

      assert :ok = CircuitBreaker.check("tenant1", :get_secrets)
    end
  end

  describe "record_failure/2" do
    test "opens circuit when threshold exceeded" do
      for _ <- 1..4 do
        CircuitBreaker.record_failure("tenant1", :get_secrets)
      end

      assert :ok = CircuitBreaker.check("tenant1", :get_secrets)

      CircuitBreaker.record_failure("tenant1", :get_secrets)

      assert {:error, %CircuitBreakerError{}} = CircuitBreaker.check("tenant1", :get_secrets)
    end

    test "maintains separate state per tenant" do
      for _ <- 1..5 do
        CircuitBreaker.record_failure("tenant1", :get_secrets)
      end

      CircuitBreaker.record_failure("tenant2", :get_secrets)

      assert {:error, %CircuitBreakerError{}} = CircuitBreaker.check("tenant1", :get_secrets)
      assert :ok = CircuitBreaker.check("tenant2", :get_secrets)
    end

    test "maintains separate state per operation" do
      for _ <- 1..5 do
        CircuitBreaker.record_failure("tenant1", :get_secrets)
      end

      CircuitBreaker.record_failure("tenant1", :db_connection)

      assert {:error, %CircuitBreakerError{}} = CircuitBreaker.check("tenant1", :get_secrets)
      assert :ok = CircuitBreaker.check("tenant1", :db_connection)
    end

    test "does not re-trip when already blocked" do
      # Trip the circuit
      for _ <- 1..5 do
        CircuitBreaker.record_failure("tenant1", :get_secrets)
      end

      assert {:error, %CircuitBreakerError{blocked_until: blocked_until}} =
               CircuitBreaker.check("tenant1", :get_secrets)

      # Record more failures while blocked — should not update blocked_until
      for _ <- 1..10 do
        CircuitBreaker.record_failure("tenant1", :get_secrets)
      end

      assert {:error, %CircuitBreakerError{blocked_until: ^blocked_until}} =
               CircuitBreaker.check("tenant1", :get_secrets)
    end

    test "db_connection requires 100 failures" do
      for _ <- 1..99 do
        CircuitBreaker.record_failure("tenant1", :db_connection)
      end

      assert :ok = CircuitBreaker.check("tenant1", :db_connection)

      CircuitBreaker.record_failure("tenant1", :db_connection)

      assert {:error, %CircuitBreakerError{}} = CircuitBreaker.check("tenant1", :db_connection)
    end
  end

  describe "clear/2" do
    test "clears circuit breaker state" do
      for _ <- 1..5 do
        CircuitBreaker.record_failure("tenant1", :get_secrets)
      end

      CircuitBreaker.clear("tenant1", :get_secrets)

      assert :ok = CircuitBreaker.check("tenant1", :get_secrets)
      assert [] = :ets.lookup(Supavisor.CircuitBreaker.Blocks, {"tenant1", :get_secrets})
      assert [] = :ets.lookup(Supavisor.CircuitBreaker.Windows, {"tenant1", :get_secrets})
    end
  end

  describe "clear_local/2" do
    test "clears circuit breaker state on current node" do
      key = "tenant1"

      for _ <- 1..10 do
        CircuitBreaker.record_failure(key, :auth_error)
      end

      assert {:error, %CircuitBreakerError{}} = CircuitBreaker.check(key, :auth_error)

      CircuitBreaker.clear_local(key, :auth_error)

      assert :ok = CircuitBreaker.check(key, :auth_error)
    end
  end

  describe "cleanup_stale_entries/0" do
    test "removes old entries" do
      now = System.system_time(:second)
      stale = now - 2000
      sw = SlidingWindow.new(600, stale)
      SlidingWindow.record(sw, stale)
      :ets.insert(Supavisor.CircuitBreaker.Windows, {{"tenant1", :get_secrets}, sw})

      deleted = CircuitBreaker.cleanup_stale_entries()

      assert deleted == 1
      assert [] = :ets.lookup(Supavisor.CircuitBreaker.Windows, {"tenant1", :get_secrets})
    end

    test "keeps recent entries" do
      CircuitBreaker.record_failure("tenant1", :get_secrets)

      deleted = CircuitBreaker.cleanup_stale_entries()

      assert deleted == 0
      assert [{_, _}] = :ets.lookup(Supavisor.CircuitBreaker.Windows, {"tenant1", :get_secrets})
    end

    test "removes expired blocks" do
      now = System.system_time(:second)
      stale = now - 2000
      sw = SlidingWindow.new(600, stale)
      SlidingWindow.record(sw, stale)
      :ets.insert(Supavisor.CircuitBreaker.Windows, {{"tenant1", :get_secrets}, sw})
      :ets.insert(Supavisor.CircuitBreaker.Blocks, {{"tenant1", :get_secrets}, now - 100})

      deleted = CircuitBreaker.cleanup_stale_entries()

      assert deleted == 1
    end

    # regression: stale entries for operations with smaller window_seconds were not cleaned up
    test "removes stale entries for operations with smaller window_seconds" do
      now = System.system_time(:second)
      stale = now - 1000
      sw = SlidingWindow.new(300, stale)
      SlidingWindow.record(sw, stale)
      :ets.insert(Supavisor.CircuitBreaker.Windows, {{"tenant1", :db_connection}, sw})

      deleted = CircuitBreaker.cleanup_stale_entries()

      assert deleted == 1
      assert [] = :ets.lookup(Supavisor.CircuitBreaker.Windows, {"tenant1", :db_connection})
    end

    test "keeps active blocks" do
      now = System.system_time(:second)
      sw = SlidingWindow.new(600, now)
      SlidingWindow.record(sw, now)
      :ets.insert(Supavisor.CircuitBreaker.Windows, {{"tenant1", :get_secrets}, sw})
      :ets.insert(Supavisor.CircuitBreaker.Blocks, {{"tenant1", :get_secrets}, now + 100})

      deleted = CircuitBreaker.cleanup_stale_entries()

      assert deleted == 0
    end
  end

  describe "opened/2" do
    test "returns blocked operations with key and blocked_until timestamp" do
      for _ <- 1..10 do
        CircuitBreaker.record_failure("tenant1", :auth_error)
      end

      assert {:error, %CircuitBreakerError{}} = CircuitBreaker.check("tenant1", :auth_error)

      assert [{"tenant1", blocked_until}] = CircuitBreaker.opened("tenant1", :auth_error)
      assert is_integer(blocked_until)
      assert blocked_until > System.system_time(:second)
    end

    test "returns empty list when operation is not blocked" do
      CircuitBreaker.record_failure("tenant1", :get_secrets)
      assert [] = CircuitBreaker.opened("tenant1", :get_secrets)
    end

    test "returns empty list for unknown key" do
      assert [] = CircuitBreaker.opened("unknown_tenant", :auth_error)
    end

    test "supports pattern matching with {tenant, :_} to find all IPs" do
      ip1 = "10.0.0.1"
      ip2 = "10.0.0.2"

      for _ <- 1..10 do
        CircuitBreaker.record_failure({"tenant1", ip1}, :auth_error)
        CircuitBreaker.record_failure({"tenant1", ip2}, :auth_error)
      end

      assert {:error, %CircuitBreakerError{}} =
               CircuitBreaker.check({"tenant1", ip1}, :auth_error)

      assert {:error, %CircuitBreakerError{}} =
               CircuitBreaker.check({"tenant1", ip2}, :auth_error)

      bans = CircuitBreaker.opened({"tenant1", :_}, :auth_error)
      assert length(bans) == 2

      assert Enum.all?(bans, fn {{tenant, ip}, blocked_until} ->
               tenant == "tenant1" and ip in [ip1, ip2] and is_integer(blocked_until) and
                 blocked_until > System.system_time(:second)
             end)
    end

    test "returns empty list when no keys match pattern" do
      assert [] = CircuitBreaker.opened({"unknown_tenant", :_}, :auth_error)
    end

    test "only returns keys matching the exact prefix in pattern and the operation" do
      ip1 = "10.0.0.1"
      ip2 = "10.0.0.2"

      for _ <- 1..10 do
        CircuitBreaker.record_failure({"tenant1", ip1}, :auth_error)
        CircuitBreaker.record_failure({"tenant1", ip1}, :get_secrets)
        CircuitBreaker.record_failure({"tenant2", ip2}, :auth_error)
      end

      assert {:error, %CircuitBreakerError{}} =
               CircuitBreaker.check({"tenant1", ip1}, :auth_error)

      assert {:error, %CircuitBreakerError{}} =
               CircuitBreaker.check({"tenant1", ip1}, :get_secrets)

      assert {:error, %CircuitBreakerError{}} =
               CircuitBreaker.check({"tenant2", ip2}, :auth_error)

      assert [{{"tenant1", ^ip1}, blocked_until}] =
               CircuitBreaker.opened({"tenant1", :_}, :auth_error)

      assert is_integer(blocked_until)
      assert blocked_until > System.system_time(:second)
    end
  end

  describe "info/2" do
    test "returns nil failures and closed status when no state exists" do
      result = CircuitBreaker.info("tenant1", :get_secrets)

      assert %{
               key: "tenant1",
               operation: :get_secrets,
               status: :closed,
               estimated_failures: nil,
               max_failures: 5,
               sliding_window_seconds: 300,
               window_seconds: 600,
               block_seconds: 30,
               blocked_until: nil
             } = result
    end

    test "returns estimated failures when window exists" do
      for _ <- 1..3 do
        CircuitBreaker.record_failure("tenant1", :get_secrets)
      end

      result = CircuitBreaker.info("tenant1", :get_secrets)

      assert result.status == :closed
      assert result.estimated_failures == 3
      assert result.blocked_until == nil
    end

    test "returns open status and blocked_until when circuit is open" do
      for _ <- 1..5 do
        CircuitBreaker.record_failure("tenant1", :get_secrets)
      end

      result = CircuitBreaker.info("tenant1", :get_secrets)
      now = System.system_time(:second)

      assert result.status == :open
      assert result.estimated_failures >= 5
      assert result.blocked_until > now
    end

    test "returns correct config for different operations" do
      result = CircuitBreaker.info("tenant1", :db_connection)

      assert result.max_failures == 100
      assert result.sliding_window_seconds == 150
      assert result.window_seconds == 300
      assert result.block_seconds == 30
    end
  end

  describe "open_local/3" do
    test "sets circuit breaker to open without previous failures" do
      key = "tenant1"
      blocked_until = System.system_time(:second) + 300

      CircuitBreaker.open_local(key, :auth_error, blocked_until)

      assert {:error, %CircuitBreakerError{blocked_until: ^blocked_until}} =
               CircuitBreaker.check(key, :auth_error)
    end

    test "sets circuit breaker to open with previous failures" do
      key = "tenant1"
      CircuitBreaker.record_failure(key, :auth_error)

      blocked_until = System.system_time(:second) + 300
      CircuitBreaker.open_local(key, :auth_error, blocked_until)

      assert {:error, %CircuitBreakerError{blocked_until: ^blocked_until}} =
               CircuitBreaker.check(key, :auth_error)
    end
  end
end
