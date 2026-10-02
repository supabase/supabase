defmodule SupavisorWeb.UserView do
  use SupavisorWeb, :view

  def render("user.json", %{user: user}) do
    %{
      db_user_alias: user.db_user_alias,
      db_user: user.db_user,
      db_password: user.db_password,
      pool_size: user.pool_size,
      is_manager: user.is_manager,
      mode_type: user.mode_type,
      pool_checkout_timeout: user.pool_checkout_timeout,
      max_clients: user.max_clients
    }
  end
end
