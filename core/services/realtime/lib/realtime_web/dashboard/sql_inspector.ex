defmodule RealtimeWeb.Dashboard.SqlInspector do
  @moduledoc """
  Live Dashboard page for running read-only SQL queries against the Realtime database.

  Queries are executed inside a transaction that is always rolled back, with
  `SET TRANSACTION READ ONLY` enforced at the database level. Column values whose
  names suggest sensitive data (passwords, secrets, tokens, keys, etc.) are
  replaced with "***" before display.
  """
  use Phoenix.LiveDashboard.PageBuilder

  require Logger

  alias Realtime.Repo.Replica

  @query_timeout 30_000
  @max_rows 1_000

  @sensitive_patterns ~w(password passwd secret token jwt key credential private salt hash)

  @impl true
  def menu_link(_, _), do: {:ok, "SQL Inspector"}

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     assign(socket,
       sql: "",
       result: nil,
       error: nil,
       max_rows: @max_rows,
       sort_col: nil,
       sort_dir: :asc,
       display_rows: [],
       row_count: 0
     )}
  end

  @impl true
  def handle_event("run_query", %{"sql" => sql}, socket) do
    sql = String.trim(sql)

    case execute_read_only(sql) do
      {:ok, result} ->
        {:noreply,
         assign(socket,
           result: result,
           error: nil,
           sql: sql,
           sort_col: nil,
           sort_dir: :asc,
           display_rows: result.rows,
           row_count: length(result.rows)
         )}

      {:error, msg} ->
        Logger.warning("SqlInspector query error: #{msg}")
        {:noreply, assign(socket, error: msg, result: nil, sql: sql, display_rows: [], row_count: 0)}
    end
  end

  @impl true
  def handle_event("sort", %{"col" => col}, socket) do
    %{result: result, sort_col: current_col, sort_dir: current_dir} = socket.assigns
    sort_dir = if current_col == col and current_dir == :asc, do: :desc, else: :asc
    col_idx = Enum.find_index(result.columns, &(&1 == col))

    display_rows =
      Enum.sort_by(result.rows, &Enum.at(&1, col_idx), fn a, b ->
        cmp = compare_cells(a, b)
        if sort_dir == :asc, do: cmp != :gt, else: cmp != :lt
      end)

    {:noreply, assign(socket, sort_col: col, sort_dir: sort_dir, display_rows: display_rows)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div style="background: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); padding: 20px; margin-bottom: 16px; min-width: 0;">
      <h5 style="margin: 0 0 4px 0; font-weight: 600;">SQL Inspector</h5>
      <p style="color: #6c757d; font-size: 0.85rem; margin-bottom: 16px;">
        Read-only SELECT queries only. Sensitive column values are masked. Results capped at <%= @max_rows %> rows.
      </p>

      <form phx-submit="run_query">
        <div style="background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 2px; margin-bottom: 12px;">
          <textarea
            name="sql"
            rows="8"
            style="width: 100%; background: #0d1117; color: #e6edf3; border: none; outline: none; resize: vertical; font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace; font-size: 0.85rem; padding: 12px; line-height: 1.5; caret-color: #e6edf3;"
            placeholder="SELECT ..."
            spellcheck="false"
            onkeydown="if((event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();this.closest('form').requestSubmit();}"
          ><%= @sql %></textarea>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <button type="submit" class="btn btn-sm btn-primary">Run Query</button>
          <span style="color: #6c757d; font-size: 0.75rem;">Tip: Cmd/Ctrl + Enter to run</span>
        </div>
      </form>

      <%= if @error do %>
        <div style="margin-top: 16px; padding: 12px 16px; background: #fff5f5; border: 1px solid #f5c2c7; border-left: 4px solid #dc3545; border-radius: 4px; color: #842029; font-size: 0.85rem;">
          <strong>Error:</strong> <%= @error %>
        </div>
      <% end %>

      <%= if @result do %>
        <div style="margin-top: 20px;">
          <%= if @result.rows == [] do %>
            <p style="color: #6c757d; font-size: 0.85rem;">Query returned 0 rows.</p>
          <% else %>
            <p style="color: #495057; font-size: 0.85rem; margin-bottom: 8px;">
              <strong><%= @row_count %></strong> row(s) returned
              <%= if @row_count == @max_rows do %>
                <span style="color: #b45309; font-weight: 600;">(results truncated at <%= @max_rows %>)</span>
              <% end %>
            </p>
            <div style="max-height: 500px; overflow: auto; border: 1px solid #dee2e6; border-radius: 6px; background: #ffffff;">
              <table style="table-layout: auto; border-collapse: separate; border-spacing: 0; font-size: 0.8rem; margin: 0; width: max-content; min-width: 100%;">
                <thead>
                  <tr>
                    <%= for col <- @result.columns do %>
                      <th
                        phx-click="sort"
                        phx-value-col={col}
                        title={col}
                        style={"position: sticky; top: 0; z-index: 1; background: #1a1a2e; color: #e6edf3; padding: 8px 12px; white-space: nowrap; text-align: left; font-weight: 600; border-bottom: 2px solid #30363d; font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace; cursor: pointer; user-select: none; #{if @sort_col == col, do: "background: #2d2d4e;", else: ""}"}
                      >
                        <%= col %>
                        <%= cond do %>
                          <% @sort_col == col and @sort_dir == :asc -> %> ↑
                          <% @sort_col == col and @sort_dir == :desc -> %> ↓
                          <% true -> %><span style="opacity: 0.3;"> ↕</span>
                        <% end %>
                      </th>
                    <% end %>
                  </tr>
                </thead>
                <tbody>
                  <%= for {row, row_idx} <- Enum.with_index(@display_rows) do %>
                    <tr style={"background: #{if rem(row_idx, 2) == 0, do: "#ffffff", else: "#f8f9fa"};"}>
                      <%= for cell <- row do %>
                        <td style={"padding: 6px 12px; white-space: nowrap; vertical-align: middle; border-bottom: 1px solid #e9ecef; font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace; #{if cell == "NULL", do: "color: #adb5bd; font-style: italic;", else: "color: #212529;"}"} title={cell}>
                          <%= cell %>
                        </td>
                      <% end %>
                    </tr>
                  <% end %>
                </tbody>
              </table>
            </div>
          <% end %>
        </div>
      <% end %>
    </div>
    """
  end

  defp execute_read_only(sql) do
    with :ok <- validate_select_only(sql) do
      stripped = String.trim_trailing(sql, ";")
      limited_sql = "SELECT * FROM (#{stripped}) AS _q LIMIT #{@max_rows}"
      repo = Replica.replica()

      repo.transaction(
        fn ->
          Ecto.Adapters.SQL.query!(repo, "SET TRANSACTION READ ONLY", [])

          case Ecto.Adapters.SQL.query(repo, limited_sql, [], timeout: @query_timeout) do
            {:ok, result} -> repo.rollback({:ok, mask_sensitive_columns(result)})
            {:error, %{postgres: %{message: message}}} -> repo.rollback({:error, message})
            {:error, reason} -> repo.rollback({:error, inspect(reason)})
          end
        end,
        timeout: @query_timeout
      )
      |> case do
        {:error, {:ok, result}} -> {:ok, result}
        {:error, {:error, message}} -> {:error, message}
      end
    end
  end

  defp validate_select_only(sql) do
    normalized = String.downcase(sql)

    cond do
      normalized == "" ->
        {:error, "Query cannot be empty"}

      not (String.starts_with?(normalized, "select") or String.starts_with?(normalized, "with")) ->
        {:error, "Only SELECT queries are allowed (may start with WITH for CTEs)"}

      true ->
        :ok
    end
  end

  defp mask_sensitive_columns(%{columns: columns, rows: rows} = result) do
    sensitive_indices =
      columns
      |> Enum.with_index()
      |> Enum.filter(fn {col, _} -> sensitive_column?(col) end)
      |> Enum.into(MapSet.new(), fn {_, idx} -> idx end)

    masked_rows =
      Enum.map(rows, fn row ->
        Enum.map(Enum.with_index(row), fn {val, idx} ->
          if MapSet.member?(sensitive_indices, idx), do: "***", else: format_cell(val)
        end)
      end)

    %{result | rows: masked_rows}
  end

  defp sensitive_column?(name) do
    lower = String.downcase(name)
    Enum.any?(@sensitive_patterns, &String.contains?(lower, &1))
  end

  defp compare_cells("NULL", "NULL"), do: :eq
  defp compare_cells("NULL", _), do: :gt
  defp compare_cells(_, "NULL"), do: :lt
  defp compare_cells(a, b) when a < b, do: :lt
  defp compare_cells(a, b) when a > b, do: :gt
  defp compare_cells(_, _), do: :eq

  defp format_cell(nil), do: "NULL"
  defp format_cell(%NaiveDateTime{} = val), do: NaiveDateTime.to_string(val)
  defp format_cell(%DateTime{} = val), do: DateTime.to_string(val)
  defp format_cell(%Date{} = val), do: Date.to_string(val)
  defp format_cell(%Time{} = val), do: Time.to_string(val)
  defp format_cell(val) when is_binary(val), do: if(String.valid?(val), do: val, else: Base.encode16(val, case: :lower))
  defp format_cell(val), do: inspect(val)
end
