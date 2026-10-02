defmodule TestTenantDb.BackendTest do
  # Backend.choose/0 reads USE_EXTERNAL_TENANT_DB at call time, but live code
  # resolves the backend exactly once at startup (test_helper.exs stores it
  # in :persistent_term), so mutating the env var here cannot change the
  # running suite's mode — restoring it on exit is hygiene, not load-bearing,
  # and async: true is safe.
  use ExUnit.Case, async: true

  alias TestTenantDb.Backend

  defp put_env_restoring(name, value) do
    restore_env_on_exit(name)
    System.put_env(name, value)
  end

  defp delete_env_restoring(name) do
    restore_env_on_exit(name)
    System.delete_env(name)
  end

  defp restore_env_on_exit(name) do
    original = System.get_env(name)

    on_exit(fn ->
      if original, do: System.put_env(name, original), else: System.delete_env(name)
    end)
  end

  describe "choose/0" do
    test "Docker when USE_EXTERNAL_TENANT_DB is unset" do
      delete_env_restoring("USE_EXTERNAL_TENANT_DB")
      assert Backend.choose() == Backend.Docker
    end

    for value <- ["true", "TRUE", "1"] do
      test "External when USE_EXTERNAL_TENANT_DB=#{value}" do
        put_env_restoring("USE_EXTERNAL_TENANT_DB", unquote(value))
        assert Backend.choose() == Backend.External
      end
    end

    for value <- ["false", "FALSE", "0"] do
      test "Docker when USE_EXTERNAL_TENANT_DB=#{value}" do
        put_env_restoring("USE_EXTERNAL_TENANT_DB", unquote(value))
        assert Backend.choose() == Backend.Docker
      end
    end

    test "raises when USE_EXTERNAL_TENANT_DB is set to an unrecognized value" do
      put_env_restoring("USE_EXTERNAL_TENANT_DB", "yes")

      assert_raise ArgumentError, ~r/USE_EXTERNAL_TENANT_DB/, fn -> Backend.choose() end
    end
  end

  describe "External.ports_config!/2" do
    test "parses a comma-separated port list" do
      assert Backend.External.ports_config!("15432, 15433,15434", nil) == [15432, 15433, 15434]
    end

    test "falls back to the singular value as a one-port list" do
      assert Backend.External.ports_config!(nil, "15432") == [15432]
    end

    test "prefers the plural value when both are set" do
      assert Backend.External.ports_config!("15432,15433", "9999") == [15432, 15433]
    end

    test "falls back to the singular value when the plural one is an empty string" do
      assert Backend.External.ports_config!("", "15432") == [15432]
    end

    test "raises the clear error when both are empty strings" do
      assert_raise RuntimeError, ~r/EXTERNAL_TENANT_DB_PORTS/, fn ->
        Backend.External.ports_config!("", "")
      end
    end

    test "raises a clear error when neither is set" do
      assert_raise RuntimeError, ~r/EXTERNAL_TENANT_DB_PORTS/, fn ->
        Backend.External.ports_config!(nil, nil)
      end
    end

    test "raises a clear error on a non-numeric entry" do
      assert_raise RuntimeError, ~r/"abc" is not a valid port/, fn ->
        Backend.External.ports_config!("15432,abc", nil)
      end
    end

    test "raises a clear error on an empty entry" do
      assert_raise RuntimeError, ~r/not a valid port/, fn ->
        Backend.External.ports_config!("15432,,15433", nil)
      end
    end
  end
end
