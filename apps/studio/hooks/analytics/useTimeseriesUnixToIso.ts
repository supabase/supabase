import {
  isUnixMicro,
  unixMicroToIsoTimestamp,
} from 'components/interfaces/Settings/Logs/Logs.utils'
import { useMemo } from 'react'

/**
 * Convenience hook for converting timeseries timestamp from unix microsecond to iso
 *
 * memoized
 */
const useTimeseriesUnixToIso = (data: any[], timestampKey: string) => {
  return useMemo(() => {
    // check if need to convert or not
    if (data.length === 0) return data
    if (!isUnixMicro(data[0][timestampKey])) return data

    return data?.map((d) => {
      d[timestampKey] = unixMicroToIsoTimestamp(d[timestampKey])
      return d
    })
  }, [JSON.stringify(data)])
}
export default useTimeseriesUnixToIso
