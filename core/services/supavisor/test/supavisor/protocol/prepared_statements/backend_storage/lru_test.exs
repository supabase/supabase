defmodule Supavisor.Protocol.PreparedStatements.BackendStorage.LRUTest do
  use ExUnit.Case, async: true
  use ExUnitProperties

  alias Supavisor.Protocol.PreparedStatements.BackendStorage.LRU

  describe "new/0" do
    test "is empty" do
      storage = LRU.new()

      assert LRU.size(storage) == 0
      refute LRU.member?(storage, "stmt_1")
    end
  end

  describe "put/2" do
    test "registers a statement" do
      storage = LRU.new() |> LRU.put("stmt_1")

      assert LRU.size(storage) == 1
      assert LRU.member?(storage, "stmt_1")
    end

    test "re-putting an existing statement keeps size and refreshes recency" do
      storage =
        LRU.new()
        |> LRU.put("stmt_1")
        |> LRU.put("stmt_2")
        |> LRU.put("stmt_1")

      assert LRU.size(storage) == 2

      {[oldest], _} = LRU.evict(storage, 1)
      assert oldest == "stmt_2"
    end
  end

  describe "touch/2" do
    test "refreshes recency of an existing statement" do
      storage =
        LRU.new()
        |> LRU.put("stmt_1")
        |> LRU.put("stmt_2")
        |> LRU.touch("stmt_1")

      {[oldest], _} = LRU.evict(storage, 1)
      assert oldest == "stmt_2"
    end

    test "is a no-op for an unknown statement" do
      storage = LRU.new() |> LRU.put("stmt_1")
      touched = LRU.touch(storage, "stmt_unknown")

      assert touched == storage
    end
  end

  describe "delete/2" do
    test "removes a statement" do
      storage =
        LRU.new()
        |> LRU.put("stmt_1")
        |> LRU.put("stmt_2")
        |> LRU.delete("stmt_1")

      assert LRU.size(storage) == 1
      refute LRU.member?(storage, "stmt_1")
      assert LRU.member?(storage, "stmt_2")
    end

    test "deleting an unknown statement is a no-op" do
      storage = LRU.new() |> LRU.put("stmt_1")
      after_delete = LRU.delete(storage, "stmt_unknown")

      assert after_delete == storage
    end
  end

  describe "evict/2" do
    test "returns oldest names in order of recency" do
      storage =
        Enum.reduce(1..5, LRU.new(), fn i, acc ->
          LRU.put(acc, "stmt_#{i}")
        end)

      {evicted, remaining} = LRU.evict(storage, 2)

      assert evicted == ["stmt_1", "stmt_2"]
      assert LRU.size(remaining) == 3
      refute LRU.member?(remaining, "stmt_1")
      refute LRU.member?(remaining, "stmt_2")
      assert LRU.member?(remaining, "stmt_5")
    end

    test "respects recency updated by touch" do
      storage =
        LRU.new()
        |> LRU.put("stmt_1")
        |> LRU.put("stmt_2")
        |> LRU.put("stmt_3")
        |> LRU.touch("stmt_1")

      {evicted, _} = LRU.evict(storage, 1)
      assert evicted == ["stmt_2"]
    end

    test "n greater than size returns all and empties storage" do
      storage =
        LRU.new()
        |> LRU.put("stmt_1")
        |> LRU.put("stmt_2")

      {evicted, remaining} = LRU.evict(storage, 10)

      assert evicted == ["stmt_1", "stmt_2"]
      assert LRU.size(remaining) == 0
    end

    test "returns empty list when storage is empty" do
      {evicted, remaining} = LRU.evict(LRU.new(), 5)

      assert evicted == []
      assert LRU.size(remaining) == 0
    end
  end

  describe "LRU invariant" do
    @names ~w(stmt_a stmt_b stmt_c stmt_d stmt_e)

    property "evict returns names ordered by last put/touch across arbitrary op sequences" do
      check all ops <- list_of(operation(), max_length: 50) do
        {storage, expected_order} = simulate(ops)
        actual_order = pop_all_in_order(storage)

        assert actual_order == expected_order
      end
    end

    defp operation do
      one_of([
        tuple({constant(:put), member_of(@names)}),
        tuple({constant(:touch), member_of(@names)}),
        tuple({constant(:delete), member_of(@names)})
      ])
    end

    defp simulate(ops) do
      {storage, _seq, shadow} =
        Enum.reduce(ops, {LRU.new(), 0, %{}}, &apply_op/2)

      expected =
        shadow
        |> Enum.sort_by(fn {_name, seq} -> seq end)
        |> Enum.map(fn {name, _seq} -> name end)

      {storage, expected}
    end

    defp apply_op({:put, name}, {storage, seq, shadow}) do
      {LRU.put(storage, name), seq + 1, Map.put(shadow, name, seq + 1)}
    end

    defp apply_op({:touch, name}, {storage, seq, shadow}) do
      if Map.has_key?(shadow, name) do
        {LRU.touch(storage, name), seq + 1, Map.put(shadow, name, seq + 1)}
      else
        {LRU.touch(storage, name), seq, shadow}
      end
    end

    defp apply_op({:delete, name}, {storage, seq, shadow}) do
      {LRU.delete(storage, name), seq, Map.delete(shadow, name)}
    end

    defp pop_all_in_order(storage) do
      case LRU.size(storage) do
        0 -> []
        size -> storage |> LRU.evict(size) |> elem(0)
      end
    end
  end
end
