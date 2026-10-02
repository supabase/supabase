defmodule Supavisor.ClientHandler.Checks do
  @moduledoc """
  Helpers to check for conditions and return errors if they are not met.
  """

  # TODO: remove the dependency, move the functions here
  alias Supavisor.HandlerHelpers

  alias Supavisor.Errors.{AddressNotAllowedError, SslRequiredError, TenantBannedError}

  def check_tenant_not_banned(data, now \\ DateTime.utc_now())

  def check_tenant_not_banned(%{tenant: %{banned_at: nil}}, _now), do: :ok

  def check_tenant_not_banned(
        %{tenant: %{banned_until: banned_until, ban_reason: reason}},
        now
      )
      when not is_nil(banned_until) do
    if DateTime.compare(now, banned_until) == :gt do
      :ok
    else
      {:error, %TenantBannedError{ban_reason: reason}}
    end
  end

  def check_tenant_not_banned(%{tenant: %{ban_reason: reason}}, _now) do
    {:error, %TenantBannedError{ban_reason: reason}}
  end

  def check_ssl_enforcement(data, info, user) do
    if !data.local and info.tenant.enforce_ssl and !data.ssl do
      {:error, %SslRequiredError{user: user}}
    else
      :ok
    end
  end

  def check_address_allowed(sock, info) do
    {:ok, addr} = HandlerHelpers.addr_from_sock(sock)

    if HandlerHelpers.filter_cidrs(info.tenant.allow_list, addr) == [] do
      {:error, %AddressNotAllowedError{address: addr}}
    else
      :ok
    end
  end
end
