defmodule Supavisor.ClientHandler.ProtocolHelpersTest do
  use ExUnit.Case, async: true

  alias Supavisor.ClientHandler.ProtocolHelpers
  alias Supavisor.Protocol.StartupOptions

  describe "parse_startup_packet/1" do
    test "drops an invalid option and reports it" do
      bin = startup_packet([{"user", "postgres.some_tenant"}, {"options", "-c jit=maybe"}])

      assert {:ok, {_type, {"postgres", "some_tenant", _db, _sp, false, _tls, _ip}}, _app, _log,
              [{"jit", "maybe"}]} = ProtocolHelpers.parse_startup_packet(bin)
    end

    test "accepts and type-converts valid options" do
      bin = startup_packet([{"user", "postgres.some_tenant"}, {"options", "-c jit=1"}])

      assert {:ok, {_type, {"postgres", "some_tenant", _db, _sp, true, _tls, _ip}}, _app, _log,
              []} =
               ProtocolHelpers.parse_startup_packet(bin)
    end
  end

  describe "extract_and_validate_user_info/2" do
    test "returns nil client_ip when the option is absent" do
      payload = %{"user" => "postgres.some_tenant"}

      assert {:ok, {_type, {"postgres", "some_tenant", nil, nil, true, nil, nil}}} =
               ProtocolHelpers.extract_and_validate_user_info(payload, %{"jit" => true})
    end

    test "returns nil client_ip when there are no options" do
      payload = %{"user" => "postgres.some_tenant"}

      assert {:ok, {_type, {"postgres", "some_tenant", nil, nil, false, nil, nil}}} =
               ProtocolHelpers.extract_and_validate_user_info(payload, %{})
    end

    test "extracts client_ip alongside jit and client_tls" do
      payload = %{"user" => "postgres.some_tenant"}
      options = %{"jit" => true, "client_tls" => true, "client_ip" => "203.0.113.9"}

      assert {:ok, {_type, {"postgres", "some_tenant", nil, nil, true, true, "203.0.113.9"}}} =
               ProtocolHelpers.extract_and_validate_user_info(payload, options)
    end

    test "round-trips client_ip through the startup options wire format" do
      # This is the format DbHandler.send_startup/4 uses when forwarding a
      # proxied connection to the pool node.
      encoded =
        StartupOptions.encode(%{
          "jit" => "true",
          "client_tls" => "true",
          "client_ip" => "2001:db8::1"
        })

      {options, []} = StartupOptions.validate(StartupOptions.parse(encoded))
      payload = %{"user" => "postgres.some_tenant"}

      assert {:ok, {_type, {"postgres", "some_tenant", nil, nil, true, true, "2001:db8::1"}}} =
               ProtocolHelpers.extract_and_validate_user_info(payload, options)
    end
  end

  describe "effective_peer_ip/3" do
    @socket_ip "10.0.0.5"

    test "uses the forwarded IPv4 address on a local listener" do
      assert ProtocolHelpers.effective_peer_ip(true, "203.0.113.9", @socket_ip) == "203.0.113.9"
    end

    test "uses the forwarded IPv6 address on a local listener" do
      assert ProtocolHelpers.effective_peer_ip(true, "2001:db8::1", @socket_ip) == "2001:db8::1"
    end

    test "ignores the forwarded address on a non-local (public) listener" do
      assert ProtocolHelpers.effective_peer_ip(false, "203.0.113.9", @socket_ip) == @socket_ip
    end

    test "falls back to the socket peer when nothing was forwarded" do
      assert ProtocolHelpers.effective_peer_ip(true, nil, @socket_ip) == @socket_ip
      assert ProtocolHelpers.effective_peer_ip(false, nil, @socket_ip) == @socket_ip
    end

    test "falls back to the socket peer when the forwarded value is not an IP" do
      for bad <- ["", "undefined", "not-an-ip", "203.0.113", "203.0.113.9 ", "example.com"] do
        assert ProtocolHelpers.effective_peer_ip(true, bad, @socket_ip) == @socket_ip,
               "expected fallback for #{inspect(bad)}"
      end
    end
  end

  # Builds a StartupMessage wire packet from key/value pairs.
  defp startup_packet(pairs) do
    body = Enum.map(pairs, fn {k, v} -> [k, <<0>>, v, <<0>>] end)
    IO.iodata_to_binary([<<0::32, 0, 3, 0, 0>>, body, <<0>>])
  end
end
