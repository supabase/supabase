defmodule Supavisor.Errors.JitUnauthorizedError do
  @moduledoc """
  This error is returned when a JIT token is valid but the user cannot assume the requested role,
  or when the API returns 401/403.
  """

  use Supavisor.Error, [:user, :reason, code: "EJITUNAUTHORIZED"]

  @type t() :: %__MODULE__{
          user: binary(),
          reason: :role_not_granted | :unauthorized_or_forbidden,
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{user: user}) do
    "password authentication failed for user \"#{user}\""
  end

  @impl Supavisor.Error
  def log_message(%{user: user, reason: reason}) do
    "JIT unauthorized for user \"#{user}\": #{reason}"
  end

  @impl Supavisor.Error
  def postgres_error(%{user: user}) do
    Supavisor.Error.protocol_error(
      "FATAL",
      "28P01",
      "password authentication failed for user \"#{user}\""
    )
  end
end
