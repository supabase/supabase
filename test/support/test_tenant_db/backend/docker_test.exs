defmodule TestTenantDb.Backend.DockerTest do
  # async: false — these tests swap the :test_run_tag app env that TestTenantDb reads to name
  # and reap its containers.
  use ExUnit.Case, async: false

  alias Realtime.Env
  alias TestTenantDb.Backend.Docker

  @suffix String.duplicate("a", 12)

  defp put_run_tag(tag) do
    original = Application.fetch_env!(:realtime, :test_run_tag)
    Application.put_env(:realtime, :test_run_tag, tag)
    on_exit(fn -> Application.put_env(:realtime, :test_run_tag, original) end)
  end

  # A prefix of its own, so the filters here cannot match the real pool's
  # containers, whose prefix is a different string entirely.
  @prune_prefix "realtime-test_prunetest"

  # we don't call `prune_dead_containers/0` here as that'd effect the tests suite's own pool
  # we need this to be isolated from our actual usage.
  describe "dead_containers/1" do
    @tag :requires_docker_backend
    test "selects finished containers under the given prefix and not the running ones" do
      dead = "#{@prune_prefix}-#{String.duplicate("a", 12)}"
      alive = "#{@prune_prefix}-#{String.duplicate("b", 12)}"
      on_exit(fn -> System.cmd("docker", ["rm", "-f", dead, alive], stderr_to_stdout: true) end)

      # `create` never starts the container, so it sits in "created" — one of the
      # states we treat as finished. `sleep` rather than postgres keeps the running
      # one cheap; only its name and state matter here.
      assert {_, 0} = System.cmd("docker", ["create", "--name", dead, image(), "true"])
      assert {_, 0} = System.cmd("docker", ["run", "-d", "--name", alive, image(), "sleep", "300"])

      assert Docker.dead_containers(@prune_prefix) == [dead]
    end
  end

  defp image, do: Env.get_binary("POSTGRES_IMAGE", "supabase/postgres:17.6.1.166")

  describe "container_prefix/0 and container_name/0" do
    test "the first run on a machine names containers as it always did" do
      put_run_tag("")

      assert Docker.container_prefix() == "realtime-test"
      assert Docker.container_name() =~ ~r"^realtime-test-.{12}$"
    end

    test "a second run puts its endpoint port in the name" do
      put_run_tag("_port4003")

      assert Docker.container_prefix() == "realtime-test_port4003"
      assert Docker.container_name() =~ ~r"^realtime-test_port4003-.{12}$"
    end

    test "a run named by TENANT or TEST_RUN uses that name" do
      put_run_tag("_pr_1234")

      assert Docker.container_prefix() == "realtime-test_pr_1234"
      assert Docker.own_container?("realtime-test_pr_1234-" <> @suffix)
    end
  end

  describe "own_container?/1" do
    test "ignores containers from another run" do
      put_run_tag("")

      assert Docker.own_container?("realtime-test-" <> @suffix)
      refute Docker.own_container?("realtime-test_port4003-" <> @suffix)
      refute Docker.own_container?("some-other-container")
    end
  end

  describe "abandoned_container?/1" do
    test "false while the owning run still holds its port" do
      refute Docker.abandoned_container?("realtime-test_port#{TestEnv.http_port()}-#{@suffix}")
    end

    test "true once that port is free" do
      assert Docker.abandoned_container?("realtime-test_port#{Env.unused_port()}-#{@suffix}")
    end

    test "false for an untagged container, which belongs to whoever holds the default port" do
      refute Docker.abandoned_container?("realtime-test-#{@suffix}")
    end

    test "false for a named run, whose tag says nothing about whether it is still going" do
      refute Docker.abandoned_container?("realtime-test_pr_1234-#{@suffix}")
    end

    test "false for a run named after digits, which is a name and not a port" do
      refute Docker.abandoned_container?("realtime-test_#{Env.unused_port()}-#{@suffix}")
    end

    test "false for a name that only reads like a tagged one" do
      refute Docker.abandoned_container?("realtime-test_port4003-tooshort")
      refute Docker.abandoned_container?("some-other-container")
    end
  end
end
