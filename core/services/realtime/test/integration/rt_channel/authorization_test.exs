defmodule Realtime.Integration.RtChannel.AuthorizationTest do
  use RealtimeWeb.ConnCase,
    async: true,
    parameterize: [
      %{serializer: Phoenix.Socket.V1.JSONSerializer},
      %{serializer: RealtimeWeb.Socket.V2Serializer}
    ]

  import ExUnit.CaptureLog
  import Generators

  alias Phoenix.Socket.Message
  alias Realtime.Integration.WebsocketClient

  @moduletag :capture_log

  setup [:checkout_tenant_and_connect]

  describe "private only channels" do
    setup [:rls_context]

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "user with only private channels enabled will not be able to join public channels", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      change_tenant_configuration(tenant, :private_only, true)
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      topic = "realtime:#{topic}"

      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{
                         "response" => %{
                           "reason" => "PrivateOnly: This project only allows private channels"
                         },
                         "status" => "error"
                       }
                     },
                     500
    end

    @tag policies: [:authenticated_read_broadcast_and_presence, :authenticated_write_broadcast_and_presence]
    test "user with only private channels enabled will be able to join private channels", %{
      tenant: tenant,
      topic: topic,
      serializer: serializer
    } do
      change_tenant_configuration(tenant, :private_only, true)

      # The cache update is what the socket reads on connect.
      assert_eventually Realtime.Tenants.Cache.get_tenant_by_external_id(tenant.external_id).private_only

      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: true}
      topic = "realtime:#{topic}"
      WebsocketClient.join(socket, topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}}, 500
    end
  end

  describe "RLS policy enforcement" do
    setup [:rls_context]

    @tag policies: [:read_matching_user_role, :write_matching_user_role], role: "anon"
    test "role policies are respected when accessing the channel", %{tenant: tenant, serializer: serializer} do
      {socket, _} = get_connection(tenant, serializer, role: "anon")
      config = %{broadcast: %{self: true}, private: true, presence: %{enabled: false}}
      topic = random_string()
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^realtime_topic}, 500

      {socket, _} = get_connection(tenant, serializer, role: "potato")
      topic = random_string()
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config})
      refute_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^realtime_topic}, 500
    end

    @tag policies: [:authenticated_read_matching_user_sub, :authenticated_write_matching_user_sub],
         sub: Ecto.UUID.generate()
    test "sub policies are respected when accessing the channel", %{tenant: tenant, sub: sub, serializer: serializer} do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated", claims: %{sub: sub})
      config = %{broadcast: %{self: true}, private: true, presence: %{enabled: false}}
      topic = random_string()
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config})

      assert_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^realtime_topic}, 500

      {socket, _} = get_connection(tenant, serializer, role: "authenticated", claims: %{sub: Ecto.UUID.generate()})
      topic = random_string()
      realtime_topic = "realtime:#{topic}"

      WebsocketClient.join(socket, realtime_topic, %{config: config})
      refute_receive %Message{event: "phx_reply", payload: %{"status" => "ok"}, topic: ^realtime_topic}, 500
    end

    @tag role: "authenticated", policies: [:broken_read_presence, :broken_write_presence]
    test "handle failing rls policy", %{tenant: tenant, serializer: serializer} do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: true}
      topic = random_string()
      realtime_topic = "realtime:#{topic}"

      log =
        capture_log(fn ->
          WebsocketClient.join(socket, realtime_topic, %{config: config})

          msg = "Unauthorized: You do not have permissions to read from this Channel topic: #{topic}"

          assert_receive %Message{
                           event: "phx_reply",
                           payload: %{
                             "response" => %{
                               "reason" => ^msg
                             },
                             "status" => "error"
                           }
                         },
                         500

          refute_receive %Message{event: "phx_reply"}
          refute_receive %Message{event: "presence_state"}
        end)

      assert log =~ "RlsPolicyError"
    end
  end

  describe "topic validation" do
    test "handle empty topic by closing the socket", %{tenant: tenant, serializer: serializer} do
      {socket, _} = get_connection(tenant, serializer, role: "authenticated")
      config = %{broadcast: %{self: true}, private: false}
      realtime_topic = "realtime:"

      WebsocketClient.join(socket, realtime_topic, %{config: config})

      assert_receive %Message{
                       event: "phx_reply",
                       payload: %{
                         "response" => %{
                           "reason" => "TopicNameRequired: You must provide a topic name"
                         },
                         "status" => "error"
                       }
                     },
                     500

      refute_receive %Message{event: "phx_reply"}
      refute_receive %Message{event: "presence_state"}
    end
  end
end
