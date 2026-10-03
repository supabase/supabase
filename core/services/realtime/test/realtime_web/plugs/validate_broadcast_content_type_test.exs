defmodule RealtimeWeb.Plugs.ValidateBroadcastContentTypeTest do
  use ExUnit.Case, async: true
  import Plug.Test
  import Plug.Conn

  alias RealtimeWeb.Plugs.ValidateBroadcastContentType

  defp call(conn) do
    ValidateBroadcastContentType.call(conn, ValidateBroadcastContentType.init([]))
  end

  describe "allowed content types" do
    test "passes application/json through unchanged" do
      conn =
        conn(:post, "/", "{}")
        |> put_req_header("content-type", "application/json")
        |> call()

      refute conn.halted
      assert is_nil(conn.status)
    end

    test "passes application/json with charset through" do
      conn =
        conn(:post, "/", "{}")
        |> put_req_header("content-type", "application/json; charset=utf-8")
        |> call()

      refute conn.halted
      assert is_nil(conn.status)
    end

    test "passes application/octet-stream through" do
      conn =
        conn(:post, "/", <<1, 2, 3>>)
        |> put_req_header("content-type", "application/octet-stream")
        |> call()

      refute conn.halted
      assert is_nil(conn.status)
    end

    test "passes through when content-type header is missing" do
      conn =
        conn(:post, "/", "")
        |> call()

      refute conn.halted
      assert is_nil(conn.status)
    end
  end

  describe "rejected content types" do
    test "returns 415 for text/plain" do
      conn =
        conn(:post, "/", "plain text")
        |> put_req_header("content-type", "text/plain")
        |> call()

      assert conn.halted
      assert conn.status == 415
      assert get_resp_header(conn, "content-type") == ["application/json; charset=utf-8"]
      assert Jason.decode!(conn.resp_body)["error"] =~ "Unsupported Media Type"

      assert Jason.decode!(conn.resp_body)["error"] ==
               "Unsupported Media Type. Use application/json or application/octet-stream"
    end

    test "returns 415 for application/xml" do
      conn =
        conn(:post, "/", "<x/>")
        |> put_req_header("content-type", "application/xml")
        |> call()

      assert conn.halted
      assert conn.status == 415
      assert Jason.decode!(conn.resp_body)["error"] =~ "Unsupported Media Type"
    end

    test "returns 415 for multipart/form-data" do
      conn =
        conn(:post, "/", "")
        |> put_req_header("content-type", "multipart/form-data; boundary=abc")
        |> call()

      assert conn.halted
      assert conn.status == 415
    end
  end

  describe "init/1" do
    test "returns its input unchanged" do
      assert ValidateBroadcastContentType.init([]) == []
      assert ValidateBroadcastContentType.init(foo: :bar) == [foo: :bar]
    end
  end
end
