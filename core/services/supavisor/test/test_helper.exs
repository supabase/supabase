{:ok, _} = Node.start(:"primary@127.0.0.1", :longnames)

# Cachex records the node name at startup for its internal routing. The
# application started Cachex on nonode@nohost, so after Node.start changes
# the identity, Cachex routes all operations to the stale node name via RPC,
# which fails with {:error, :nodedown}. Restart it to pick up the new name.
Supervisor.terminate_child(Supavisor.Supervisor, Cachex)
Supervisor.restart_child(Supavisor.Supervisor, Cachex)

logs =
  case System.get_env("TEST_LOGS", "all") do
    level when level in ~w[all true] ->
      true

    level when level in ~w[emergency alert critical error warning notice info debug] ->
      [level: String.to_existing_atom(level)]

    "warn" ->
      [level: :warning]

    level when level in ~w[none disabled false] ->
      false
  end

linux_excludes =
  if :os.type() != {:unix, :linux}, do: [linux: true], else: []

ExUnit.start(
  capture_log: logs,
  exclude:
    [
      flaky: true,
      integration: true,
      integration_docker: true
    ] ++ linux_excludes
)

Ecto.Adapters.SQL.Sandbox.mode(Supavisor.Repo, :auto)
