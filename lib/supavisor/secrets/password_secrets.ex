defmodule Supavisor.Secrets.PasswordSecrets do
  @moduledoc "Secrets for password authentication (plaintext password)"

  @derive {Inspect, except: [:password]}
  defstruct [:user, :password]

  @type t :: %__MODULE__{
          user: String.t(),
          password: String.t()
        }
end
