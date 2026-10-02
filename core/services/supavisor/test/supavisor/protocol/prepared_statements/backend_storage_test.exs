defmodule Supavisor.Protocol.PreparedStatements.BackendStorageTest do
  use ExUnit.Case, async: false

  alias Supavisor.Protocol.PreparedStatements.BackendStorage
  alias Supavisor.Protocol.PreparedStatements.BackendStorage.{LRU, Random}

  @flag "backend_prepared_statements_storage"

  describe "strategies/0" do
    test "exposes the registry of known strategies" do
      assert BackendStorage.strategies() == %{"lru" => LRU, "random" => Random}
    end
  end

  describe "select/1" do
    test "defaults to Random when no flag is set anywhere" do
      assert BackendStorage.select(%{}) == Random
    end

    test "returns LRU when tenant flag is \"lru\"" do
      assert BackendStorage.select(%{@flag => "lru"}) == LRU
    end

    test "returns Random when tenant flag is \"random\"" do
      assert BackendStorage.select(%{@flag => "random"}) == Random
    end

    test "falls back to default when tenant flag is unknown" do
      assert BackendStorage.select(%{@flag => "tinylfu"}) == Random
    end

    test "falls back to app config when tenant flag is missing" do
      original = Application.get_env(:supavisor, Supavisor.FeatureFlag, %{})
      Application.put_env(:supavisor, Supavisor.FeatureFlag, Map.put(original, @flag, "lru"))
      on_exit(fn -> Application.put_env(:supavisor, Supavisor.FeatureFlag, original) end)

      assert BackendStorage.select(%{}) == LRU
    end

    test "tenant flag overrides app config" do
      original = Application.get_env(:supavisor, Supavisor.FeatureFlag, %{})
      Application.put_env(:supavisor, Supavisor.FeatureFlag, Map.put(original, @flag, "lru"))
      on_exit(fn -> Application.put_env(:supavisor, Supavisor.FeatureFlag, original) end)

      assert BackendStorage.select(%{@flag => "random"}) == Random
    end
  end
end
