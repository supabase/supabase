defmodule RealtimeWeb.Dashboard.FeatureFlags do
  @moduledoc """
  Phoenix LiveDashboard page for managing feature flags.

  Provides a UI to create, toggle, and delete global feature flags, and to
  search for a tenant and override the flag value for that specific tenant.
  """

  use Phoenix.LiveDashboard.PageBuilder

  alias Realtime.Api
  alias Realtime.FeatureFlags
  alias Realtime.Tenants.Cache, as: TenantsCache

  @impl true
  def menu_link(_, _), do: {:ok, "Feature Flags"}

  @impl true
  def mount(_params, _, socket) do
    {:ok, reset_tenant_state(assign(socket, flags: Api.list_feature_flags()))}
  end

  @impl true
  def handle_event("toggle", %{"id" => id}, socket) do
    flag = Enum.find(socket.assigns.flags, &(&1.id == id))

    attrs = %{
      name: flag.name,
      enabled: !flag.enabled,
      rollout_percentage: flag.rollout_percentage,
      bucket_key: flag.bucket_key
    }

    case Api.upsert_feature_flag(attrs) do
      {:ok, updated} ->
        flags = Enum.map(socket.assigns.flags, fn f -> if f.id == id, do: updated, else: f end)
        {:noreply, assign(socket, flags: flags)}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  @impl true
  def handle_event(
        "set_rollout",
        %{"flag_id" => id, "rollout_percentage" => rollout_percentage, "bucket_key" => bucket_key},
        socket
      ) do
    flag = Enum.find(socket.assigns.flags, &(&1.id == id))

    with {pct, ""} <- Integer.parse(rollout_percentage),
         attrs = %{
           name: flag.name,
           enabled: flag.enabled,
           rollout_percentage: pct,
           bucket_key: normalize_bucket_key(bucket_key)
         },
         {:ok, updated} <- Api.upsert_feature_flag(attrs) do
      flags = Enum.map(socket.assigns.flags, fn f -> if f.id == id, do: updated, else: f end)
      {:noreply, assign(socket, flags: flags)}
    else
      _ -> {:noreply, socket}
    end
  end

  @impl true
  def handle_event("create", %{"name" => name}, socket) when name != "" do
    case Api.upsert_feature_flag(%{name: String.trim(name), enabled: false}) do
      {:ok, flag} ->
        flags = Enum.sort_by([flag | socket.assigns.flags], & &1.name)
        {:noreply, assign(socket, flags: flags)}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  @impl true
  def handle_event("create", _params, socket), do: {:noreply, socket}

  @impl true
  def handle_event("delete", %{"id" => id}, socket) do
    flag = Enum.find(socket.assigns.flags, &(&1.id == id))

    case Api.delete_feature_flag(flag) do
      {:ok, _} ->
        {:noreply, assign(socket, flags: Enum.reject(socket.assigns.flags, &(&1.id == id)))}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  @impl true
  def handle_event("open_tenant_manager", %{"id" => id}, socket) do
    {:noreply, reset_tenant_state(socket, managing_id: id)}
  end

  @impl true
  def handle_event("close_tenant_manager", _params, socket) do
    {:noreply, reset_tenant_state(socket)}
  end

  @impl true
  def handle_event("search_tenant", %{"tenant_id" => tenant_id}, socket) do
    case TenantsCache.get_tenant_by_external_id(String.trim(tenant_id)) do
      nil ->
        {:noreply, assign(socket, found_tenant: nil, tenant_error: "Tenant not found", tenant_search: tenant_id)}

      tenant ->
        {:noreply, assign(socket, found_tenant: tenant, tenant_error: nil, tenant_search: tenant_id)}
    end
  end

  @impl true
  def handle_event("set_tenant_flag", %{"flag_name" => flag_name, "enabled" => enabled}, socket) do
    tenant = socket.assigns.found_tenant

    case FeatureFlags.set_tenant_flag(flag_name, tenant.external_id, enabled == "true") do
      {:ok, updated_tenant} ->
        {:noreply, assign(socket, found_tenant: updated_tenant)}

      {:error, _} ->
        {:noreply, assign(socket, tenant_error: "Failed to update tenant flag")}
    end
  end

  @impl true
  def handle_event("clear_tenant_flag", %{"flag_name" => flag_name}, socket) do
    tenant = socket.assigns.found_tenant

    case FeatureFlags.clear_tenant_flag(flag_name, tenant.external_id) do
      {:ok, updated_tenant} ->
        {:noreply, assign(socket, found_tenant: updated_tenant)}

      {:error, _} ->
        {:noreply, assign(socket, tenant_error: "Failed to clear tenant flag")}
    end
  end

  defp reset_tenant_state(socket, extra \\ []) do
    assign(socket, [managing_id: nil, tenant_search: "", found_tenant: nil, tenant_error: nil] ++ extra)
  end

  defp normalize_bucket_key(bucket_key) do
    case String.trim(bucket_key) do
      "" -> nil
      trimmed -> trimmed
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="phx-dashboard-section">
      <h5 class="card-title">Feature Flags</h5>

      <form phx-submit="create" class="mb-4 d-flex gap-2">
        <input
          type="text"
          name="name"
          placeholder="New flag name"
          class="form-control w-auto"
          autocomplete="off"
        />
        <button type="submit" class="btn btn-primary">Add</button>
      </form>

      <table class="table table-hover">
        <thead>
          <tr>
            <th style="width: 25%">Name</th>
            <th style="width: 12%">Status</th>
            <th style="width: 43%">Rollout</th>
            <th style="width: 20%">Actions</th>
          </tr>
        </thead>
        <tbody>
          <%= for flag <- @flags do %>
            <tr>
              <td class="font-monospace align-middle"><%= flag.name %></td>
              <td class="align-middle">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <button
                    type="button"
                    phx-click="toggle"
                    phx-value-id={flag.id}
                    role="switch"
                    aria-checked={to_string(flag.enabled)}
                    style={"position: relative; display: inline-flex; align-items: center; width: 44px; height: 24px; border-radius: 9999px; border: none; outline: none; cursor: pointer; padding: 0; transition: background-color 0.2s ease; background-color: #{if flag.enabled, do: "#22c55e", else: "#9ca3af"};"}
                  >
                    <span style={"display: block; width: 18px; height: 18px; border-radius: 50%; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.2s ease; transform: translateX(#{if flag.enabled, do: "23px", else: "3px"});"} />
                  </button>
                  <span style={"font-size: 0.8125rem; font-weight: 500; color: #{if flag.enabled, do: "#16a34a", else: "#6b7280"};"}>
                    <%= if flag.enabled, do: "Enabled", else: "Disabled" %>
                  </span>
                </div>
              </td>
              <td class="align-middle">
                <form id={"set_rollout_#{flag.id}"} phx-submit="set_rollout" class="d-flex align-items-end gap-3">
                  <input type="hidden" name="flag_id" value={flag.id} />
                  <div>
                    <label for={"rollout_percentage_#{flag.id}"} class="form-label text-muted small mb-1">Percentage</label>
                    <div class="d-flex align-items-center gap-1">
                      <input
                        id={"rollout_percentage_#{flag.id}"}
                        type="number"
                        name="rollout_percentage"
                        min="0"
                        max="100"
                        value={flag.rollout_percentage}
                        class="form-control form-control-sm"
                        style="width: 80px;"
                      />
                      <span class="text-muted">%</span>
                    </div>
                  </div>
                  <div>
                    <label for={"bucket_key_#{flag.id}"} class="form-label text-muted small mb-1">Bucket key</label>
                    <input
                      id={"bucket_key_#{flag.id}"}
                      type="text"
                      name="bucket_key"
                      value={flag.bucket_key}
                      placeholder={"defaults to \"#{flag.name}\""}
                      title="Bucket key: flags sharing the same bucket key share the same rollout cohort"
                      class="form-control form-control-sm"
                      style="width: 180px;"
                      autocomplete="off"
                    />
                  </div>
                  <button type="submit" class="btn btn-sm btn-outline-secondary">Save</button>
                </form>
              </td>
              <td class="align-middle">
                <div style="display: flex; gap: 0.5rem;">
                  <button phx-click="open_tenant_manager" phx-value-id={flag.id} class="btn btn-sm btn-outline-primary">
                    Tenants
                  </button>
                  <button
                    phx-click="delete"
                    phx-value-id={flag.id}
                    data-confirm={"Delete flag #{flag.name}?"}
                    class="btn btn-sm btn-outline-danger"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
            <%= if @managing_id == flag.id do %>
              <tr>
                <td colspan="4" style="background: #f8f9fa; padding: 1rem 1.25rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                    <strong>Tenant flag: <%= flag.name %></strong>
                    <button phx-click="close_tenant_manager" class="btn btn-sm btn-secondary">Close</button>
                  </div>

                  <form phx-submit="search_tenant" class="d-flex gap-2 mb-3">
                    <input
                      type="text"
                      name="tenant_id"
                      value={@tenant_search}
                      placeholder="Enter tenant external_id"
                      class="form-control form-control-sm w-auto"
                      autocomplete="off"
                    />
                    <button type="submit" class="btn btn-sm btn-primary">Search</button>
                  </form>

                  <%= if @tenant_error do %>
                    <p class="text-danger mb-2"><%= @tenant_error %></p>
                  <% end %>

                  <%= if @found_tenant do %>
                    <% override = Map.get(@found_tenant.feature_flags, flag.name) %>
                    <% inherited = FeatureFlags.enabled?(flag.name, @found_tenant.external_id) %>
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem 0.75rem; background: white; border-radius: 4px; border: 1px solid #dee2e6;">
                      <code><%= @found_tenant.external_id %></code>
                      <span class="text-muted">—</span>
                      <%= case override do %>
                        <% true -> %>
                          <span class="badge" style="background: #22c55e; color: white;">Override: Enabled</span>
                        <% false -> %>
                          <span class="badge" style="background: #6b7280; color: white;">Override: Disabled</span>
                        <% nil -> %>
                          <span class="badge" style="background: #e5e7eb; color: #374151;">
                            No override · inheriting <%= if inherited, do: "Enabled", else: "Disabled" %>
                          </span>
                      <% end %>
                      <div style="display: flex; gap: 0.5rem; margin-left: auto;">
                        <button
                          type="button"
                          phx-click="set_tenant_flag"
                          phx-value-flag_name={flag.name}
                          phx-value-enabled="true"
                          disabled={override == true}
                          class={"btn btn-sm #{if override == true, do: "btn-success", else: "btn-outline-success"}"}
                        >
                          Enable
                        </button>
                        <button
                          type="button"
                          phx-click="set_tenant_flag"
                          phx-value-flag_name={flag.name}
                          phx-value-enabled="false"
                          disabled={override == false}
                          class={"btn btn-sm #{if override == false, do: "btn-secondary", else: "btn-outline-secondary"}"}
                        >
                          Disable
                        </button>
                        <%= if override != nil do %>
                          <button
                            type="button"
                            phx-click="clear_tenant_flag"
                            phx-value-flag_name={flag.name}
                            class="btn btn-sm btn-outline-danger"
                          >
                            Clear override
                          </button>
                        <% end %>
                      </div>
                    </div>
                  <% end %>
                </td>
              </tr>
            <% end %>
          <% end %>
        </tbody>
      </table>
    </div>
    """
  end
end
