# This file draws from https://github.com/phoenixframework/phoenix/blob/9941711736c8464b27b40914a4d954ed2b4f5958/lib/phoenix/channel/server.ex
# License: https://github.com/phoenixframework/phoenix/blob/518a4640a70aa4d1370a64c2280d598e5b928168/LICENSE.md

defmodule Extensions.PostgresCdcRls.MessageDispatcher do
  @moduledoc """
  Hook invoked by Phoenix.PubSub dispatch.
  """

  alias Phoenix.Socket.Broadcast

  def dispatch([_ | _] = topic_subscriptions, _from, {type, payload, sub_ids}) do
    _ =
      Enum.reduce(topic_subscriptions, %{}, fn
        {_pid, {:subscriber_fastlane, fastlane_pid, serializer, ids, join_topic, is_new_api}}, cache ->
          for {bin_id, id} <- ids, reduce: [] do
            acc ->
              if MapSet.member?(sub_ids, bin_id) do
                [id | acc]
              else
                acc
              end
          end
          |> case do
            [_ | _] = valid_ids ->
              new_payload =
                if is_new_api do
                  %Broadcast{
                    topic: join_topic,
                    event: "postgres_changes",
                    payload: %{ids: valid_ids, data: Jason.Fragment.new(payload)}
                  }
                else
                  %Broadcast{topic: join_topic, event: type, payload: Jason.Fragment.new(payload)}
                end

              broadcast_message(cache, fastlane_pid, new_payload, serializer)

            _ ->
              cache
          end
      end)

    :ok
  end

  defp broadcast_message(cache, fastlane_pid, msg, serializer) do
    case cache do
      %{^msg => encoded_msg} ->
        send(fastlane_pid, encoded_msg)
        cache

      %{} ->
        encoded_msg = serializer.fastlane!(msg)
        send(fastlane_pid, encoded_msg)
        Map.put(cache, msg, encoded_msg)
    end
  end
end
