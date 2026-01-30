import { fillTimeseries } from 'components/interfaces/Settings/Logs/Logs.utils'
import type { Datum } from 'components/ui/Charts/Charts.types'
import { useMemo } from 'react'

export type FillTimeseriesOptions<T extends Datum = Datum> = {
  /** The timeseries data to fill gaps in */
  data: T[]
  /** The key in each data object that contains the timestamp */
  timestampKey: string
  /** The key(s) to fill with default values when gaps exist */
  valueKey: string | string[]
  /** Default value to use for gaps */
  defaultValue: number
  /** Start of the time range (ISO string) */
  startDate?: string
  /** End of the time range (ISO string) */
  endDate?: string
  /** Minimum number of points before filling is applied */
  minPointsToFill?: number
  /** Optional interval specification (e.g., '5m', '1h') */
  interval?: string
}

export type FillTimeseriesResult<T extends Datum = Datum> = {
  data: T[]
  error: Error | null
  isError: boolean
}

/**
 * Sorts timeseries data by timestamp in ascending order
 * Returns a new sorted array without mutating the input
 */
export function sortByTimestamp<T extends Datum>(data: T[], timestampKey: string): T[] {
  return [...data].sort((a, b) => {
    return (
      new Date(a[timestampKey] as string).getTime() - new Date(b[timestampKey] as string).getTime()
    )
  })
}

/**
 * Validates that the data has a valid timestamp key
 */
export function hasValidTimestamp<T extends Datum>(data: T[], timestampKey: string): boolean {
  return Boolean(data[0]?.[timestampKey])
}

/**
 * Convenience hook for memoized filling of timeseries data.
 *
 * Fills gaps in timeseries data and sorts results by timestamp.
 *
 * @example
 * ```ts
 * const { data, error, isError } = useFillTimeseriesSorted({
 *   data: chartData,
 *   timestampKey: 'timestamp',
 *   valueKey: 'count',
 *   defaultValue: 0,
 *   startDate: startIso,
 *   endDate: endIso
 * })
 * ```
 */
export const useFillTimeseriesSorted = <T extends Datum = Datum>(
  options: FillTimeseriesOptions<T>
): FillTimeseriesResult<T> => {
  const {
    data,
    timestampKey,
    valueKey,
    defaultValue,
    startDate,
    endDate,
    minPointsToFill = 20,
    interval,
  } = options

  return useMemo(() => {
    // Early return if no valid timestamp
    if (!hasValidTimestamp(data, timestampKey)) {
      return {
        data,
        error: null,
        isError: false,
      }
    }

    try {
      const filled = fillTimeseries(
        data,
        timestampKey,
        valueKey,
        defaultValue,
        startDate,
        endDate,
        minPointsToFill,
        interval
      ) as T[]

      const sorted = sortByTimestamp(filled, timestampKey)

      return {
        data: sorted,
        error: null,
        isError: false,
      }
    } catch (error: unknown) {
      return {
        data: [],
        error: error instanceof Error ? error : new Error(String(error)),
        isError: true,
      }
    }
  }, [
    JSON.stringify(data),
    timestampKey,
    JSON.stringify(valueKey),
    defaultValue,
    startDate,
    endDate,
    minPointsToFill,
    interval,
  ])
}
