defmodule RealtimeWeb.InspectorLive.ConnComponentTest do
  use RealtimeWeb.ConnCase, async: true
  import Phoenix.LiveViewTest

  describe "connection form persistence" do
    test "validate patches the URL with the publishable token but never the bearer", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      view
      |> form("#conn_form", connection: %{channel: "room_b", token: "publishable-key", bearer: "secret-bearer"})
      |> render_change()

      path = assert_patch(view)

      assert path =~ "token=publishable-key"
      refute path =~ "secret-bearer"
      assert path =~ "room_b"
    end

    test "a link carrying a token fills the token field", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/?host=https://x.supabase.co&channel=room_a&token=publishable-key")

      assert view |> element("#conn_form_token") |> render() =~ "publishable-key"
    end

    test "a bare project ref in the host field derives the full host", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      view
      |> form("#conn_form", connection: %{host: "abcdefgh", token: "publishable-key"})
      |> render_change()

      path = assert_patch(view)

      assert path =~ "abcdefgh.supabase.co"
    end

    test "a real host is left alone rather than treated as a project ref", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      view
      |> form("#conn_form", connection: %{host: "http://127.0.0.1:54321"})
      |> render_change()

      path = assert_patch(view)

      assert path =~ "host=http%3A%2F%2F127.0.0.1%3A54321"
      refute path =~ "supabase.co"
    end

    test "a link shared with the old project param still resolves to a host", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/?project=abcdefgh&channel=room_a")

      assert render(view) =~ "abcdefgh.supabase.co"
    end

    test "the share button is available before a successful connection", %{conn: conn} do
      {:ok, _view, html} = live(conn, ~p"/")

      assert html |> Floki.parse_document!() |> Floki.find("#share-button") != []
    end

    test "validate patches the URL with cleaned values", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      view
      |> form("#conn_form", connection: %{channel: "  room_b  ", host: "https://x.supabase.co/"})
      |> render_change()

      path = assert_patch(view)

      assert path =~ "channel=room_b"
      assert path =~ "host=https%3A%2F%2Fx.supabase.co&"
    end
  end

  describe "connect validation" do
    test "connecting without a token shows a required-field error and does not push connect", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      html =
        view
        |> form("#conn_form", connection: %{channel: "room_a", host: "https://x.supabase.co", token: ""})
        |> render_submit()

      assert html =~ "can&#39;t be blank"
    end

    test "connecting without a host shows a required-field error", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      html =
        view
        |> form("#conn_form", connection: %{channel: "room_a", token: "a-token", host: ""})
        |> render_submit()

      assert html =~ "can&#39;t be blank"
    end

    test "connecting with just a host succeeds", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      view
      |> form("#conn_form", connection: %{channel: "room_a", token: "a-token", host: "https://x.supabase.co"})
      |> render_submit()

      assert_push_event(view, "connect", %{"connection" => %{"channel" => "room_a"}})
    end
  end

  describe "postgres changes filters" do
    setup %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      # The editor only exists once database changes are on, same as for a real user.
      view |> form("#conn_form", connection: %{enable_db_changes: "true"}) |> render_change()
      assert_patch(view)

      %{view: view}
    end

    defp open_editor(view) do
      view |> element("button[phx-click=open_filter_editor]") |> render_click()
      view
    end

    defp applied_url(view) do
      view |> assert_patch() |> URI.decode()
    end

    test "conditions are joined into one filter and shared in the URL", %{view: view} do
      view = open_editor(view)
      view |> element("button[phx-click=add_condition]") |> render_click()

      view
      |> form("#filter-editor-form",
        conditions: %{
          "0" => %{column: "amount", operator: "gt", value: "100"},
          "1" => %{column: "status", operator: "eq", value: "open"}
        }
      )
      |> render_submit()

      assert applied_url(view) =~ "filter=amount=gt.100,status=eq.open"
    end

    test "the not toggle prefixes the operator", %{view: view} do
      view = open_editor(view)

      view
      |> form("#filter-editor-form",
        conditions: %{"0" => %{column: "status", operator: "in", value: "(draft,archived)", negated: "true"}}
      )
      |> render_submit()

      assert applied_url(view) =~ "filter=status=not.in.(draft,archived)"
    end

    test "a multi-condition filter from a URL opens as one row per condition", %{view: view} do
      render_patch(view, "/?enable_db_changes=true&filter=amount%3Dgt.100,status%3Deq.open")

      doc = view |> open_editor() |> render() |> Floki.parse_document!()

      assert Floki.attribute(doc, ~s(input[name="conditions[0][column]"]), "value") == ["amount"]
      assert Floki.attribute(doc, ~s(input[name="conditions[1][column]"]), "value") == ["status"]
      assert Floki.attribute(doc, ~s(input[name="conditions[1][value]"]), "value") == ["open"]
      assert [_] = Floki.find(doc, ~s(select[name="conditions[0][operator]"] option[value=gt][selected]))
    end

    test "a comma inside an in-list stays part of the value rather than starting a condition", %{view: view} do
      render_patch(view, "/?enable_db_changes=true&filter=status%3Din.(draft,archived)")

      doc = view |> open_editor() |> render() |> Floki.parse_document!()

      assert Floki.attribute(doc, ~s(input[name="conditions[0][value]"]), "value") == ["(draft,archived)"]
      assert Floki.find(doc, ~s(input[name="conditions[1][column]"])) == []
    end

    test "cancelling leaves the filter that was already applied", %{view: view} do
      render_patch(view, "/?enable_db_changes=true&filter=age%3Dlt.65")

      view = open_editor(view)
      view |> form("#filter-editor-form", conditions: %{"0" => %{column: "wiped", value: "1"}}) |> render_change()
      view |> element("button[phx-click=close_filter_editor]") |> render_click()

      html = render(view)

      refute html =~ "wiped"
      assert html =~ "age &lt; 65"
    end

    test "`is` only accepts the values Postgres allows, and nothing is applied until it does", %{view: view} do
      view = open_editor(view)

      html =
        view
        |> form("#filter-editor-form", conditions: %{"0" => %{column: "deleted_at", operator: "is", value: "banana"}})
        |> render_submit()

      assert html =~ "only accepts null, true, false, unknown"
      assert html =~ "filter-editor-form"

      view
      |> form("#filter-editor-form", conditions: %{"0" => %{column: "deleted_at", operator: "is", value: "null"}})
      |> render_submit()

      assert applied_url(view) =~ "filter=deleted_at=is.null"
    end

    test "a column is trimmed into a chip and travels in the URL", %{view: view} do
      view = open_editor(view)

      view |> form(~s(form[phx-submit=add_select_column]), column: "  title  ") |> render_submit()
      view |> form("#filter-editor-form", conditions: %{"0" => %{column: "", value: ""}}) |> render_submit()

      assert applied_url(view) =~ "select=title"
    end

    test "the same column cannot be selected twice", %{view: view} do
      view = open_editor(view)

      view |> form(~s(form[phx-submit=add_select_column]), column: "title") |> render_submit()
      html = view |> form(~s(form[phx-submit=add_select_column]), column: "title") |> render_submit()

      assert html |> Floki.parse_document!() |> Floki.find("button[phx-click=remove_select_column]") |> length() == 1
    end

    test "select reaches the client as a list of column names", %{view: view} do
      render_patch(view, "/?enable_db_changes=true&table=todos&select=id,title")

      view
      |> form("#conn_form", connection: %{host: "http://127.0.0.1:54321", token: "anon"})
      |> render_submit()

      assert_push_event(view, "connect", %{"connection" => %{"select" => ["id", "title"]}})
    end

    test "no selected columns sends an empty list rather than an empty string", %{view: view} do
      view
      |> form("#conn_form", connection: %{host: "http://127.0.0.1:54321", token: "anon"})
      |> render_submit()

      assert_push_event(view, "connect", %{"connection" => %{"select" => []}})
    end

    test "an applied filter survives editing another field", %{view: view} do
      render_patch(view, "/?enable_db_changes=true&filter=age%3Dlt.65&select=name")

      view |> form("#conn_form", connection: %{channel: "room_b"}) |> render_change()

      url = applied_url(view)

      assert url =~ "filter=age=lt.65"
      assert url =~ "select=name"
    end

    test "the event type reaches the client instead of always subscribing to everything", %{view: view} do
      view
      |> form("#conn_form",
        connection: %{
          channel: "room_a",
          token: "a-token",
          host: "https://x.supabase.co",
          event: "DELETE"
        }
      )
      |> render_submit()

      assert_push_event(view, "connect", %{"connection" => %{"event" => "DELETE"}})
    end
  end

  describe "user token" do
    test "a bearer collapses to the identity it claims", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      html =
        view
        |> form("#conn_form", connection: %{bearer: jwt(%{"email" => "dev@example.com", "role" => "authenticated"})})
        |> render_change()

      assert html =~ "dev@example.com"
      assert html =~ "authenticated"
      assert html =~ "Sign out"
      refute html =~ "paste a user JWT"
    end

    test "an expired token says so instead of failing silently at connect time", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      html =
        view
        |> form("#conn_form", connection: %{bearer: jwt(%{"email" => "dev@example.com", "exp" => 1})})
        |> render_change()

      assert html =~ "expired"
    end

    test "signing out clears the token and brings the credentials back", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      view
      |> form("#conn_form", connection: %{bearer: jwt(%{"email" => "dev@example.com"})})
      |> render_change()

      html = view |> element("button[phx-click=clear_bearer]") |> render_click()

      refute html =~ "dev@example.com"
      assert html =~ "paste a user JWT"
    end

    test "an unreadable token is labelled rather than crashing the form", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      html = view |> form("#conn_form", connection: %{bearer: "not-a-jwt"}) |> render_change()

      assert html =~ "unreadable token"
    end
  end

  defp jwt(claims) do
    encode = &(&1 |> Jason.encode!() |> Base.url_encode64(padding: false))

    "#{encode.(%{"alg" => "HS256"})}.#{encode.(claims)}.signature"
  end

  describe "field cleanup" do
    test "a pasted token keeps working when it carries surrounding whitespace", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      view
      |> form("#conn_form",
        connection: %{channel: " room_a ", token: "  a-token\n", host: " https://x.supabase.co/ "}
      )
      |> render_submit()

      assert_push_event(view, "connect", %{
        "connection" => %{"channel" => "room_a", "token" => "a-token", "host" => "https://x.supabase.co"}
      })
    end

    test "a pasted dashboard URL still ends up pointing at the project's host", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      view
      |> form("#conn_form", connection: %{host: "https://abcdefgh.supabase.co/dashboard"})
      |> render_change()

      path = assert_patch(view)

      assert path =~ "host=https%3A%2F%2Fabcdefgh.supabase.co"
      refute path =~ "dashboard"
    end

    test "booleans reach the client as booleans, not strings", %{conn: conn} do
      {:ok, view, _html} = live(conn, ~p"/")

      view
      |> form("#conn_form",
        connection: %{
          channel: "room_a",
          token: "a-token",
          host: "https://x.supabase.co",
          enable_presence: "true",
          private_channel: "false"
        }
      )
      |> render_submit()

      assert_push_event(view, "connect", %{
        "connection" => %{"enable_presence" => true, "private_channel" => false}
      })
    end
  end
end
