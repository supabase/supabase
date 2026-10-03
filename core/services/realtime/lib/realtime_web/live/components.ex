defmodule RealtimeWeb.Components do
  @moduledoc """
  Components for LiveView
  """

  use Phoenix.Component
  alias Phoenix.LiveView.JS

  @doc """
  Renders a heroicon (see `deps/heroicons`) as a small inline mask, e.g. `<.icon name="hero-signal" />`.
  Color follows `currentColor`, so wrap in a text-color utility or class to tint it.
  ## Examples
      <.icon name="hero-magnifying-glass" class="text-brand-600" />
      <.icon name="hero-check-circle-mini" />
  """
  attr :name, :string, required: true
  attr :class, :string, default: nil

  def icon(assigns) do
    ~H"""
    <span class={[@name, @class]} />
    """
  end

  @doc """
  Renders an h1 tag.
  ## Examples
      <.h1>My Header</.h1>
  """
  slot(:inner_block, required: true)

  def h1(assigns) do
    ~H"""
    <h1 class="mb-5 flex items-center text-2xl font-semibold leading-6 text-brand">
      <%= render_slot(@inner_block) %>
    </h1>
    """
  end

  @doc """
  Renders an h2 tag.
  ## Examples
      <.h2>My Header</.h2>
  """
  slot(:inner_block, required: true)

  def h2(assigns) do
    ~H"""
    <h2 class="mb-5 flex items-center text-lg font-semibold leading-6 text-brand">
      <%= render_slot(@inner_block) %>
    </h2>
    """
  end

  @doc """
  Renders an h3 tag.
  ## Examples
      <.h3>My Header</.h3>
  """
  slot(:inner_block, required: true)

  def h3(assigns) do
    ~H"""
    <h3 class="mb-5 flex items-center text-lg font-semibold leading-6 text-brand">
      <%= render_slot(@inner_block) %>
    </h3>
    """
  end

  @doc """
  Renders a button, or a link/patch styled as a button. Pick the render shape by
  supplying `href`/`patch`/`navigate`; color always comes from `variant`, never from
  a caller-supplied `class`, so composing classes here is always additive, never an
  override (stylesheet-order-safe).
  ## Examples
      <.button variant={:primary} type="submit">Connect</.button>
      <.button variant={:secondary} href={@share_url} target="_blank">Share</.button>
      <.button variant={:secondary} patch={~p"/"}>Back</.button>
      <.button variant={:danger} phx-click="disconnect">Disconnect</.button>
  """
  attr :variant, :atom, default: :primary, values: [:primary, :secondary, :danger]
  attr :type, :string, default: nil
  attr :href, :string, default: nil
  attr :patch, :string, default: nil
  attr :navigate, :string, default: nil
  attr :target, :string, default: nil
  attr :replace, :boolean, default: true
  attr :class, :string, default: nil
  attr :rest, :global

  slot(:inner_block, required: true)

  def button(assigns) do
    ~H"""
    <.link
      :if={@href || @patch || @navigate}
      role="button"
      href={@href}
      patch={@patch}
      navigate={@navigate}
      replace={@replace}
      target={@target}
      class={[button_base(), button_variant(@variant), @class]}
      {@rest}
    >
      <%= render_slot(@inner_block) %>
    </.link>
    <button
      :if={!(@href || @patch || @navigate)}
      type={@type}
      class={[button_base(), button_variant(@variant), @class]}
      {@rest}
    >
      <%= render_slot(@inner_block) %>
    </button>
    """
  end

  defp button_base, do: "font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2"
  defp button_variant(:primary), do: "bg-brand-600 hover:bg-brand-500 text-white focus:ring-brand-500"
  defp button_variant(:secondary), do: "bg-neutral-600 hover:bg-neutral-500 text-white focus:ring-neutral-500"
  defp button_variant(:danger), do: "bg-error-600 hover:bg-error-500 text-white focus:ring-error-500"

  @doc """
  Renders a modal.
  ## Examples
      <.modal id="confirm-modal">
        Are you sure?
        <:confirm>OK</:confirm>
        <:cancel>Cancel</:cancel>
      </.modal>
  JS commands may be passed to the `:on_cancel` and `on_confirm` attributes
  for the caller to reactor to each button press, for example:
      <.modal id="confirm" on_confirm={JS.push("delete")} on_cancel={JS.navigate(~p"/posts")}>
        Are you sure you?
        <:confirm>OK</:confirm>
        <:cancel>Cancel</:cancel>
      </.modal>
  """
  attr :id, :string, required: true
  attr :show, :boolean, default: false
  attr :on_cancel, JS, default: %JS{}
  attr :on_confirm, JS, default: %JS{}

  slot(:inner_block, required: true)
  slot(:title)
  slot(:subtitle)
  slot(:confirm)
  slot(:cancel)

  def modal(assigns) do
    ~H"""
    <div id={@id} phx-mounted={@show && show_modal(@id)} class="relative z-50 hidden">
      <div
        id={"#{@id}-bg"}
        class="fixed inset-0 bg-zinc-50/90 dark:bg-black/70 transition-opacity"
        aria-hidden="true"
      />
      <div
        class="fixed inset-0 overflow-y-auto"
        aria-labelledby={"#{@id}-title"}
        aria-describedby={"#{@id}-description"}
        role="dialog"
        aria-modal="true"
        tabindex="0"
      >
        <div class="flex min-h-full items-center justify-center">
          <div class="w-full max-w-3xl p-4 sm:p-6 lg:py-8">
            <.focus_wrap
              id={"#{@id}-container"}
              phx-mounted={@show && show_modal(@id)}
              phx-window-keydown={hide_modal(@on_cancel, @id)}
              phx-key="escape"
              phx-click-away={hide_modal(@on_cancel, @id)}
              class="hidden relative rounded-2xl bg-white dark:bg-neutral-900 p-14 shadow-lg shadow-zinc-700/10 ring-1 ring-gray-700/10 dark:ring-neutral-700 transition"
            >
              <div class="absolute top-6 right-5">
                <button
                  phx-click={hide_modal(@on_cancel, @id)}
                  type="button"
                  class="-m-3 flex-none p-3 opacity-20 hover:opacity-40 dark:text-neutral-100"
                  aria-label="Close"
                >
                  x
                </button>
              </div>
              <div id={"#{@id}-content"}>
                <header :if={@title != []}>
                  <h1 id={"#{@id}-title"} class="text-lg font-semibold leading-8 text-zinc-800 dark:text-neutral-100">
                    <%= render_slot(@title) %>
                  </h1>
                  <p :if={@subtitle != []} class="mt-2 text-sm leading-6 text-zinc-600 dark:text-neutral-400">
                    <%= render_slot(@subtitle) %>
                  </p>
                </header>
                <%= render_slot(@inner_block) %>
                <div :if={@confirm != [] or @cancel != []} class="ml-6 mb-4 flex items-center gap-5">
                  <.button
                    :for={confirm <- @confirm}
                    id={"#{@id}-confirm"}
                    phx-click={@on_confirm}
                    phx-disable-with
                    class="py-2 px-3"
                  >
                    <%= render_slot(confirm) %>
                  </.button>
                  <.link
                    :for={cancel <- @cancel}
                    phx-click={hide_modal(@on_cancel, @id)}
                    class="text-sm font-semibold leading-6 text-zinc-900 dark:text-neutral-100 hover:text-zinc-700 dark:hover:text-neutral-300"
                  >
                    <%= render_slot(cancel) %>
                  </.link>
                </div>
              </div>
            </.focus_wrap>
          </div>
        </div>
      </div>
    </div>
    """
  end

  @doc """
  Renders a small filled status indicator dot.
  ## Examples
      <.status_dot variant={:success} />
      <.status_dot variant={:info} pulse />
  """
  attr :variant, :atom, required: true, values: [:success, :warning, :error, :info, :neutral]
  attr :pulse, :boolean, default: false
  attr :class, :string, default: nil
  attr :rest, :global

  def status_dot(assigns) do
    ~H"""
    <span
      class={[
        "inline-block h-2.5 w-2.5 rounded-full",
        status_color(@variant),
        @pulse && "animate-pulse-slow",
        @class
      ]}
      {@rest}
    />
    """
  end

  defp status_color(:success), do: "bg-success-500 dark:bg-success-400"
  defp status_color(:warning), do: "bg-warning-500 dark:bg-warning-400"
  defp status_color(:error), do: "bg-error-500 dark:bg-error-400"
  defp status_color(:info), do: "bg-info-500 dark:bg-info-400"
  defp status_color(:neutral), do: "bg-neutral-400 dark:bg-neutral-500"

  @doc """
  Renders a semantic badge: a StatusDot plus a label.
  ## Examples
      <.badge variant={:success}>Subscribed</.badge>
      <.badge variant={:warning} dot={false}>Loading...</.badge>
  """
  attr :variant, :atom, required: true, values: [:success, :warning, :error, :info, :neutral]
  attr :dot, :boolean, default: true
  attr :pulse, :boolean, default: false
  attr :class, :string, default: nil
  attr :rest, :global

  slot(:inner_block, required: true)

  def badge(assigns) do
    ~H"""
    <span
      class={[
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        badge_color(@variant),
        @class
      ]}
      {@rest}
    >
      <.status_dot :if={@dot} variant={@variant} pulse={@pulse} />
      <%= render_slot(@inner_block) %>
    </span>
    """
  end

  defp badge_color(:success), do: "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300"
  defp badge_color(:warning), do: "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300"
  defp badge_color(:error), do: "bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300"
  defp badge_color(:info), do: "bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-300"
  defp badge_color(:neutral), do: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"

  ## Forms

  @doc """
  Renders an input with label and error messages, driven by a `Phoenix.HTML.FormField`.
  ## Examples
      <.input field={@form[:channel]} label="Channel" placeholder="room_a" />
      <.input field={@form[:log_level]} type="select" label="Log level" options={["debug", "info", "warning", "error"]} />
      <.input field={@form[:enable_presence]} type="checkbox" label="Enable Presence" />
  """
  attr :id, :any, default: nil
  attr :name, :any
  attr :label, :string, default: nil
  attr :value, :any

  attr :type, :string,
    default: "text",
    values: ~w(checkbox color date datetime-local email file hidden month number password range
      radio search select tel text textarea time url week)

  attr :field, Phoenix.HTML.FormField, doc: "a %Phoenix.HTML.FormField{} struct, for form fields"
  attr :errors, :list, default: []
  attr :checked, :boolean
  attr :prompt, :string, default: nil
  attr :options, :list, default: []
  attr :multiple, :boolean, default: false

  attr :rest, :global, include: ~w(accept autocomplete disabled form max maxlength min minlength
      pattern placeholder readonly required rows size step)

  def input(%{field: %Phoenix.HTML.FormField{} = field} = assigns) do
    assigns
    |> assign(field: nil, id: assigns.id || field.id)
    |> assign(:errors, Enum.map(field.errors, &translate_error/1))
    |> assign_new(:name, fn -> if assigns.multiple, do: field.name <> "[]", else: field.name end)
    |> assign_new(:value, fn -> field.value end)
    |> input()
  end

  def input(%{type: "checkbox"} = assigns) do
    assigns = assign_new(assigns, :checked, fn -> Phoenix.HTML.Form.normalize_value("checkbox", assigns.value) end)

    ~H"""
    <div class="mb-4">
      <label class="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-neutral-200">
        <input type="hidden" name={@name} value="false" />
        <input
          type="checkbox"
          id={@id}
          name={@name}
          value="true"
          checked={@checked}
          class="rounded border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 text-brand-600 focus:ring-brand-500 disabled:opacity-50"
          {@rest}
        />
        <%= @label %>
      </label>
      <.error :for={msg <- @errors}><%= msg %></.error>
    </div>
    """
  end

  def input(%{type: "select"} = assigns) do
    ~H"""
    <div class="mb-4">
      <.label for={@id}><%= @label %></.label>
      <select id={@id} name={@name} class={input_classes(@errors)} multiple={@multiple} {@rest}>
        <option :if={@prompt} value=""><%= @prompt %></option>
        <%= Phoenix.HTML.Form.options_for_select(@options, @value) %>
      </select>
      <.error :for={msg <- @errors}><%= msg %></.error>
    </div>
    """
  end

  def input(assigns) do
    ~H"""
    <div class="mb-4">
      <.label for={@id}><%= @label %></.label>
      <input
        type={@type}
        name={@name}
        id={@id}
        value={Phoenix.HTML.Form.normalize_value(@type, @value)}
        class={input_classes(@errors)}
        {@rest}
      />
      <.error :for={msg <- @errors}><%= msg %></.error>
    </div>
    """
  end

  defp input_classes(errors) do
    [
      "my-1 block w-full rounded-md shadow-sm bg-white dark:bg-neutral-800 dark:text-neutral-100",
      if(errors == [],
        do:
          "border-gray-300 dark:border-neutral-600 focus:border-brand-500 focus:ring focus:ring-brand-200 dark:focus:ring-brand-900/40 focus:ring-opacity-50",
        else:
          "border-error-500 dark:border-error-500 focus:border-error-500 focus:ring focus:ring-error-200 dark:focus:ring-error-900/40 focus:ring-opacity-50"
      )
    ]
  end

  @doc """
  Renders a label for a form field.
  """
  attr :for, :string, default: nil
  slot(:inner_block, required: true)

  def label(assigns) do
    ~H"""
    <label for={@for} class="block text-gray-700 dark:text-neutral-200 text-sm font-bold mb-2">
      <%= render_slot(@inner_block) %>
    </label>
    """
  end

  @doc """
  Renders an inline form-field error message.
  """
  slot(:inner_block, required: true)

  def error(assigns) do
    ~H"""
    <p class="mt-1 flex items-center gap-1 text-xs text-error-600">
      <%= render_slot(@inner_block) %>
    </p>
    """
  end

  defp translate_error({msg, opts}) do
    if count = opts[:count] do
      Gettext.dngettext(RealtimeWeb.Gettext, "errors", msg, msg, count, opts)
    else
      Gettext.dgettext(RealtimeWeb.Gettext, "errors", msg, opts)
    end
  end

  ## JS Commands

  def show(js \\ %JS{}, selector) do
    JS.show(js,
      to: selector,
      time: 50,
      transition:
        {"transition-all transform ease-out duration-300", "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95",
         "opacity-100 translate-y-0 sm:scale-100"}
    )
  end

  def hide(js \\ %JS{}, selector) do
    JS.hide(js,
      to: selector,
      time: 50,
      transition:
        {"transition-all transform ease-in duration-200", "opacity-100 translate-y-0 sm:scale-100",
         "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"}
    )
  end

  def show_modal(js \\ %JS{}, id) when is_binary(id) do
    js
    |> JS.show(to: "##{id}")
    |> JS.show(
      to: "##{id}-bg",
      transition: {"transition-all transform ease-out duration-300", "opacity-0", "opacity-100"}
    )
    |> show("##{id}-container")
    |> JS.focus_first(to: "##{id}-content")
  end

  def hide_modal(js \\ %JS{}, id) do
    js
    |> JS.hide(
      to: "##{id}-bg",
      transition: {"transition-all transform ease-in duration-200", "opacity-100", "opacity-0"}
    )
    |> hide("##{id}-container")
    |> JS.hide(to: "##{id}", transition: {"block", "block", "hidden"})
    |> JS.pop_focus()
  end
end
