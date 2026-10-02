defmodule RealtimeWeb.InspectorLive.ConnComponent do
  use RealtimeWeb, :live_component

  @url_params ~w(host project channel token schema table event filter select enable_presence enable_db_changes private_channel log_level)

  defmodule Connection do
    use Ecto.Schema
    import Ecto.Changeset

    schema "f" do
      field(:log_level, :string, default: "error")
      field(:token, :string)
      field(:host, :string)
      field(:project, :string)
      field(:channel, :string, default: "room_a")
      field(:schema, :string, default: "public")
      field(:table, :string, default: "*")
      field(:event, :string, default: "*")
      field(:filter, :string)
      field(:select, :string)
      field(:bearer, :string)
      field(:enable_broadcast, :boolean, default: true)
      field(:enable_presence, :boolean, default: false)
      field(:enable_db_changes, :boolean, default: false)
      field(:private_channel, :boolean, default: false)
    end

    @text_fields [:log_level, :token, :host, :project, :channel, :schema, :table, :filter, :select, :bearer]

    def changeset(form, params \\ %{}) do
      form
      |> cast(params, [
        :log_level,
        :token,
        :host,
        :project,
        :channel,
        :schema,
        :table,
        :event,
        :filter,
        :select,
        :bearer,
        :enable_broadcast,
        :enable_presence,
        :enable_db_changes,
        :private_channel
      ])
      |> clean_text_fields()
      |> clean_select()
      |> clean_project()
      |> clean_host()
      |> expand_project_ref()
      |> validate_required([:channel])
    end

    # Each column name is trimmed on its own: `id, title` would otherwise ask for " title".
    defp clean_select(changeset) do
      update_change(changeset, :select, fn
        value when is_binary(value) -> value |> split_select() |> Enum.join(",")
        value -> value
      end)
    end

    @doc "The `select` string as the list of column names the wire format expects."
    def split_select(nil), do: []

    def split_select(value) when is_binary(value) do
      value
      |> String.split(",")
      |> Enum.map(&String.trim/1)
      |> Enum.reject(&(&1 == ""))
      |> Enum.uniq()
    end

    def split_select(_), do: []

    # The connection line has one slot for "where", so a bare project ref typed there becomes the
    # full host. Anything carrying a scheme, dot or colon is already a host and is left alone.
    def project_ref?(value) when is_binary(value) do
      value != "" and not String.contains?(value, ".") and not String.contains?(value, ":") and
        not String.contains?(value, "/")
    end

    def project_ref?(_), do: false

    defp expand_project_ref(changeset) do
      case get_field(changeset, :host) do
        host when is_binary(host) ->
          if project_ref?(host),
            do: changeset |> put_change(:project, host) |> put_change(:host, "https://#{host}.supabase.co"),
            else: changeset

        _ ->
          changeset
      end
    end

    defp clean_text_fields(changeset) do
      Enum.reduce(@text_fields, changeset, fn field, acc ->
        update_change(acc, field, fn
          value when is_binary(value) -> String.trim(value)
          value -> value
        end)
      end)
    end

    defp clean_project(changeset) do
      update_change(changeset, :project, &project_ref/1)
    end

    def project_ref(value) when is_binary(value) do
      value
      |> String.trim()
      |> String.replace(~r{^\w+://}, "")
      |> String.split(~r{[/.]}, parts: 2)
      |> hd()
    end

    def project_ref(value), do: value

    # Realtime is addressed by origin, so a pasted dashboard or docs URL keeps only scheme, host
    # and port. Anything without a scheme is left as typed so a half-finished host still validates.
    defp clean_host(changeset) do
      update_change(changeset, :host, fn
        value when is_binary(value) -> origin_of(value)
        value -> value
      end)
    end

    defp origin_of(value) do
      case URI.parse(value) do
        # Updating the parsed struct rather than building a fresh %URI{} keeps the opaque :authority
        # field owned by URI; to_string/1 ignores it when :host is set and drops the default port.
        %URI{scheme: scheme, host: host} = uri when is_binary(scheme) and is_binary(host) and host != "" ->
          URI.to_string(%URI{uri | userinfo: nil, path: nil, query: nil, fragment: nil})

        _ ->
          String.trim_trailing(value, "/")
      end
    end

    def submit_changeset(form, params \\ %{}) do
      form
      |> changeset(params)
      |> validate_required([:token])
      |> validate_host_or_project()
    end

    defp validate_host_or_project(changeset) do
      if get_field(changeset, :host) in [nil, ""] and get_field(changeset, :project) in [nil, ""] do
        add_error(changeset, :host, "can't be blank")
      else
        changeset
      end
    end
  end

  @impl true
  def mount(socket) do
    changeset = Connection.changeset(%Connection{})

    socket =
      socket
      |> assign(subscribed_state: "Connect")
      |> assign(changeset: changeset)
      |> assign(url_params: %{})
      |> assign(connected_snapshot: nil)
      |> assign(filter_editor: nil)

    {:ok, socket}
  end

  @impl true
  def update(%{url_params: params} = assigns, socket) do
    bearer = %{"bearer" => Ecto.Changeset.get_field(socket.assigns.changeset, :bearer)}

    merged =
      params
      |> adopt_legacy_project()
      |> Map.take(@url_params)
      |> then(&Map.merge(bearer, &1))
      |> Map.reject(fn {_k, v} -> v in [nil, ""] end)

    socket =
      socket
      |> assign(Map.delete(assigns, :url_params))
      |> assign(:changeset, Connection.changeset(%Connection{}, merged))
      |> assign(:url_params, params)

    {:ok, socket}
  end

  def update(assigns, socket) do
    {:ok, assign(socket, assigns)}
  end

  @impl true
  def handle_event("validate", %{"connection" => conn}, socket) do
    conn = derive_host(conn)
    changeset = Connection.changeset(%Connection{}, conn)

    socket =
      socket
      |> assign(changeset: changeset)
      |> push_patch(to: Routes.inspector_index_path(RealtimeWeb.Endpoint, :index, url_params(changeset)), replace: true)

    {:noreply, socket}
  end

  def handle_event("connect", %{"connection" => conn}, socket) do
    conn = derive_host(conn)

    case Ecto.Changeset.apply_action(Connection.submit_changeset(%Connection{}, conn), :validate) do
      {:ok, connection} ->
        socket =
          socket
          |> assign(changeset: Connection.changeset(%Connection{}, conn))
          |> assign(subscribed_state: "Connecting...")
          |> assign(connected_snapshot: connection)
          |> push_event("connect", %{"connection" => connect_params(connection)})

        {:noreply, socket}

      {:error, changeset} ->
        {:noreply, assign(socket, :changeset, changeset)}
    end
  end

  def handle_event("clear_bearer", _params, socket) do
    changeset = Ecto.Changeset.put_change(socket.assigns.changeset, :bearer, "")

    {:noreply, assign(socket, :changeset, changeset)}
  end

  def handle_event("disconnect", _params, socket) do
    socket =
      socket
      |> assign(subscribed_state: "Connect")
      |> assign(connected_snapshot: nil)
      |> push_event("disconnect", %{})

    {:noreply, socket}
  end

  def handle_event("clear_local_storage", _params, socket) do
    socket =
      socket
      |> assign(:changeset, Connection.changeset(%Connection{}))
      |> push_event("clear_local_storage", %{})
      |> push_patch(
        to: Routes.inspector_index_path(RealtimeWeb.Endpoint, :index),
        replace: true
      )

    {:noreply, socket}
  end

  def handle_event("local_storage", params, socket) do
    changeset = socket.assigns.changeset

    saved =
      params
      |> Map.take(~w(token bearer))
      |> Map.reject(fn {key, value} ->
        value in [nil, ""] or Ecto.Changeset.get_field(changeset, String.to_existing_atom(key)) not in [nil, ""]
      end)

    {:noreply, assign(socket, :changeset, Connection.changeset(changeset, saved))}
  end

  def handle_event("cancel", params, socket) do
    changeset = Connection.changeset(%Connection{}, params)

    {:noreply, assign(socket, changeset: changeset)}
  end

  # The editor works on a draft: nothing reaches the changeset or the URL until Apply.
  def handle_event("open_filter_editor", _params, socket) do
    changeset = socket.assigns.changeset
    filter = Ecto.Changeset.get_field(changeset, :filter)

    {conditions, unreadable} =
      case Realtime.Filter.parse_all(filter) do
        {:ok, []} -> {[blank_condition()], nil}
        {:ok, conditions} -> {conditions, nil}
        :error -> {[blank_condition()], filter}
      end

    editor = %{
      conditions: conditions,
      select: Connection.split_select(Ecto.Changeset.get_field(changeset, :select)),
      unreadable: unreadable,
      error: nil
    }

    {:noreply, assign(socket, :filter_editor, editor)}
  end

  def handle_event("close_filter_editor", _params, socket) do
    {:noreply, assign(socket, :filter_editor, nil)}
  end

  def handle_event("filter_editor_change", params, socket) do
    {:noreply, update_editor(socket, &%{&1 | conditions: read_conditions(params), error: nil})}
  end

  def handle_event("add_condition", _params, socket) do
    {:noreply, update_editor(socket, &%{&1 | conditions: &1.conditions ++ [blank_condition()], error: nil})}
  end

  def handle_event("remove_condition", %{"index" => index}, socket) do
    update = fn editor ->
      conditions = List.delete_at(editor.conditions, String.to_integer(index))
      %{editor | conditions: if(conditions == [], do: [blank_condition()], else: conditions), error: nil}
    end

    {:noreply, update_editor(socket, update)}
  end

  def handle_event("add_select_column", %{"column" => column}, socket) do
    column = String.trim(column)

    update = fn editor ->
      if column == "" or column in editor.select,
        do: editor,
        else: %{editor | select: editor.select ++ [column]}
    end

    {:noreply, update_editor(socket, update)}
  end

  def handle_event("remove_select_column", %{"column" => column}, socket) do
    {:noreply, update_editor(socket, &%{&1 | select: List.delete(&1.select, column)})}
  end

  def handle_event("apply_filter_editor", params, socket) do
    conditions = read_conditions(params)

    case invalid_is_value(conditions) do
      nil ->
        select = socket.assigns.filter_editor.select

        changeset =
          socket.assigns.changeset
          |> Ecto.Changeset.put_change(:filter, Realtime.Filter.compose_all(conditions))
          |> Ecto.Changeset.put_change(:select, Enum.join(select, ","))

        socket =
          socket
          |> assign(changeset: changeset)
          |> assign(filter_editor: nil)
          |> push_patch(
            to: Routes.inspector_index_path(RealtimeWeb.Endpoint, :index, url_params(changeset)),
            replace: true
          )

        {:noreply, socket}

      column ->
        error = "#{column} uses `is`, which only accepts #{Enum.join(Realtime.Filter.allowed_is_values(), ", ")}."
        {:noreply, update_editor(socket, &%{&1 | conditions: conditions, error: error})}
    end
  end

  defp update_editor(socket, fun) do
    case socket.assigns.filter_editor do
      nil -> socket
      editor -> assign(socket, :filter_editor, fun.(editor))
    end
  end

  defp blank_condition, do: %{column: "", operator: "eq", value: "", negated: false}

  defp read_conditions(%{"conditions" => conditions}) when is_map(conditions) do
    conditions
    |> Enum.sort_by(fn {index, _row} -> String.to_integer(index) end)
    |> Enum.map(fn {_index, row} ->
      %{
        column: Map.get(row, "column", ""),
        operator: Map.get(row, "operator", "eq"),
        value: Map.get(row, "value", ""),
        negated: Map.get(row, "negated") in ["true", "on", true]
      }
    end)
  end

  defp read_conditions(_params), do: [blank_condition()]

  # Caught here because Postgres surfaces the raise as a failed subscription, not as a usable error.
  defp invalid_is_value(conditions) do
    Enum.find_value(conditions, fn condition ->
      value = String.trim(condition.value)
      column = String.trim(condition.column)

      if condition.operator == "is" and column != "" and value not in Realtime.Filter.allowed_is_values(),
        do: column
    end)
  end

  @doc "The filter as readable conditions. An unreadable filter is shown verbatim."
  def describe_filter(changeset) do
    case Ecto.Changeset.get_field(changeset, :filter) do
      blank when blank in [nil, ""] ->
        []

      filter ->
        case Realtime.Filter.parse_all(filter) do
          {:ok, conditions} -> Enum.map(conditions, &describe_condition/1)
          :error -> [filter]
        end
    end
  end

  defp describe_condition(%{column: column, operator: operator, value: value, negated: negated}) do
    negation = if negated, do: "not ", else: ""

    "#{column} #{negation}#{Realtime.Filter.operator_label(operator)} #{value}"
  end

  @doc "Column names the subscription will ask for, empty meaning every column."
  def selected_columns(changeset) do
    Connection.split_select(Ecto.Changeset.get_field(changeset, :select))
  end

  @doc """
  Who a bearer token claims to be, for display only.

  The payload is read without verifying the signature: Realtime does that when the token is used.
  Showing the identity means a filled bearer field can collapse to "who am I" instead of 800
  characters of base64, and an expired token stops looking like a server problem.
  """
  def bearer_identity(nil), do: nil
  def bearer_identity(""), do: nil

  def bearer_identity(jwt) do
    with [_header, payload | _] <- String.split(jwt, "."),
         {:ok, json} <- Base.url_decode64(payload, padding: false),
         {:ok, claims} <- Jason.decode(json) do
      %{
        subject: claims["email"] || claims["sub"] || "user",
        role: claims["role"],
        expired?: expired?(claims["exp"])
      }
    else
      _ -> %{subject: "unreadable token", role: nil, expired?: false}
    end
  end

  defp expired?(exp) when is_integer(exp), do: exp < System.system_time(:second)
  defp expired?(_), do: false

  defp url_params(changeset) do
    changeset
    |> Ecto.Changeset.apply_changes()
    |> Map.take(Enum.map(@url_params, &String.to_existing_atom/1))
    |> Enum.reject(fn {_key, value} -> value in [nil, ""] end)
    |> Map.new(fn {key, value} -> {Atom.to_string(key), value} end)
  end

  defp connect_params(%Connection{} = connection) do
    connection
    |> Map.take(
      ~w(channel token host log_level schema table event filter bearer enable_presence enable_db_changes private_channel)a
    )
    |> Map.new(fn {key, value} -> {Atom.to_string(key), value} end)
    # A string is rejected by the server, so the comma separated URL form never reaches the wire.
    |> Map.put("select", Connection.split_select(connection.select))
  end

  attr :field, Phoenix.HTML.FormField, required: true
  attr :placeholder, :string, default: nil
  attr :aria_label, :string, required: true
  attr :class, :string, default: nil

  @doc "Borderless input for the segmented connection line, which owns the border as a whole."
  def plain_input(assigns) do
    ~H"""
    <input
      type="text"
      id={@field.id}
      name={@field.name}
      value={Phoenix.HTML.Form.normalize_value("text", @field.value)}
      placeholder={@placeholder}
      aria-label={@aria_label}
      autocomplete="off"
      spellcheck="false"
      class={[
        "border-0 bg-transparent text-sm px-3 py-2 focus:ring-0 focus:outline-none",
        "text-gray-900 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500",
        @class
      ]}
    />
    """
  end

  attr :field, Phoenix.HTML.FormField, required: true
  attr :placeholder, :string, default: nil
  attr :aria_label, :string, required: true
  attr :class, :string, default: nil

  @doc "Compact bordered input for the detail rows a toggle reveals."
  def slim_input(assigns) do
    ~H"""
    <input
      type="text"
      id={@field.id}
      name={@field.name}
      value={Phoenix.HTML.Form.normalize_value("text", @field.value)}
      placeholder={@placeholder}
      aria-label={@aria_label}
      autocomplete="off"
      spellcheck="false"
      class={[
        "text-xs rounded-md py-1 px-2 border-gray-300 dark:border-neutral-600",
        "dark:bg-neutral-800 dark:text-neutral-100",
        "focus:border-brand-500 focus:ring focus:ring-brand-200 dark:focus:ring-brand-900/40 focus:ring-opacity-50",
        @class
      ]}
    />
    """
  end

  attr :field, Phoenix.HTML.FormField, required: true
  attr :label, :string, required: true

  @doc """
  A feature as a chip rather than a labelled checkbox.

  The chip is always visible, so nothing is hidden; only its detail row appears on demand. This is
  what keeps a long feature list from reading as a long form.
  """
  def toggle(assigns) do
    assigns = assign(assigns, :on, Phoenix.HTML.Form.normalize_value("checkbox", assigns.field.value))

    ~H"""
    <label class={[
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium cursor-pointer select-none transition-colors",
      if(@on,
        do: "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-700",
        else:
          "bg-transparent text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600"
      )
    ]}>
      <input type="hidden" name={@field.name} value="false" />
      <input
        type="checkbox"
        id={@field.id}
        name={@field.name}
        value="true"
        checked={@on}
        class="sr-only peer"
      />
      <span
        aria-hidden="true"
        class={[
          "w-1.5 h-1.5 rounded-full",
          if(@on, do: "bg-brand-500", else: "bg-gray-300 dark:bg-neutral-600")
        ]}
      >
      </span>
      <%= @label %>
    </label>
    """
  end

  defp stale_connection?(_changeset, nil), do: false

  defp stale_connection?(changeset, connected_snapshot) do
    Ecto.Changeset.apply_changes(changeset) != connected_snapshot
  end

  # Links shared before the host field absorbed the project ref still carry ?project=.
  defp adopt_legacy_project(%{"project" => project} = params) when project not in [nil, ""] do
    case Map.get(params, "host") do
      host when host in [nil, ""] -> Map.put(params, "host", project)
      _ -> params
    end
  end

  defp adopt_legacy_project(params), do: params

  defp derive_host(%{"project" => project} = conn) when project not in [nil, ""] do
    case Connection.project_ref(project) do
      ref when ref in [nil, ""] -> conn
      ref -> conn |> Map.put("project", ref) |> Map.put("host", "https://#{ref}.supabase.co")
    end
  end

  defp derive_host(conn), do: conn
end
