defmodule Supavisor.JITDockerComposeCase do
  @moduledoc """
  Sets up and manages lifecycle of various Docker containers
  required by an integration test.
  """

  use ExUnit.CaseTemplate

  require Logger

  @project_root Path.expand("../..", __DIR__)
  @cert_dir Path.join(@project_root, "priv/jit/postgres/certs")

  using do
    quote do
      import Supavisor.JITDockerComposeCase
    end
  end

  setup_all do
    # Generate certificates if they don't exist
    ensure_certificates()

    # Start docker compose services
    start_docker_compose()

    # Wait for services to be healthy
    wait_for_services()

    on_exit(fn ->
      nil
      stop_docker_compose()
      cleanup_certificates()
    end)

    :ok
  end

  defp ensure_certificates do
    ca_cert = Path.join(@cert_dir, "ca.crt")

    unless File.exists?(ca_cert) do
      Logger.info("Generating test certificates")

      {output, exit_code} =
        System.cmd("#{@cert_dir}/generate_test_certs.sh", [@cert_dir])

      if exit_code != 0 do
        raise "Failed to generate certificates: #{output}"
      end

      Logger.info("Certificates generated")
    end
  end

  defp cleanup_certificates do
    Logger.info("Removing test certificates from #{@cert_dir}/")

    if File.dir?(@cert_dir) do
      [
        @cert_dir <> "/*.key",
        @cert_dir <> "/*.crt",
        @cert_dir <> "/*.csr",
        @cert_dir <> "/*.srl",
        @cert_dir <> "/*.ext"
      ]
      |> Enum.flat_map(&Path.wildcard/1)
      |> Enum.each(&File.rm!/1)

      Logger.info("Certificates removed successfully")
    else
      Logger.warning("No certificates directory found at #{@cert_dir}")
    end
  end

  def start_docker_compose do
    Logger.info("Starting Docker Compose services")

    {output, exit_code} =
      System.cmd(
        "docker-compose",
        ["-p", "supavisor-jit", "-f", "docker-compose.jit.yml", "up", "-d"],
        stderr_to_stdout: true,
        cd: @project_root
      )

    if exit_code != 0 do
      raise "Failed to start Docker Compose: #{output}"
    end

    Logger.info("Docker Compose services started")
  end

  def stop_docker_compose do
    Logger.info("Stopping Docker Compose services")

    System.cmd(
      "docker-compose",
      ["-p", "supavisor-jit", "-f", "docker-compose.jit.yml", "down", "-v"],
      stderr_to_stdout: true,
      cd: @project_root
    )

    Logger.info("Docker Compose services stopped")
  end

  def wait_for_services(max_attempts \\ 30, delay_ms \\ 1000) do
    Logger.info("Waiting for services to be ready")

    Enum.reduce_while(1..max_attempts, nil, fn attempt, _acc ->
      case check_service_health() do
        :ok ->
          Logger.info("All services are ready")
          {:halt, :ok}

        {:error, reason} ->
          if attempt == max_attempts do
            raise "Services failed to start after #{max_attempts} attempts: #{reason}"
          else
            Logger.info("Attempt #{attempt}/#{max_attempts}: Services not ready yet")
            Process.sleep(delay_ms)
            {:cont, nil}
          end
      end
    end)
  end

  defp check_postgres_health do
    {_output, exit_code} =
      System.cmd(
        "docker-compose",
        ["-f", "docker-compose.jit.yml", "exec", "-T", "db", "pg_isready", "-U", "user"],
        stderr_to_stdout: true,
        cd: @project_root
      )

    if exit_code == 0 do
      :ok
    else
      {:error, "pg_isready returned non-zero"}
    end
  end

  defp check_service_health do
    services = [
      {"API Service", &check_api_health/0},
      {"PostgreSQL", &check_postgres_health/0}
    ]

    results =
      Enum.map(services, fn {name, check_fn} ->
        case check_fn.() do
          :ok -> {:ok, name}
          {:error, reason} -> {:error, "#{name}: #{reason}"}
        end
      end)

    case Enum.find(results, fn result -> match?({:error, _}, result) end) do
      nil -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  defp check_api_health do
    case Req.get("http://localhost:8080/health", receive_timeout: 5000, retry: false) do
      {:ok, %Req.Response{status: status}} when status in 200..299 ->
        :ok

      {:ok, %Req.Response{status: status}} ->
        {:error, "returned status #{status}"}

      {:error, exception} ->
        {:error, Exception.message(exception)}
    end
  end

  def api_client do
    Req.new(
      base_url: "http://localhost:8080",
      headers: [{"content-type", "application/json"}]
    )
  end

  def api_request(method, path, opts \\ []) do
    client = api_client()

    case method do
      :get -> Req.get(client, Keyword.merge([url: path, retry: false], opts))
      :post -> Req.post(client, Keyword.merge([url: path, retry: false], opts))
      :put -> Req.put(client, Keyword.merge([url: path, retry: false], opts))
      :delete -> Req.delete(client, Keyword.merge([url: path, retry: false], opts))
    end
  end
end
