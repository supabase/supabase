defmodule Extensions.PostgresCdcRls.MessageDispatcherTest do
  use ExUnit.Case, async: true

  alias Extensions.PostgresCdcRls.MessageDispatcher
  alias Phoenix.Socket.Broadcast

  defmodule FakeSerializer do
    def fastlane!(msg), do: {:encoded, msg}
  end

  describe "dispatch/3" do
    test "dispatches to fastlane subscribers with matching sub_ids using new api" do
      parent = self()

      fastlane_pid =
        spawn(fn ->
          receive do
            msg -> send(parent, {:received, msg})
          end
        end)

      sub_ids = MapSet.new(["sub_1"])
      ids = [{"sub_1", 1}]

      subscriptions = [
        {self(), {:subscriber_fastlane, fastlane_pid, FakeSerializer, ids, "realtime:topic", true}}
      ]

      payload = Jason.encode!(%{data: "test"})

      assert :ok = MessageDispatcher.dispatch(subscriptions, self(), {"INSERT", payload, sub_ids})

      assert_receive {:received, {:encoded, %Broadcast{topic: "realtime:topic", event: "postgres_changes"}}}
    end

    test "dispatches to fastlane subscribers with matching sub_ids using old api" do
      parent = self()

      fastlane_pid =
        spawn(fn ->
          receive do
            msg -> send(parent, {:received, msg})
          end
        end)

      sub_ids = MapSet.new(["sub_1"])
      ids = [{"sub_1", 1}]

      subscriptions = [
        {self(), {:subscriber_fastlane, fastlane_pid, FakeSerializer, ids, "realtime:topic", false}}
      ]

      payload = Jason.encode!(%{data: "test"})

      assert :ok = MessageDispatcher.dispatch(subscriptions, self(), {"INSERT", payload, sub_ids})

      assert_receive {:received, {:encoded, %Broadcast{topic: "realtime:topic", event: "INSERT"}}}
    end

    test "does not dispatch when sub_ids do not match" do
      parent = self()

      fastlane_pid =
        spawn(fn ->
          receive do
            msg -> send(parent, {:received, msg})
          after
            1000 -> :ok
          end
        end)

      sub_ids = MapSet.new(["sub_2"])
      ids = [{"sub_1", 1}]

      subscriptions = [
        {self(), {:subscriber_fastlane, fastlane_pid, FakeSerializer, ids, "realtime:topic", true}}
      ]

      assert :ok = MessageDispatcher.dispatch(subscriptions, self(), {"INSERT", "payload", sub_ids})

      refute_receive {:received, _}
    end

    test "caches encoded messages across multiple subscribers" do
      parent = self()

      pids =
        for _ <- 1..2 do
          spawn(fn ->
            receive do
              msg -> send(parent, {:received, msg})
            end
          end)
        end

      sub_ids = MapSet.new(["sub_1"])
      ids = [{"sub_1", 1}]

      subscriptions =
        Enum.map(pids, fn pid ->
          {self(), {:subscriber_fastlane, pid, FakeSerializer, ids, "realtime:topic", true}}
        end)

      assert :ok = MessageDispatcher.dispatch(subscriptions, self(), {"INSERT", "payload", sub_ids})

      assert_receive {:received, {:encoded, %Broadcast{}}}
      assert_receive {:received, {:encoded, %Broadcast{}}}
    end
  end
end
