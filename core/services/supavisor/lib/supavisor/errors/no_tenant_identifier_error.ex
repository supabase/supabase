defmodule Supavisor.Errors.NoTenantIdentifierError do
  @moduledoc """
  This error is returned when neither external_id nor sni_hostname is provided
  to identify a tenant.
  """

  use Supavisor.Error, code: "ENOIDENTIFIER"

  @type t() :: %__MODULE__{code: binary()}

  @impl Supavisor.Error
  def error_message(_) do
    "no tenant identifier provided (external_id or sni_hostname required)"
  end
end
