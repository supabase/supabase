defmodule Realtime.LogsTest do
  use ExUnit.Case, async: true

  import ExUnit.CaptureLog

  alias Realtime.Logs

  describe "to_log/1" do
    test "returns binary as-is" do
      assert Logs.to_log("hello") == "hello"
    end

    test "inspects non-binary values" do
      assert Logs.to_log(%{key: "value"}) == inspect(%{key: "value"}, pretty: true)
      assert Logs.to_log(123) == "123"
      assert Logs.to_log([:a, :b]) == inspect([:a, :b], pretty: true)
    end
  end

  describe "log_error/2" do
    test "logs error with code and message" do
      defmodule LogErrorTest do
        use Realtime.Logs

        def do_log do
          log_error("TestCode", "something broke")
        end
      end

      log = capture_log(fn -> LogErrorTest.do_log() end)
      assert log =~ "TestCode: something broke"
    end
  end

  describe "log_warning/2" do
    test "logs warning with code and message" do
      defmodule LogWarningTest do
        use Realtime.Logs

        def do_log do
          log_warning("WarnCode", "something suspicious")
        end
      end

      log = capture_log(fn -> LogWarningTest.do_log() end)
      assert log =~ "WarnCode: something suspicious"
    end
  end

  describe "Jason.Encoder implementation" do
    test "encodes DBConnection.ConnectionError" do
      error = %DBConnection.ConnectionError{
        message: "connection lost",
        reason: :timeout,
        severity: :error
      }

      encoded = Jason.encode!(error)
      assert encoded =~ "message: \"connection lost\""
      assert encoded =~ "reason: :timeout"
      assert encoded =~ "severity: :error"
    end

    test "encodes Postgrex.Error" do
      error = %Postgrex.Error{
        message: "relation not found",
        postgres: %{
          code: "42P01",
          schema: "public",
          table: "users"
        }
      }

      encoded = Jason.encode!(error)
      assert encoded =~ "message: \"relation not found\""
      assert encoded =~ "schema: \"public\""
      assert encoded =~ "table: \"users\""
      assert encoded =~ "code: \"42P01\""
    end

    test "encodes Tuple with error logging" do
      log =
        capture_log(fn ->
          encoded = Jason.encode!({:error, "test"})
          assert encoded =~ "error: \"unable to parse response\""
        end)

      assert log =~ "UnableToEncodeJson"
    end
  end
end
