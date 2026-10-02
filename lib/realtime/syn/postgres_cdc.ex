defmodule Realtime.Syn.PostgresCdc do
  @moduledoc """
  Sharded `:syn` scopes for the Postgres CDC supervision trees.

  Spreading tenants over several scopes keeps a single `:syn` table from holding every
  registration. The shard comes from the tenant id, so every node resolves the same scope for a
  given tenant.
  """

  @doc """
  Scope holding the CDC tree registration for `tenant_id`.
  """
  @spec scope(String.t()) :: atom()
  def scope(tenant_id) do
    shards = Application.fetch_env!(:realtime, :postgres_cdc_scope_shards)
    shard = :erlang.phash2(tenant_id, shards)
    :"realtime_postgres_cdc_#{shard}"
  end

  @doc """
  Every scope, so they can all be started and handed to `:syn` at boot.
  """
  @spec scopes() :: [atom()]
  def scopes do
    shards = Application.fetch_env!(:realtime, :postgres_cdc_scope_shards)
    Enum.map(0..(shards - 1), fn shard -> :"realtime_postgres_cdc_#{shard}" end)
  end

  @doc """
  Prefix shared by the scope atoms and `syn_topic/1`, which `Realtime.SynHandler` matches on to
  tell Postgres CDC registry events from the rest.
  """
  @spec syn_topic_prefix() :: String.t()
  def syn_topic_prefix, do: "realtime_postgres_cdc_"

  @doc """
  PubSub topic carrying the `ready` event, whose payload holds the tree's own pids.

  Broadcast locally on every node, since `:syn` fires its callbacks cluster-wide.
  """
  @spec syn_topic(String.t()) :: String.t()
  def syn_topic(tenant_id), do: "#{syn_topic_prefix()}#{tenant_id}"

  @doc """
  PubSub topic where channels learn the tenant's CDC tree is gone.
  """
  @spec down_topic(String.t()) :: String.t()
  def down_topic(tenant_id), do: "#{syn_topic(tenant_id)}:down"

  @doc """
  Event saying the tenant's CDC tree is gone, so its subscribers must re-subscribe.
  """
  @spec down_event() :: String.t()
  def down_event, do: "postgres_cdc_down"
end
