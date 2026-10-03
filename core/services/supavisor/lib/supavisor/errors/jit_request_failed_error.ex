defmodule Supavisor.Errors.JitRequestFailedError do
  @moduledoc """
  This error is returned when the JIT API request fails unexpectedly.
  """

  use Supavisor.Error, [:user, :reason, code: "EJITREQUESTFAILED"]

  @type t() :: %__MODULE__{
          user: binary(),
          reason: :request_crashed | :unexpected_api_error,
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{user: user}) do
    "failed to reach JIT provider for user \"#{user}\""
  end

  @impl Supavisor.Error
  def log_message(%{user: user, reason: reason}) do
    "JIT request failed for user \"#{user}\": #{reason}"
  end
end
