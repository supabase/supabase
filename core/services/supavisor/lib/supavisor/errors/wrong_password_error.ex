defmodule Supavisor.Errors.WrongPasswordError do
  @moduledoc """
  This error is returned when password authentication fails for a user.
  """

  use Supavisor.Error, [:user, code: "EWRONGPASSWORD"]

  @type t() :: %__MODULE__{
          user: binary(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{user: user}) do
    "password authentication failed for user \"#{user}\""
  end

  @impl Supavisor.Error
  def log_message(%{user: user}) do
    "Exchange error: password authentication failed for user \"#{user}\""
  end

  @impl Supavisor.Error
  # Use the plain message without the error code prefix to match
  # the standard PostgreSQL authentication error format on the wire.
  def postgres_error(%{user: user}) do
    Supavisor.Error.protocol_error(
      "FATAL",
      "28P01",
      "password authentication failed for user \"#{user}\""
    )
  end
end
