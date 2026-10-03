defmodule Realtime.PostgresCdc do
  @moduledoc """
  Behaviour and dispatch facade for the Postgres CDC drivers.

  A tenant names its driver through `postgres_cdc_default`, which `driver/1` resolves against the
  configured `:extensions`. Every function here delegates to that driver's `handle_*` callback, so
  callers never reach for a driver module directly.
  """

  alias Realtime.Api.Tenant

  @timeout 10_000
  @extensions Application.compile_env(:realtime, :extensions)

  defmodule Exception do
    defexception message: "PostgresCdc error!"
  end

  def connect(module, opts) do
    apply(module, :handle_connect, [opts])
  end

  def after_connect(module, connect_response, extension, params, tenant) do
    apply(module, :handle_after_connect, [connect_response, extension, params, tenant])
  end

  @doc """
  Subscribes the calling channel to the tenant's Postgres changes.

  It also subscribes to `Realtime.Syn.PostgresCdc.down_topic/1`, where a `postgres_cdc_down` event
  tells the channel to re-subscribe. That re-subscribe is what starts the CDC tree again, as its
  supervisor never restarts it.
  """
  @spec subscribe(module(), [map()], String.t(), keyword()) :: :ok
  def subscribe(module, pg_change_params, tenant, metadata) do
    RealtimeWeb.Endpoint.subscribe(Realtime.Syn.PostgresCdc.down_topic(tenant))
    apply(module, :handle_subscribe, [pg_change_params, tenant, metadata])
  end

  @spec stop(module, Tenant.t(), pos_integer) :: :ok
  def stop(module, tenant, timeout \\ @timeout) do
    apply(module, :handle_stop, [tenant.external_id, timeout])
  end

  @doc """
  Stops all available drivers within a specified timeout.

  Expects all handle_stop calls to return `:ok` within the `stop_timeout`.

  We want all available drivers to stop within the `timeout`.
  """

  @spec stop_all(Tenant.t(), pos_integer) :: :ok | :error
  def stop_all(tenant, timeout \\ @timeout) do
    count = Enum.count(available_drivers())
    stop_timeout = Kernel.ceil(timeout / count)

    stops = Enum.map(available_drivers(), fn module -> stop(module, tenant, stop_timeout) end)

    case Enum.all?(stops, &(&1 == :ok)) do
      true -> :ok
      false -> :error
    end
  end

  @spec available_drivers :: list
  def available_drivers do
    @extensions
    |> Enum.filter(fn {_, e} -> e.type == :postgres_cdc end)
    |> Enum.map(fn {_, e} -> e.driver end)
  end

  @spec filter_settings(binary(), list()) :: map()
  def filter_settings(key, extensions) do
    [cdc] = Enum.filter(extensions, fn e -> e.type == key end)

    cdc.settings
  end

  @doc """
  Gets the extension module for a tenant.
  """

  @spec driver(String.t()) :: {:ok, module()} | {:error, String.t()}
  def driver(tenant_key) do
    @extensions
    |> Enum.filter(fn {_, %{key: key}} -> tenant_key == key end)
    |> case do
      [{_, %{driver: driver}}] -> {:ok, driver}
      _ -> {:error, "No driver found for key #{tenant_key}"}
    end
  end

  @callback handle_connect(any()) :: {:ok, any()} | nil
  @callback handle_after_connect(any(), any(), any(), tenant_id :: String.t()) ::
              {:ok, any()} | {:error, any()} | {:error, any(), any()}
  @callback handle_subscribe(any(), any(), any()) :: :ok
  @callback handle_stop(any(), any()) :: any()
end
