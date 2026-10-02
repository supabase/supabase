defmodule Realtime.FeatureFlags.Cache do
  @moduledoc """
  In-process Cachex cache for `Realtime.Api.FeatureFlag` records.

  Cache misses fall through to the database automatically via `Cachex.fetch/3`.
  Both hits and misses are cached: a flag that does not exist is stored as a
  `@not_found` sentinel so that hot-path callers don't hit the database on every
  check for a flag that isn't there. We can't cache a plain `nil`, because
  Cachex treats `nil` as "absent" and re-runs the fallback (the DB read) for it;
  the sentinel is a real value it can store, and `get_flag/1` maps it back to
  `nil` at the boundary. The common create/update path already overwrites the
  sentinel on every node via `global_update_cache/1`.

  Use `global_update_cache/1` after mutations to push the updated struct to all
  cluster nodes. Use `global_invalidate_cache/1` after deletes.
  """

  require Cachex.Spec
  alias Realtime.Api
  alias Realtime.Api.FeatureFlag
  alias Realtime.GenRpc

  # Sentinel for "flag does not exist". Cachex uses `nil` to mean "absent" and
  # would re-run the fallback (the DB read) for a committed `nil`, so we cache a
  # concrete value instead and translate it back to `nil` in get_flag/1.
  @not_found :not_found

  def child_spec(_) do
    tenant_cache_expiration = Application.get_env(:realtime, :tenant_cache_expiration)

    %{
      id: __MODULE__,
      start: {Cachex, :start_link, [__MODULE__, [expiration: Cachex.Spec.expiration(default: tenant_cache_expiration)]]}
    }
  end

  @spec get_flag(String.t()) :: FeatureFlag.t() | nil
  def get_flag(name) do
    case Cachex.fetch(__MODULE__, cache_key(name), fn _key ->
           with %FeatureFlag{} = flag <- Api.get_feature_flag(name),
                do: {:commit, flag},
                else: (_ -> {:commit, @not_found})
         end) do
      {:error, _} -> nil
      {_, @not_found} -> nil
      {_, value} -> value
    end
  end

  @spec update_cache(FeatureFlag.t()) :: {:ok, boolean()} | {:error, boolean()}
  def update_cache(%FeatureFlag{} = flag) do
    Cachex.put(__MODULE__, cache_key(flag.name), flag)
  end

  @spec invalidate_cache(String.t()) :: {:ok, boolean()} | {:error, boolean()}
  def invalidate_cache(name) when is_binary(name) do
    Cachex.del(__MODULE__, cache_key(name))
  end

  @spec global_update_cache(FeatureFlag.t()) :: :ok
  def global_update_cache(%FeatureFlag{} = flag) do
    GenRpc.multicast(__MODULE__, :update_cache, [flag])
  end

  @spec global_invalidate_cache(FeatureFlag.t()) :: :ok
  def global_invalidate_cache(%FeatureFlag{} = flag) do
    GenRpc.multicast(__MODULE__, :invalidate_cache, [flag.name])
  end

  defp cache_key(name), do: {:get_flag, name}
end
