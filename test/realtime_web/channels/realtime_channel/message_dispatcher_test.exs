defmodule RealtimeWeb.RealtimeChannel.MessageDispatcherTest do
  use ExUnit.Case, async: true

  import ExUnit.CaptureLog

  alias Phoenix.Socket.Broadcast
  alias Phoenix.Socket.V1
  alias RealtimeWeb.RealtimeChannel.MessageDispatcher
  alias RealtimeWeb.Socket.UserBroadcast
  alias RealtimeWeb.Socket.V2Serializer

  defmodule TestSerializer do
    def fastlane!(msg) do
      Agent.update(TestSerializer, fn count -> count + 1 end)
      {:encoded, msg}
    end
  end

  describe "fastlane_metadata/8" do
    test "info level" do
      assert MessageDispatcher.fastlane_metadata(self(), Serializer, "realtime:topic", :info, "tenant_id") ==
               {:rc_fastlane, self(), Serializer, "realtime:topic", :info, "tenant_id", MapSet.new(), true, true}
    end

    test "presence_read? defaults to true and can be set to false" do
      assert MessageDispatcher.fastlane_metadata(
               self(),
               Serializer,
               "realtime:topic",
               :info,
               "tenant_id",
               MapSet.new(),
               false
             ) ==
               {:rc_fastlane, self(), Serializer, "realtime:topic", :info, "tenant_id", MapSet.new(), false, true}
    end

    test "non-info level" do
      assert MessageDispatcher.fastlane_metadata(self(), Serializer, "realtime:topic", :warning, "tenant_id") ==
               {:rc_fastlane, self(), Serializer, "realtime:topic", :warning, "tenant_id", MapSet.new(), true, true}
    end

    test "replayed message ids" do
      assert MessageDispatcher.fastlane_metadata(
               self(),
               Serializer,
               "realtime:topic",
               :warning,
               "tenant_id",
               MapSet.new([1])
             ) ==
               {:rc_fastlane, self(), Serializer, "realtime:topic", :warning, "tenant_id", MapSet.new([1]), true, true}
    end

    test "broadcast_read? defaults to true and can be set to false" do
      assert MessageDispatcher.fastlane_metadata(
               self(),
               Serializer,
               "realtime:topic",
               :info,
               "tenant_id",
               MapSet.new(),
               true,
               false
             ) ==
               {:rc_fastlane, self(), Serializer, "realtime:topic", :info, "tenant_id", MapSet.new(), true, false}
    end
  end

  describe "dispatch/3" do
    setup do
      {:ok, _pid} =
        start_supervised(%{
          id: TestSerializer,
          start: {Agent, :start_link, [fn -> 0 end, [name: TestSerializer]]}
        })

      :ok
    end

    test "dispatches messages to fastlane subscribers" do
      parent = self()

      subscriber_pid =
        spawn(fn ->
          loop = fn loop ->
            receive do
              msg ->
                send(parent, {:subscriber, msg})
                loop.(loop)
            end
          end

          loop.(loop)
        end)

      from_pid = :erlang.list_to_pid(~c'<0.2.1>')

      subscribers = [
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :warning, "tenant123", MapSet.new(), true, true}}
      ]

      msg = %Broadcast{topic: "some:other:topic", event: "event", payload: %{data: "test"}}

      log =
        capture_log(fn ->
          assert MessageDispatcher.dispatch(subscribers, from_pid, msg) == :ok
        end)

      assert log =~ "Received message on realtime:topic with payload: #{inspect(msg, pretty: true)}"

      assert_receive {:encoded, %Broadcast{event: "event", payload: %{data: "test"}, topic: "realtime:topic"}}
      assert_receive {:encoded, %Broadcast{event: "event", payload: %{data: "test"}, topic: "realtime:topic"}}

      assert Agent.get(TestSerializer, & &1) == 1

      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}

      refute_receive _any
    end

    test "does not dispatch broadcast messages to subscribers denied broadcast.read" do
      parent = self()

      subscriber_pid =
        spawn(fn ->
          loop = fn loop ->
            receive do
              msg ->
                send(parent, {:subscriber, msg})
                loop.(loop)
            end
          end

          loop.(loop)
        end)

      from_pid = :erlang.list_to_pid(~c'<0.2.1>')

      subscribers = [
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, false}}
      ]

      for msg <- [
            %Broadcast{topic: "some:other:topic", event: "broadcast", payload: %{data: "test"}},
            %UserBroadcast{topic: "some:other:topic", user_event: "event", user_payload: %{data: "test"}}
          ] do
        assert MessageDispatcher.dispatch(subscribers, from_pid, msg) == :ok
      end

      assert Agent.get(TestSerializer, & &1) == 0
      refute_receive _any

      # system/operations events are not gated on broadcast.read
      system = %Broadcast{topic: "some:other:topic", event: "system", payload: %{status: "ok"}}
      assert MessageDispatcher.dispatch(subscribers, from_pid, system) == :ok

      assert_receive {:encoded, %Broadcast{event: "system", topic: "realtime:topic"}}
      assert_receive {:subscriber, :check_rate_counter}
    end

    test "strips the {:tb, tenant_id, msg} tenant tag before dispatching to fastlane subscribers" do
      parent = self()

      subscriber_pid =
        spawn(fn ->
          loop = fn loop ->
            receive do
              msg ->
                send(parent, {:subscriber, msg})
                loop.(loop)
            end
          end

          loop.(loop)
        end)

      from_pid = :erlang.list_to_pid(~c'<0.2.1>')

      subscribers = [
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}}
      ]

      msg = %Broadcast{topic: "some:other:topic", event: "event", payload: %{data: "test"}}

      # TenantBroadcaster tags broadcasts with their tenant_id; dispatch/3 must unwrap so the
      # downstream fastlane path (and the client) only ever sees the underlying struct.
      assert MessageDispatcher.dispatch(subscribers, from_pid, {:tb, "tenant123", msg}) == :ok

      assert_receive {:encoded, %Broadcast{event: "event", payload: %{data: "test"}, topic: "realtime:topic"}}
      assert Agent.get(TestSerializer, & &1) == 1

      assert_receive {:subscriber, :check_rate_counter}

      # The {:tb, ...} wrapper never reaches subscribers
      refute_receive {:tb, _, _}
      refute_receive _any
    end

    test "strips the {:tb, tenant_id, msg} tenant tag before dispatching to non fastlane subscribers" do
      from_pid = :erlang.list_to_pid(~c'<0.2.1>')

      subscribers = [
        {self(), :not_fastlane},
        {self(), :not_fastlane}
      ]

      msg = %Broadcast{topic: "some:other:topic", event: "event", payload: %{data: "test"}}

      assert MessageDispatcher.dispatch(subscribers, from_pid, {:tb, "tenant123", msg}) == :ok

      assert_receive %Broadcast{topic: "some:other:topic", event: "event", payload: %{data: "test"}}
      assert_receive %Broadcast{topic: "some:other:topic", event: "event", payload: %{data: "test"}}

      refute_receive {:tb, _, _}
      assert Agent.get(TestSerializer, & &1) == 0
    end

    test "dispatches 'presence_diff' messages to fastlane subscribers" do
      parent = self()

      subscriber_pid =
        spawn(fn ->
          loop = fn loop ->
            receive do
              msg ->
                send(parent, {:subscriber, msg})
                loop.(loop)
            end
          end

          loop.(loop)
        end)

      from_pid = :erlang.list_to_pid(~c'<0.2.1>')

      subscribers = [
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :info, "tenant456", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :warning, "tenant456", MapSet.new(), true, true}}
      ]

      msg = %Broadcast{topic: "some:other:topic", event: "presence_diff", payload: %{data: "test"}}

      log =
        capture_log(fn ->
          assert MessageDispatcher.dispatch(subscribers, from_pid, msg) == :ok
        end)

      assert log =~ "Received message on realtime:topic with payload: #{inspect(msg, pretty: true)}"

      assert_receive {:encoded, %Broadcast{event: "presence_diff", payload: %{data: "test"}, topic: "realtime:topic"}}
      assert_receive {:encoded, %Broadcast{event: "presence_diff", payload: %{data: "test"}, topic: "realtime:topic"}}

      assert Agent.get(TestSerializer, & &1) == 1

      assert Realtime.GenCounter.get(Realtime.Tenants.presence_events_per_second_key("tenant456")) == 2

      refute_receive _any
    end

    test "does not dispatch 'presence_diff' messages to subscribers denied presence.read" do
      parent = self()

      subscriber_pid =
        spawn(fn ->
          loop = fn loop ->
            receive do
              msg ->
                send(parent, {:subscriber, msg})
                loop.(loop)
            end
          end

          loop.(loop)
        end)

      from_pid = :erlang.list_to_pid(~c'<0.2.1>')

      subscribers = [
        # allowed: presence_read? == true -> fastlaned
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :info, "tenant789", MapSet.new(), true, true}},
        # denied: presence_read? == false -> withheld
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :warning, "tenant789", MapSet.new(), false, true}},
        # unknown: presence_read? == nil -> routed to the channel process (raw, unencoded)
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :info, "tenant789", MapSet.new(), nil, true}}
      ]

      msg = %Broadcast{topic: "some:other:topic", event: "presence_diff", payload: %{data: "test"}}

      assert MessageDispatcher.dispatch(subscribers, from_pid, msg) == :ok

      # Only the allowed subscriber is encoded/delivered to its fastlane pid.
      assert_receive {:encoded, %Broadcast{event: "presence_diff", payload: %{data: "test"}, topic: "realtime:topic"}}
      assert Agent.get(TestSerializer, & &1) == 1

      # The nil subscriber is routed to its channel process wrapped, for handle_info to gate.
      assert_receive {:subscriber,
                      {:authorize_presence_diff,
                       %Broadcast{event: "presence_diff", payload: %{data: "test"}, topic: "some:other:topic"}}}

      # The presence counter only counts the fastlaned (allowed) subscriber.
      assert Realtime.GenCounter.get(Realtime.Tenants.presence_events_per_second_key("tenant789")) == 1

      refute_receive _any
    end

    test "does not dispatch messages to fastlane subscribers if they already replayed it" do
      parent = self()

      subscriber_pid =
        spawn(fn ->
          loop = fn loop ->
            receive do
              msg ->
                send(parent, {:subscriber, msg})
                loop.(loop)
            end
          end

          loop.(loop)
        end)

      from_pid = :erlang.list_to_pid(~c'<0.2.1>')
      replaeyd_message_ids = MapSet.new(["123"])

      subscribers = [
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :info, "tenant123", replaeyd_message_ids, true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :warning, "tenant123", replaeyd_message_ids, true,
          true}}
      ]

      msg = %Broadcast{
        topic: "some:other:topic",
        event: "event",
        payload: %{"data" => "test", "meta" => %{"id" => "123"}}
      }

      assert MessageDispatcher.dispatch(subscribers, from_pid, msg) == :ok

      assert Agent.get(TestSerializer, & &1) == 0

      refute_receive _any
    end

    test "does not dispatch UserBroadcast to fastlane subscribers if they already replayed it" do
      parent = self()

      subscriber_pid =
        spawn(fn ->
          loop = fn loop ->
            receive do
              msg ->
                send(parent, {:subscriber, msg})
                loop.(loop)
            end
          end

          loop.(loop)
        end)

      from_pid = :erlang.list_to_pid(~c'<0.2.1>')
      replayed_message_ids = MapSet.new(["abc"])

      subscribers = [
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :info, "tenant123", replayed_message_ids, true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :warning, "tenant123", replayed_message_ids, true,
          true}}
      ]

      msg = %UserBroadcast{
        topic: "some:other:topic",
        user_event: "event",
        user_payload: Jason.encode!(%{data: "test"}),
        user_payload_encoding: :json,
        metadata: %{"id" => "abc"}
      }

      assert MessageDispatcher.dispatch(subscribers, from_pid, msg) == :ok

      assert Agent.get(TestSerializer, & &1) == 0

      refute_receive _any
    end

    test "payload is not a map" do
      parent = self()

      subscriber_pid =
        spawn(fn ->
          loop = fn loop ->
            receive do
              msg ->
                send(parent, {:subscriber, msg})
                loop.(loop)
            end
          end

          loop.(loop)
        end)

      from_pid = :erlang.list_to_pid(~c'<0.2.1>')

      subscribers = [
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :warning, "tenant123", MapSet.new(), true, true}}
      ]

      msg = %Broadcast{topic: "some:other:topic", event: "event", payload: "not a map"}

      log =
        capture_log(fn ->
          assert MessageDispatcher.dispatch(subscribers, from_pid, msg) == :ok
        end)

      assert log =~ "Received message on realtime:topic with payload: #{inspect(msg, pretty: true)}"

      assert_receive {:encoded, %Broadcast{event: "event", payload: "not a map", topic: "realtime:topic"}}
      assert_receive {:encoded, %Broadcast{event: "event", payload: "not a map", topic: "realtime:topic"}}

      assert Agent.get(TestSerializer, & &1) == 1

      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}

      refute_receive _any
    end

    test "encodes message separately for each unique serializer and join topic combination" do
      parent = self()

      subscriber_pid =
        spawn(fn ->
          loop = fn loop ->
            receive do
              msg ->
                send(parent, {:subscriber, msg})
                loop.(loop)
            end
          end

          loop.(loop)
        end)

      from_pid = :erlang.list_to_pid(~c'<0.2.1>')

      # Four subscribers: same serializer, two different join_topics (two each)
      subscribers = [
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic-a", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic-a", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic-b", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic-b", :info, "tenant123", MapSet.new(), true, true}}
      ]

      msg = %Broadcast{topic: "some:other:topic", event: "event", payload: %{data: "test"}}

      log =
        capture_log(fn ->
          assert MessageDispatcher.dispatch(subscribers, from_pid, msg) == :ok
        end)

      assert log =~ "Received message on realtime:topic-a"
      assert log =~ "Received message on realtime:topic-b"

      # Serializer called once per unique {serializer, join_topic} pair (2 topics = 2 calls)
      assert Agent.get(TestSerializer, & &1) == 2

      # Each topic gets encoded with the correct topic rewritten
      assert_receive {:encoded, %Broadcast{event: "event", topic: "realtime:topic-a"}}
      assert_receive {:encoded, %Broadcast{event: "event", topic: "realtime:topic-a"}}
      assert_receive {:encoded, %Broadcast{event: "event", topic: "realtime:topic-b"}}
      assert_receive {:encoded, %Broadcast{event: "event", topic: "realtime:topic-b"}}

      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}

      refute_receive _any
    end

    test "dispatches messages to non fastlane subscribers" do
      from_pid = :erlang.list_to_pid(~c'<0.2.1>')

      subscribers = [
        {self(), :not_fastlane},
        {self(), :not_fastlane}
      ]

      msg = %Broadcast{topic: "some:other:topic", event: "event", payload: %{data: "test"}}

      assert MessageDispatcher.dispatch(subscribers, from_pid, msg) == :ok

      assert_receive %Phoenix.Socket.Broadcast{topic: "some:other:topic", event: "event", payload: %{data: "test"}}
      assert_receive %Phoenix.Socket.Broadcast{topic: "some:other:topic", event: "event", payload: %{data: "test"}}

      # TestSerializer is not called
      assert Agent.get(TestSerializer, & &1) == 0
    end

    test "dispatches Broadcast to V1 & V2 Serializers" do
      parent = self()

      subscriber_pid =
        spawn(fn ->
          loop = fn loop ->
            receive do
              msg ->
                send(parent, {:subscriber, msg})
                loop.(loop)
            end
          end

          loop.(loop)
        end)

      from_pid = :erlang.list_to_pid(~c'<0.2.1>')

      subscribers = [
        {subscriber_pid,
         {:rc_fastlane, self(), V1.JSONSerializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), V1.JSONSerializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), V2Serializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), V2Serializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}}
      ]

      msg = %Broadcast{topic: "some:other:topic", event: "event", payload: %{data: "test"}}

      log =
        capture_log(fn ->
          assert MessageDispatcher.dispatch(subscribers, from_pid, msg) == :ok
        end)

      assert log =~ "Received message on realtime:topic with payload: #{inspect(msg, pretty: true)}"

      # Receive 2 messages using V1
      assert_receive {:socket_push, :text, message_v1}
      assert_receive {:socket_push, :text, ^message_v1}

      assert Jason.decode!(message_v1) == %{
               "event" => "event",
               "payload" => %{"data" => "test"},
               "ref" => nil,
               "topic" => "realtime:topic"
             }

      # Receive 2 messages using V2
      assert_receive {:socket_push, :text, message_v2}
      assert_receive {:socket_push, :text, ^message_v2}

      # V2 is an array format
      assert Jason.decode!(message_v2) == [nil, nil, "realtime:topic", "event", %{"data" => "test"}]

      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}

      refute_receive _any
    end

    test "dispatches json UserBroadcast to V1 & V2 Serializers" do
      parent = self()

      subscriber_pid =
        spawn(fn ->
          loop = fn loop ->
            receive do
              msg ->
                send(parent, {:subscriber, msg})
                loop.(loop)
            end
          end

          loop.(loop)
        end)

      from_pid = :erlang.list_to_pid(~c'<0.2.1>')

      subscribers = [
        {subscriber_pid,
         {:rc_fastlane, self(), V1.JSONSerializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), V1.JSONSerializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), V2Serializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), V2Serializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}}
      ]

      user_payload = Jason.encode!(%{data: "test"})

      msg = %UserBroadcast{
        topic: "some:other:topic",
        user_event: "event123",
        user_payload: user_payload,
        user_payload_encoding: :json,
        metadata: %{"id" => "123", "replayed" => true}
      }

      log =
        capture_log(fn ->
          assert MessageDispatcher.dispatch(subscribers, from_pid, msg) == :ok
        end)

      assert log =~ "Received message on realtime:topic with payload: #{inspect(msg, pretty: true)}"

      # Receive 2 messages using V1
      assert_receive {:socket_push, :text, message_v1}
      assert_receive {:socket_push, :text, ^message_v1}

      assert Jason.decode!(message_v1) == %{
               "event" => "broadcast",
               "payload" => %{
                 "event" => "event123",
                 "meta" => %{"id" => "123", "replayed" => true},
                 "payload" => %{"data" => "test"},
                 "type" => "broadcast"
               },
               "ref" => nil,
               "topic" => "realtime:topic"
             }

      # Receive 2 messages using V2
      assert_receive {:socket_push, :binary, message_v2}
      assert_receive {:socket_push, :binary, ^message_v2}

      encoded_metadata = Jason.encode!(%{"id" => "123", "replayed" => true})
      metadata_size = byte_size(encoded_metadata)

      # binary payload structure
      assert message_v2 ==
               <<
                 # user broadcast = 4
                 4::size(8),
                 # topic_size
                 14,
                 # user_event_size
                 8,
                 # metadata_size
                 metadata_size,
                 # json encoding
                 1::size(8),
                 "realtime:topic",
                 "event123"
               >> <> encoded_metadata <> user_payload

      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}

      refute_receive _any
    end

    test "dispatches binary UserBroadcast to V1 & V2 Serializers" do
      parent = self()

      subscriber_pid =
        spawn(fn ->
          loop = fn loop ->
            receive do
              msg ->
                send(parent, {:subscriber, msg})
                loop.(loop)
            end
          end

          loop.(loop)
        end)

      from_pid = :erlang.list_to_pid(~c'<0.2.1>')

      subscribers = [
        {subscriber_pid,
         {:rc_fastlane, self(), V1.JSONSerializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), V1.JSONSerializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), V2Serializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), V2Serializer, "realtime:topic", :info, "tenant123", MapSet.new(), true, true}}
      ]

      user_payload = <<123, 456, 789>>

      msg = %UserBroadcast{
        topic: "some:other:topic",
        user_event: "event123",
        user_payload: user_payload,
        user_payload_encoding: :binary,
        metadata: %{"id" => "123", "replayed" => true}
      }

      log =
        capture_log(fn ->
          assert MessageDispatcher.dispatch(subscribers, from_pid, msg) == :ok
        end)

      assert log =~ "Received message on realtime:topic with payload: #{inspect(msg, pretty: true)}"
      assert log =~ "User payload encoding is not JSON"

      # Only prints once
      assert String.split(log, "User payload encoding is not JSON") |> length() == 2

      # No V1 message received as binary payloads are not supported
      refute_receive {:socket_push, :text, _message_v1}

      # Receive 2 messages using V2
      assert_receive {:socket_push, :binary, message_v2}
      assert_receive {:socket_push, :binary, ^message_v2}

      encoded_metadata = Jason.encode!(%{"id" => "123", "replayed" => true})
      metadata_size = byte_size(encoded_metadata)

      # binary payload structure
      assert message_v2 ==
               <<
                 # user broadcast = 4
                 4::size(8),
                 # topic_size
                 14,
                 # user_event_size
                 8,
                 # metadata_size
                 metadata_size,
                 # binary encoding
                 0::size(8),
                 "realtime:topic",
                 "event123"
               >> <> encoded_metadata <> user_payload

      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}

      refute_receive _any
    end
  end

  describe "dispatch/3 events rate counter" do
    setup do
      {:ok, _pid} =
        start_supervised(%{
          id: TestSerializer,
          start: {Agent, :start_link, [fn -> 0 end, [name: TestSerializer]]}
        })

      tenant_id = Ecto.UUID.generate()
      rate_args = Realtime.Tenants.events_per_second_rate(tenant_id, 100)
      {:ok, counter_pid} = Realtime.RateCounter.new(rate_args)
      # Wait for the immediate first tick so it does not reset the count mid-test
      :sys.get_state(counter_pid)

      subscriber_pid = spawn_subscriber(self())

      subscribers = [
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :warning, tenant_id, MapSet.new(), true, true}},
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :warning, tenant_id, MapSet.new(), true, true}},
        # denied broadcast.read: not delivered, not counted
        {subscriber_pid,
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :warning, tenant_id, MapSet.new(), true, false}}
      ]

      %{tenant_id: tenant_id, rate_args: rate_args, subscribers: subscribers}
    end

    test "counts delivered messages in bulk without messaging channels", %{
      rate_args: rate_args,
      subscribers: subscribers
    } do
      msg = %Broadcast{topic: "some:other:topic", event: "broadcast", payload: %{data: "test"}}

      assert MessageDispatcher.dispatch(subscribers, self(), msg) == :ok

      assert_receive {:encoded, %Broadcast{event: "broadcast"}}
      assert_receive {:encoded, %Broadcast{event: "broadcast"}}
      assert Realtime.GenCounter.get(rate_args.id) == 2
      refute_receive {:subscriber, _}
    end

    test "counts using the tenant tag", %{tenant_id: tenant_id, rate_args: rate_args, subscribers: subscribers} do
      msg = %Broadcast{topic: "some:other:topic", event: "broadcast", payload: %{data: "test"}}

      assert MessageDispatcher.dispatch([{self(), :not_fastlane} | subscribers], nil, {:tb, tenant_id, msg}) == :ok

      assert_receive %Broadcast{event: "broadcast"}
      assert Realtime.GenCounter.get(rate_args.id) == 2
      refute_receive {:subscriber, _}
    end

    test "asks delivered channels to check the rate counter when the limit is triggered", %{
      rate_args: rate_args,
      subscribers: subscribers
    } do
      {:ok, state} = Realtime.RateCounter.find(rate_args.id)
      Cachex.put!(Realtime.RateCounter, rate_args.id, %{state | limit: %{state.limit | triggered: true}})

      msg = %Broadcast{topic: "some:other:topic", event: "broadcast", payload: %{data: "test"}}

      assert MessageDispatcher.dispatch(subscribers, self(), msg) == :ok

      assert_receive {:encoded, %Broadcast{event: "broadcast"}}
      assert_receive {:encoded, %Broadcast{event: "broadcast"}}
      assert Realtime.GenCounter.get(rate_args.id) == 2
      assert_receive {:subscriber, :check_rate_counter}
      assert_receive {:subscriber, :check_rate_counter}
      refute_receive {:subscriber, _}
    end
  end

  describe "dispatch/3 events rate counter not running" do
    setup do
      {:ok, _pid} =
        start_supervised(%{
          id: TestSerializer,
          start: {Agent, :start_link, [fn -> 0 end, [name: TestSerializer]]}
        })

      tenant_id = Ecto.UUID.generate()

      subscribers = [
        {spawn_subscriber(self()),
         {:rc_fastlane, self(), TestSerializer, "realtime:topic", :warning, tenant_id, MapSet.new(), true, true}}
      ]

      %{tenant_id: tenant_id, subscribers: subscribers}
    end

    test "asks delivered channels to check the rate counter so it gets restarted", %{
      tenant_id: tenant_id,
      subscribers: subscribers
    } do
      key = Realtime.Tenants.events_per_second_key(tenant_id)
      assert Realtime.RateCounter.find(key) == {:error, :not_found}

      msg = %Broadcast{topic: "some:other:topic", event: "broadcast", payload: %{data: "test"}}

      assert MessageDispatcher.dispatch(subscribers, self(), msg) == :ok

      assert_receive {:encoded, %Broadcast{event: "broadcast"}}
      assert_receive {:subscriber, :check_rate_counter}
      assert Realtime.GenCounter.get(key) == 1
      # The dispatcher never starts the counter itself
      assert Realtime.RateCounter.find(key) == {:error, :not_found}
    end

    test "tagged presence_diff goes through the presence path and is not counted as an event", %{
      tenant_id: tenant_id,
      subscribers: subscribers
    } do
      msg = %Broadcast{topic: "some:other:topic", event: "presence_diff", payload: %{data: "test"}}

      assert MessageDispatcher.dispatch(subscribers, self(), {:tb, tenant_id, msg}) == :ok

      assert_receive {:encoded, %Broadcast{event: "presence_diff"}}
      assert Realtime.GenCounter.get(Realtime.Tenants.presence_events_per_second_key(tenant_id)) == 1
      assert Realtime.GenCounter.get(Realtime.Tenants.events_per_second_key(tenant_id)) == 0
      refute_receive {:subscriber, _}
    end
  end

  defp spawn_subscriber(parent) do
    spawn(fn ->
      loop = fn loop ->
        receive do
          msg ->
            send(parent, {:subscriber, msg})
            loop.(loop)
        end
      end

      loop.(loop)
    end)
  end
end
