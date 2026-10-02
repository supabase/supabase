defmodule Realtime.FilterTest do
  use ExUnit.Case, async: true

  alias Realtime.Filter

  describe "presentation" do
    test "every operator has a label and a value placeholder" do
      for operator <- Filter.operators() do
        assert is_binary(Filter.operator_label(operator))
        assert is_binary(Filter.value_placeholder(operator))
      end
    end

    test "comparison operators read as symbols rather than PostgREST jargon" do
      assert Filter.operator_label("eq") == "="
      assert Filter.operator_label("gte") == "≥"
    end
  end

  describe "parse_all/1" do
    test "splits every condition a filter carries" do
      assert {:ok, [amount, status]} = Filter.parse_all("amount=gt.100,status=eq.open")

      assert amount == %{column: "amount", operator: "gt", value: "100", negated: false}
      assert status == %{column: "status", operator: "eq", value: "open", negated: false}
    end

    test "an empty filter is no conditions rather than an error" do
      assert Filter.parse_all("") == {:ok, []}
      assert Filter.parse_all(nil) == {:ok, []}
    end

    test "a comma inside an in-list or quotes belongs to the value" do
      assert {:ok, [in_list]} = Filter.parse_all("status=in.(draft,archived)")
      assert in_list.value == "(draft,archived)"

      assert {:ok, [quoted]} = Filter.parse_all(~s(name=eq."Smith, John"))
      assert quoted.value == ~s("Smith, John")
    end

    test "keeps the negation prefix off the operator" do
      assert {:ok, [condition]} = Filter.parse_all("deleted_at=not.is.null")

      assert condition == %{column: "deleted_at", operator: "is", value: "null", negated: true}
    end

    test "one unreadable condition fails the filter rather than dropping it" do
      assert Filter.parse_all("amount=gt.100,nonsense") == :error
      assert Filter.parse_all("amount=bogus.100") == :error
      assert Filter.parse_all("amount=gt.100,,status=eq.open") == :error
    end
  end

  describe "compose_all/1" do
    test "joins conditions with the comma the wire format expects" do
      conditions = [
        %{column: "amount", operator: "gt", value: "100", negated: false},
        %{column: "status", operator: "eq", value: "open", negated: true}
      ]

      assert Filter.compose_all(conditions) == "amount=gt.100,status=not.eq.open"
    end

    test "trims the column and value so a stray space is not part of the name" do
      conditions = [%{column: " amount ", operator: "gt", value: " 100 ", negated: false}]

      assert Filter.compose_all(conditions) == "amount=gt.100"
    end

    test "drops a condition with no column instead of emitting an empty segment" do
      conditions = [
        %{column: "", operator: "eq", value: "ignored", negated: false},
        %{column: "id", operator: "eq", value: "1", negated: false}
      ]

      assert Filter.compose_all(conditions) == "id=eq.1"
    end

    test "round-trips everything parse_all produces" do
      filter = "a=eq.1,b=in.(x,y),c=not.is.null"

      assert {:ok, conditions} = Filter.parse_all(filter)
      assert Filter.compose_all(conditions) == filter
    end
  end
end
