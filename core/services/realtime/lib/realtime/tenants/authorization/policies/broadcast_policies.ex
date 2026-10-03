defmodule Realtime.Tenants.Authorization.Policies.BroadcastPolicies do
  @moduledoc """
  BroadcastPolicies structure that holds the required authorization information for a given connection within the scope of a sending / receiving broadcasts messages
  """
  defstruct read: nil, write: nil, persist: nil

  @typedoc """
  * `read` - Whether the connection may receive broadcasts on a given Topic.
  * `write` - Whether the connection may send broadcasts on a given Topic.
  * `persist` - Whether the broadcasts of a given Topic may be stored in `realtime.messages`.

  `nil` means the policy was not checked yet.
  """
  @type t :: %__MODULE__{
          read: boolean() | nil,
          write: boolean() | nil,
          persist: boolean() | nil
        }
end
