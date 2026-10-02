defmodule Realtime.SignalHandlerTest do
  use ExUnit.Case
  import ExUnit.CaptureLog
  alias Realtime.SignalHandler

  defmodule FakeHandler do
    def handle_event(signal, _state), do: send(self(), signal)
  end

  setup do
    on_exit(fn ->
      Application.put_env(:realtime, :shutdown_in_progress, false)
    end)
  end

  describe "signal handling" do
    test "sends signal to handler_mod" do
      {:ok, state} = SignalHandler.init({%{handler_mod: FakeHandler}, :ok})

      assert capture_log(fn -> SignalHandler.handle_event(:sigterm, state) end) =~
               "SignalHandler: :sigterm received"

      assert_receive :sigterm
    end

    test "sets shutdown_in_progress on sigterm" do
      {:ok, state} = SignalHandler.init({%{handler_mod: FakeHandler}, :ok})

      capture_log(fn -> SignalHandler.handle_event(:sigterm, state) end)

      assert Application.get_env(:realtime, :shutdown_in_progress) == true
    end

    test "does not set shutdown_in_progress on non-sigterm signals" do
      Application.put_env(:realtime, :shutdown_in_progress, false)
      {:ok, state} = SignalHandler.init({%{handler_mod: FakeHandler}, :ok})

      capture_log(fn -> SignalHandler.handle_event(:sigusr1, state) end)

      refute Application.get_env(:realtime, :shutdown_in_progress)
    end
  end

  describe "gen_event callbacks" do
    test "handle_info delegates to erl_signal_handler" do
      {:ok, state} = SignalHandler.init({%{handler_mod: FakeHandler}, :ok})
      assert {:ok, _state} = SignalHandler.handle_info(:some_info, state)
    end

    test "handle_call delegates to erl_signal_handler" do
      {:ok, state} = SignalHandler.init({%{handler_mod: FakeHandler}, :ok})
      assert {:ok, _reply, _state} = SignalHandler.handle_call(:some_call, state)
    end
  end

  describe "shutdown_in_progress?/1" do
    test "shutdown_in_progress? returns error when shutdown is in progress" do
      Application.put_env(:realtime, :shutdown_in_progress, true)
      assert SignalHandler.shutdown_in_progress?() == {:error, :shutdown_in_progress}
    end

    test "shutdown_in_progress? returns ok when no shutdown in progress" do
      Application.put_env(:realtime, :shutdown_in_progress, false)
      assert SignalHandler.shutdown_in_progress?() == :ok
    end
  end
end
