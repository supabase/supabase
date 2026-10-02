defmodule Supavisor.Errors.InvalidUserInfoError do
  @moduledoc """
  This error is returned when the user or database name format is invalid.
  """

  use Supavisor.Error, [:user, :db_name, code: "EINVALIDUSERINFO"]

  @type t() :: %__MODULE__{
          user: binary(),
          db_name: term(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(_error) do
    "Authentication error, reason: \"Invalid format for user or db_name\""
  end

  @impl Supavisor.Error
  def log_message(%{user: user, db_name: db_name}) do
    "Invalid format for user or db_name: #{inspect({user, db_name})}"
  end
end
