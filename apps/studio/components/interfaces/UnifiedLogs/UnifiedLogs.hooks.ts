import { useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef } from 'react'

import { useHotKey } from 'hooks/ui/useHotKey'
import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'

export const useResetFocus = () => {
  useHotKey(() => {
    // FIXME: some dedicated div[tabindex="0"] do not auto-unblur (e.g. the DataTableFilterResetButton)
    // REMINDER: we cannot just document.activeElement?.blur(); as the next tab will focus the next element in line,
    // which is not what we want. We want to reset entirely.
    document.body.setAttribute('tabindex', '0')
    document.body.focus()
    document.body.removeAttribute('tabindex')
  }, '.')
}

export const useLiveMode = <TData extends { date: Date }>(data: TData[]) => {
  const [live] = useQueryState('live', SEARCH_PARAMS_PARSER.live)
  // REMINDER: used to capture the live mode on timestamp
  const liveTimestamp = useRef<number | undefined>(live ? new Date().getTime() : undefined)

  useEffect(() => {
    if (live) liveTimestamp.current = new Date().getTime()
    else liveTimestamp.current = undefined
  }, [live])

  const anchorRow = useMemo(() => {
    if (!live) return undefined

    const item = data.find((item) => {
      // return first item that is there if not liveTimestamp
      if (!liveTimestamp.current) return true
      // return first item that is after the liveTimestamp
      if (item.date.getTime() > liveTimestamp.current) return false
      return true
      // return first item if no liveTimestamp
    })

    return item
  }, [live, data])

  return { row: anchorRow, timestamp: liveTimestamp.current }
}
