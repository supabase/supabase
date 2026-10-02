defmodule Supavisor.Errors.SslRequiredError do
  @moduledoc """
  This error is returned when a tenant requires SSL but the client attempts to connect without it
  """

  use Supavisor.Error, [:user, code: "ESSLREQUIRED"]

  @type t() :: %__MODULE__{
          user: binary() | nil,
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{user: user}) do
    "SSL connection is required for user: #{user}"
  end
end
