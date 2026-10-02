defmodule RealtimeWeb.Plugs.BaggageRequestIdTest do
  use ExUnit.Case, async: true
  import Plug.Test
  import Plug.Conn

  alias RealtimeWeb.Plugs.BaggageRequestId

  defp call(conn, opts) do
    BaggageRequestId.call(conn, BaggageRequestId.init(opts))
  end

  test "uses request id from baggage if valid" do
    conn =
      conn(:get, "/")
      |> put_req_header("baggage", "request-id=1234567890")
      |> call([])

    assert ["1234567890"] = get_resp_header(conn, "x-request-id")
    assert Logger.metadata()[:request_id] == "1234567890"
  end

  test "uses configured request id key from baggage" do
    conn =
      conn(:get, "/")
      |> put_req_header("baggage", "my-request-id=1234567890")
      |> call(baggage_key: "my-request-id")

    assert ["1234567890"] = get_resp_header(conn, "x-request-id")
    assert Logger.metadata()[:request_id] == "1234567890"
  end

  test "generates new request id if not valid from baggage: min size" do
    conn =
      conn(:get, "/")
      # too short
      |> put_req_header("baggage", "request-id=123")
      |> call([])

    [res_request_id] = get_resp_header(conn, "x-request-id")
    assert ^res_request_id = Logger.metadata()[:request_id]
    assert generated_request_id?(res_request_id)
    assert res_request_id != "123"
  end

  test "generates new request id if not valid from baggage: max size" do
    request_id = String.duplicate("0", 201)

    conn =
      conn(:get, "/")
      # too long
      |> put_req_header("baggage", "request-id=#{request_id}")
      |> call([])

    [res_request_id] = get_resp_header(conn, "x-request-id")
    assert ^res_request_id = Logger.metadata()[:request_id]
    assert generated_request_id?(res_request_id)
    assert res_request_id != request_id
  end

  test "generates new request id if baggage value contains a newline (log forging)" do
    # W3C baggage percent-decodes values, so %0A arrives as a raw newline.
    # Such a value must be rejected to avoid CRLF/log injection (CWE-117/CWE-93).
    conn =
      conn(:get, "/")
      |> put_req_header("baggage", "request-id=INJECTED%0A%5Bcritical%5D%20fake-log-line")
      |> call([])

    [res_request_id] = get_resp_header(conn, "x-request-id")
    assert ^res_request_id = Logger.metadata()[:request_id]
    assert generated_request_id?(res_request_id)
    refute res_request_id =~ "\n"
  end

  test "generates new request id if baggage value contains a terminal escape sequence" do
    # ESC (0x1B) passes Plug's CR/LF/NUL check and String.printable?/1, but is a
    # terminal-escape-injection primitive against operators tailing raw logs.
    conn =
      conn(:get, "/")
      |> put_req_header("baggage", "request-id=INJECTED%1B%5B2Jcleared-screen")
      |> call([])

    [res_request_id] = get_resp_header(conn, "x-request-id")
    assert ^res_request_id = Logger.metadata()[:request_id]
    assert generated_request_id?(res_request_id)
    refute res_request_id =~ "\e"
  end

  test "generates new request id if baggage value contains a tab" do
    conn =
      conn(:get, "/")
      |> put_req_header("baggage", "request-id=INJECTED%09tabbed")
      |> call([])

    [res_request_id] = get_resp_header(conn, "x-request-id")
    assert ^res_request_id = Logger.metadata()[:request_id]
    assert generated_request_id?(res_request_id)
    refute res_request_id =~ "\t"
  end

  test "generates new request id if baggage value contains a C1 control char" do
    # %C2%85 percent-decodes to the 2-byte UTF-8 encoding of U+0085 (NEL), a C1
    # control char that is a line terminator in some processors. It is *valid*
    # UTF-8, so a UTF-8-only validator would accept it; the printable-ASCII
    # whitelist rejects it because both bytes (0xC2, 0x85) are >= 0x80.
    conn =
      conn(:get, "/")
      |> put_req_header("baggage", "request-id=INJECTED%C2%85nextline")
      |> call([])

    [res_request_id] = get_resp_header(conn, "x-request-id")
    assert ^res_request_id = Logger.metadata()[:request_id]
    assert generated_request_id?(res_request_id)
  end

  test "generates new request id if baggage value is not valid UTF-8" do
    # %FF percent-decodes to the lone byte 0xFF, which is not valid UTF-8. The
    # printable-ASCII byte walk must reject it (0xFF >= 0x80) rather than crash.
    conn =
      conn(:get, "/")
      |> put_req_header("baggage", "request-id=INJECTED%FFmalformed")
      |> call([])

    [res_request_id] = get_resp_header(conn, "x-request-id")
    assert ^res_request_id = Logger.metadata()[:request_id]
    assert generated_request_id?(res_request_id)
  end

  test "generates new request id if baggage value contains a bidi override" do
    # %E2%80%AE decodes to U+202E (RIGHT-TO-LEFT OVERRIDE), valid UTF-8 that
    # reorders how a terminal renders the log line (spoofing). Its bytes are all
    # >= 0x80, so the printable-ASCII whitelist rejects it.
    conn =
      conn(:get, "/")
      |> put_req_header("baggage", "request-id=INJECTED%E2%80%AEspoofed")
      |> call([])

    [res_request_id] = get_resp_header(conn, "x-request-id")
    assert ^res_request_id = Logger.metadata()[:request_id]
    assert generated_request_id?(res_request_id)
  end

  test "generates new request id if baggage value contains a line separator" do
    # %E2%80%A8 decodes to U+2028 (LINE SEPARATOR), treated as a line terminator
    # by many JSON/log processors -> log forging above the ASCII range.
    conn =
      conn(:get, "/")
      |> put_req_header("baggage", "request-id=INJECTED%E2%80%A8fake-line")
      |> call([])

    [res_request_id] = get_resp_header(conn, "x-request-id")
    assert ^res_request_id = Logger.metadata()[:request_id]
    assert generated_request_id?(res_request_id)
  end

  test "generates new request id if there is no bahhage" do
    conn =
      conn(:get, "/")
      |> call([])

    [res_request_id] = get_resp_header(conn, "x-request-id")
    assert ^res_request_id = Logger.metadata()[:request_id]
    assert generated_request_id?(res_request_id)
  end

  test "generates new request id if not include inside baggage" do
    conn =
      conn(:get, "/")
      |> put_req_header("baggage", "something-else=123")
      |> call([])

    [res_request_id] = get_resp_header(conn, "x-request-id")
    assert ^res_request_id = Logger.metadata()[:request_id]
    assert generated_request_id?(res_request_id)
  end

  defp generated_request_id?(request_id) do
    Regex.match?(~r/\A[A-Za-z0-9-_]+\z/, request_id)
  end
end
