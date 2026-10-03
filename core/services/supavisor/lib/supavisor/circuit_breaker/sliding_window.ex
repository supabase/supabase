defmodule Supavisor.CircuitBreaker.SlidingWindow do
  @moduledoc """
  Atomics-based sliding window counter.

  Maintains an approximate count of events over a time window using two
  adjacent windows and linear interpolation. All operations are O(1)
  and lock-free via `:atomics`.

  ### Layout (2 unsigned atomics slots)

  - Slot 1: packed counts — high 32 bits = prev count, low 32 bits = current count
  - Slot 2: window index (`div(now - time_offset, window_seconds)`)

  ### How it works

  Time is divided into fixed-size windows (`window_seconds`). Each window is
  identified by its index: `div(now - time_offset, window_seconds)`. We keep counts for the
  current and previous windows, and estimate the sliding total using linear
  interpolation between them.

  Both counts are packed into a single 64-bit atomic (prev in the high 32 bits,
  current in the low 32 bits). This lets us read a consistent snapshot of both
  counts with a single `get`, and update them atomically via CAS loops.

  #### Recording events (`record/2`)

  1. **Rotate** if the window index has advanced (see below).
  2. **Increment** current count: `:atomics.add(ref, @counts, 1)`. Since
     current is in the low 32 bits, a plain `add` of 1 does the right thing.
  3. **Estimate** the sliding count from a single atomic read.

  #### Rotation

  When the window index advances, one process wins a CAS on the `window_index`
  slot and becomes responsible for transforming the packed counts:

  - **Adjacent window** (index advanced by 1): CAS loop shifts current into
    prev and zeros current (`shift_current_to_prev/1`).
  - **Stale window** (index advanced by 2+): CAS loop zeros prev while
    preserving current (`reset_counts/1`).

  Losers of the `window_index` CAS skip rotation and proceed to increment.

  #### Estimated count

  A single `get` of the packed counts slot yields a consistent {prev, current}
  pair. The estimate is:

      prev * ((window_seconds - elapsed) / window_seconds) + current

  where `elapsed = rem(now - time_offset, window_seconds)`.

  The `time_offset` aligns window boundaries to creation time, so the first
  window always starts full-length rather than mid-window.

  ### Known race

  There is a narrow race between the `window_index` CAS and the `@counts`
  CAS loop during rotation. A concurrent `add` may be misattributed to
  the wrong window (e.g. shifted into prev), but counts are never lost.
  """

  import Bitwise

  @counts 1
  @window_index 2

  @low_mask 0xFFFFFFFF

  require Record

  Record.defrecord(:sw, ref: nil, window_seconds: nil, time_offset: nil)

  @opaque t ::
            record(:sw,
              ref: :atomics.atomics_ref(),
              window_seconds: pos_integer(),
              time_offset: non_neg_integer()
            )

  @doc """
  Creates a new sliding window with the given window size in seconds.
  """
  @spec new(pos_integer(), non_neg_integer()) :: t()
  def new(window_seconds, starting_time) do
    ref = :atomics.new(2, signed: false)
    time_offset = rem(starting_time, window_seconds)
    adjusted = starting_time - time_offset
    :atomics.put(ref, @window_index, div(adjusted, window_seconds))
    sw(ref: ref, window_seconds: window_seconds, time_offset: time_offset)
  end

  @doc """
  Records events, rotating the window if needed.
  Returns the estimated count after the increment.
  """
  @spec record(t(), integer(), pos_integer()) :: non_neg_integer()
  def record(
        sw(ref: ref, window_seconds: window_seconds, time_offset: time_offset) = s,
        now,
        count \\ 1
      ) do
    adjusted = now - time_offset
    current_window = div(adjusted, window_seconds)
    rotate(ref, current_window)
    :atomics.add(ref, @counts, count)
    unsafe_estimated_count(s, now)
  end

  @doc """
  Returns the current window index stored in the ref.
  """
  @spec window_index(t()) :: non_neg_integer()
  def window_index(sw(ref: ref)) do
    :atomics.get(ref, @window_index)
  end

  @doc """
  Returns true if the sliding window is stale (no activity for 2+ windows).
  """
  @spec stale?(t(), integer()) :: boolean()
  def stale?(sw(ref: ref, window_seconds: window_seconds, time_offset: time_offset), now) do
    stored_window = :atomics.get(ref, @window_index)
    adjusted = now - time_offset
    current_window = div(adjusted, window_seconds)
    current_window - stored_window >= 2
  end

  # Rotates the sliding window if the current window index has advanced.
  #
  # Uses compare_exchange on the window_index slot so that only one process
  # wins the rotation. Losers see the compare_exchange failing
  # (the winner already set window_index to current_window) and just
  # proceed to increment current_count.
  defp rotate(ref, current_window) do
    stored_window = :atomics.get(ref, @window_index)

    cond do
      stored_window >= current_window ->
        # Same window or clock went backwards — don't rotate.
        :ok

      stored_window == current_window - 1 ->
        case :atomics.compare_exchange(ref, @window_index, stored_window, current_window) do
          :ok ->
            # We won the rotation — shift current into prev, reset current.
            shift_current_to_prev(ref)

          _ ->
            # Another process already rotated — nothing to do.
            :ok
        end

      true ->
        # Read counts before the window_index CAS. At this point no CAS loser
        # has started adding new-window events yet, so this is purely stale.
        stale_counts = :atomics.get(ref, @counts)

        case :atomics.compare_exchange(ref, @window_index, stored_window, current_window) do
          :ok ->
            # We won — stale window, subtract the stale counts.
            reset_counts(ref, stale_counts)

          _ ->
            :ok
        end
    end
  end

  # CAS loop to atomically shift current count into prev and zero current.
  # Retries if a concurrent increment lands between read and CAS.
  defp shift_current_to_prev(ref) do
    old = :atomics.get(ref, @counts)
    current = old &&& @low_mask
    new_packed = current <<< 32

    case :atomics.compare_exchange(ref, @counts, old, new_packed) do
      :ok -> :ok
      _ -> shift_current_to_prev(ref)
    end
  end

  # Subtracts the stale counts via CAS loop. The stale value is captured
  # before the window_index CAS, so it doesn't include any new-window adds.
  # Concurrent adds are preserved because they sit on top of the stale value
  # — we only subtract the stale amount. If an add lands between our read
  # and CAS, the CAS fails and we retry, still subtracting the same amount.
  defp reset_counts(ref, stale) do
    current = :atomics.get(ref, @counts)
    new = current - stale

    case :atomics.compare_exchange(ref, @counts, current, new) do
      :ok -> :ok
      _ -> reset_counts(ref, stale)
    end
  end

  @doc """
  Returns the estimated count, assuming the window has already been rotated.
  Cheaper than `estimated_count/2` (no window index read). Use only when the
  caller has just called `record/2` or `rotate` — otherwise the result may be
  stale. See `estimated_count/2` for the safe version.
  """
  @spec unsafe_estimated_count(t(), integer()) :: non_neg_integer()
  def unsafe_estimated_count(
        sw(ref: ref, window_seconds: window_seconds, time_offset: time_offset),
        now
      ) do
    packed = :atomics.get(ref, @counts)
    current = packed &&& @low_mask
    prev = packed >>> 32
    adjusted = now - time_offset
    elapsed = rem(adjusted, window_seconds)
    weight = (window_seconds - elapsed) / window_seconds
    round(prev * weight + current)
  end

  @doc """
  Returns the estimated count for the sliding window at the given time.
  Accounts for the window possibly having advanced past the stored window index.
  """
  @spec estimated_count(t(), integer()) :: non_neg_integer()
  def estimated_count(sw(ref: ref, window_seconds: window_seconds, time_offset: time_offset), now) do
    stored_window = :atomics.get(ref, @window_index)
    adjusted = now - time_offset
    current_window = div(adjusted, window_seconds)
    gap = current_window - stored_window

    cond do
      gap >= 2 ->
        0

      gap == 1 ->
        packed = :atomics.get(ref, @counts)
        current = packed &&& @low_mask
        elapsed = rem(adjusted, window_seconds)
        weight = (window_seconds - elapsed) / window_seconds
        round(current * weight)

      true ->
        packed = :atomics.get(ref, @counts)
        current = packed &&& @low_mask
        prev = packed >>> 32
        elapsed = rem(adjusted, window_seconds)
        weight = (window_seconds - elapsed) / window_seconds
        round(prev * weight + current)
    end
  end
end
