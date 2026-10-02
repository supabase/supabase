defmodule SupavisorWeb.ConnCase do
  @moduledoc """
  This module defines the test case to be used by
  tests that require setting up a connection.

  Such tests rely on `Phoenix.ConnTest` and also
  import other functionality to make it easier
  to build common data structures and query the data layer.

  Finally, if the test case interacts with the database,
  we enable the SQL sandbox, so changes done to the database
  are reverted at the end of every test. If you are using
  PostgreSQL, you can even run database tests asynchronously
  by setting `use SupavisorWeb.ConnCase, async: true`, although
  this option is not recommended for other databases.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      # Import conveniences for testing with connections
      import Plug.Conn
      import Phoenix.ConnTest
      import Phoenix.VerifiedRoutes
      import SupavisorWeb.ConnCase

      alias SupavisorWeb.Router.Helpers, as: Routes

      # The default endpoint for testing
      @endpoint SupavisorWeb.Endpoint
      @router SupavisorWeb.Router
    end
  end

  setup tags do
    Supavisor.DataCase.setup_sandbox(tags)
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end

  def assert_schema(data, schema_name) do
    OpenApiSpex.TestAssertions.assert_schema(data, schema_name, SupavisorWeb.ApiSpec.spec())
  end
end
