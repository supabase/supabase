defmodule SupavisorWeb.WsProxyTest do
  use ExUnit.Case, async: true
  alias SupavisorWeb.WsProxy

  @password_pkt <<?p, 13::32, "postgres", 0>>

  test "filter the password packet" do
    bin = "hello"
    assert WsProxy.filter_pass_pkt(<<@password_pkt::binary, bin::binary>>) == bin
    assert WsProxy.filter_pass_pkt(bin) == bin
  end
end
