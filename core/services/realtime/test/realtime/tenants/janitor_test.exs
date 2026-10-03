defmodule Realtime.Tenants.JanitorTest do
  # async: false due to the fact that we're checking ets tables that can be modified by other tests
  use Realtime.DataCase, async: false

  import ExUnit.CaptureLog

  alias Realtime.Api.Message
  alias Realtime.Database
  alias Realtime.Tenants.Janitor
  alias Realtime.Tenants.Connect
  alias Realtime.Tenants.Repo

  setup do
    :ets.delete_all_objects(Connect)
    timer = Application.get_env(:realtime, :janitor_schedule_timer)

    Application.put_env(:realtime, :janitor_schedule_timer, 200)
    Application.put_env(:realtime, :janitor_schedule_randomize, false)
    Application.put_env(:realtime, :janitor_chunk_size, 2)
    tenant1 = TestTenantDb.checkout_tenant(run_migrations: true)
    tenant2 = TestTenantDb.checkout_tenant(run_migrations: true)

    tenants =
      Enum.map(
        [tenant1, tenant2],
        fn tenant ->
          tenant = Realtime.Repo.preload(tenant, :extensions)
          Connect.lookup_or_start_connection(tenant.external_id)
          assert_eventually Connect.ready?(tenant.external_id), timeout: 5_000, interval: 50
          tenant
        end
      )

    date_start = Date.utc_today() |> Date.add(-10)
    date_end = Date.utc_today()

    Enum.map(tenants, fn tenant ->
      {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)
      create_messages_partitions(conn, date_start, date_end)
    end)

    start_supervised!(
      {Task.Supervisor,
       name: Realtime.Tenants.Janitor.TaskSupervisor, max_children: 5, max_seconds: 500, max_restarts: 1}
    )

    on_exit(fn ->
      Enum.each(tenants, &Connect.shutdown(&1.external_id))
      Enum.each(tenants, &assert_eventually(is_nil(Connect.whereis(&1.external_id)), timeout: 1_000, interval: 10))
      Application.put_env(:realtime, :janitor_schedule_timer, timer)
    end)

    %{tenants: tenants}
  end

  test "cleans messages older than 72 hours and creates partitions from tenants that were active and untracks the user and test tenant is connected",
       %{
         tenants: tenants
       } do
    utc_now = NaiveDateTime.utc_now()
    limit = NaiveDateTime.add(utc_now, -72, :hour)

    messages =
      for days <- -5..0 do
        inserted_at = NaiveDateTime.add(utc_now, days, :day)
        Enum.map(tenants, &message_fixture(&1, %{inserted_at: inserted_at}))
      end
      |> List.flatten()
      |> MapSet.new()

    to_keep =
      messages
      |> Enum.reject(&(NaiveDateTime.compare(NaiveDateTime.beginning_of_day(limit), &1.inserted_at) == :gt))
      |> MapSet.new()

    start_supervised!(Janitor)

    conns =
      Enum.map(tenants, fn tenant ->
        {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)
        conn
      end)

    assert_eventually remaining_messages(conns) == to_keep, timeout: 5_000, interval: 100

    Enum.each(conns, &verify_partitions/1)
    current = remaining_messages(conns)

    assert MapSet.difference(current, to_keep) |> MapSet.size() == 0

    assert :ets.tab2list(Connect) == []
  end

  test "cleans messages older than 72 hours and creates partitions from tenants that were active and untracks the user and test tenant has disconnected",
       %{
         tenants: tenants
       } do
    Connect.shutdown(hd(tenants).external_id)
    assert_eventually is_nil(Connect.whereis(hd(tenants).external_id))

    utc_now = NaiveDateTime.utc_now()
    limit = NaiveDateTime.add(utc_now, -72, :hour)

    messages =
      for days <- -5..0 do
        inserted_at = NaiveDateTime.add(utc_now, days, :day)
        Enum.map(tenants, &message_fixture(&1, %{inserted_at: inserted_at}))
      end
      |> List.flatten()
      |> MapSet.new()

    to_keep =
      messages
      |> Enum.reject(&(NaiveDateTime.compare(NaiveDateTime.beginning_of_day(limit), &1.inserted_at) == :gt))
      |> MapSet.new()

    start_supervised!(Janitor)

    conns =
      Enum.map(tenants, fn tenant ->
        {:ok, conn} = Database.connect(tenant, "realtime_test", :stop)
        conn
      end)

    assert_eventually remaining_messages(conns) == to_keep, timeout: 5_000, interval: 100

    Enum.each(conns, &verify_partitions/1)
    current = remaining_messages(conns)

    assert MapSet.difference(current, to_keep) |> MapSet.size() == 0
    assert :ets.tab2list(Connect) == []
  end

  test "logs error if fails to connect to tenant" do
    extensions = [
      %{
        "type" => "postgres_cdc_rls",
        "settings" => %{
          "db_host" => "127.0.0.1",
          "db_name" => "postgres",
          "db_user" => "supabase_admin",
          "db_password" => "postgres",
          "db_port" => "1111",
          "poll_interval" => 100,
          "poll_max_changes" => 100,
          "poll_max_record_bytes" => 1_048_576,
          "region" => "us-east-1",
          "ssl_enforced" => false
        }
      }
    ]

    tenant = tenant_fixture(%{extensions: extensions})
    # Force add a bad tenant
    :ets.insert(Connect, {tenant.external_id})

    Process.sleep(250)

    janitor = start_supervised!(Janitor)

    assert capture_log(fn ->
             Process.sleep(1000)
           end) =~ "JanitorFailedToDeleteOldMessages"

    assert_eventually :sys.get_state(janitor).tasks == %{}
    assert :ets.tab2list(Connect) == []
  end

  defp verify_partitions(conn) do
    today = Date.utc_today()
    yesterday = Date.add(today, -3)
    future = Date.add(today, 3)
    dates = Date.range(yesterday, future)

    %{rows: rows} =
      Postgrex.query!(
        conn,
        "SELECT tablename from pg_catalog.pg_tables where schemaname = 'realtime' and tablename like 'messages_%'",
        []
      )

    partitions = MapSet.new(rows, fn [name] -> name end)

    expected_names =
      MapSet.new(dates, fn date -> "messages_#{date |> Date.to_iso8601() |> String.replace("-", "_")}" end)

    assert MapSet.equal?(partitions, expected_names)
  end

  defp remaining_messages(conns) do
    conns
    |> Enum.flat_map(fn conn ->
      {:ok, res} = Repo.all(conn, from(m in Message), Message)
      res
    end)
    |> MapSet.new()
  end
end
