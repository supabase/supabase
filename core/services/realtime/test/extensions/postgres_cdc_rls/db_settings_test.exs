defmodule Extensions.PostgresCdcRls.DbSettingsTest do
  use ExUnit.Case, async: true

  alias Extensions.PostgresCdcRls.DbSettings

  describe "default/0" do
    test "returns a map with expected keys and values" do
      default = DbSettings.default()

      assert default["poll_interval_ms"] == 100
      assert default["poll_max_changes"] == 100
      assert default["poll_max_record_bytes"] == 1_048_576
      assert default["publication"] == "supabase_realtime"
      assert default["slot_name"] == "supabase_realtime_replication_slot"
    end
  end

  describe "required/0" do
    test "returns a list of tuples" do
      required = DbSettings.required()

      assert is_list(required)
      assert length(required) > 0

      for {name, validator, required_flag} <- required do
        assert is_binary(name)
        assert is_function(validator, 1)
        assert is_boolean(required_flag)
      end
    end

    test "db_host is required" do
      required = DbSettings.required()
      assert {"db_host", _, true} = List.keyfind!(required, "db_host", 0)
    end

    test "region is not required" do
      required = DbSettings.required()
      assert {"region", _, false} = List.keyfind!(required, "region", 0)
    end

    test "validators accept binary values" do
      required = DbSettings.required()

      for {_name, validator, _required} <- required do
        assert validator.("some_value") == true
      end
    end
  end
end
