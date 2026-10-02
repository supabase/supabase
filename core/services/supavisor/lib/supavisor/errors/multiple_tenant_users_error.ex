defmodule Supavisor.Errors.MultipleTenantUsersError do
  @moduledoc """
  This error is returned when a tenant/user lookup matches multiple rows,
  which indicates misconfigured tenant data (e.g. duplicate managers).
  """

  use Supavisor.Error, [:type, :user, :tenant_or_alias, code: "EMULTIPLEUSERS"]

  @type t() :: %__MODULE__{
          type: atom() | nil,
          user: binary() | nil,
          tenant_or_alias: binary() | nil,
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{user: user, tenant_or_alias: tenant_or_alias}),
    do: "multiple users matched for #{user}.#{tenant_or_alias}, check tenant configuration"
end
