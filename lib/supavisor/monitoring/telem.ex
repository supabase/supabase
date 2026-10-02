defmodule Supavisor.Monitoring.Telem do
  @moduledoc false

  require Logger
  require Supavisor

  @disabled Application.compile_env(:supavisor, :metrics_disabled, false)

  if @disabled do
    defp telemetry_execute(_name, _measurements, _meta), do: :ok
  else
    defp telemetry_execute(event_name, measurements, metadata) do
      :telemetry.execute(event_name, measurements, metadata)
    end
  end

  @spec network_usage(:client | :db, Supavisor.sock(), Supavisor.id(), map()) ::
          {:ok | :error, map()}
  if @disabled do
    def network_usage(_type, _sock, _id, _stats), do: {:ok, %{recv_oct: 0, send_oct: 0}}
  else
    def network_usage(type, {mod, socket}, Supavisor.id() = id, stats) do
      mod = if mod == :ssl, do: :ssl, else: :inet

      case mod.getstat(socket, [:recv_oct, :send_oct]) do
        {:ok, [{:recv_oct, recv_oct}, {:send_oct, send_oct}]} ->
          stats = %{
            send_oct: send_oct - Map.get(stats, :send_oct, 0),
            recv_oct: recv_oct - Map.get(stats, :recv_oct, 0)
          }

          :telemetry.execute(
            [:supavisor, type, :network, :stat],
            stats,
            id_to_tags(id)
          )

          {:ok, %{recv_oct: recv_oct, send_oct: send_oct}}

        {:error, reason} ->
          Logger.error("Failed to get socket stats: #{inspect(reason)}")
          {:error, stats}
      end
    end
  end

  @spec pool_checkout_time(integer(), Supavisor.id(), :local | :remote) :: :ok | nil
  def pool_checkout_time(time, Supavisor.id() = id, same_box) do
    if time > 1_000_000 do
      Logger.warning(
        "Pool checkout took over 1s (#{div(time, 1_000)}ms), consider increasing pool size or checking for slow queries"
      )
    end

    telemetry_execute(
      [:supavisor, :pool, :checkout, :stop, same_box],
      %{duration: time},
      id_to_tags(id)
    )
  end

  @spec client_query_time(integer(), Supavisor.id(), boolean()) :: :ok | nil
  def client_query_time(start, Supavisor.id() = id, proxy) do
    telemetry_execute(
      [:supavisor, :client, :query, :stop],
      %{duration: System.monotonic_time() - start},
      Map.put(id_to_tags(id), :proxy, proxy)
    )
  end

  @spec client_connection_time(integer(), Supavisor.id()) :: :ok | nil
  def client_connection_time(start, Supavisor.id() = id) do
    telemetry_execute(
      [:supavisor, :client, :connection, :stop],
      %{duration: System.monotonic_time() - start},
      id_to_tags(id)
    )
  end

  @spec client_join(:ok | :fail, Supavisor.id() | any()) :: :ok | nil
  def client_join(status, Supavisor.id() = id) do
    telemetry_execute(
      [:supavisor, :client, :joins, status],
      %{},
      id_to_tags(id)
    )
  end

  def client_join(_status, id) do
    Logger.debug("client_join is called with a mismatched id: #{Supavisor.inspect_id(id)}")
  end

  @spec client_admission(:admitted | :rejected, Supavisor.id() | any()) :: :ok | nil
  def client_admission(status, Supavisor.id() = id) do
    telemetry_execute(
      [:supavisor, :client, :admission, status],
      %{},
      id_to_tags(id)
    )
  end

  def client_admission(_status, id) do
    Logger.debug("client_admission is called with a mismatched id: #{Supavisor.inspect_id(id)}")
  end

  @spec handler_action(
          :client_handler | :db_handler,
          :started | :stopped | :db_connection,
          Supavisor.id()
        ) :: :ok | nil
  def handler_action(handler, action, Supavisor.id() = id) do
    telemetry_execute(
      [:supavisor, handler, action, :all],
      %{},
      id_to_tags(id)
    )
  end

  def handler_action(handler, action, id) do
    Logger.debug(
      "handler_action is called with a mismatched #{inspect(handler)} #{inspect(action)} #{inspect(id)}"
    )
  end

  def prepared_statements_evicted(count, Supavisor.id() = id) do
    telemetry_execute(
      [:supavisor, :db_handler, :prepared_statements, :evicted],
      %{count: count},
      id_to_tags(id)
    )
  end

  @spec id_to_tags(Supavisor.id()) :: map()
  defp id_to_tags(
         Supavisor.id(
           type: type,
           tenant: tenant,
           user: user,
           mode: mode,
           db: db_name,
           search_path: search_path
         )
       ) do
    %{
      type: type,
      tenant: tenant,
      user: user,
      mode: mode,
      db_name: db_name,
      search_path: search_path
    }
  end
end
