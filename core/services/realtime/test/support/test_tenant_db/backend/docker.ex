defmodule TestTenantDb.Backend.Docker do
  @moduledoc false
  # Default backend: each pool worker runs a supabase/postgres docker
  # container. This module owns everything docker — image pull, `docker run`,
  # readiness probing, teardown — plus a small registry GenServer that hands
  # each TestTenantDb.Backend.Docker.Worker its container. Docker picks the host
  # port, so no two runs can pick the same one; container names carry this run's
  # id, so startup only reaps containers whose owning run is gone. With
  # REUSE_CONTAINERS=true this run's own containers are handed out first
  # (a dev speedup).
  @behaviour TestTenantDb.Backend

  use GenServer

  import WaitForIt

  alias Realtime.Database
  alias Realtime.Env
  alias TestTenantDb.Probe

  @container_prefix "realtime-test"
  @container_suffix_length 12

  # Docker states a pool container never comes back from. "created" belongs here
  # only because we look at it while the pool is stopped — see prune_dead_containers/0.
  @dead_statuses ["created", "exited", "dead"]

  # -- Timeouts for bringing a worker's container up.
  #
  # A worker becoming usable is two phases, and a caller blocked in
  # `Worker.port/1` is waiting for both:
  #
  #   claim      — queue behind other workers, then `docker run -d` + read the port.
  #                Serialised through this module's GenServer, but it does not wait
  #                for Postgres, so it is short per worker.
  #   wait_ready — poll until a real connection from the host succeeds. Runs in the
  #                worker itself, so all workers do this in parallel.
  #
  # `Worker.port/1` must allow more than claim + wait_ready combined.
  @claim_timeout_ms 30_000
  @container_ready_timeout_ms 25_000
  # Readiness polling backs off from start to max rather than a fixed interval.
  @ready_poll_start_ms 50
  @ready_poll_max_ms 250

  # Time to wait for docker to publish the port binding, not for Postgres itself to be ready.
  @published_port_timeout_ms 2_000

  # Careful that this doesn't go over ~60s / exunits default timeout
  def worker_ready_timeout_ms, do: @claim_timeout_ms + @container_ready_timeout_ms

  # -- TestTenantDb.Backend implementation

  @impl TestTenantDb.Backend
  def max_cases, do: Env.get_integer("MAX_CASES", 4)

  # POSTGRES_IMAGE is both the realtime database and this backend's containers.
  @impl TestTenantDb.Backend
  def capability_probe_port, do: :realtime_db

  @impl TestTenantDb.Backend
  def prepare! do
    :ok = pull()

    reap_abandoned_containers()

    existing =
      if Env.get_boolean("REUSE_CONTAINERS", false) do
        prune_dead_containers()
        existing_containers()
      else
        stop_containers()
        []
      end

    {:ok, _pid} = GenServer.start_link(__MODULE__, existing, name: __MODULE__)
    :ok
  end

  # We keep containers around for diagnostics/no `--rm`, hence we need to clean up
  # after ourselves.
  #
  # The registry is stopped before we list, to prevent it from launching more containers.
  @impl TestTenantDb.Backend
  def cleanup! do
    if pid = Process.whereis(__MODULE__), do: GenServer.stop(pid)
    if !Env.get_boolean("REUSE_CONTAINERS", false), do: stop_containers()
    :ok
  end

  # A couple of workers beyond max_cases so a test that briefly holds more
  # than one DB (or slow on_exit teardown) doesn't starve the pool.
  @impl TestTenantDb.Backend
  def pool_spec(max_cases), do: {__MODULE__.Worker, max_cases + 2}

  @impl TestTenantDb.Backend
  def worker_port(pid), do: __MODULE__.Worker.port(pid)

  @impl TestTenantDb.Backend
  def storage_up!(tenant) do
    {:ok, db_settings} = Database.from_tenant(tenant, "realtime_test", :stop)

    settings =
      db_settings
      |> Map.from_struct()
      |> Keyword.new()

    case Ecto.Adapters.Postgres.storage_up(settings) do
      :ok -> :ok
      {:error, :already_up} -> :ok
      _ -> raise "Failed to create database"
    end
  end

  @inspect_format "status={{.State.Status}} exit={{.State.ExitCode}} oom={{.State.OOMKilled}} " <>
                    "error={{.State.Error}} started={{.State.StartedAt}} finished={{.State.FinishedAt}}"

  @stats_format "mem={{.MemUsage}} mem%={{.MemPerc}} cpu={{.CPUPerc}} pids={{.PIDs}}"

  @all_stats_format "{{.Name}} mem={{.MemUsage}} cpu={{.CPUPerc}} pids={{.PIDs}}"

  @activity_query "SELECT pid, state, wait_event_type, wait_event, application_name, " <>
                    "now() - query_start AS running, left(query, 120) FROM pg_stat_activity ORDER BY query_start"

  @slots_query "SELECT slot_name, active, active_pid, wal_status, safe_wal_size FROM pg_replication_slots"

  @impl TestTenantDb.Backend
  def diagnose(pid) do
    case __MODULE__.Worker.container(pid) do
      nil ->
        {"unknown container", "worker #{inspect(pid)} did not report a container name"}

      name ->
        {name, Enum.join(state_of(name) ++ host_load() ++ inside(name) ++ logs_of(name), "\n")}
    end
  end

  defp state_of(name) do
    [
      "verdict: " <> verdict(name),
      "container: " <> docker(["inspect", "--format", @inspect_format, name]),
      "resources: " <> docker(["stats", "--no-stream", "--format", @stats_format, name])
    ]
  end

  # One container's CPU number cannot tell it's just this container vs. it's the host
  # so add host load to distinguish
  defp host_load do
    load =
      case File.read("/proc/loadavg") do
        {:ok, contents} -> contents |> String.split() |> Enum.take(3) |> Enum.join(" ")
        _ -> "unknown"
      end

    [
      "runner: #{:erlang.system_info(:logical_processors_available)} cores, loadavg #{load}",
      "all containers:\n" <> docker(["stats", "--no-stream", "--format", @all_stats_format])
    ]
  end

  # Say what the state means, so the first line of the dump already narrows it down.
  defp verdict(name) do
    # Several `docker inspect` calls vs. one for simplicity: This is for a failure cause only, we can afford the extra time.
    running = docker(["inspect", "--format", "{{.State.Running}}", name])
    oom = docker(["inspect", "--format", "{{.State.OOMKilled}}", name])
    code = docker(["inspect", "--format", "{{.State.ExitCode}}", name])

    case {running, oom, code} do
      {"true", _, _} ->
        "container is UP but Postgres did not answer from the host — see the process list and logs below"

      {_, "true", _} ->
        "OOM-KILLED"

      {_, _, "137"} ->
        "SIGKILLed from OUTSIDE the container. Postgres did not crash on its own"

      {_, _, "0"} ->
        "exited cleanly (code 0) — something stopped it on purpose"

      {_, _, other} ->
        "Postgres exited on its own with code #{other} — the log lines below should say why"
    end
  end

  defp inside(name) do
    if running?(name) do
      [
        "backends:\n" <> docker(["exec", name, "ps", "-eo", "pid,stat,time,etime,rss,args"]),
        "pg_stat_activity:\n" <> psql(name, @activity_query),
        "pg_replication_slots:\n" <> psql(name, @slots_query)
      ]
    else
      ["(container is not running, so no in-container state to collect)"]
    end
  end

  # we've seen some tight loops and didn't see where they started,
  # ---> more log lines to see where it may have started
  # It's only printed in a failure case so that's ok.
  defp logs_of(name), do: ["last 200 log lines:\n" <> docker(["logs", "--tail", "200", name])]

  defp running?(name) do
    docker(["inspect", "--format", "{{.State.Running}}", name]) == "true"
  end

  @impl TestTenantDb.Backend
  def discard(pid) do
    case __MODULE__.Worker.container(pid) do
      nil -> :ok
      name -> docker(["rm", "-f", name])
    end

    :ok
  end

  # Every call here runs against a container that has already stopped answering, so
  # each one is wrapped in `timeout`. If the container is up but its Postgres is
  # blocked, `docker exec` inherits that block and never returns — hanging the
  # test process these diagnostics exist to explain.
  defp docker(args, seconds \\ 5) do
    case System.cmd("timeout", [to_string(seconds), "docker" | args], stderr_to_stdout: true) do
      {output, 0} -> String.trim(output)
      {_output, 124} -> "(timed out after #{seconds}s: docker #{Enum.join(args, " ")})"
      {output, code} -> "(docker #{Enum.join(args, " ")} exited #{code}: #{String.trim(output)})"
    end
  end

  # Over the unix socket rather than TCP: the probe already established that the
  # port is not answering, and the postmaster sometimes still serves locally.
  defp psql(name, query) do
    docker(["exec", name, "psql", "-U", "postgres", "-h", "/var/run/postgresql", "-tAc", query])
  end

  # -- Container registry (claimed by TestTenantDb.Backend.Docker.Worker)

  # Hand a worker a container: reuse a pre-existing one if any remain,
  # otherwise start a fresh one on a free port. Returns {:ok, name, port}.
  def claim, do: GenServer.call(__MODULE__, :claim, @claim_timeout_ms)

  @impl GenServer
  def init(existing), do: {:ok, %{existing: existing}}

  @impl GenServer
  def handle_call(:claim, _from, state) do
    case state.existing do
      [{name, port} | rest] ->
        {:reply, {:ok, name, port}, %{state | existing: rest}}

      [] ->
        {name, port} = start_available_container()
        {:reply, {:ok, name, port}, state}
    end
  end

  # -- Docker plumbing

  defp image, do: Env.get_binary("POSTGRES_IMAGE", "supabase/postgres:17.6.1.166")

  def pull do
    case System.cmd("docker", ["image", "inspect", image()]) do
      {_, 0} ->
        :ok

      _ ->
        IO.puts("Pulling image #{image()}. This might take a while...")
        {_, 0} = System.cmd("docker", ["pull", image()])
        :ok
    end
  end

  # Start a container and let docker publish 5432 on a port of its choosing, then read the
  # port back: nothing else on the machine can be handed the same one.
  defp start_available_container(attempts \\ 5, last_error \\ "none")

  defp start_available_container(0, last_error) do
    raise "TestTenantDb.Backend.Docker: exhausted retries starting a container. Last error: #{last_error}"
  end

  defp start_available_container(attempts, _last_error) do
    name = container_name()

    with {_, 0} <- docker_run(name),
         {:ok, port} <- await_published_port(name) do
      {name, port}
    else
      failure ->
        # Remove the failed container before retrying with a fresh name.
        System.cmd("docker", ["rm", "-f", name], stderr_to_stdout: true)
        start_available_container(attempts - 1, describe_start_failure(failure))
    end
  end

  defp describe_start_failure({:error, reason}), do: reason
  defp describe_start_failure({output, code}), do: "docker run exited #{code}: #{String.trim(output)}"

  # The port binding for `-p 0:5432` publishes shortly after `docker run -d` returns, and under
  # heavy container churn Docker Desktop can fail to publish one at all.
  defp await_published_port(name) do
    case_wait docker_port(name),
      timeout: @published_port_timeout_ms,
      interval: WaitForIt.Backoff.exponential(start: @ready_poll_start_ms, max: @ready_poll_max_ms) do
      {:ok, port} ->
        {:ok, port}
    else
      {:error, _reason} = error ->
        error
    end
  end

  # "0.0.0.0:32768" / "[::]:32768" — take the first mapping's port.
  defp docker_port(name) do
    case System.cmd("docker", ["port", name, "5432/tcp"], stderr_to_stdout: true) do
      {output, 0} ->
        case Regex.run(~r/:(\d+)\s*$/m, output) do
          [_, port] -> {:ok, String.to_integer(port)}
          nil -> {:error, String.trim(output)}
        end

      {output, _code} ->
        {:error, String.trim(output)}
    end
  end

  defp random_string(length) do
    :crypto.strong_rand_bytes(length)
    |> Base.url_encode64()
    |> binary_part(0, length)
  end

  # This run's containers carry its run tag, so a run only ever tears down its own.
  def container_prefix, do: @container_prefix <> TestEnv.run_tag()

  def container_name, do: "#{container_prefix()}-#{random_string(@container_suffix_length)}"

  # The docker name filter is a substring match: a run listing "realtime-test" also gets another
  # run's "realtime-test_port4003-...". A container is this run's only if its name is exactly
  # this run's prefix followed by a random suffix.
  def own_container?(name, prefix \\ container_prefix()) do
    prefix = prefix <> "-"

    String.starts_with?(name, prefix) and byte_size(name) == byte_size(prefix) + @container_suffix_length
  end

  # A run whose tag is its endpoint port is gone once that port is free again. A named run
  # (TENANT or TEST_RUN) says nothing about liveness, so its containers are left for its owner,
  # who clears them on its next run.
  def abandoned_container?(name) do
    case Regex.run(~r/^#{@container_prefix}_port(\d+)-(.+)$/, name) do
      [_, port, suffix] when byte_size(suffix) == @container_suffix_length ->
        Env.port_available?(String.to_integer(port))

      _ ->
        false
    end
  end

  # Containers left behind by runs that are gone. Whoever starts next clears them, so a killed
  # run doesn't leak databases forever.
  def reap_abandoned_containers do
    {list, 0} = System.cmd("docker", ["ps", "-a", "--format", "{{.Names}}", "--filter", "name=#{@container_prefix}"])

    list
    |> String.split("\n", trim: true)
    |> Enum.filter(&abandoned_container?/1)
    |> remove!()
  end

  def stop_containers() do
    {list, 0} =
      System.cmd("docker", ["ps", "-a", "--format", "{{.Names}}", "--filter", "name=#{container_prefix()}"])

    list
    |> String.split("\n", trim: true)
    |> Enum.filter(&own_container?/1)
    |> remove!()
  end

  # As we keep dead containers around for diagnostics we also need to clean them up.
  def prune_dead_containers, do: remove!(dead_containers())

  defp remove!([]), do: :ok

  defp remove!(names) do
    System.cmd("docker", ["rm", "-f" | names], stderr_to_stdout: true)
    :ok
  end

  def dead_containers(prefix \\ container_prefix()) do
    filters = Enum.flat_map(@dead_statuses, &["--filter", "status=#{&1}"])

    {list, 0} =
      System.cmd("docker", ["ps", "-a", "--format", "{{.Names}}", "--filter", "name=#{prefix}"] ++ filters)

    list
    |> String.split("\n", trim: true)
    |> Enum.filter(&own_container?(&1, prefix))
  end

  def existing_containers do
    {containers, 0} =
      System.cmd("docker", ["ps", "--format", "{{json .}}", "--filter", "name=#{container_prefix()}"])

    containers
    |> String.split("\n", trim: true)
    |> Enum.map(&Jason.decode!/1)
    |> Enum.filter(&own_container?(&1["Names"]))
    |> Enum.map(fn container ->
      # Ports" => "0.0.0.0:6445->5432/tcp, [::]:6445->5432/tcp"
      regex = ~r/(?<=:)\d+(?=->)/

      [port] =
        Regex.scan(regex, container["Ports"])
        |> List.flatten()
        |> Enum.uniq()

      {container["Names"], String.to_integer(port)}
    end)
  end

  # Gates on a real connection from the host, exactly what consumers use.
  def wait_ready!(name, port) do
    settings = Probe.settings!(port)

    case_wait Probe.check(settings),
      timeout: @container_ready_timeout_ms,
      interval: WaitForIt.Backoff.exponential(start: @ready_poll_start_ms, max: @ready_poll_max_ms) do
      :ok ->
        :ok
    else
      {:error, reason} ->
        raise "Container #{name} did not accept connections within " <>
                "#{@container_ready_timeout_ms}ms. Last error: #{reason}"
    end
  end

  defp docker_run(name) do
    initdb_sh = Path.expand("../../../../dev/postgres/za-permit-supabase-admin.sh", __DIR__)
    initdb_sql = Path.expand("../../../../dev/postgres/zb-supabase-schema.sql", __DIR__)
    initdb_template1_sql = Path.expand("../../../../dev/postgres/zc-template1-orioledb.sql", __DIR__)

    # Deliberately no `--rm`, we keep containers around for diagnostics of why they died
    System.cmd(
      "docker",
      [
        "run",
        "-d",
        "--name",
        name,
        "-e",
        "POSTGRES_HOST=/var/run/postgresql",
        "-e",
        "POSTGRES_PASSWORD=postgres",
        "-v",
        "#{initdb_sh}:/docker-entrypoint-initdb.d/za-permit-supabase-admin.sh",
        "-v",
        "#{initdb_sql}:/docker-entrypoint-initdb.d/zb-supabase-schema.sql",
        "-v",
        "#{initdb_template1_sql}:/docker-entrypoint-initdb.d/zc-template1-orioledb.sql",
        "-p",
        "0:5432",
        image(),
        "postgres",
        "-c",
        "config_file=/etc/postgresql/postgresql.conf",
        "-c",
        "wal_keep_size=32MB",
        "-c",
        "max_wal_size=1GB",
        "-c",
        "max_slot_wal_keep_size=32MB"
      ],
      stderr_to_stdout: true
    )
  end
end
