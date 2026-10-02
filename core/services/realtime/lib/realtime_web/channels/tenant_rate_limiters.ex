defmodule RealtimeWeb.TenantRateLimiters do
  @moduledoc """
  Rate limiters for tenants.
  """
  require Logger
  alias Realtime.UsersCounter
  alias Realtime.Tenants
  alias Realtime.RateCounter
  alias Realtime.Api.Tenant

  @spec check_tenant(Realtime.Api.Tenant.t()) :: :ok | {:error, :too_many_connections | :too_many_joins}
  def check_tenant(tenant) do
    with :ok <- max_concurrent_users_check(tenant) do
      max_joins_per_second_check(tenant)
    end
  end

  defp max_concurrent_users_check(%Tenant{max_concurrent_users: max_conn_users, external_id: external_id}) do
    total_conn_users = UsersCounter.tenant_users(external_id)

    if total_conn_users < max_conn_users,
      do: :ok,
      else: {:error, :too_many_connections}
  end

  defp max_joins_per_second_check(%Tenant{max_joins_per_second: max_joins_per_second} = tenant) do
    rate_args = Tenants.joins_per_second_rate(tenant.external_id, max_joins_per_second)

    RateCounter.new(rate_args)

    case RateCounter.get(rate_args) do
      {:ok, %{limit: %{triggered: false}}} ->
        :ok

      {:ok, %{limit: %{triggered: true}}} ->
        {:error, :too_many_joins}

      error ->
        Logger.error("UnknownErrorOnCounter: #{inspect(error)}")
        {:error, error}
    end
  end
end
