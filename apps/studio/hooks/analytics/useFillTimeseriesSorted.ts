import { fillTimeseries } from 'components/interfaces/Settings/Logs'
import { useMemo } from 'react'

/**
 * Convenience hook for memoized filling of timeseries data.
 */
const useFillTimeseriesSorted = (...args: Parameters<typeof fillTimeseries>) => {
  return useMemo(() => {
    const [data, timestampKey] = args
    if (!data[0]?.[timestampKey]) return data

    const filled = fillTimeseries(...args)
    return filled.sort((a, b) => {
      return (new Date(a[args[1]]) as any) - (new Date(b[args[1]]) as any)
    })
  }, [JSON.stringify(args[0]), ...args])
}
export default useFillTimeseriesSorted
