defmodule Supavisor.Errors.PasswordChangedError do
  @moduledoc """
  This error is returned when SCRAM authentication fails and the user's password was
  changed since the validation secrets were cached.

  The SCRAM exchange was performed with the stale salt, so the client's proof can't be
  verified against the new secrets. The client must reconnect.
  """

  use Supavisor.Error, [:user, code: "EPASSWORDCHANGED"]

  @type t() :: %__MODULE__{
          user: binary(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{user: user}) do
    "password authentication failed for user \"#{user}\": password was recently changed"
  end

  @impl Supavisor.Error
  def log_message(%{user: user}) do
    "Exchange error: password authentication failed for user \"#{user}\", password was recently changed"
  end

  @impl Supavisor.Error
  # Keep the standard PostgreSQL message and code so clients matching on them still work.
  def postgres_error(%{user: user}) do
    "FATAL"
    |> Supavisor.Error.protocol_error(
      "28P01",
      "password authentication failed for user \"#{user}\""
    )
    |> Map.put(
      "H",
      "The password for this user was recently changed. Retry the connection."
    )
  end
end
