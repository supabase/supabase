defmodule Supavisor.Errors.AddressNotAllowedError do
  @moduledoc """
  This error is returned when a client attempts to connect from an address not in the tenant's allow_list
  """

  use Supavisor.Error, [:address, code: "EADDRNOTALLOWED"]

  @type t() :: %__MODULE__{
          address: term(),
          code: binary()
        }

  @impl Supavisor.Error
  def error_message(%{address: address}) do
    "address not in tenant allow_list: #{inspect(address)}"
  end
end
