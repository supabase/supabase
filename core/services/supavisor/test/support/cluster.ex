defmodule Supavisor.Support.Cluster do
  @moduledoc """
  This module provides functionality to help handle distributive mode for testing.
  """

  defmodule PortConfig do
    @moduledoc """
    Configuration for ports used by a peer node in tests.
    """
    defstruct proxy_port_transaction: 7655,
              proxy_port_session: 7656,
              proxy_port: 7657,
              session_proxy_ports: [13_100, 13_101, 13_102, 13_103],
              transaction_proxy_ports: [13_104, 13_105, 13_106, 13_107]

    @type t :: %__MODULE__{
            proxy_port_transaction: pos_integer(),
            proxy_port_session: pos_integer(),
            proxy_port: pos_integer(),
            session_proxy_ports: [pos_integer()],
            transaction_proxy_ports: [pos_integer()]
          }
  end

  def start_node(name \\ :peer.random_name(), port_config \\ %PortConfig{}) do
    start_peer_node(name, clustered: true, port_config: port_config)
  end

  def start_node_unclustered(name \\ :peer.random_name(), port_config \\ %PortConfig{}) do
    start_peer_node(name, clustered: false, port_config: port_config)
  end

  defp start_peer_node(name, opts) do
    clustered = Keyword.get(opts, :clustered, true)
    port_config = Keyword.get(opts, :port_config, %PortConfig{})

    {:ok, pid, node} = create_peer(name)
    setup_peer_logging(pid)
    apply_peer_config(pid, clustered, port_config)
    :peer.call(pid, Application, :ensure_all_started, [:supavisor])

    {:ok, pid, node}
  end

  defp create_peer(name) do
    result =
      ExUnit.Callbacks.start_supervised(%{
        id: {:peer, name},
        start:
          {:peer, :start_link,
           [
             %{
               name: name,
               host: ~c"127.0.0.1",
               longnames: true,
               connection: :standard_io
             }
           ]}
      })

    case result do
      {:ok, pid, _node} = success ->
        ExUnit.Callbacks.on_exit(fn ->
          if Process.alive?(pid) do
            :peer.stop(pid)
          end
        end)

        success

      error ->
        error
    end
  end

  defp setup_peer_logging(pid) do
    :peer.call(pid, :logger, :add_primary_filter, [
      :sasl_filter,
      {&:logger_filters.domain/2, {:stop, :sub, [:otp, :sasl]}}
    ])

    :peer.call(pid, :logger, :set_primary_config, [:level, :all])
    true = :peer.call(pid, :code, :set_path, [:code.get_path()])
  end

  defp apply_peer_config(pid, clustered, port_config) do
    for {app_name, _, _} <- Application.loaded_applications() do
      for {key, val} <- Application.get_all_env(app_name) do
        new_val = transform_config_value({app_name, key}, val, clustered, port_config)
        :peer.call(pid, Application, :put_env, [app_name, key, new_val])
      end
    end
  end

  defp transform_config_value(
         {:supavisor, :proxy_port_transaction},
         _val,
         _clustered,
         %PortConfig{proxy_port_transaction: port}
       ) do
    port
  end

  defp transform_config_value(
         {:supavisor, :proxy_port_session},
         _val,
         _clustered,
         %PortConfig{proxy_port_session: port}
       ) do
    port
  end

  defp transform_config_value(
         {:supavisor, :proxy_port},
         _val,
         _clustered,
         %PortConfig{proxy_port: port}
       ) do
    port
  end

  defp transform_config_value(
         {:supavisor, SupavisorWeb.Endpoint},
         val,
         _clustered,
         _port_config
       ) do
    put_in(val[:http], ip: {127, 0, 0, 1}, port: 0)
  end

  defp transform_config_value({:supavisor, :region}, _val, _clustered, _port_config) do
    "usa"
  end

  defp transform_config_value(
         {:supavisor, :availability_zone},
         _val,
         _clustered,
         _port_config
       ) do
    "ap-southeast-1c"
  end

  defp transform_config_value(
         {:supavisor, :session_proxy_ports},
         _val,
         _clustered,
         %PortConfig{session_proxy_ports: ports}
       ) do
    ports
  end

  defp transform_config_value(
         {:supavisor, :transaction_proxy_ports},
         _val,
         _clustered,
         %PortConfig{transaction_proxy_ports: ports}
       ) do
    ports
  end

  defp transform_config_value(
         {:libcluster, :topologies},
         _val,
         clustered,
         _port_config
       )
       when not clustered do
    []
  end

  defp transform_config_value({:supavisor, Supavisor.Repo}, val, _clustered, _port_config) do
    Keyword.put(val, :pool, DBConnection.ConnectionPool)
  end

  defp transform_config_value(_key, val, _clustered, _port_config) do
    val
  end
end
