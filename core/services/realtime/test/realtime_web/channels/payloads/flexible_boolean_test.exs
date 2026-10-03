defmodule RealtimeWeb.Channels.Payloads.FlexibleBooleanTest do
  use ExUnit.Case, async: true

  alias RealtimeWeb.Channels.Payloads.FlexibleBoolean

  describe "type/0" do
    test "returns :boolean" do
      assert FlexibleBoolean.type() == :boolean
    end
  end

  describe "cast/1" do
    test "casts boolean true as-is" do
      assert FlexibleBoolean.cast(true) == {:ok, true}
    end

    test "casts boolean false as-is" do
      assert FlexibleBoolean.cast(false) == {:ok, false}
    end

    test "casts string 'true' in any case to boolean true" do
      assert FlexibleBoolean.cast("true") == {:ok, true}
      assert FlexibleBoolean.cast("True") == {:ok, true}
      assert FlexibleBoolean.cast("TRUE") == {:ok, true}
      assert FlexibleBoolean.cast("tRuE") == {:ok, true}
    end

    test "casts string 'false' in any case to boolean false" do
      assert FlexibleBoolean.cast("false") == {:ok, false}
      assert FlexibleBoolean.cast("False") == {:ok, false}
      assert FlexibleBoolean.cast("FALSE") == {:ok, false}
      assert FlexibleBoolean.cast("fAlSe") == {:ok, false}
    end

    test "returns error for invalid string values" do
      assert FlexibleBoolean.cast("test") == :error
      assert FlexibleBoolean.cast("yes") == :error
      assert FlexibleBoolean.cast("no") == :error
      assert FlexibleBoolean.cast("1") == :error
      assert FlexibleBoolean.cast("0") == :error
      assert FlexibleBoolean.cast("") == :error
    end

    test "returns error for non-boolean, non-string values" do
      assert FlexibleBoolean.cast(1) == :error
      assert FlexibleBoolean.cast(0) == :error
      assert FlexibleBoolean.cast(nil) == :error
      assert FlexibleBoolean.cast(%{}) == :error
      assert FlexibleBoolean.cast([]) == :error
    end
  end

  describe "load/1" do
    test "loads boolean values" do
      assert FlexibleBoolean.load(true) == {:ok, true}
      assert FlexibleBoolean.load(false) == {:ok, false}
    end
  end

  describe "dump/1" do
    test "dumps boolean values" do
      assert FlexibleBoolean.dump(true) == {:ok, true}
      assert FlexibleBoolean.dump(false) == {:ok, false}
    end

    test "returns error for non-boolean values" do
      assert FlexibleBoolean.dump("true") == :error
      assert FlexibleBoolean.dump(1) == :error
      assert FlexibleBoolean.dump(nil) == :error
    end
  end
end
