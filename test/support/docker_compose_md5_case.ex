defmodule Supavisor.DockerComposeMd5Case do
  @moduledoc """
  Sets up and manages lifecycle of a PostgreSQL container configured
  for MD5 authentication, used to test MD5 rejection behavior.
  """

  use ExUnit.CaseTemplate

  @compose_dir Path.expand("../integration/md5-rejection", __DIR__)

  setup_all do
    start_docker_compose()
    wait_for_postgres()

    on_exit(fn ->
      stop_docker_compose()
    end)

    :ok
  end

  defp start_docker_compose do
    IO.puts("Starting MD5 Docker Compose services...")

    {output, exit_code} =
      System.cmd("docker-compose", ["up", "-d"],
        stderr_to_stdout: true,
        cd: @compose_dir
      )

    if exit_code != 0 do
      raise "Failed to start Docker Compose: #{output}"
    end

    IO.puts("MD5 Docker Compose services started")
  end

  defp stop_docker_compose do
    IO.puts("Stopping MD5 Docker Compose services...")

    System.cmd("docker-compose", ["down", "-v"],
      stderr_to_stdout: true,
      cd: @compose_dir
    )

    IO.puts("MD5 Docker Compose services stopped")
  end

  defp wait_for_postgres(max_attempts \\ 30, delay_ms \\ 1000) do
    IO.puts("Waiting for MD5 PostgreSQL to be ready...")

    Enum.reduce_while(1..max_attempts, nil, fn attempt, _acc ->
      {_output, exit_code} =
        System.cmd(
          "docker-compose",
          ["exec", "-T", "db", "pg_isready", "-U", "postgres"],
          stderr_to_stdout: true,
          cd: @compose_dir
        )

      if exit_code == 0 do
        IO.puts("MD5 PostgreSQL is ready!")
        {:halt, :ok}
      else
        if attempt == max_attempts do
          raise "MD5 PostgreSQL failed to start after #{max_attempts} attempts"
        else
          IO.puts("Attempt #{attempt}/#{max_attempts}: PostgreSQL not ready yet...")
          Process.sleep(delay_ms)
          {:cont, nil}
        end
      end
    end)
  end
end
