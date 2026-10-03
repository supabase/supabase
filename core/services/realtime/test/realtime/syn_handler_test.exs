defmodule Realtime.SynHandlerTest do
  use Realtime.DataCase, async: false
  import ExUnit.CaptureLog
  alias Realtime.SynHandler
  alias Realtime.Tenants.Connect
  alias RealtimeWeb.Endpoint

  @mod SynHandler
  @name "test"
  @topic "syn_handler"

  @aux_mod (quote do
              defmodule FakeConnect do
                use GenServer

                def start_link([tenant_id, region, opts]) do
                  name = {Connect, tenant_id, %{conn: nil, region: region}}
                  gen_opts = [name: {:via, :syn, name}]
                  GenServer.start_link(FakeConnect, [tenant_id, opts], gen_opts)
                end

                def init([tenant_id, opts]) do
                  conn = Keyword.get(opts, :conn, "remote_conn")
                  :syn.update_registry(Connect, tenant_id, fn _pid, meta -> %{meta | conn: conn} end)

                  if opts[:trap_exit], do: Process.flag(:trap_exit, true)

                  {:ok, nil}
                end

                def handle_info(:shutdown_connect, state), do: {:stop, :normal, state}
                def handle_info(_, state), do: {:noreply, state}
              end
            end)

  Code.eval_quoted(@aux_mod)

  # > :"main@127.0.0.11" < :"atest@127.0.0.1"
  # false
  # iex(2)> :erlang.phash2("tenant123", 2)
  # 0
  # iex(3)> :erlang.phash2("tenant999", 2)
  # 1
  describe "integration test with a Connect conflict name=atest" do
    setup do
      {:ok, pid, node} =
        Clustered.start_disconnected(@aux_mod, name: :atest, extra_config: [{:realtime, :region, "ap-southeast-2"}])

      %{peer_pid: pid, node: node}
    end

    @tag tenant_id: "tenant999"
    test "tenant hash = 1", %{node: node, peer_pid: peer_pid, tenant_id: tenant_id} do
      assert :erlang.phash2(tenant_id, 2) == 1
      local_pid = start_supervised!({FakeConnect, [tenant_id, "us-east-1", [conn: "local_conn"]]})
      {:ok, remote_pid} = :peer.call(peer_pid, FakeConnect, :start_link, [[tenant_id, "ap-southeast-2", []]])
      on_exit(fn -> Process.exit(remote_pid, :brutal_kill) end)

      log =
        capture_log(fn ->
          # Connect to peer node to cause a conflict on syn
          true = Node.connect(node)

          # Both nodes agree
          assert_eventually(
            {^remote_pid, %{region: "ap-southeast-2", conn: "remote_conn"}} =
              :peer.call(peer_pid, :syn, :lookup, [Connect, tenant_id])
          )

          assert_eventually(
            {^remote_pid, %{region: "ap-southeast-2", conn: "remote_conn"}} = :syn.lookup(Connect, tenant_id)
          )

          assert :peer.call(peer_pid, Process, :alive?, [remote_pid])

          assert_eventually not Process.alive?(local_pid)
        end)

      assert log =~ "stop local process: #{inspect(local_pid)}"
      assert log =~ "Successfully stopped #{inspect(local_pid)}"

      assert log =~
               "Elixir.Realtime.Tenants.Connect terminated due to syn conflict resolution: \"#{tenant_id}\" #{inspect(local_pid)}"
    end

    @tag tenant_id: "tenant123"
    test "tenant hash = 0", %{node: node, peer_pid: peer_pid, tenant_id: tenant_id} do
      assert :erlang.phash2(tenant_id, 2) == 0
      {:ok, remote_pid} = :peer.call(peer_pid, FakeConnect, :start_link, [[tenant_id, "ap-southeast-2", []]])
      local_pid = start_supervised!({FakeConnect, [tenant_id, "us-east-1", [conn: "local_conn"]]})
      on_exit(fn -> Process.exit(remote_pid, :kill) end)

      log =
        capture_log(fn ->
          # Connect to peer node to cause a conflict on syn
          true = Node.connect(node)
          assert_eventually {^local_pid, %{region: "us-east-1", conn: "local_conn"}} = :syn.lookup(Connect, tenant_id)

          assert_eventually(
            {^local_pid, %{region: "us-east-1", conn: "local_conn"}} =
              :peer.call(peer_pid, :syn, :lookup, [Connect, tenant_id])
          )

          assert_eventually not :peer.call(peer_pid, Process, :alive?, [remote_pid])

          assert Process.alive?(local_pid)
        end)

      assert log =~ "remote process will be stopped: #{inspect(remote_pid)}"
    end
  end

  # > :"main@127.0.0.11" < :"test@127.0.0.1"
  # true
  # iex(2)> :erlang.phash2("tenant123", 2)
  # 0
  # iex(3)> :erlang.phash2("tenant999", 2)
  # 1
  describe "integration test with a Connect conflict name=test" do
    setup do
      {:ok, pid, node} =
        Clustered.start_disconnected(@aux_mod, name: :test, extra_config: [{:realtime, :region, "ap-southeast-2"}])

      %{peer_pid: pid, node: node}
    end

    @tag tenant_id: "tenant999"
    test "tenant hash = 1", %{node: node, peer_pid: peer_pid, tenant_id: tenant_id} do
      assert :erlang.phash2(tenant_id, 2) == 1
      Endpoint.subscribe("connect:#{tenant_id}")
      local_pid = start_supervised!({FakeConnect, [tenant_id, "us-east-1", [conn: "local_conn"]]})

      {:ok, remote_pid} = :peer.call(peer_pid, FakeConnect, :start_link, [[tenant_id, "ap-southeast-2", []]])

      on_exit(fn -> Process.exit(remote_pid, :brutal_kill) end)

      log =
        capture_log(fn ->
          # Connect to peer node to cause a conflict on syn
          true = Node.connect(node)
          assert_eventually {^local_pid, %{region: "us-east-1", conn: "local_conn"}} = :syn.lookup(Connect, tenant_id)

          assert_eventually(
            {^local_pid, %{region: "us-east-1", conn: "local_conn"}} =
              :peer.call(peer_pid, :syn, :lookup, [Connect, tenant_id])
          )

          assert_eventually not :peer.call(peer_pid, Process, :alive?, [remote_pid])

          assert Process.alive?(local_pid)
        end)

      assert log =~ "remote process will be stopped: #{inspect(remote_pid)}"
    end

    @tag tenant_id: "tenant123"
    test "tenant hash = 0", %{node: node, peer_pid: peer_pid, tenant_id: tenant_id} do
      assert :erlang.phash2(tenant_id, 2) == 0
      # Start remote process first
      {:ok, remote_pid} = :peer.call(peer_pid, FakeConnect, :start_link, [[tenant_id, "ap-southeast-2", []]])

      on_exit(fn -> Process.exit(remote_pid, :kill) end)

      # start connect locally later
      local_pid = start_supervised!({FakeConnect, [tenant_id, "us-east-1", [conn: "local_conn"]]})

      log =
        capture_log(fn ->
          # Connect to peer node to cause a conflict on syn
          true = Node.connect(node)

          assert_eventually(
            {^remote_pid, %{region: "ap-southeast-2", conn: "remote_conn"}} =
              :peer.call(peer_pid, :syn, :lookup, [Connect, tenant_id])
          )

          assert_eventually(
            {^remote_pid, %{region: "ap-southeast-2", conn: "remote_conn"}} = :syn.lookup(Connect, tenant_id)
          )

          assert :peer.call(peer_pid, Process, :alive?, [remote_pid])

          assert_eventually not Process.alive?(local_pid)
        end)

      assert log =~ "stop local process: #{inspect(local_pid)}"
      assert log =~ "Successfully stopped #{inspect(local_pid)}"

      assert log =~
               "Elixir.Realtime.Tenants.Connect terminated due to syn conflict resolution: \"#{tenant_id}\" #{inspect(local_pid)}"
    end

    @tag tenant_id: "tenant123"
    test "tenant hash = 0 but timed out stopping", %{node: node, peer_pid: peer_pid, tenant_id: tenant_id} do
      assert :erlang.phash2(tenant_id, 2) == 0
      # Start remote process first
      {:ok, remote_pid} = :peer.call(peer_pid, FakeConnect, :start_link, [[tenant_id, "ap-southeast-2", []]])

      on_exit(fn -> Process.exit(remote_pid, :kill) end)

      # start connect locally later
      local_pid = start_supervised!({FakeConnect, [tenant_id, "us-east-1", [conn: "local_conn", trap_exit: true]]})

      log =
        capture_log(fn ->
          # Connect to peer node to cause a conflict on syn
          true = Node.connect(node)
          assert_process_down(local_pid, :killed, 6000)

          # Both nodes agree
          assert {^remote_pid, %{region: "ap-southeast-2", conn: "remote_conn"}} =
                   :peer.call(peer_pid, :syn, :lookup, [Connect, tenant_id])

          assert {^remote_pid, %{region: "ap-southeast-2", conn: "remote_conn"}} = :syn.lookup(Connect, tenant_id)

          assert :peer.call(peer_pid, Process, :alive?, [remote_pid])
        end)

      assert log =~ "stop local process: #{inspect(local_pid)}"
      assert log =~ "Timed out while waiting for process #{inspect(local_pid)} to stop. Sending kill exit signal"

      assert log =~
               "Elixir.Realtime.Tenants.Connect terminated due to syn conflict resolution: \"#{tenant_id}\" #{inspect(local_pid)}"
    end
  end

  describe "on_process_registered/5" do
    test "emits telemetry event for process registration" do
      pid = self()
      meta = %{some: :meta}
      reason = :normal

      # Attach a test handler to capture the telemetry event
      test_pid = self()
      handler_id = [:test, :syn_handler, :registered]

      :telemetry.attach(
        handler_id,
        [:syn, @mod, :registered],
        fn event, measurements, metadata, _config ->
          send(test_pid, {:telemetry_event, event, measurements, metadata})
        end,
        nil
      )

      on_exit(fn -> :telemetry.detach(handler_id) end)

      assert SynHandler.on_process_registered(@mod, @name, pid, meta, reason) == :ok

      assert_receive {:telemetry_event, [:syn, @mod, :registered], %{}, %{name: @name}}
    end
  end

  describe "on_process_joined/5" do
    test "emits telemetry event with name and meta for a group join" do
      pid = self()
      meta = %{region: "us-east-1"}
      reason = :normal

      ref = :telemetry_test.attach_event_handlers(self(), [[:syn, @mod, :joined]])

      assert SynHandler.on_process_joined(@mod, @name, pid, meta, reason) == :ok

      assert_receive {[:syn, @mod, :joined], ^ref, %{}, %{name: @name, meta: ^meta}}
    end
  end

  describe "on_process_left/5" do
    test "emits telemetry event with name and meta for a group leave" do
      pid = self()
      meta = %{region: "us-east-1"}
      reason = :normal

      ref = :telemetry_test.attach_event_handlers(self(), [[:syn, @mod, :left]])

      assert SynHandler.on_process_left(@mod, @name, pid, meta, reason) == :ok

      assert_receive {[:syn, @mod, :left], ^ref, %{}, %{name: @name, meta: ^meta}}
    end
  end

  describe "on_process_unregistered/5" do
    setup do
      RealtimeWeb.Endpoint.subscribe("#{@topic}:#{@name}")
    end

    test "emits telemetry event for process unregistration" do
      reason = :normal
      pid = self()

      # Attach a test handler to capture the telemetry event
      test_pid = self()
      handler_id = [:test, :syn_handler, :unregistered]

      :telemetry.attach(
        handler_id,
        [:syn, @mod, :unregistered],
        fn event, measurements, metadata, _config ->
          send(test_pid, {:telemetry_event, event, measurements, metadata})
        end,
        nil
      )

      on_exit(fn -> :telemetry.detach(handler_id) end)

      capture_log(fn ->
        assert SynHandler.on_process_unregistered(@mod, @name, pid, %{}, reason) == :ok
      end)

      assert_receive {:telemetry_event, [:syn, @mod, :unregistered], %{}, %{name: @name}}

      topic = "#{@topic}:#{@name}"
      event = "#{@topic}_down"
      assert_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: ^event, payload: %{reason: ^reason, pid: ^pid}}
    end

    test "it handles :syn_conflict_resolution reason" do
      reason = :syn_conflict_resolution
      pid = self()

      log =
        capture_log(fn ->
          assert SynHandler.on_process_unregistered(@mod, @name, pid, %{}, reason) == :ok
        end)

      topic = "#{@topic}:#{@name}"
      event = "#{@topic}_down"

      assert log =~ "#{@mod} terminated due to syn conflict resolution: #{inspect(@name)} #{inspect(self())}"
      assert_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: ^event, payload: %{reason: ^reason, pid: ^pid}}
    end

    test "it handles other reasons" do
      reason = :other_reason
      pid = self()

      log =
        capture_log(fn ->
          assert SynHandler.on_process_unregistered(@mod, @name, pid, %{}, reason) == :ok
        end)

      topic = "#{@topic}:#{@name}"
      event = "#{@topic}_down"

      refute log =~ "#{@mod} terminated: #{inspect(@name)} #{node()}"

      assert_receive %Phoenix.Socket.Broadcast{
                       topic: ^topic,
                       event: ^event,
                       payload: %{reason: ^reason, pid: ^pid}
                     },
                     500
    end
  end

  defp assert_process_down(pid, reason, timeout) do
    ref = Process.monitor(pid)

    if reason do
      assert_receive {:DOWN, ^ref, :process, ^pid, ^reason}, timeout
    else
      assert_receive {:DOWN, ^ref, :process, ^pid, _reason}, timeout
    end
  end
end
