defmodule Supavisor.Errors.TenantOrUserNotFoundError do
  @moduledoc """
  This error is returned when the requested tenant or user is not found
  """

  use Supavisor.Error, [:type, :user, :tenant_or_alias, code: "ENOTFOUND"]

  @type t() :: %__MODULE__{
          type: atom() | nil,
          user: binary() | nil,
          tenant_or_alias: binary() | nil,
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{user: user, tenant_or_alias: tenant_or_alias}),
    do: "tenant/user #{user}.#{tenant_or_alias} not found"
end
