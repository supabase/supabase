defmodule Supavisor.PeepStorage.Atomics do
  @moduledoc false

  require Peep.Storage.Atomics

  @doc """
  Returns raw bucket counts as a list, plus sum and above_max.

  Returns `{counts, sum, above_max}` where `counts` is a list of integers
  in bucket order (index 0..n-1). No boundary string computation is done.
  """
  def counts(
        Peep.Storage.Atomics.atomic(
          buckets: buckets,
          sum: sum,
          above_max: above_max,
          num_buckets: num_buckets
        )
      ) do
    counts = for idx <- 1..num_buckets, do: :atomics.get(buckets, idx)
    {counts, :atomics.get(sum, 1), :atomics.get(above_max, 1)}
  end

  @doc """
  Returns the sorted list of boundary strings for this atomics record.

  These are fixed for the lifetime of the metric and can be cached.
  """
  def boundaries(
        Peep.Storage.Atomics.atomic(
          bucket_calculator: {module, config},
          num_buckets: num_buckets
        )
      ) do
    for idx <- 0..(num_buckets - 1) do
      module.upper_bound(idx, config)
    end
  end
end
