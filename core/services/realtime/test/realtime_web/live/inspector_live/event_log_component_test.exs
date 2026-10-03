defmodule RealtimeWeb.InspectorLive.EventLogComponentTest do
  use RealtimeWeb.ConnCase, async: true
  import Phoenix.LiveViewTest

  alias RealtimeWeb.InspectorLive.EventLogComponent

  setup %{conn: conn} do
    {:ok, view, _html} = live(conn, ~p"/")
    %{log: with_target(view, "#event_log")}
  end

  describe "EventLogComponent" do
    test "caps the stream at 500 entries, dropping the oldest", %{log: log} do
      for n <- 1..501 do
        render_hook(log, "log_event", %{"category" => "broadcast", "event" => "evt-#{n}", "payload" => %{}})
      end

      html = render(log)

      assert html =~ ~s(data-event="evt-501")
      refute html =~ ~s(data-event="evt-1")
    end

    test "pause buffers events behind a pending count, resume flushes them in order", %{log: log} do
      render_hook(log, "pause", %{})

      render_hook(log, "log_event", %{"category" => "broadcast", "event" => "buffered-1", "payload" => %{}})
      html = render_hook(log, "log_event", %{"category" => "broadcast", "event" => "buffered-2", "payload" => %{}})

      refute html =~ "buffered-1"
      refute html =~ "buffered-2"
      assert html =~ "2 new"

      html = render_hook(log, "resume", %{})

      assert html =~ ~s(data-event="buffered-1")
      assert html =~ ~s(data-event="buffered-2")
      refute html =~ ~r/\d+ new/
    end

    test "clear empties the log and resets the empty-state message", %{log: log} do
      render_hook(log, "log_event", %{"category" => "broadcast", "event" => "will-be-cleared", "payload" => %{}})
      html = render_hook(log, "clear", %{})

      refute html =~ "will-be-cleared"
      assert html =~ "Nothing yet"
    end

    test "toggle_category flips the button's active styling", %{log: log} do
      html = render(log)
      assert html =~ ~s(phx-value-category="broadcast")

      html = render_hook(log, "toggle_category", %{"category" => "broadcast"})
      # An inactive category button drops the brand-tinted active classes.
      refute html =~ ~r/phx-value-category="broadcast"[^>]*bg-brand-100/
    end
  end

  describe "default categories" do
    test "channel traffic is on and client logging is off", %{log: log} do
      [active] =
        render(log)
        |> Floki.parse_document!()
        |> Floki.find("#event_log")
        |> Floki.attribute("data-categories")

      assert active |> String.split(",") |> Enum.sort() == ~w(broadcast postgres presence system)
    end

    test "toggling a category updates what the browser filter is told to show", %{log: log} do
      html = render_hook(log, "toggle_category", %{"category" => "transport"})

      [active] = html |> Floki.parse_document!() |> Floki.find("#event_log") |> Floki.attribute("data-categories")

      assert "transport" in String.split(active, ",")
    end

    test "each row carries the fields the browser filter matches against", %{log: log} do
      render_hook(log, "log_event", %{
        "category" => "system",
        "event" => "realtime:room_a phx_join (6, 6)",
        "payload" => %{"table" => "messages"}
      })

      [row] = render(log) |> Floki.parse_document!() |> Floki.find("#event_log_rows > tr")

      assert Floki.attribute(row, "data-label") == ["Joining room_a"]
      assert Floki.attribute(row, "data-category") == ["system"]
      assert Floki.attribute(row, "data-payload") == [~s({"table":"messages"})]
    end
  end

  describe "payload_summary/1" do
    test "renders JSON rather than Elixir map syntax" do
      summary = EventLogComponent.payload_summary(%{"event" => "test", "payload" => %{"some" => "data"}})

      assert summary == ~s({"event":"test","payload":{"some":"data"}})
      refute summary =~ "=>"
    end

    test "truncates long payloads instead of stretching the row" do
      summary = EventLogComponent.payload_summary(%{"blob" => String.duplicate("x", 500)})

      assert String.ends_with?(summary, "…")
      assert String.length(summary) <= 161
    end

    test "renders an em dash for an empty payload" do
      assert EventLogComponent.payload_summary(%{}) == "—"
      assert EventLogComponent.payload_summary(nil) == "—"
    end
  end

  describe "event_label/1" do
    test "names the protocol verb and drops the message refs" do
      assert EventLogComponent.event_label("realtime:room_a phx_join (6, 6)") == "Joining room_a"
      assert EventLogComponent.event_label("ok realtime:room_a phx_reply (6)") == "Joined room_a"
      assert EventLogComponent.event_label("error realtime:room_a phx_reply (6)") == "Join rejected"
      assert EventLogComponent.event_label("realtime:room_a phx_leave (null, 22)") == "Leaving room_a"
      assert EventLogComponent.event_label("close realtime:room_a") == "Channel closed"
      assert EventLogComponent.event_label("error realtime:room_a") == "Channel error"
    end

    test "leaves a broadcast's own event name alone" do
      assert EventLogComponent.event_label("cursor-move") == "cursor-move"
    end

    test "names the transport lifecycle instead of parsing the socket URL" do
      raw = "connected to ws://127.0.0.1:54321/realtime/v1/websocket?apikey=[redacted]&vsn=2.0.0"

      assert EventLogComponent.event_label(raw) == "Transport connected"
    end

    test "names the subscription confirmation" do
      assert EventLogComponent.event_label("ok realtime:room_a system") == "Subscription confirmed"
    end

    test "never leaks the raw refs into the label" do
      refute EventLogComponent.event_label("realtime:room_a phx_join (6, 6)") =~ "("
      refute EventLogComponent.event_label("realtime:room_a phx_join (6, 6)") =~ "phx_"
    end
  end

  describe "time_label/1" do
    test "shows time of day only" do
      {:ok, dt, _} = DateTime.from_iso8601("2026-08-07T13:37:25.596Z")

      assert EventLogComponent.time_label(dt) == "13:37:25.596"
    end
  end
end
