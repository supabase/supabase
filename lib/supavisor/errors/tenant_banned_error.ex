defmodule Supavisor.Errors.TenantBannedError do
  @moduledoc """
  This error is returned when a client attempts to connect to a banned tenant.
  """

  use Supavisor.Error, [:ban_reason, code: "EBANNED"]

  @type t() :: %__MODULE__{
          ban_reason: binary() | nil,
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{ban_reason: reason}), do: "tenant is banned: #{reason}"

  @impl Supavisor.Error
  def log_level(_), do: :warning
end
