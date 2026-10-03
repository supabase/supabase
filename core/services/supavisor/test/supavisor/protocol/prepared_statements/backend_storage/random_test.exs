defmodule Supavisor.Protocol.PreparedStatements.BackendStorage.RandomTest do
  use ExUnit.Case, async: true

  alias Supavisor.Protocol.PreparedStatements.BackendStorage.Random

  describe "new/0" do
    test "is empty" do
      storage = Random.new()

      assert Random.size(storage) == 0
      refute Random.member?(storage, "stmt_1")
    end
  end

  describe "put/2" do
    test "registers a statement" do
      storage = Random.new() |> Random.put("stmt_1")

      assert Random.size(storage) == 1
      assert Random.member?(storage, "stmt_1")
    end

    test "re-putting an existing statement keeps size" do
      storage =
        Random.new()
        |> Random.put("stmt_1")
        |> Random.put("stmt_1")

      assert Random.size(storage) == 1
    end
  end

  describe "touch/2" do
    test "is a no-op for an existing statement" do
      storage = Random.new() |> Random.put("stmt_1")
      touched = Random.touch(storage, "stmt_1")

      assert touched == storage
    end

    test "is a no-op for an unknown statement" do
      storage = Random.new() |> Random.put("stmt_1")
      touched = Random.touch(storage, "stmt_unknown")

      assert touched == storage
    end
  end

  describe "delete/2" do
    test "removes a statement" do
      storage =
        Random.new()
        |> Random.put("stmt_1")
        |> Random.put("stmt_2")
        |> Random.delete("stmt_1")

      assert Random.size(storage) == 1
      refute Random.member?(storage, "stmt_1")
      assert Random.member?(storage, "stmt_2")
    end

    test "deleting an unknown statement is a no-op" do
      storage = Random.new() |> Random.put("stmt_1")
      after_delete = Random.delete(storage, "stmt_unknown")

      assert after_delete == storage
    end
  end

  describe "evict/2" do
    test "evicts n existing members and shrinks size by n" do
      storage =
        Enum.reduce(1..5, Random.new(), fn i, acc ->
          Random.put(acc, "stmt_#{i}")
        end)

      {evicted, remaining} = Random.evict(storage, 2)

      assert length(evicted) == 2
      assert Enum.all?(evicted, &Random.member?(storage, &1))
      assert Enum.all?(evicted, &(not Random.member?(remaining, &1)))
      assert Random.size(remaining) == 3
    end

    test "n greater than size returns all and empties storage" do
      storage =
        Random.new()
        |> Random.put("stmt_1")
        |> Random.put("stmt_2")

      {evicted, remaining} = Random.evict(storage, 10)

      assert Enum.sort(evicted) == ["stmt_1", "stmt_2"]
      assert Random.size(remaining) == 0
    end

    test "returns empty list when storage is empty" do
      {evicted, remaining} = Random.evict(Random.new(), 5)

      assert evicted == []
      assert Random.size(remaining) == 0
    end
  end
end
