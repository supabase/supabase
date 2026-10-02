defmodule Realtime.Tenants.Authorization.Policies do
  @moduledoc """
  Policies structure that holds the required authorization information for a given connection.

  Currently there are two types of policies:
  * Realtime.Tenants.Authorization.Policies.BroadcastPolicies - Used to store the access to Broadcast feature on a given Topic
  * Realtime.Tenants.Authorization.Policies.PresencePolicies - Used to store the access to Presence feature on a given Topic
  """

  alias Realtime.Tenants.Authorization.Policies.BroadcastPolicies
  alias Realtime.Tenants.Authorization.Policies.PresencePolicies

  defstruct broadcast: %BroadcastPolicies{},
            presence: %PresencePolicies{}

  @type t :: %__MODULE__{
          broadcast: BroadcastPolicies.t(),
          presence: PresencePolicies.t()
        }

  @doc """
  Updates the Policies struct sub key with the given value.
  """
  @spec update_policies(t(), atom, atom, boolean) :: t()
  def update_policies(policies, key, sub_key, value) do
    Map.update!(policies, key, fn map -> Map.put(map, sub_key, value) end)
  end
end
