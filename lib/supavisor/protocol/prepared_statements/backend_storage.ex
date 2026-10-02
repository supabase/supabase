defmodule Supavisor.Protocol.PreparedStatements.BackendStorage do
  @moduledoc """
  Behaviour for tracking prepared statements registered on a single backend
  connection.

  Implementations differ in how they decide which entries to evict when the
  per-connection limit is reached. The concrete implementation is resolved
  once per db handler via `select/1` based on the tenant + application
  feature flags.

  ## Selecting a strategy

  The `"backend_prepared_statements_storage"` feature flag picks the
  implementation. Tenant flags take precedence over application defaults
  (`config :supavisor, Supavisor.FeatureFlag, %{...}`). Unknown or missing
  values fall back to the default (`Random`).

      %{"backend_prepared_statements_storage" => "lru"}
      %{"backend_prepared_statements_storage" => "random"}
  """

  alias Supavisor.Protocol.PreparedStatements

  @type t() :: struct()
  @type name() :: PreparedStatements.statement_name()

  @callback new() :: t()
  @callback size(t()) :: non_neg_integer()
  @callback member?(t(), name()) :: boolean()
  @callback put(t(), name()) :: t()
  @callback touch(t(), name()) :: t()
  @callback delete(t(), name()) :: t()
  @callback evict(t(), pos_integer()) :: {[name()], t()}

  @flag_key "backend_prepared_statements_storage"

  @strategies %{
    "lru" => __MODULE__.LRU,
    "random" => __MODULE__.Random
  }

  @default __MODULE__.Random

  @doc """
  Returns the registry of available strategy names to implementation modules.
  """
  @spec strategies() :: %{String.t() => module()}
  def strategies, do: @strategies

  @doc """
  Resolves the backend storage implementation for a connection. Falls back to
  the default implementation when the flag is unset or names an unknown
  strategy.
  """
  @spec select(map()) :: module()
  def select(tenant_feature_flags) do
    Map.get(@strategies, fetch_strategy(tenant_feature_flags), @default)
  end

  defp fetch_strategy(tenant_feature_flags) do
    case Map.get(tenant_feature_flags, @flag_key) do
      nil ->
        :supavisor
        |> Application.get_env(Supavisor.FeatureFlag, %{})
        |> Map.get(@flag_key)

      value ->
        value
    end
  end
end
