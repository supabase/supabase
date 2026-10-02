defmodule Supavisor.Secrets.ManagerSecrets do
  @moduledoc "Secrets for manager user (used by SecretChecker to run auth_query)"

  @derive {Inspect, except: [:db_password]}
  defstruct [:db_user, :db_password]

  @type t :: %__MODULE__{
          db_user: String.t(),
          db_password: String.t()
        }

  @spec from_manager_user(Supavisor.Tenants.User.t()) :: t()
  def from_manager_user(%Supavisor.Tenants.User{is_manager: true} = user) do
    %__MODULE__{
      db_user: user.db_user,
      db_password: user.db_password
    }
  end
end
