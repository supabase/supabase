defmodule RealtimeWeb.EndpointTest do
  use ExUnit.Case, async: true

  alias RealtimeWeb.Endpoint

  describe "log_level/1" do
    test "logs 5xx responses at error level" do
      assert Endpoint.log_level(%{status: 500, path_info: ["api"]}) == :error
      assert Endpoint.log_level(%{status: 503, path_info: ["api"]}) == :error
    end

    test "logs 4xx responses at warning level" do
      assert Endpoint.log_level(%{status: 400, path_info: ["api"]}) == :warning
      assert Endpoint.log_level(%{status: 429, path_info: ["api"]}) == :warning
    end

    test "logs successful responses at info level" do
      assert Endpoint.log_level(%{status: 200, path_info: ["api"]}) == :info
    end

    test "defaults to info when status is not yet set" do
      assert Endpoint.log_level(%{status: nil, path_info: ["api"]}) == :info
      assert Endpoint.log_level(%{path_info: ["api"]}) == :info
    end

    test "keeps healthcheck routes at info by default regardless of status" do
      assert Endpoint.log_level(%{path_info: ["healthcheck"], status: 500}) == :info
      assert Endpoint.log_level(%{path_info: ["api", "tenants", "abc", "health"], status: 500}) == :info
    end

    test "disables healthcheck logging when configured" do
      Application.put_env(:realtime, :disable_healthcheck_logging, true)
      on_exit(fn -> Application.put_env(:realtime, :disable_healthcheck_logging, false) end)

      assert Endpoint.log_level(%{path_info: ["healthcheck"], status: 200}) == false
    end
  end
end
