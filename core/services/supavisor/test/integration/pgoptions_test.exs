defmodule Supavisor.Integration.PgoptionsTest do
  use Supavisor.DataCase, async: false

  @tenant "proxy_tenant_pgoptions"

  @moduletag integration: true

  @psql System.find_executable("psql")
  if is_nil(@psql) do
    @moduletag skip: "psql executable is required for PGOPTIONS integration checks"
  end

  setup do
    repo_conf = Application.fetch_env!(:supavisor, Repo)
    port = Application.fetch_env!(:supavisor, :proxy_port_transaction)

    {:ok,
     %{
       psql: @psql,
       port: port,
       db: repo_conf[:database],
       user: "#{repo_conf[:username]}.#{@tenant}"
     }}
  end

  test "PGOPTIONS --search_path=schemaA,schemaB", ctx do
    result =
      run_psql!(ctx, "SHOW search_path;", pgoptions: "--search_path=schemaA,schemaB")

    assert result == "schemaA,schemaB"
  end

  test "PGOPTIONS -c search_path=custom-schema", ctx do
    result =
      run_psql!(ctx, "SHOW search_path;", pgoptions: "-c search_path=custom-schema")

    assert result == "custom-schema"
  end

  test "PGOPTIONS --search_path schema with whitespaces", ctx do
    result =
      run_psql!(ctx, "SHOW search_path;", pgoptions: "--search_path=schemaA,\\ schemaB")

    assert result == "schemaA, schemaB"
  end

  test "PGOPTIONS does not allow injecting additional -c flags after the --search_path", ctx do
    default_work_mem = run_psql!(ctx, "SHOW work_mem;")

    work_mem =
      run_psql!(ctx, "SHOW work_mem;", pgoptions: "--search_path=public -c work_mem=2047GB")

    assert work_mem == default_work_mem
    assert work_mem != "2047GB"
  end

  test "PGOPTIONS --search_path invalid syntax terminates with error", ctx do
    {output, status} =
      run_psql(ctx, "SHOW search_path;", pgoptions: "--search_path=,--invalid-syntax--;(")

    assert status != 0
    assert output =~ "invalid value for parameter"
  end

  defp run_psql!(ctx, sql, opts \\ []) do
    {output, status} = run_psql(ctx, sql, opts)
    assert status == 0, output

    output
    |> String.trim()
    |> String.split("\n")
    |> List.last()
    |> String.trim()
  end

  defp run_psql(ctx, sql, opts) do
    db_conf = Application.fetch_env!(:supavisor, Repo)

    env =
      [
        {"PGHOST", "127.0.0.1"},
        {"PGPORT", Integer.to_string(ctx.port)},
        {"PGDATABASE", ctx.db},
        {"PGUSER", ctx.user},
        {"PGPASSWORD", db_conf[:password]},
        {"PGSSLMODE", "disable"}
      ]
      |> maybe_put_pgoptions(opts[:pgoptions])

    args = [
      "--no-psqlrc",
      "--set",
      "ON_ERROR_STOP=on",
      "--tuples-only",
      "-A",
      "-c",
      sql
    ]

    System.cmd(ctx.psql, args, env: env, stderr_to_stdout: true)
  end

  defp maybe_put_pgoptions(env, nil), do: env
  defp maybe_put_pgoptions(env, ""), do: env
  defp maybe_put_pgoptions(env, value), do: [{"PGOPTIONS", value} | env]
end
