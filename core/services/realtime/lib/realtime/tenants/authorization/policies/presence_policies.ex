defmodule Realtime.Tenants.Authorization.Policies.PresencePolicies do
  @moduledoc """
    PresencePolicies structure that holds the required authorization information for a given connection within the scope of a tracking / receiving presence messages
  """
  defstruct read: nil, write: nil

  @type t :: %__MODULE__{
          read: boolean() | nil,
          write: boolean() | nil
        }
end
