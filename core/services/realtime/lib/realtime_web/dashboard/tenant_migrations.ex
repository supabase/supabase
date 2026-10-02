defmodule RealtimeWeb.Dashboard.TenantMigrations do
  @moduledoc """
  Live Dashboard page to inspect tenant migrations state.

  Requires `pgdelta` on `$PATH`.

  Tenants are diffed against the declarative schema artifact in
  `priv/repo/tenant_schema`, which is the same for every supported Postgres major
  version. Planning creates a short-lived shadow database on the tenant's own
  cluster, so the tenant's `db_user` needs `CREATEDB`. OrioleDB tenants are not
  supported.
  """
  use Phoenix.LiveDashboard.PageBuilder
  use Realtime.Logs

  alias Realtime.Api
  alias Realtime.Api.Tenant
  alias Realtime.Database
  alias Realtime.Nodes
  alias Realtime.Rpc
  alias Realtime.Tenants.Migrations

  @application_name "realtime_migrations"
  @query_timeout 60_000
  @pgdelta_timeout @query_timeout * 2
  @rpc_timeout @query_timeout * 3

  @impl true
  def menu_link(_, _), do: {:ok, "Tenant Migrations"}

  @impl true
  def mount(_params, _session, socket) do
    {:ok, reset_assigns(socket)}
  end

  @impl true
  def handle_params(%{"external_id" => ref}, _uri, socket) when ref != "" do
    ref = String.trim(ref)

    with %Tenant{} = tenant <- Api.get_tenant_by_external_id(ref),
         {:ok, settings} <- Database.from_tenant(tenant, @application_name, :stop),
         {:ok, schema_migrations, orioledb?} <- with_tenant_conn(settings, &fetch_tenant_state/1) do
      socket
      |> cancel_pgdelta()
      |> reset_assigns()
      |> assign(external_id: ref, tenant: tenant, schema_migrations: {:ok, schema_migrations})
      |> start_pgdelta(tenant, orioledb?)
      |> then(&{:noreply, &1})
    else
      nil ->
        {:noreply, assign_error(socket, ref, "Tenant not found")}

      {:error, reason} ->
        log_error("TenantMigrationsConnectFailed", reason)
        {:noreply, assign_error(socket, ref, "Failed to connect to tenant DB: #{inspect(reason)}")}
    end
  end

  def handle_params(_params, _uri, socket) do
    {:noreply, socket |> cancel_pgdelta() |> reset_assigns()}
  end

  @impl true
  def handle_info(:pgdelta_tick, %{assigns: %{pgdelta_running: true}} = socket) do
    elapsed = System.monotonic_time(:millisecond) - socket.assigns.pgdelta_started_at

    socket
    |> assign(pgdelta_elapsed_ms: elapsed)
    |> schedule_tick()
    |> then(&{:noreply, &1})
  end

  def handle_info(
        {ref, {:rechecked, schema_migrations, pgdelta_result}},
        %{assigns: %{pgdelta_task: %Task{ref: ref}}} = socket
      ) do
    Process.demonitor(ref, [:flush])

    {:noreply,
     assign(socket,
       schema_migrations: schema_migrations,
       pgdelta_result: pgdelta_result,
       pgdelta_running: false,
       pgdelta_task: nil
     )}
  end

  def handle_info({ref, pgdelta_result}, %{assigns: %{pgdelta_task: %Task{ref: ref}}} = socket) do
    Process.demonitor(ref, [:flush])
    {:noreply, assign(socket, pgdelta_result: pgdelta_result, pgdelta_running: false, pgdelta_task: nil)}
  end

  def handle_info({ref, :ok}, %{assigns: %{apply_task: %Task{ref: ref}, tenant: %Tenant{} = tenant}} = socket) do
    Process.demonitor(ref, [:flush])
    socket = assign(socket, applying: false, apply_task: nil, error: nil)

    case Database.from_tenant(tenant, @application_name, :stop) do
      {:ok, settings} ->
        case socket.assigns.pgdelta_result do
          {:ok, %{status: :changes}} ->
            socket |> start_recheck(tenant, settings) |> then(&{:noreply, &1})

          _ ->
            schema_migrations = with_tenant_conn(settings, &fetch_schema_migrations/1)
            {:noreply, assign(socket, schema_migrations: schema_migrations)}
        end

      {:error, reason} ->
        {:noreply, assign(socket, error: "Applied, but re-check failed: #{inspect(reason)}")}
    end
  end

  def handle_info({ref, {:error, msg}}, %{assigns: %{apply_task: %Task{ref: ref}}} = socket) do
    Process.demonitor(ref, [:flush])
    {:noreply, assign(socket, applying: false, apply_task: nil, error: msg)}
  end

  def handle_info({:DOWN, ref, :process, _pid, reason}, %{assigns: %{pgdelta_task: %Task{ref: ref}}} = socket) do
    log_error("TenantMigrationsPgDeltaCrash", inspect(reason))

    {:noreply,
     assign(socket,
       pgdelta_result: {:error, "pg-delta crashed: #{inspect(reason)}"},
       pgdelta_running: false,
       pgdelta_task: nil
     )}
  end

  def handle_info({:DOWN, ref, :process, _pid, reason}, %{assigns: %{apply_task: %Task{ref: ref}}} = socket) do
    log_error("TenantMigrationsApplyCrash", inspect(reason))
    {:noreply, assign(socket, applying: false, apply_task: nil, error: "Apply crashed: #{inspect(reason)}")}
  end

  def handle_info(_msg, socket), do: {:noreply, socket}

  @impl true
  def handle_event("lookup", %{"external_id" => ref}, socket) do
    ref = String.trim(ref)
    {:noreply, push_patch(socket, to: "/admin/dashboard/tenant_migrations?external_id=#{URI.encode(ref)}")}
  end

  @impl true
  def handle_event("apply", _params, socket) do
    %{tenant: %Tenant{} = tenant, pgdelta_result: pgdelta_result} = socket.assigns

    case pgdelta_result do
      {:ok, %{status: :changes, plan: plan}} -> {:noreply, start_apply(socket, tenant, plan)}
      {:ok, %{status: :no_changes}} -> {:noreply, start_apply(socket, tenant, nil)}
      _ -> {:noreply, socket}
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="phx-dashboard-section">
      <h5 class="card-title">Tenant Migrations</h5>
      <p class="text-muted">
        Inspect a tenant's applied migrations and drift against the committed schema.
      </p>

      <form phx-submit="lookup" class="mb-4 d-flex gap-2">
        <input
          type="text"
          name="external_id"
          value={@external_id}
          placeholder="Enter external_id"
          class="form-control w-auto"
          autocomplete="off"
          spellcheck="false"
        />
        <button type="submit" class="btn btn-primary" phx-disable-with="Loading...">Lookup</button>
      </form>

      <%= if @error do %>
        <p class="text-danger"><%= @error %></p>
      <% end %>

      <%= if @tenant do %>
        <h6 class="mt-4">realtime.schema_migrations</h6>
        <%= schema_migrations(@schema_migrations) %>

        <h6 class="mt-4">pg-delta plan vs committed schema</h6>
        <div
          :if={@pgdelta_running}
          data-test-id="pgdelta-running"
          class="alert alert-info d-flex align-items-center"
          style="gap: 8px;"
        >
          <div class="spinner-border spinner-border-sm" role="status"></div>
          <span>Processing... (<%= div(@pgdelta_elapsed_ms, 1000) %>s)</span>
        </div>
        <div
          :if={@applying}
          data-test-id="pgdelta-applying"
          class="alert alert-info d-flex align-items-center"
          style="gap: 8px;"
        >
          <div class="spinner-border spinner-border-sm" role="status"></div>
          <span>Applying plan to tenant database...</span>
        </div>
        <%= pgdelta_plan(@pgdelta_result, @schema_migrations, @applying or @pgdelta_running) %>
      <% end %>
    </div>
    """
  end

  defp reset_assigns(socket) do
    assign(socket,
      external_id: "",
      tenant: nil,
      schema_migrations: nil,
      pgdelta_result: nil,
      pgdelta_elapsed_ms: 0,
      pgdelta_running: false,
      pgdelta_started_at: nil,
      pgdelta_task: nil,
      applying: false,
      apply_task: nil,
      error: nil
    )
  end

  defp assign_error(socket, ref, msg) do
    socket
    |> cancel_pgdelta()
    |> reset_assigns()
    |> assign(external_id: ref, error: msg)
  end

  defp schedule_tick(socket) do
    Process.send_after(self(), :pgdelta_tick, 1000)
    socket
  end

  defp fetch_tenant_state(conn) do
    with {:ok, _} <- ensure_realtime_admin_role(conn),
         {:ok, _} <- ensure_schema_migrations(conn),
         {:ok, schema_migrations} <- fetch_schema_migrations(conn) do
      {:ok, schema_migrations, orioledb?(conn)}
    end
  end

  defp orioledb?(conn) do
    case Postgrex.query(conn, "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'orioledb')", []) do
      {:ok, %{rows: [[true]]}} -> true
      _ -> false
    end
  end

  defp start_pgdelta(socket, _tenant, true = _orioledb?), do: assign(socket, pgdelta_result: :unsupported)

  defp start_pgdelta(socket, %Tenant{} = tenant, false = _orioledb?) do
    if connected?(socket) do
      task =
        Task.Supervisor.async_nolink(Realtime.TaskSupervisor, fn ->
          run_pgdelta(tenant)
        end)

      running_pgdelta(socket, task)
    else
      socket
    end
  end

  defp cancel_pgdelta(%{assigns: %{pgdelta_task: %Task{} = task}} = socket) do
    Task.Supervisor.terminate_child(Realtime.TaskSupervisor, task.pid)
    Process.demonitor(task.ref, [:flush])
    socket
  end

  defp cancel_pgdelta(socket), do: socket

  defp start_recheck(socket, %Tenant{} = tenant, %Database{} = settings) do
    task =
      Task.Supervisor.async_nolink(Realtime.TaskSupervisor, fn ->
        {:rechecked, with_tenant_conn(settings, &fetch_schema_migrations/1), run_pgdelta(tenant)}
      end)

    socket
    |> assign(schema_migrations: nil)
    |> running_pgdelta(task)
  end

  defp running_pgdelta(socket, task) do
    socket
    |> assign(
      pgdelta_running: true,
      pgdelta_elapsed_ms: 0,
      pgdelta_started_at: System.monotonic_time(:millisecond),
      pgdelta_task: task
    )
    |> schedule_tick()
  end

  defp start_apply(socket, %Tenant{} = tenant, plan) do
    task = Task.Supervisor.async_nolink(Realtime.TaskSupervisor, fn -> apply_pgdelta(tenant, plan) end)
    assign(socket, applying: true, apply_task: task, error: nil)
  end

  defp migrations_progress(schema_migrations) do
    total = length(Migrations.migrations())

    applied =
      case schema_migrations do
        {:ok, rows} -> length(rows)
        _ -> total
      end

    {applied, total}
  end

  defp schema_migrations(nil) do
    assigns = %{}
    ~H""
  end

  defp schema_migrations({:error, msg}) do
    assigns = %{msg: msg}

    ~H"""
    <p class="text-danger"><%= @msg %></p>
    """
  end

  defp schema_migrations({:ok, rows}) do
    assigns = %{rows: rows}

    ~H"""
    <p class="text-muted small mb-2"><strong><%= length(@rows) %></strong> row(s)</p>
    <div style="max-height: 400px; overflow: auto; border: 1px solid #dee2e6; border-radius: 6px;">
      <table style="border-collapse: separate; border-spacing: 0; font-size: 0.8rem; margin: 0; width: 100%;">
        <thead>
          <tr>
            <th style="position: sticky; top: 0; z-index: 1; background: #1a1a2e; color: #e6edf3; padding: 8px 12px; text-align: left; font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace; font-weight: 600; border-bottom: 2px solid #30363d;">
              version
            </th>
            <th style="position: sticky; top: 0; z-index: 1; background: #1a1a2e; color: #e6edf3; padding: 8px 12px; text-align: left; font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace; font-weight: 600; border-bottom: 2px solid #30363d;">
              inserted_at
            </th>
          </tr>
        </thead>
        <tbody>
          <%= for {[version, inserted_at], idx} <- Enum.with_index(@rows) do %>
            <tr style={"background: #{if rem(idx, 2) == 0, do: "#ffffff", else: "#f8f9fa"};"}>
              <td style="padding: 6px 12px; font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace; border-bottom: 1px solid #e9ecef; color: #212529;">
                <%= version %>
              </td>
              <td style="padding: 6px 12px; font-family: 'SF Mono', Menlo, Monaco, Consolas, monospace; border-bottom: 1px solid #e9ecef; color: #495057;">
                <%= inserted_at %>
              </td>
            </tr>
          <% end %>
        </tbody>
      </table>
    </div>
    """
  end

  defp pgdelta_plan(nil, _schema_migrations, _apply_disabled) do
    assigns = %{}
    ~H""
  end

  defp pgdelta_plan(:unsupported, _schema_migrations, _apply_disabled) do
    assigns = %{}

    ~H"""
    <div class="alert alert-secondary mb-0">Drift detection is not supported on OrioleDB tenants.</div>
    """
  end

  defp pgdelta_plan({:error, msg}, _schema_migrations, _apply_disabled) do
    assigns = %{msg: msg}

    ~H"""
    <div class="alert alert-danger">
      <strong>Error:</strong>
      <pre class="mb-0 mt-2" style="white-space: pre-wrap; word-break: break-word;"><%= @msg %></pre>
    </div>
    """
  end

  defp pgdelta_plan({:ok, %{status: :no_changes}}, schema_migrations, apply_disabled) do
    {applied, total} = migrations_progress(schema_migrations)
    assigns = %{behind: applied < total, applied: applied, total: total, apply_disabled: apply_disabled}

    ~H"""
    <div :if={@behind}>
      <div class="alert alert-warning">
        No schema drift, but realtime.schema_migrations has <%= @applied %> of <%= @total %> versions recorded.
        Apply records the missing version(s) and sets tenants.migrations_ran to <%= @total %>.
      </div>
      <div class="d-flex justify-content-end mt-3">
        <button type="button" class="btn btn-primary" phx-click="apply" phx-disable-with="Applying..." disabled={@apply_disabled}>
          Apply
        </button>
      </div>
    </div>
    <div :if={not @behind} class="alert alert-success mb-0">
      No drift detected. Tenant matches the committed schema.
    </div>
    """
  end

  defp pgdelta_plan({:ok, %{status: :changes} = result}, _schema_migrations, apply_disabled) do
    assigns = %{
      sql: result.sql,
      destructive: result.destructive,
      apply_disabled: apply_disabled
    }

    ~H"""
    <div class="alert alert-warning">
      <strong>Drift detected between tenant and the committed schema.</strong>
      The SQL below is reconciliation plan generated by pg-delta and it may contain errors and/or destructive statements.
      Review every statement before running it.
      <div :if={@destructive > 0} class="mt-2">
        pg-delta flagged <strong><%= @destructive %></strong> action(s) as destructive.
      </div>
    </div>
    <style>
      pre.pgdelta-sql-plain {
        font-family: ui-monospace, "SF Mono", SFMono-Regular, "Cascadia Mono", "Cascadia Code", Menlo, Consolas,
          "DejaVu Sans Mono", "Liberation Mono", monospace;
        font-size: 0.85rem;
        line-height: 1.55;
        font-variant-ligatures: none;
      }
      @media (max-width: 768px) {
        pre.pgdelta-sql-plain {
          padding: 12px 48px 12px 12px;
          font-size: 0.78rem;
        }
      }
    </style>
    <div style="position: relative;">
      <button
        type="button"
        title="Copy SQL"
        class="btn btn-sm btn-secondary"
        onclick={"
          const btn = this;
          const code = btn.parentElement.querySelector('code').innerText;
          navigator.clipboard.writeText(code).then(() => {
            const prev = btn.innerText;
            btn.innerText = 'Copied';
            btn.disabled = true;
            setTimeout(() => { btn.innerText = prev; btn.disabled = false; }, 1200);
          });
        "}
        style="position: absolute; top: 8px; right: 8px; z-index: 2;"
      >Copy</button>
      <pre
        class="pgdelta-sql-plain"
        style="color-scheme: light dark; background: light-dark(#ffffff, #0d1117); color: light-dark(#1f2328, #e6edf3); margin: 0; padding: 16px 64px 16px 16px; border-radius: 6px; max-width: 100%; max-height: 60vh; overflow-y: auto; overflow-x: hidden; white-space: pre-wrap; overflow-wrap: anywhere;"
      ><code class="language-sql"><%= @sql %></code></pre>
    </div>
    <div class="d-flex justify-content-end mt-3">
      <button
        type="button"
        class="btn btn-danger"
        phx-click="apply"
        phx-disable-with="Applying..."
        disabled={@apply_disabled}
        data-confirm="Apply this SQL plan to the tenant database? This may include destructive statements and is irreversible."
      >
        Apply
      </button>
    </div>
    """
  end

  defp insert_versions(conn, versions) do
    insert = """
    INSERT INTO realtime.schema_migrations (version, inserted_at)
    SELECT unnest($1::bigint[]), NOW()
    ON CONFLICT (version) DO NOTHING
    """

    with {:ok, _} <- restore_schema_migrations_pkey(conn),
         {:ok, _} <- Postgrex.query(conn, insert, [versions], timeout: @query_timeout) do
      :ok
    end
  end

  defp restore_schema_migrations_pkey(conn) do
    restore = """
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'realtime.schema_migrations'::regclass AND contype = 'p'
      ) THEN
        ALTER TABLE realtime.schema_migrations ADD PRIMARY KEY (version);
      END IF;
    END
    $$
    """

    Postgrex.query(conn, restore, [], timeout: @query_timeout)
  end

  defp fetch_schema_migrations(conn) do
    schema_migrations_query = "SELECT version, inserted_at FROM realtime.schema_migrations ORDER BY version DESC"

    case Postgrex.query(conn, schema_migrations_query, [], timeout: @query_timeout) do
      {:ok, %{rows: rows}} ->
        {:ok, Enum.map(rows, fn [v, ts] -> [to_string(v), format_ts(ts)] end)}

      {:error, %{postgres: %{message: message}}} ->
        log_error("TenantMigrationsSchemaMigrationsQueryFailed", message)
        {:error, message}

      {:error, reason} ->
        log_error("TenantMigrationsSchemaMigrationsQueryFailed", reason)
        {:error, inspect(reason)}
    end
  end

  defp ensure_schema_migrations(conn) do
    Postgrex.query(
      conn,
      "CREATE TABLE IF NOT EXISTS realtime.schema_migrations (version bigint PRIMARY KEY, inserted_at timestamp)",
      []
    )
  end

  defp ensure_realtime_admin_role(conn) do
    case Postgrex.query(conn, "SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime_admin'", []) do
      {:ok, %{num_rows: 0}} -> Postgrex.query(conn, "CREATE ROLE supabase_realtime_admin", [])
      result -> result
    end
  end

  defp format_ts(%NaiveDateTime{} = t), do: NaiveDateTime.to_string(t)
  defp format_ts(%DateTime{} = t), do: DateTime.to_string(t)
  defp format_ts(other), do: to_string(other)

  @doc false
  def postgres_url(%Database{} = db) do
    sslmode = if db.ssl, do: "require", else: "disable"

    IO.iodata_to_binary([
      "postgresql://",
      URI.encode_www_form(db.username),
      ":",
      URI.encode_www_form(db.password),
      "@",
      url_host(db),
      ":",
      Integer.to_string(db.port),
      "/",
      URI.encode_www_form(db.database),
      "?sslmode=",
      sslmode,
      host_param(db)
    ])
  end

  defp url_host(%Database{hostname: hostname} = db) do
    if ipv6_literal?(db), do: "[#{hostname}]", else: hostname
  end

  # node-postgres passes the URL host to getaddrinfo verbatim, so brackets fail with
  # `ENOTFOUND [::1]`. A `host` query param overrides the URL host, unbracketed.
  defp host_param(%Database{hostname: hostname} = db) do
    if ipv6_literal?(db), do: ["&host=", hostname], else: []
  end

  defp ipv6_literal?(%Database{hostname: hostname}) do
    match?({:ok, _}, :inet.parse_ipv6strict_address(String.to_charlist(hostname)))
  end

  @doc false
  def schema_path do
    Application.app_dir(:realtime, "priv/repo/tenant_schema")
  end

  @doc false
  def profile_path do
    Application.app_dir(:realtime, "priv/repo/pgdelta_profile.json")
  end

  @doc false
  def run_pgdelta(%Tenant{external_id: external_id} = tenant) do
    with {:ok, node, _region} <- Nodes.get_node_for_tenant(tenant),
         {:ok, _} = result <-
           Rpc.enhanced_call(node, __MODULE__, :run_pgdelta_tenant, [tenant],
             timeout: @rpc_timeout,
             tenant_id: external_id
           ) do
      result
    else
      {:error, :rpc_error, reason} -> {:error, "pg-delta RPC failed: #{inspect(reason)}"}
      {:error, _} = err -> err
    end
  end

  def run_pgdelta(%Database{} = settings) do
    with_pgdelta(fn path, dir ->
      plan_path = Path.join(dir, "plan.json")

      args = [
        "schema",
        "apply",
        "--dir",
        schema_path(),
        "--target",
        postgres_url(settings),
        "--profile",
        profile_path(),
        "--dry-run",
        "--out-plan",
        plan_path
      ]

      case run_pgdelta_cmd(path, args) do
        {_output, 0} -> read_plan(path, plan_path, dir)
        other -> pgdelta_error(other)
      end
    end)
  end

  defp read_plan(path, plan_path, dir) do
    with {:ok, plan} <- File.read(plan_path),
         {:ok, %{"actions" => actions} = decoded} <- Jason.decode(plan) do
      case actions do
        [] ->
          {:ok, %{status: :no_changes, plan: nil, sql: "", destructive: 0}}

        _ ->
          destructive = get_in(decoded, ["safetyReport", "destructiveActions"]) || 0

          with {:ok, sql} <- render_plan(path, plan_path, dir) do
            {:ok, %{status: :changes, plan: plan, sql: sql, destructive: destructive}}
          end
      end
    else
      error ->
        log_error("TenantMigrationsPgDeltaPlanUnreadable", error)
        {:error, "pg-delta wrote an unreadable plan: #{inspect(error)}"}
    end
  end

  defp render_plan(path, plan_path, dir) do
    args = ["render", "--plan", plan_path, "--out", Path.join(dir, "plan.sql"), "--allow-drops"]

    case run_pgdelta_cmd(path, args) do
      {_output, 0} -> {:ok, dir |> segment_files() |> Enum.map_join("\n", &File.read!/1)}
      other -> pgdelta_error(other)
    end
  end

  defp segment_files(dir) do
    dir
    |> Path.join("plan*.sql")
    |> Path.wildcard()
    |> Enum.sort_by(fn file ->
      case Regex.run(~r/_(\d+)\.sql$/, file) do
        [_, segment] -> String.to_integer(segment)
        nil -> 0
      end
    end)
  end

  defp with_pgdelta(fun) do
    case System.find_executable("pgdelta") do
      nil ->
        log_error("TenantMigrationsPgDeltaMissing", "pgdelta not found on PATH")
        {:error, "pgdelta not found on PATH"}

      path ->
        dir = Path.join(System.tmp_dir!(), "pgdelta-#{System.unique_integer([:positive])}")
        File.mkdir_p!(dir)

        try do
          fun.(path, dir)
        after
          File.rm_rf(dir)
        end
    end
  end

  defp pgdelta_error(:timeout) do
    log_error("TenantMigrationsPgDeltaTimeout", "killed after #{@pgdelta_timeout}ms")
    {:error, "pg-delta timed out after #{div(@pgdelta_timeout, 1000)}s"}
  end

  defp pgdelta_error({output, code}) do
    log_error("TenantMigrationsPgDeltaNonZeroExit", "exit #{code}: #{output}")
    {:error, "pg-delta exited #{code}:\n#{output}"}
  end

  defp run_pgdelta_cmd(path, args) do
    port = Port.open({:spawn_executable, path}, [:binary, :exit_status, :stderr_to_stdout, args: args])

    collect_pgdelta(port, [])
  end

  defp collect_pgdelta(port, acc) do
    receive do
      {^port, {:data, data}} ->
        collect_pgdelta(port, [acc | data])

      {^port, {:exit_status, status}} ->
        {IO.iodata_to_binary(acc), status}
    after
      @pgdelta_timeout ->
        if Port.info(port), do: Port.close(port)
        :timeout
    end
  end

  @doc false
  def run_pgdelta_tenant(%Tenant{} = tenant) do
    with {:ok, settings} <- Database.from_tenant(tenant, @application_name, :stop) do
      run_pgdelta(settings)
    end
  end

  @doc false
  def apply_pgdelta(%Tenant{external_id: external_id} = tenant, plan) do
    versions = Enum.map(Migrations.migrations(), fn {v, _mod} -> v end)
    total = length(versions)

    with :ok <- apply_plan(tenant, plan),
         {:ok, settings} <- Database.from_tenant(tenant, @application_name, :stop),
         :ok <- with_tenant_conn(settings, &insert_versions(&1, versions)),
         {:ok, _} <- Api.update_migrations_ran(external_id, total) do
      :ok
    else
      {:error, %{postgres: %{message: message}}} ->
        log_error("TenantMigrationsApplyFailed", message)
        {:error, "Apply failed: #{message}"}

      {:error, reason} ->
        log_error("TenantMigrationsApplyFailed", reason)
        {:error, "Apply failed: #{inspect(reason)}"}
    end
  end

  defp apply_plan(_tenant, nil), do: :ok

  defp apply_plan(%Tenant{external_id: external_id} = tenant, plan) do
    with {:ok, node, _region} <- Nodes.get_node_for_tenant(tenant),
         {:ok, _} <-
           Rpc.enhanced_call(node, __MODULE__, :apply_plan_tenant, [tenant, plan],
             timeout: @rpc_timeout,
             tenant_id: external_id
           ) do
      :ok
    else
      {:error, :rpc_error, reason} -> {:error, "pg-delta RPC failed: #{inspect(reason)}"}
      {:error, _} = err -> err
    end
  end

  @doc false
  def apply_plan_tenant(%Tenant{} = tenant, plan) do
    with {:ok, settings} <- Database.from_tenant(tenant, @application_name, :stop) do
      run_pgdelta_apply(settings, plan)
    end
  end

  defp run_pgdelta_apply(%Database{} = settings, plan) do
    with_pgdelta(fn path, dir ->
      plan_path = Path.join(dir, "plan.json")
      File.write!(plan_path, plan)

      args = [
        "apply",
        "--plan",
        plan_path,
        "--target",
        postgres_url(settings),
        "--profile",
        profile_path(),
        "--allow-data-loss"
      ]

      case run_pgdelta_cmd(path, args) do
        {_output, 0} -> {:ok, :applied}
        other -> pgdelta_error(other)
      end
    end)
  end

  defp with_tenant_conn(%Database{} = settings, fun) do
    case Database.connect_db(%{settings | pool_size: 1}) do
      {:ok, conn} ->
        result = fun.(conn)
        GenServer.stop(conn)
        result

      {:error, _} = err ->
        err
    end
  end
end
