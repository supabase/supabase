defmodule Realtime.Rpc do
  @moduledoc """
  RPC module for Realtime with the intent of standardizing the RPC interface and collect telemetry
  """
  use Realtime.Logs
  alias Realtime.Telemetry

  @doc """
  Calls external node using :rpc.call/5 and collects telemetry
  """
  @spec call(atom(), atom(), atom(), any(), keyword()) :: any()
  def call(node, mod, func, args, opts \\ []) do
    timeout = Keyword.get(opts, :timeout, Application.get_env(:realtime, :rpc_timeout))
    {latency, response} = :timer.tc(fn -> :rpc.call(node, mod, func, args, timeout) end)

    Telemetry.execute(
      [:realtime, :rpc],
      %{latency: latency},
      %{mod: mod, func: func, target_node: node, origin_node: node(), mechanism: :rpc, success: nil}
    )

    response
  end

  @doc """
  Calls external node using :erpc.call/5 and collects telemetry
  """
  @spec enhanced_call(atom(), atom(), atom(), any(), keyword()) ::
          {:ok, any()} | {:error, :rpc_error, term()} | {:error, term()}
  def enhanced_call(node, mod, func, args \\ [], opts \\ []) do
    timeout = Keyword.get(opts, :timeout, Application.get_env(:realtime, :rpc_timeout))
    tenant_id = Keyword.get(opts, :tenant_id)

    try do
      with {latency, response} <- :timer.tc(fn -> :erpc.call(node, mod, func, args, timeout) end) do
        case response do
          {:ok, _} ->
            Telemetry.execute(
              [:realtime, :rpc],
              %{latency: latency},
              %{
                mod: mod,
                func: func,
                target_node: node,
                origin_node: node(),
                success: true,
                mechanism: :erpc
              }
            )

            response

          error ->
            Telemetry.execute(
              [:realtime, :rpc],
              %{latency: latency},
              %{
                mod: mod,
                func: func,
                target_node: node,
                origin_node: node(),
                success: false,
                mechanism: :erpc
              }
            )

            error
        end
      end
    catch
      _, reason ->
        reason =
          case reason do
            {_, reason} -> reason
            {_, reason, _} -> reason
          end

        Telemetry.execute(
          [:realtime, :rpc],
          %{latency: 0},
          %{
            mod: mod,
            func: func,
            target_node: node,
            origin_node: node(),
            success: false,
            mechanism: :erpc
          }
        )

        log_error(
          "ErrorOnRpcCall",
          %{target: node, mod: mod, func: func, error: reason},
          project: tenant_id,
          external_id: tenant_id
        )

        {:error, :rpc_error, reason}
    end
  end
end
