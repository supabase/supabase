defmodule Realtime.Tenants.Connect.ReconcileMigrations do
  @moduledoc """
  Reconciles the tenant's cached migrations_ran counter with the actual
  migration count from the tenant database's schema_migrations table.

  This handles the case where a project restore causes the database schema
  to revert while the migrations_ran counter remains at the latest value.
  """

  alias Realtime.Api
  alias Realtime.Telemetry

  @behaviour Realtime.Tenants.Connect.Piper

  @event [:realtime, :tenants, :migrations, :reconcile]

  @impl true
  def run(%{tenant: %{migrations_ran: migrations_ran}, migrations_ran_on_database: migrations_ran} = acc),
    do: {:ok, acc}

  def run(%{tenant: tenant, migrations_ran_on_database: migrations_ran_on_database} = acc) do
    metadata = %{
      external_id: tenant.external_id,
      cached_migrations_ran: tenant.migrations_ran,
      database_migrations_ran: migrations_ran_on_database
    }

    start_time = Telemetry.start(@event, metadata)

    case Api.update_migrations_ran(tenant.external_id, migrations_ran_on_database) do
      {:ok, updated_tenant} ->
        Telemetry.stop(@event, start_time, metadata)
        {:ok, %{acc | tenant: updated_tenant}}

      {:error, error} ->
        Telemetry.exception(@event, start_time, :error, error, [], metadata)
        {:error, error}
    end
  end
end
