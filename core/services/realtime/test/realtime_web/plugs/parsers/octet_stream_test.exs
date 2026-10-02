defmodule RealtimeWeb.Plugs.Parsers.OctetStreamTest do
  use ExUnit.Case, async: true
  import Plug.Test
  import Plug.Conn

  alias RealtimeWeb.Plugs.Parsers.OctetStream

  defmodule TimeoutReader do
    def read_body(_conn, _opts), do: {:error, :timeout}
  end

  defmodule ErrorReader do
    def read_body(_conn, _opts), do: {:error, :closed}
  end

  describe "init/1" do
    test "defaults the body reader to Plug.Conn.read_body/2" do
      assert {{Plug.Conn, :read_body, []}, opts} = OctetStream.init([])
      assert opts == []
    end

    test "passes other opts through untouched" do
      assert {{Plug.Conn, :read_body, []}, opts} = OctetStream.init(length: 42)
      assert Keyword.get(opts, :length) == 42
    end

    test "pops :body_reader out of opts" do
      reader = {TimeoutReader, :read_body, []}
      assert {^reader, opts} = OctetStream.init(body_reader: reader, length: 10)
      refute Keyword.has_key?(opts, :body_reader)
      assert Keyword.get(opts, :length) == 10
    end
  end

  describe "parse/5" do
    test "returns {:next, conn} for non-octet-stream content types" do
      conn = conn(:post, "/", "anything")
      opts = OctetStream.init([])

      assert {:next, ^conn} = OctetStream.parse(conn, "application", "json", %{}, opts)
      assert {:next, ^conn} = OctetStream.parse(conn, "text", "plain", %{}, opts)
      assert {:next, ^conn} = OctetStream.parse(conn, "application", "x-www-form-urlencoded", %{}, opts)
    end

    test "parses application/octet-stream body into %{\"_binary\" => body}" do
      body = <<1, 2, 3, 4, 5>>

      conn =
        conn(:post, "/", body)
        |> put_req_header("content-type", "application/octet-stream")

      opts = OctetStream.init([])

      assert {:ok, %{"_binary" => ^body}, %Plug.Conn{}} =
               OctetStream.parse(conn, "application", "octet-stream", %{}, opts)
    end

    test "handles empty binary body" do
      conn =
        conn(:post, "/", <<>>)
        |> put_req_header("content-type", "application/octet-stream")

      opts = OctetStream.init([])

      assert {:ok, %{"_binary" => <<>>}, %Plug.Conn{}} =
               OctetStream.parse(conn, "application", "octet-stream", %{}, opts)
    end

    test "returns {:error, :too_large, conn} when body exceeds :length" do
      body = :crypto.strong_rand_bytes(2_000)

      conn =
        conn(:post, "/", body)
        |> put_req_header("content-type", "application/octet-stream")

      opts = OctetStream.init(length: 100, read_length: 100)

      assert {:error, :too_large, %Plug.Conn{}} =
               OctetStream.parse(conn, "application", "octet-stream", %{}, opts)
    end

    test "raises Plug.TimeoutError when body reader returns {:error, :timeout}" do
      conn =
        conn(:post, "/", <<1, 2, 3>>)
        |> put_req_header("content-type", "application/octet-stream")

      opts = OctetStream.init(body_reader: {TimeoutReader, :read_body, []})

      assert_raise Plug.TimeoutError, fn ->
        OctetStream.parse(conn, "application", "octet-stream", %{}, opts)
      end
    end

    test "raises Plug.BadRequestError for other read_body errors" do
      conn =
        conn(:post, "/", <<1, 2, 3>>)
        |> put_req_header("content-type", "application/octet-stream")

      opts = OctetStream.init(body_reader: {ErrorReader, :read_body, []})

      assert_raise Plug.BadRequestError, fn ->
        OctetStream.parse(conn, "application", "octet-stream", %{}, opts)
      end
    end

    test "ignores content-type parameters" do
      body = <<10, 20, 30>>

      conn =
        conn(:post, "/", body)
        |> put_req_header("content-type", "application/octet-stream; charset=binary")

      opts = OctetStream.init([])

      assert {:ok, %{"_binary" => ^body}, %Plug.Conn{}} =
               OctetStream.parse(
                 conn,
                 "application",
                 "octet-stream",
                 %{"charset" => "binary"},
                 opts
               )
    end
  end
end
