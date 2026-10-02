defmodule RealtimeWeb do
  @moduledoc """
  The entrypoint for defining your web interface, such
  as controllers, views, channels and so on.

  This can be used in your application as:

      use RealtimeWeb, :controller
      use RealtimeWeb, :view

  The definitions below will be executed for every view,
  controller, etc, so keep them short and clean, focused
  on imports, uses and aliases.

  Do NOT define functions inside the quoted expressions
  below. Instead, define any helper function in modules
  and import those modules here.
  """

  def static_paths, do: ~w(assets fonts images favicon.svg robots.txt worker.js)

  def controller do
    quote do
      # Phoenix 1.8 deprecated the :namespace option. `formats: [html: "View", json: "View"]`
      # keeps the existing Phoenix.View module naming (e.g. PageController -> PageView), and
      # `layouts:` replaces what :namespace previously derived ({RealtimeWeb.LayoutView, :app}).
      use Phoenix.Controller,
        formats: [html: "View", json: "View"],
        layouts: [html: RealtimeWeb.LayoutView]

      import Plug.Conn
      import RealtimeWeb.Gettext
      alias RealtimeWeb.Router.Helpers, as: Routes

      unquote(verified_routes())
    end
  end

  def view do
    quote do
      use Phoenix.View,
        root: "lib/realtime_web/templates",
        namespace: RealtimeWeb

      # Import convenience functions from controllers
      import Phoenix.Controller,
        only: [get_flash: 1, get_flash: 2, view_module: 1, view_template: 1]

      # Include shared imports and aliases for views
      unquote(view_helpers())
    end
  end

  def live_view do
    quote do
      use Phoenix.LiveView,
        layout: {RealtimeWeb.LayoutView, :live}

      unquote(view_helpers())
    end
  end

  def live_component do
    quote do
      use Phoenix.LiveComponent

      unquote(view_helpers())
    end
  end

  def component do
    quote do
      use Phoenix.Component

      unquote(view_helpers())
    end
  end

  def router do
    quote do
      use Phoenix.Router

      import Plug.Conn
      import Phoenix.Controller
      import Phoenix.LiveView.Router
      import Phoenix.LiveDashboard.Router
    end
  end

  def channel do
    quote do
      use Phoenix.Channel, log_join: false, log_handle_in: false
      import RealtimeWeb.Gettext
    end
  end

  defp view_helpers do
    quote do
      # Use all HTML functionality (forms, tags, etc)
      use Phoenix.HTML

      import Phoenix.Component
      import Phoenix.LiveComponent

      import Phoenix.LiveView.Helpers
      # Import basic rendering functionality (render, render_layout, etc)
      import Phoenix.View

      import RealtimeWeb.ErrorHelpers
      import RealtimeWeb.Gettext
      alias RealtimeWeb.Router.Helpers, as: Routes

      import RealtimeWeb.Components

      unquote(verified_routes())
    end
  end

  @doc """
  When used, dispatch to the appropriate controller/view/etc.
  """
  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end

  def verified_routes do
    quote do
      use Phoenix.VerifiedRoutes,
        endpoint: RealtimeWeb.Endpoint,
        router: RealtimeWeb.Router,
        statics: RealtimeWeb.static_paths()
    end
  end
end
