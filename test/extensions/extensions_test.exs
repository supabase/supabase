defmodule Realtime.ExtensionsTest do
  use ExUnit.Case, async: true

  alias Realtime.Extensions

  describe "db_settings/1" do
    test "returns default and required for postgres_cdc_rls" do
      result = Extensions.db_settings("postgres_cdc_rls")

      assert %{default: default, required: required} = result
      assert is_map(default)
      assert is_list(required)
    end

    test "default contains expected keys" do
      %{default: default} = Extensions.db_settings("postgres_cdc_rls")

      assert Map.has_key?(default, "poll_interval_ms")
      assert Map.has_key?(default, "poll_max_changes")
      assert Map.has_key?(default, "poll_max_record_bytes")
      assert Map.has_key?(default, "publication")
      assert Map.has_key?(default, "slot_name")
    end

    test "required contains expected fields" do
      %{required: required} = Extensions.db_settings("postgres_cdc_rls")

      field_names = Enum.map(required, fn {name, _validator, _encrypt} -> name end)

      assert "db_host" in field_names
      assert "db_port" in field_names
      assert "db_name" in field_names
      assert "db_user" in field_names
      assert "db_password" in field_names
    end

    test "returns empty default for unknown extension type" do
      result = Extensions.db_settings("unknown_extension")
      assert %{default: %{}, required: []} = result
    end
  end
end
