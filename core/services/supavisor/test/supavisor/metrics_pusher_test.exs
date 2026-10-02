defmodule Supavisor.MetricsPusherTest do
  use ExUnit.Case, async: true
  import ExUnit.CaptureLog

  require Supavisor

  alias Plug.Conn
  alias Supavisor.MetricsPusher
  alias Supavisor.Monitoring.Telem

  setup {Req.Test, :verify_on_exit!}

  # Helper function to start MetricsPusher and allow it to use Req.Test.
  # Defaults to the :global scope so existing scope-agnostic tests (HTTP
  # mechanics: auth, compression, error handling, extra_labels) don't need
  # to change.
  defp start_and_allow_pusher(opts) do
    opts =
      opts
      |> Keyword.put_new(:scope, :global)
      |> Keyword.put_new(:name, Supavisor.MetricsPusher.Global)
      |> Keyword.put(:interval, :timer.minutes(5))

    name = Keyword.fetch!(opts, :name)
    pid = start_supervised!(Supervisor.child_spec({MetricsPusher, opts}, id: name))
    Req.Test.allow(name, self(), pid)
    send(pid, :push)
    {:ok, pid}
  end

  describe "start_link/1" do
    test "does not start when URL is missing" do
      opts = [scope: :global, enabled: true]
      assert :ignore = MetricsPusher.start_link(opts)
    end

    test "raises when :scope is omitted" do
      opts = [url: "https://example.com:8428/api/v1/import/prometheus"]
      assert_raise KeyError, fn -> MetricsPusher.start_link(opts) end
    end

    test "sends request successfully" do
      opts = [
        url: "https://example.com:8428/api/v1/import/prometheus",
        user: "supavisor",
        auth: "hunter2",
        compress: true,
        timeout: 5000
      ]

      tenant = "metrics_pusher_test_tenant"

      Telem.client_join(
        :ok,
        Supavisor.id(type: :single, tenant: tenant, user: "u", mode: :session, db: "db")
      )

      parent = self()

      # The :global scope carries this node's node-wide (beam/OS-level)
      # metrics, but excludes tenant-tagged series — those go through the
      # separate :tenant-scoped pusher instead.
      Req.Test.expect(Supavisor.MetricsPusher.Global, 1, fn conn ->
        assert conn.method == "POST"
        assert conn.scheme == :https
        assert conn.host == "example.com"
        assert conn.port == 8428
        assert conn.request_path == "/api/v1/import/prometheus"

        assert Conn.get_req_header(conn, "authorization") == [
                 "Basic #{Base.encode64("supavisor:hunter2")}"
               ]

        assert Conn.get_req_header(conn, "content-type") == ["text/plain"]

        # Req.Test's plug adapter transparently decompresses gzip'd request
        # bodies (and strips content-encoding) before the plug sees them, so
        # the body here is already plaintext regardless of `compress: true`.
        {:ok, body, conn} = Conn.read_body(conn)

        send(parent, {:req_called, body})
        Req.Test.text(conn, "")
      end)

      {:ok, _pid} = start_and_allow_pusher(opts)

      assert_receive {:req_called, body}, 300

      assert body =~ "beam_stats_run_queue_count"
      refute body =~ "supavisor_client_joins_ok"
      refute body =~ ~s(tenant="#{tenant}")
    end

    test "sends request successfully without auth header" do
      opts = [
        url: "http://localhost:8428/api/v1/import/prometheus",
        compress: true,
        timeout: 5000
      ]

      parent = self()

      Req.Test.expect(Supavisor.MetricsPusher.Global, 1, fn conn ->
        assert Conn.get_req_header(conn, "authorization") == []

        send(parent, :req_called)
        Req.Test.text(conn, "")
      end)

      {:ok, _pid} = start_and_allow_pusher(opts)
      assert_receive :req_called, 300
    end

    test "sends request body untouched when compress=false" do
      opts = [
        url: "http://localhost:8428/api/v1/import/prometheus",
        user: "hunter2",
        auth: "supavisor",
        compress: false,
        timeout: 5000
      ]

      parent = self()

      Req.Test.expect(Supavisor.MetricsPusher.Global, 1, fn conn ->
        assert Conn.get_req_header(conn, "content-encoding") == []
        assert Conn.get_req_header(conn, "content-type") == ["text/plain"]

        send(parent, :req_called)
        Req.Test.text(conn, "")
      end)

      {:ok, _pid} = start_and_allow_pusher(opts)
      assert_receive :req_called, 300
    end

    test "when request receives non 2XX response" do
      opts = [
        url: "https://example.com:8428/api/v1/import/prometheus",
        auth: "hunter2",
        compress: true,
        timeout: 5000
      ]

      parent = self()

      log =
        capture_log(fn ->
          Req.Test.expect(Supavisor.MetricsPusher.Global, 1, fn conn ->
            send(parent, :req_called)
            Conn.send_resp(conn, 500, "")
          end)

          {:ok, pid} = start_and_allow_pusher(opts)
          assert_receive :req_called, 300
          assert Process.alive?(pid)
          # Wait enough for the log to be captured
          Process.sleep(100)
        end)

      assert log =~ "MetricsPusher: Failed to push"
      assert log =~ "metrics to"
    end

    test "when an error is raised" do
      opts = [
        url: "https://example.com:8428/api/v1/import/prometheus",
        timeout: 5000
      ]

      parent = self()

      log =
        capture_log(fn ->
          Req.Test.expect(Supavisor.MetricsPusher.Global, 1, fn _conn ->
            send(parent, :req_called)
            raise RuntimeError, "unexpected error"
          end)

          {:ok, pid} = start_and_allow_pusher(opts)
          assert_receive :req_called, 300
          assert Process.alive?(pid)
          # Wait enough for the log to be captured
          Process.sleep(100)
        end)

      assert log =~ "MetricsPusher: Exception during"
      assert log =~ "push: %RuntimeError{message: \"unexpected error\"}"
    end

    test "appends extra_label query params to URL" do
      opts = [
        url: "http://localhost:8428/api/v1/import/prometheus",
        compress: false,
        timeout: 5000,
        extra_labels: [{"region", "us-east-1"}, {"env", "prod"}]
      ]

      parent = self()

      Req.Test.expect(Supavisor.MetricsPusher.Global, 1, fn conn ->
        send(parent, {:req_called, conn.query_string})
        Req.Test.text(conn, "")
      end)

      {:ok, _pid} = start_and_allow_pusher(opts)
      assert_receive {:req_called, query_string}, 300

      decoded_params = query_string |> String.split("&") |> Enum.map(&URI.decode_www_form/1)
      assert "extra_label=region=us-east-1" in decoded_params
      assert "extra_label=env=prod" in decoded_params
    end

    test "logs unexpected messages and stays alive" do
      parent = self()

      Req.Test.expect(Supavisor.MetricsPusher.Global, 1, fn conn ->
        send(parent, :push_happened)
        Req.Test.text(conn, "")
      end)

      {:ok, pid} =
        start_and_allow_pusher(
          url: "http://localhost:8428/api/v1/import/prometheus",
          timeout: 5000
        )

      assert_receive :push_happened, 500

      log =
        capture_log(fn ->
          send(pid, :unexpected_message)
          Process.sleep(50)
          assert Process.alive?(pid)
        end)

      assert log =~ "MetricsPusher received unexpected message: :unexpected_message"
    end
  end

  describe "start_link/1 with :tenant scope" do
    test "pushes only tenant-tagged metrics" do
      opts = [
        scope: :tenant,
        name: Supavisor.MetricsPusher.Tenant,
        url: "https://example.com:8428/api/v1/import/prometheus",
        compress: true,
        timeout: 5000
      ]

      tenant = "metrics_pusher_test_tenant"

      Telem.client_join(
        :ok,
        Supavisor.id(type: :single, tenant: tenant, user: "u", mode: :session, db: "db")
      )

      parent = self()

      Req.Test.expect(Supavisor.MetricsPusher.Tenant, 1, fn conn ->
        {:ok, body, conn} = Conn.read_body(conn)
        send(parent, {:req_called, body})
        Req.Test.text(conn, "")
      end)

      {:ok, _pid} = start_and_allow_pusher(opts)

      assert_receive {:req_called, body}, 300

      assert body =~ "supavisor_client_joins_ok"
      assert body =~ ~s(tenant="#{tenant}")
      refute body =~ "beam_stats_run_queue_count"
    end
  end

  describe "running both scopes concurrently" do
    test "each scope's pusher only receives its own traffic" do
      parent = self()

      Req.Test.expect(Supavisor.MetricsPusher.Global, 1, fn conn ->
        send(parent, :global_called)
        Req.Test.text(conn, "")
      end)

      Req.Test.expect(Supavisor.MetricsPusher.Tenant, 1, fn conn ->
        send(parent, :tenant_called)
        Req.Test.text(conn, "")
      end)

      {:ok, _global_pid} =
        start_and_allow_pusher(
          scope: :global,
          name: Supavisor.MetricsPusher.Global,
          url: "http://localhost:8428/api/v1/import/prometheus",
          timeout: 5000
        )

      {:ok, _tenant_pid} =
        start_and_allow_pusher(
          scope: :tenant,
          name: Supavisor.MetricsPusher.Tenant,
          url: "http://localhost:8429/api/v1/import/prometheus",
          timeout: 5000
        )

      assert_receive :global_called, 300
      assert_receive :tenant_called, 300
    end
  end
end
