defmodule RealtimeWeb.Dashboard.ReconTrace do
  @moduledoc false
  use Phoenix.LiveDashboard.PageBuilder

  alias Phoenix.LiveView.JS

  @impl true
  def menu_link(_, _), do: {:ok, "Recon Trace"}

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(
       tracing: false,
       collector_pid: nil,
       mod: "",
       fun: "_",
       arity: "_",
       max_calls: "100",
       scope: "local",
       entry_count: 0,
       entries: [],
       sort_by: nil,
       error: nil,
       mod_suggestions: [],
       module_functions: [],
       fun_suggestions: [],
       arity_options: []
     )
     |> stream(:entries, [])}
  end

  def terminate(_reason, socket) do
    if socket.assigns.tracing, do: do_stop(socket.assigns.collector_pid)
    :ok
  end

  @impl true
  def handle_event("start", params, socket) do
    case parse_and_start(params, self()) do
      {:ok, collector_pid} ->
        {:noreply,
         socket
         |> assign(
           tracing: true,
           collector_pid: collector_pid,
           entry_count: 0,
           entries: [],
           sort_by: nil,
           error: nil
         )
         |> stream(:entries, [], reset: true)}

      {:error, reason} ->
        {:noreply, assign(socket, error: reason)}
    end
  end

  def handle_event("stop", _params, socket) do
    do_stop(socket.assigns.collector_pid)
    {:noreply, assign(socket, tracing: false, collector_pid: nil)}
  end

  def handle_event("clear", _params, socket) do
    {:noreply,
     socket
     |> assign(entry_count: 0, entries: [], sort_by: nil)
     |> stream(:entries, [], reset: true)}
  end

  def handle_event("sort_by", %{"field" => field}, socket) do
    sort_by = if field == "none", do: nil, else: String.to_existing_atom(field)
    sorted = sort_entries(socket.assigns.entries, sort_by)

    {:noreply,
     socket
     |> assign(sort_by: sort_by)
     |> stream(:entries, sorted, reset: true)}
  end

  def handle_event("field_changed", %{"_target" => ["mod"], "mod" => val} = params, socket) do
    suggestions =
      if String.length(val) >= 2 do
        downcased = String.downcase(val)

        :code.all_loaded()
        |> Enum.flat_map(fn
          {mod, _} when is_atom(mod) -> [Atom.to_string(mod)]
          _ -> []
        end)
        |> Enum.filter(&String.contains?(String.downcase(&1), downcased))
        |> Enum.sort()
        |> Enum.take(15)
      else
        []
      end

    {:noreply,
     assign(socket,
       mod: val,
       mod_suggestions: suggestions,
       fun: Map.get(params, "fun", "_"),
       arity: Map.get(params, "arity", "_"),
       module_functions: [],
       fun_suggestions: [],
       arity_options: []
     )}
  end

  def handle_event("field_changed", %{"_target" => ["fun"], "fun" => val} = params, socket) do
    suggestions =
      if val != "" && socket.assigns.module_functions != [] do
        downcased = String.downcase(val)

        socket.assigns.module_functions
        |> Enum.map(fn {name, _arity} -> Atom.to_string(name) end)
        |> Enum.uniq()
        |> Enum.filter(&String.contains?(String.downcase(&1), downcased))
        |> Enum.sort()
        |> Enum.take(15)
      else
        []
      end

    {:noreply,
     assign(socket,
       fun: val,
       fun_suggestions: suggestions,
       mod: Map.get(params, "mod", socket.assigns.mod),
       arity: "_",
       arity_options: []
     )}
  end

  def handle_event("field_changed", %{"_target" => ["arity"], "arity" => val} = params, socket) do
    {:noreply,
     assign(socket,
       arity: val,
       mod: Map.get(params, "mod", socket.assigns.mod),
       fun: Map.get(params, "fun", socket.assigns.fun)
     )}
  end

  def handle_event("field_changed", params, socket) do
    {:noreply,
     assign(socket,
       mod: Map.get(params, "mod", socket.assigns.mod),
       fun: Map.get(params, "fun", socket.assigns.fun),
       arity: Map.get(params, "arity", socket.assigns.arity),
       max_calls: Map.get(params, "max_calls", socket.assigns.max_calls),
       scope: Map.get(params, "scope", socket.assigns.scope)
     )}
  end

  def handle_event("select_mod", %{"mod" => mod_name}, socket) do
    display_name =
      case mod_name do
        "Elixir." <> rest -> rest
        other -> ":" <> other
      end

    module_functions = load_module_functions(display_name)

    {:noreply,
     assign(socket,
       mod: display_name,
       mod_suggestions: [],
       module_functions: module_functions,
       fun: "_",
       arity: "_",
       fun_suggestions: [],
       arity_options: []
     )}
  end

  def handle_event("select_fun", %{"fun" => fun_name}, socket) do
    fun_atom = String.to_atom(fun_name)

    arity_options =
      socket.assigns.module_functions
      |> Enum.filter(fn {name, _} -> name == fun_atom end)
      |> Enum.map(fn {_, arity} -> arity end)
      |> Enum.uniq()
      |> Enum.sort()

    {:noreply,
     assign(socket,
       fun: fun_name,
       fun_suggestions: [],
       arity_options: arity_options,
       arity: "_"
     )}
  end

  @impl true
  def handle_info({:raw_trace_call, pid, mod, fun, args, ts, proc_info}, socket) do
    entry = build_entry(pid, mod, fun, args, ts, proc_info)
    entries = [entry | socket.assigns.entries]

    {:noreply,
     socket
     |> assign(entries: entries, entry_count: socket.assigns.entry_count + 1)
     |> stream_insert(:entries, entry, at: 0)}
  end

  def handle_info({:raw_trace_return, pid, mod, fun, arity, return_val, return_ts}, socket) do
    pid_str = pid_to_string(pid)
    mod_str = mod_to_string(mod)

    case Enum.find(socket.assigns.entries, fn e ->
           e.pid == pid_str and e.mod == mod_str and e.fun == fun and e.arity == arity and e.status == :calling
         end) do
      nil ->
        {:noreply, socket}

      entry ->
        duration_us = System.convert_time_unit(return_ts - entry.called_at, :native, :microsecond)

        return_value =
          try do
            format_value(return_val)
          rescue
            _ -> {:scalar, "error", "(failed to format return value)"}
          end

        updated = %{entry | return_value: return_value, duration_us: duration_us, status: :returned}
        entries = Enum.map(socket.assigns.entries, fn e -> if e.id == updated.id, do: updated, else: e end)

        {:noreply,
         socket
         |> assign(entries: entries)
         |> stream_insert(:entries, updated)}
    end
  end

  def handle_info(_msg, socket), do: {:noreply, socket}

  @impl true
  def render(assigns) do
    ~H"""
    <div class="phx-dashboard-section">
      <h5 class="card-title">Recon Trace</h5>
      <p class="text-muted small">
        Traces function calls on the current node using <code>:recon_trace</code>.
        Stopping — or navigating away — always clears all trace flags
        to restore production to a clean state.
      </p>

      <%= if @error do %>
        <div class="alert alert-danger py-2"><%= @error %></div>
      <% end %>

      <form phx-submit={if @tracing, do: "stop", else: "start"} phx-change="field_changed" phx-debounce="200" class="row g-2 align-items-end mb-3">
        <div class="col-auto position-relative">
          <label class="form-label small mb-1">Module</label>
          <input
            type="text"
            name="mod"
            value={@mod}
            placeholder="e.g. Realtime.Tenants or :queue"
            class="form-control form-control-sm"
            disabled={@tracing}
            autocomplete="off"
            required
          />
          <%= if @mod_suggestions != [] do %>
            <ul class="list-group" style="position: absolute; z-index: 1000; max-height: 200px; overflow-y: auto; width: 100%;">
              <%= for mod_name <- @mod_suggestions do %>
                <button type="button" class="list-group-item list-group-item-action py-1 small" phx-click="select_mod" phx-value-mod={mod_name}>
                  <%= String.replace_prefix(mod_name, "Elixir.", "") %>
                </button>
              <% end %>
            </ul>
          <% end %>
        </div>
        <div class="col-auto position-relative">
          <label class="form-label small mb-1">Function (<code>_</code> = any)</label>
          <input
            type="text"
            name="fun"
            value={@fun}
            placeholder="_"
            class="form-control form-control-sm"
            disabled={@tracing || @module_functions == []}
            autocomplete="off"
          />
          <%= if @fun_suggestions != [] do %>
            <ul class="list-group" style="position: absolute; z-index: 1000; max-height: 200px; overflow-y: auto; width: 100%;">
              <%= for fun_name <- @fun_suggestions do %>
                <button type="button" class="list-group-item list-group-item-action py-1 small" phx-click="select_fun" phx-value-fun={fun_name}>
                  <%= fun_name %>
                </button>
              <% end %>
            </ul>
          <% end %>
        </div>
        <div class="col-auto">
          <label class="form-label small mb-1">Arity (<code>_</code> = any)</label>
          <%= if @arity_options != [] do %>
            <select name="arity" class="form-select form-select-sm" style="width: 80px" disabled={@tracing}>
              <option value="_" selected={@arity == "_"}>_</option>
              <%= for a <- @arity_options do %>
                <option value={to_string(a)} selected={@arity == to_string(a)}><%= a %></option>
              <% end %>
            </select>
          <% else %>
            <input
              type="text"
              name="arity"
              value={@arity}
              placeholder="_"
              class="form-control form-control-sm"
              style="width: 80px"
              disabled={@tracing}
              autocomplete="off"
            />
          <% end %>
        </div>
        <div class="col-auto">
          <label class="form-label small mb-1">Max calls</label>
          <input
            type="text"
            name="max_calls"
            value={@max_calls}
            placeholder="100"
            class="form-control form-control-sm"
            style="width: 100px"
            disabled={@tracing}
          />
        </div>
        <div class="col-auto">
          <label class="form-label small mb-1">Scope</label>
          <select name="scope" class="form-select form-select-sm" disabled={@tracing}>
            <option value="local" selected={@scope == "local"}>local</option>
            <option value="global" selected={@scope == "global"}>global</option>
          </select>
        </div>
        <div class="col-auto">
          <%= if @tracing do %>
            <button type="submit" class="btn btn-sm btn-danger">Stop Tracing</button>
          <% else %>
            <button type="submit" class="btn btn-sm btn-primary">Start Tracing</button>
          <% end %>
          <%= if @entry_count > 0 do %>
            <button type="button" phx-click="clear" class="btn btn-sm btn-outline-secondary ms-1">Clear</button>
          <% end %>
        </div>
      </form>

      <%= if @tracing do %>
        <div class="alert alert-warning py-2 small">
          <strong>Tracing active</strong> — rate-limited to <%= @max_calls %> calls.
          Navigate away or click Stop to clear all trace flags.
        </div>
      <% end %>

      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <span class="small text-muted"><%= @entry_count %> call(s) captured</span>
        <div class="d-flex align-items-center gap-2">
          <span class="small text-muted">Sort by</span>
          <div class="d-flex gap-1">
            <%= for {label, field} <- [{"Time", "none"}, {"Memory", "memory"}, {"Reductions", "reductions"}, {"Msg Queue", "message_queue_len"}, {"Binary Mem", "binary_memory"}] do %>
              <% active = to_string(@sort_by) == field || (field == "none" && is_nil(@sort_by)) %>
              <button
                type="button"
                phx-click="sort_by"
                phx-value-field={field}
                style={"font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; border: 1px solid #{if active, do: "#6b7280", else: "#d1d5db"}; background: #{if active, do: "#374151", else: "transparent"}; color: #{if active, do: "#fff", else: "#6b7280"}; cursor: pointer;"}
              ><%= label %></button>
            <% end %>
          </div>
        </div>
      </div>

      <div id="recon-trace-entries" phx-update="stream">
        <%= for {dom_id, entry} <- @streams.entries do %>
          <div id={dom_id} class="card mb-2 border shadow-sm">
            <div
              class="card-header py-2 px-3"
              style={"cursor: pointer; background: #{if entry.status == :calling, do: "#fffbeb", else: "#f8fafc"};"}
              phx-click={JS.toggle(to: "##{dom_id}-body")}
            >
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <code class="text-secondary" style="font-size: 0.75rem;"><%= entry.pid %></code>
                    <span class="fw-semibold" style="font-size: 0.85rem;"><%= entry.mod %>.<%= entry.fun %>/<%= entry.arity %></span>
                    <%= if entry.status == :calling do %>
                      <span class="badge rounded-pill text-bg-warning">calling…</span>
                    <% else %>
                      <span class="badge rounded-pill text-bg-success"><%= entry.duration_us %>µs</span>
                    <% end %>
                  </div>
                  <div class="d-flex align-items-center mt-2" style="font-size: 0.8rem; color: #6b7280; gap: 1.5rem;">
                    <div class="d-flex align-items-center" style="gap: 0.35rem;">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7-4.75a.75.75 0 0 0-1.5 0v5.5a.75.75 0 0 0 .22.53l2.25 2.25a.75.75 0 1 0 1.06-1.06L8 9.19V3.25Z" clip-rule="evenodd"/></svg>
                      <span><%= entry.timestamp %></span>
                    </div>
                    <%= if entry.memory do %>
                      <div class="d-flex align-items-center" style="gap: 0.35rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h7A2.5 2.5 0 0 1 14 4.5v2a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 6.5v-2ZM4.5 3.5A1 1 0 0 0 3.5 4.5v2a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-7ZM5 5a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1H5Zm1.5 0a.5.5 0 0 0 0 1H7a.5.5 0 0 0 0-1h-.5ZM4 10.5A2.5 2.5 0 0 1 6.5 8h3A2.5 2.5 0 0 1 12 10.5v1A2.5 2.5 0 0 1 9.5 14h-3A2.5 2.5 0 0 1 4 11.5v-1Zm2.5-1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-3ZM7 11a.5.5 0 0 0 0 1h.5a.5.5 0 0 0 0-1H7Zm1.5 0a.5.5 0 0 0 0 1H9a.5.5 0 0 0 0-1h-.5Z"/></svg>
                        <span>memory</span>
                        <span style="color: #111827; font-weight: 600;"><%= format_bytes(entry.memory) %></span>
                      </div>
                      <div class="d-flex align-items-center" style="gap: 0.35rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M7.628 1.349a.75.75 0 0 1 .744 0l3.843 2.168A.75.75 0 0 1 12.5 4.82v1.208a2.75 2.75 0 0 0-3.354 4.34L8 11.13l-1.146-.763A2.75 2.75 0 0 0 3.5 6.028V4.82a.75.75 0 0 1 .285-.303L7.628 1.35ZM3.5 7.505a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Zm9 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5ZM6.25 11.75a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1-.75-.75Z"/></svg>
                        <span>reductions</span>
                        <span style="color: #111827; font-weight: 600;"><%= entry.reductions %></span>
                      </div>
                      <div class="d-flex align-items-center" style="gap: 0.35rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M1 4.5A1.5 1.5 0 0 1 2.5 3h11A1.5 1.5 0 0 1 15 4.5v2A1.5 1.5 0 0 1 13.5 8h-11A1.5 1.5 0 0 1 1 6.5v-2ZM2.5 4a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-11ZM1 10.5A1.5 1.5 0 0 1 2.5 9h11a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-2ZM2.5 10a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-11ZM4 5.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Zm.75 5.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"/></svg>
                        <span>msg queue</span>
                        <span style="color: #111827; font-weight: 600;"><%= entry.message_queue_len %></span>
                      </div>
                      <div class="d-flex align-items-center" style="gap: 0.35rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h11A1.5 1.5 0 0 1 15 3.5v1A1.5 1.5 0 0 1 13.5 6h-11A1.5 1.5 0 0 1 1 4.5v-1ZM2 7.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v5A1.5 1.5 0 0 1 12.5 14h-9A1.5 1.5 0 0 1 2 12.5v-5Z"/></svg>
                        <span>binary mem</span>
                        <span style="color: #111827; font-weight: 600;"><%= format_bytes(entry.binary_memory) %></span>
                      </div>
                    <% end %>
                  </div>
                </div>
                <span class="text-muted" style="font-size: 0.75rem;">▼</span>
              </div>
            </div>
            <div id={"#{dom_id}-body"} class="card-body p-0" style="display: none;">
              <%= for {arg, i} <- Enum.with_index(entry.args, 1) do %>
                <div class="px-3 py-2 border-top">
                  <div class="text-muted mb-1" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">arg <%= i %></div>
                  <%= render_value(assigns, arg) %>
                </div>
              <% end %>
              <%= if entry.return_value do %>
                <div class="px-3 py-2 border-top" style="background: #f0fdf4;">
                  <div class="text-muted mb-1" style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">return</div>
                  <%= render_value(assigns, entry.return_value) %>
                </div>
              <% end %>
            </div>
          </div>
        <% end %>
      </div>
    </div>
    """
  end

  @badge_style "font-size: 0.6rem; background: #e0e7ff; color: #4338ca; border-radius: 3px; padding: 0 5px; font-weight: 700; white-space: nowrap;"
  @key_style "color: #7c3aed; font-size: 0.78rem; font-family: monospace; flex-shrink: 0;"
  @indent_style "padding-left: 12px; border-left: 2px solid #e5e7eb; margin-top: 4px; display: none;"
  @row_style "display: flex; gap: 8px; align-items: flex-start; padding: 3px 0; border-bottom: 1px solid #f3f4f6;"
  @toggle_btn "display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 5px; padding: 2px 8px 2px 6px; cursor: pointer; font-size: 0.75rem; color: #334155; font-weight: 500;"
  @chevron {:safe,
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor' width='12' height='12'><path fill-rule='evenodd' d='M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L9.19 8 6.22 5.03a.75.75 0 0 1 0-1.06Z' clip-rule='evenodd'/></svg>"}

  defp tree_assigns(assigns, extra) do
    assign(
      assigns,
      [
        badge: @badge_style,
        key: @key_style,
        indent: @indent_style,
        row: @row_style,
        btn: @toggle_btn,
        chevron: @chevron
      ] ++ extra
    )
  end

  defp render_value(assigns, {:struct, cid, name, fields}) do
    assigns = tree_assigns(assigns, cid: cid, name: name, fields: fields)

    ~H"""
    <div>
      <button type="button" phx-click={JS.toggle(to: "#rv-#{@cid}")} style={@btn}>
        <%= @chevron %>
        <span style={@badge}>%<%= @name %>{}</span>
        <span style="color: #64748b;"><%= length(@fields) %> fields</span>
      </button>
      <div id={"rv-#{@cid}"} style={@indent}>
        <%= for {k, v} <- @fields do %>
          <div style={@row}>
            <span style={@key}><%= k %></span>
            <div style="flex: 1; min-width: 0;"><%= render_value(assigns, v) %></div>
          </div>
        <% end %>
      </div>
    </div>
    """
  end

  defp render_value(assigns, {:map, cid, fields}) do
    assigns = tree_assigns(assigns, cid: cid, fields: fields)

    ~H"""
    <div>
      <button type="button" phx-click={JS.toggle(to: "#rv-#{@cid}")} style={@btn}>
        <%= @chevron %>
        <span style={@badge}>map</span>
        <span style="color: #64748b;"><%= length(@fields) %> keys</span>
      </button>
      <div id={"rv-#{@cid}"} style={@indent}>
        <%= for {k, v} <- @fields do %>
          <div style={@row}>
            <span style={@key}><%= k %></span>
            <div style="flex: 1; min-width: 0;"><%= render_value(assigns, v) %></div>
          </div>
        <% end %>
      </div>
    </div>
    """
  end

  defp render_value(assigns, {:list, _cid, []}) do
    assigns = assign(assigns, badge: @badge_style)
    ~H"<span style={@badge}>list[0]</span>"
  end

  defp render_value(assigns, {:list, cid, items}) do
    assigns = tree_assigns(assigns, cid: cid, items: items)

    ~H"""
    <div>
      <button type="button" phx-click={JS.toggle(to: "#rv-#{@cid}")} style={@btn}>
        <%= @chevron %>
        <span style={@badge}>list</span>
        <span style="color: #64748b;"><%= length(@items) %> items</span>
      </button>
      <div id={"rv-#{@cid}"} style={@indent}>
        <%= for {item, j} <- Enum.with_index(@items) do %>
          <div style={@row}>
            <span style={@key}>[<%= j %>]</span>
            <div style="flex: 1; min-width: 0;"><%= render_value(assigns, item) %></div>
          </div>
        <% end %>
      </div>
    </div>
    """
  end

  defp render_value(assigns, {:tuple, cid, elements}) do
    assigns = tree_assigns(assigns, cid: cid, elements: elements)

    ~H"""
    <div>
      <button type="button" phx-click={JS.toggle(to: "#rv-#{@cid}")} style={@btn}>
        <%= @chevron %>
        <span style={@badge}>tuple</span>
        <span style="color: #64748b;"><%= length(@elements) %> elements</span>
      </button>
      <div id={"rv-#{@cid}"} style={@indent}>
        <%= for {el, j} <- Enum.with_index(@elements) do %>
          <div style={@row}>
            <span style={@key}><%= j %></span>
            <div style="flex: 1; min-width: 0;"><%= render_value(assigns, el) %></div>
          </div>
        <% end %>
      </div>
    </div>
    """
  end

  defp render_value(assigns, {:scalar, type, str}) do
    assigns = assign(assigns, type: type, str: str, badge: @badge_style)

    ~H"""
    <span style="display: inline-flex; align-items: baseline; gap: 5px; flex-wrap: wrap;">
      <span style={@badge}><%= @type %></span>
      <code style="font-size: 0.78rem; color: #111827; word-break: break-all;"><%= @str %></code>
    </span>
    """
  end

  defp load_module_functions(mod_str) do
    case parse_module(mod_str) do
      {:ok, mod} ->
        if function_exported?(mod, :__info__, 1) do
          mod.__info__(:functions)
        else
          try do
            :erlang.apply(mod, :module_info, [:exports])
          rescue
            _ -> []
          end
        end

      _ ->
        []
    end
  end

  defp parse_and_start(params, parent) do
    mod = Map.get(params, "mod", "")
    fun = Map.get(params, "fun", "_")
    max_calls = Map.get(params, "max_calls", "100")
    scope = Map.get(params, "scope", "local")

    with {:ok, mod_atom} <- parse_module(mod),
         {:ok, max_val} <- parse_max_calls(max_calls) do
      fun_atom = parse_fun(fun)
      scope_atom = if scope == "global", do: :global, else: :local
      io_server = spawn_link(fn -> io_discard_loop() end)

      formatter_fun = fn
        {:trace, pid, :call, {m, f, args}} ->
          ts = System.monotonic_time()
          proc_info = Process.info(pid, [:memory, :reductions, :message_queue_len, :binary])
          send(parent, {:raw_trace_call, pid, m, f, args, ts, proc_info})
          ""

        {:trace, pid, :return_from, {m, f, a}, return_val} ->
          ts = System.monotonic_time()
          send(parent, {:raw_trace_return, pid, m, f, a, return_val, ts})
          ""

        _ ->
          ""
      end

      try do
        :recon_trace.calls(
          {mod_atom, fun_atom, :return_trace},
          max_val,
          formatter: formatter_fun,
          io_server: io_server,
          scope: scope_atom
        )

        {:ok, io_server}
      rescue
        e ->
          Process.exit(io_server, :kill)
          {:error, "trace failed: #{inspect(e)}"}
      end
    end
  end

  defp do_stop(io_server) do
    :recon_trace.clear()
    if is_pid(io_server) && Process.alive?(io_server), do: Process.exit(io_server, :kill)
  end

  defp io_discard_loop do
    receive do
      {:io_request, from, ref, _} -> send(from, {:io_reply, ref, :ok})
      _ -> :ok
    end

    io_discard_loop()
  end

  defp build_entry(pid, mod, fun, args, ts, proc_info) do
    proc =
      case proc_info do
        nil ->
          %{memory: nil, reductions: nil, message_queue_len: nil, binary_memory: nil}

        info ->
          binary_memory = Enum.reduce(info[:binary], 0, fn {_, size, _}, acc -> acc + size end)

          %{
            memory: info[:memory],
            reductions: info[:reductions],
            message_queue_len: info[:message_queue_len],
            binary_memory: binary_memory
          }
      end

    %{
      id: System.unique_integer([:monotonic, :positive]),
      pid: pid_to_string(pid),
      mod: mod_to_string(mod),
      fun: fun,
      arity: length(args),
      args: Enum.map(args, &format_value/1),
      called_at: ts,
      timestamp: Time.utc_now() |> Time.truncate(:millisecond) |> Time.to_string(),
      duration_us: nil,
      return_value: nil,
      status: :calling,
      memory: proc.memory,
      reductions: proc.reductions,
      message_queue_len: proc.message_queue_len,
      binary_memory: proc.binary_memory
    }
  end

  defp pid_to_string(pid), do: pid |> inspect() |> String.replace("#PID", "")
  defp mod_to_string(mod), do: mod |> Atom.to_string() |> String.replace_prefix("Elixir.", "")

  defp format_value(val) when is_struct(val) do
    name = mod_to_string(val.__struct__)

    fields =
      try do
        val
        |> Map.to_list()
        |> Enum.reject(fn {k, _} -> k == :__struct__ end)
        |> Enum.map(fn {k, v} -> {Atom.to_string(k), format_value(v)} end)
      rescue
        _ -> [{"(error)", {:scalar, "error", "failed to inspect struct fields"}}]
      end

    {:struct, System.unique_integer([:positive]), name, fields}
  end

  defp format_value(val) when is_map(val) do
    fields =
      try do
        Enum.map(val, fn {k, v} -> {inspect(k), format_value(v)} end)
      rescue
        _ -> [{"(error)", {:scalar, "error", "failed to inspect map"}}]
      end

    {:map, System.unique_integer([:positive]), fields}
  end

  defp format_value(val) when is_list(val) do
    {:list, System.unique_integer([:positive]), Enum.map(val, &format_value/1)}
  rescue
    _ -> {:scalar, "list", inspect(val, limit: 30)}
  end

  defp format_value(val) when is_tuple(val) do
    {:tuple, System.unique_integer([:positive]), Enum.map(Tuple.to_list(val), &format_value/1)}
  end

  defp format_value(nil), do: {:scalar, "nil", "nil"}
  defp format_value(true), do: {:scalar, "boolean", "true"}
  defp format_value(false), do: {:scalar, "boolean", "false"}
  defp format_value(val) when is_atom(val), do: {:scalar, "atom", inspect(val)}
  defp format_value(val) when is_integer(val), do: {:scalar, "integer", Integer.to_string(val)}
  defp format_value(val) when is_float(val), do: {:scalar, "float", inspect(val)}

  defp format_value(val) when is_binary(val) do
    if String.printable?(val) do
      {:scalar, "string", inspect(val, printable_limit: 300)}
    else
      {:scalar, "binary", inspect(val, limit: 30)}
    end
  end

  defp format_value(val) when is_pid(val), do: {:scalar, "pid", inspect(val)}
  defp format_value(val) when is_reference(val), do: {:scalar, "reference", inspect(val)}
  defp format_value(val) when is_port(val), do: {:scalar, "port", inspect(val)}
  defp format_value(val) when is_function(val), do: {:scalar, "function", inspect(val)}
  defp format_value(val), do: {:scalar, "term", inspect(val, pretty: true, limit: 30, printable_limit: 300)}

  defp sort_entries(entries, nil), do: entries

  defp sort_entries(entries, field) do
    Enum.sort(entries, fn a, b ->
      case {a[field], b[field]} do
        {nil, _} -> false
        {_, nil} -> true
        {va, vb} -> va >= vb
      end
    end)
  end

  defp parse_module(""), do: {:error, "Module is required"}

  defp parse_module(":" <> erlang_mod) do
    {:ok, String.to_existing_atom(erlang_mod)}
  rescue
    _ -> {:error, "Unknown Erlang module: :#{erlang_mod}"}
  end

  defp parse_module(elixir_mod) do
    {:ok, String.to_existing_atom("Elixir." <> elixir_mod)}
  rescue
    _ ->
      try do
        {:ok, String.to_existing_atom(elixir_mod)}
      rescue
        _ -> {:error, "Unknown module: #{elixir_mod}. Make sure it is loaded."}
      end
  end

  defp parse_fun("_"), do: :_
  defp parse_fun(""), do: :_

  defp parse_fun(f) do
    String.to_existing_atom(f)
  rescue
    _ -> {:error, "Unknown function: #{f}"}
  end

  defp parse_max_calls(m) do
    case Integer.parse(m) do
      {n, ""} when n > 0 -> {:ok, n}
      _ -> {:error, "Max calls must be a positive integer (e.g. 100)"}
    end
  end

  defp format_bytes(nil), do: "—"
  defp format_bytes(b) when b >= 1_048_576, do: "#{Float.round(b / 1_048_576, 1)}MB"
  defp format_bytes(b) when b >= 1_024, do: "#{Float.round(b / 1_024, 1)}KB"
  defp format_bytes(b), do: "#{b}B"
end
