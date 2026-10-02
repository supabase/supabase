defmodule RealtimeWeb.ErrorView do
  use RealtimeWeb, :view

  def render("error.json", %{conn: %{assigns: %{message: message}}}), do: %{message: message}

  def template_not_found(template, _assigns), do: Phoenix.Controller.status_message_from_template(template)
end
