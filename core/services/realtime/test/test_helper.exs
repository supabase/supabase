start_time = :os.system_time(:millisecond)

alias Realtime.Api

# USE_EXTERNAL_TENANT_DB=true swaps per-test docker containers for pre-existing servers listed
# in EXTERNAL_TENANT_DB_PORTS. Resolved once here; the rest read Backend.current().
backend = TestTenantDb.Backend.resolve!()
max_cases = backend.max_cases()

repo_config = Application.fetch_env!(:realtime, Realtime.Repo)

# Probe a tenant database, not the realtime one: TENANT_DB_IMAGE can differ from POSTGRES_IMAGE.
{:ok, pg_conn} =
  Postgrex.start_link(
    hostname: repo_config[:hostname],
    port:
      case backend.capability_probe_port() do
        :realtime_db -> repo_config[:port] || 5432
        port -> port
      end,
    username: repo_config[:username],
    password: repo_config[:password],
    database: "postgres"
  )

%{rows: [[pg_version_num]]} = Postgrex.query!(pg_conn, "SELECT current_setting('server_version_num')::int")

%{rows: [[has_supautils_realtime_grants]]} =
  Postgrex.query!(
    pg_conn,
    "SELECT current_setting('supautils.policy_grants', true) LIKE '%realtime.messages%' AND current_setting('supautils.policy_grants', true) LIKE '%realtime.subscription%'"
  )

%{rows: [[orioledb?]]} =
  Postgrex.query!(pg_conn, "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'orioledb')")

# Postgrex leaves nothing in pg_prepared_statements for a query without :cache_statement
# but Multigres re-prepares everything it forwards under a name of its own,
# so this probe serves to find if it's behind a pooler or has direct connection.
probe_marker = "direct_connection_probe_#{System.unique_integer([:positive])}"
Postgrex.query!(pg_conn, "SELECT 1 AS #{probe_marker}", [])

%{rows: [[direct_connection?]]} =
  Postgrex.query!(
    pg_conn,
    "SELECT count(*) = 0 FROM pg_prepared_statements WHERE statement LIKE $1",
    ["%#{probe_marker}%"]
  )

# `realtime.broadcast_changes(..., NEW record, OLD record, ...)` (introduced in commit 2922658c) called from a trigger via `PERFORM` fails on PG <= 14.5
requires_pg_140006 = if pg_version_num < 140_006, do: :requires_pg_140006

requires_pg_150000 = if pg_version_num < 150_000, do: :requires_pg_150000

# Restriction assertions on the postgres role only when supautils.policy_grants includes realtime.messages and realtime.subscription (supabase/postgres >= 15.14.1.018)
requires_supautils_policy_grants = if !has_supautils_realtime_grants, do: :requires_supautils_policy_grants
requires_no_supautils_policy_grants = if has_supautils_realtime_grants, do: :requires_no_supautils_policy_grants

skip_orioledb = if orioledb?, do: :skip_orioledb
requires_orioledb = if !orioledb?, do: :requires_orioledb

# Only the docker backend can drop and recreate a tenant database mid-run.
requires_docker_backend = if backend != TestTenantDb.Backend.Docker, do: :requires_docker_backend

requires_direct_connection = if !direct_connection?, do: :requires_direct_connection

%{rows: [[synchronous_standby?]]} =
  Postgrex.query!(pg_conn, "SELECT current_setting('synchronous_standby_names', true) <> ''")

requires_synchronous_standby = if !synchronous_standby?, do: :requires_synchronous_standby

exclude =
  Enum.reject(
    [
      :failing,
      requires_pg_140006,
      requires_pg_150000,
      requires_supautils_policy_grants,
      requires_no_supautils_policy_grants,
      skip_orioledb,
      requires_orioledb,
      requires_docker_backend,
      requires_direct_connection,
      requires_synchronous_standby
    ],
    &is_nil/1
  )

ExUnit.start(
  exclude: exclude,
  max_cases: max_cases,
  capture_log: Realtime.Env.get_boolean("CAPTURE_LOG", true)
)

max_cases = ExUnit.configuration()[:max_cases]

backend.prepare!()

{:ok, _pid} = TestTenantDb.start_link(max_cases)

# after_suite callbacks run in reverse registration order, so teardown is registered
# first to make it run last — `report_unhealthy_checkouts/1` must be run when the pool
# still exists.
ExUnit.after_suite(&TestTenantDb.shutdown/1)

# A wedged tenant database is recovered from silently (the worker is replaced), so
# the rate has to be reported explicitly or it disappears from CI entirely.
ExUnit.after_suite(&TestTenantDb.report_unhealthy_checkouts/1)

# A wait that succeeded on its 48th of 50 attempts is a flake that has not happened yet, and a
# green run says nothing about it. `[:wait_for_it, :wait, :stop]` reports how many evaluations a
# wait actually took, so with WAIT_MARGIN_REPORT=true every wait that timed out or burned more
# than half its budget is written to wait-margin.jsonl for the flaky digest to pick up.
#
# Off by default: it is a diagnostic for CI and for chasing a specific flake, not something every
# local `mix test` should pay for.
if Realtime.Env.get_boolean("WAIT_MARGIN_REPORT", false) do
  try do
    # Appended to, never truncated: `mix test --failed` reruns only the failures, and wiping
    # the file here would throw away everything the full run had already written.
    path = System.get_env("WAIT_MARGIN_REPORT_PATH", "wait-margin.jsonl")
    {:ok, io} = File.open(path, [:append, :utf8])

    # Serialised through one agent: waits run in every test process at once, and interleaved
    # appends from 4+ schedulers would tear the lines apart.
    {:ok, writer} = Agent.start_link(fn -> io end)

    :telemetry.attach(
      "wait-for-it-margin",
      [:wait_for_it, :wait, :stop],
      fn _event, %{duration: duration, evaluations: evaluations}, meta, _config ->
        try do
          # `refute_eventually` and `assert_always` pass *by* timing out, so their timeouts are
          # not news. WaitForIt tags them, which is the only way to tell them apart from a real one.
          expected_timeout? = meta.wait_context[:construct] in [:refute_eventually, :assert_always]

          budget =
            case {meta.timeout, meta.interval} do
              {:infinity, _} -> nil
              {timeout, interval} when is_integer(interval) and interval > 0 -> div(timeout, interval)
              _ -> nil
            end

          over_budget? = is_integer(budget) and budget > 0 and evaluations > div(budget, 2)
          # A plain `:timeout` is not counted on its own: it already shows up in the flaky
          # report as a failure (or a failure-then-pass on retry), so counting it here too
          # would double it up. Only a wait that ran well past half its budget adds new signal.
          report? = not expected_timeout? and over_budget?

          if report? do
            entry =
              %{
                result: meta.result,
                wait_type: meta.wait_type,
                construct: meta.wait_context && meta.wait_context[:construct],
                evaluations: evaluations,
                budget: budget,
                timeout: meta.timeout,
                duration_ms: System.convert_time_unit(duration, :native, :millisecond),
                # `until/2` is a plain function and carries no caller env.
                file: meta.env && Path.relative_to_cwd(meta.env.file),
                line: meta.env && meta.env.line
              }
              |> Jason.encode!()

            Agent.cast(writer, fn io ->
              IO.write(io, entry <> "\n")
              io
            end)
          end
        rescue
          # A diagnostic must never take a real test failure down with it.
          error -> IO.warn("WAIT_MARGIN_REPORT telemetry handler failed: #{Exception.message(error)}")
        end
      end,
      nil
    )

    ExUnit.after_suite(fn _ ->
      Agent.get(writer, & &1, :infinity)
      File.close(io)
    end)
  rescue
    error -> IO.warn("failed to set up WAIT_MARGIN_REPORT: #{Exception.message(error)}")
  end
end

for tenant <- Api.list_tenants(), do: Api.delete_tenant_by_external_id(tenant.external_id)

Ecto.Adapters.SQL.Sandbox.mode(Realtime.Repo, :manual)

Mimic.copy(:syn)
Mimic.copy(Cachex)
Mimic.copy(Ecto.Migrator)
Mimic.copy(Extensions.PostgresCdcRls)
Mimic.copy(Extensions.PostgresCdcRls.Replications)
Mimic.copy(Extensions.PostgresCdcRls.Subscriptions)
Mimic.copy(Forum.Muster)
Mimic.copy(Realtime.Database)
Mimic.copy(Realtime.Messages)
Mimic.copy(Realtime.FeatureFlags)
Mimic.copy(Realtime.GenCounter)
Mimic.copy(Realtime.GenRpc)
Mimic.copy(Realtime.Nodes)
Mimic.copy(Realtime.Repo)
Mimic.copy(Realtime.Repo.Replica)
Mimic.copy(Realtime.RateCounter)
Mimic.copy(Realtime.Tenants.Authorization)
Mimic.copy(Realtime.Tenants.Cache)
Mimic.copy(Realtime.Tenants.Repo)
Mimic.copy(Realtime.Tenants.Connect)
Mimic.copy(Realtime.Tenants.Migrations)
Mimic.copy(Realtime.Tenants.Rebalancer)
Mimic.copy(Realtime.Tenants.ReplicationConnection)
Mimic.copy(Realtime.UsersCounter)
Mimic.copy(RealtimeWeb.ChannelsAuthorization)
Mimic.copy(RealtimeWeb.Endpoint)
Mimic.copy(RealtimeWeb.JwtVerification)
Mimic.copy(RealtimeWeb.TenantBroadcaster)
Mimic.copy(NimbleZTA.Cloudflare)

self_node = TestEnv.node_name()
^self_node = node()
[{_pid, [node: ^self_node]}] = :syn.members(RegionNodes, Realtime.Nodes.region())

end_time = :os.system_time(:millisecond)
IO.puts("[test_helper.exs] Time to start tests: #{end_time - start_time} ms")
