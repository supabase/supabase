defmodule TestTenantDb.Probe do
  @moduledoc false
  # One definition of "this tenant database is usable": a real connection from the
  # host to the published port, plus a query.
  #
  # Both callers go through here on purpose:
  #
  #   * `TestTenantDb`, per checkout, to decide whether to hand the database to a test
  #   * `TestTenantDb.Backend.Docker.wait_ready!/2`, to decide when a freshly started
  #     container may join the pool

  alias Realtime.Database

  @connect_timeout_ms 2_000
  @deadline_ms 5_000

  @spec settings!(pos_integer()) :: Database.t()
  def settings!(port) do
    {:ok, settings} =
      Database.from_plaintext_settings(
        %{
          "db_host" => "127.0.0.1",
          "db_port" => to_string(port),
          "db_name" => "postgres",
          "db_user" => System.get_env("DB_USER", "supabase_admin"),
          "db_password" => "postgres",
          "ssl_enforced" => false
        },
        "test_tenant_db_probe",
        # Fail fast rather than retry in the background: a probe that keeps
        # reconnecting cannot answer "is this database usable right now".
        :stop
      )

    settings
  end

  @doc "Convenience for callers that check a port once."
  @spec check_port(pos_integer()) :: :ok | {:error, String.t()}
  def check_port(port), do: check(settings!(port))

  @doc """
  One attempt, bounded by @deadline_ms.

  Runs in a `spawn_monitor`'d process, never a linked one. The pool uses
  `backoff_type: :stop`, so a refused connection kills it, and `DBConnection.Watcher`
  answers that by killing whoever started it.
  We want to catch and debug exactly that behavior, so we need to "live".
  """
  @spec check(Database.t()) :: :ok | {:error, String.t()}
  def check(%Database{} = settings) do
    {pid, ref} = spawn_monitor(fn -> exit({:probe_result, connect_and_query(settings)}) end)

    receive do
      {:DOWN, ^ref, :process, ^pid, {:probe_result, result}} ->
        result

      {:DOWN, ^ref, :process, ^pid, :killed} ->
        {:error, "could not connect (probe pool died on its first connection attempt)"}

      {:DOWN, ^ref, :process, ^pid, reason} ->
        {:error, "probe process exited: #{inspect(reason)}"}
    after
      @deadline_ms ->
        Process.exit(pid, :kill)
        receive do: ({:DOWN, ^ref, :process, ^pid, _reason} -> :ok)
        {:error, "did not answer probe within #{@deadline_ms}ms"}
    end
  end

  defp connect_and_query(settings) do
    extra_opts = [connect_timeout: @connect_timeout_ms, queue_interval: @deadline_ms]

    case Database.connect_db(settings, extra_opts) do
      {:ok, conn} ->
        try do
          case Postgrex.query(conn, "SELECT 1", [], timeout: @deadline_ms) do
            {:ok, _result} -> :ok
            {:error, error} -> {:error, Exception.message(error)}
          end
        after
          if Process.alive?(conn), do: GenServer.stop(conn)
        end

      {:error, error} ->
        {:error, "could not connect: #{inspect(error)}"}
    end
  end
end
