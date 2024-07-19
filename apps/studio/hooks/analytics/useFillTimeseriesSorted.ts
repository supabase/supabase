import { fillTimeseries } from 'components/interfaces/Settings/Logs/Logs.utils'
import { useMemo } from 'react'

/**
 * Convenience hook for memoized filling of timeseries data.
 */
export const useFillTimeseriesSorted = (...args: Parameters<typeof fillTimeseries>) => {
  return useMemo(() => {
    const [data, timestampKey] = args
    if (!data[0]?.[timestampKey])
      return {
        data,
        error: undefined,
        isError: false,
      }

    try {
      const filled = fillTimeseries(...args)

      return {
        data: filled.sort((a, b) => {
          return (new Date(a[args[1]]) as any) - (new Date(b[args[1]]) as any)
        }),
        error: undefined,
        isError: false,
      }
    } catch (error: any) {
      return {
        data: [],
        error,
        isError: true,
      }
    }
  }, [JSON.stringify(args[0]), ...args])
}
