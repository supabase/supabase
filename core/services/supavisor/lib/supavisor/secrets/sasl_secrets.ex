defmodule Supavisor.Secrets.SASLSecrets do
  @moduledoc "Secrets for SCRAM-SHA-256 authentication"

  @derive {Inspect, except: [:client_key, :server_key, :salt, :stored_key]}
  defstruct [
    :user,
    :client_key,
    :server_key,
    :digest,
    :iterations,
    :salt,
    :stored_key
  ]

  @type t :: %__MODULE__{
          user: String.t(),
          client_key: binary() | nil,
          server_key: binary(),
          digest: String.t(),
          iterations: pos_integer(),
          salt: binary(),
          stored_key: binary()
        }
end
