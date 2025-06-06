// @ts-ignore
import { _LEVELS } from '@/constants/levels'
import { type Table as TTable } from '@tanstack/react-table'
import { useQueryState } from 'nuqs'

import { useHotKey } from 'hooks/ui/useHotKey'
import { useEffect, useMemo, useRef } from 'react'
import { cn } from 'ui'
import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import { FacetMetadataSchema } from './UnifiedLogs.schema'

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

// TODO: make a BaseObject (incl. date and uuid e.g. for every upcoming branch of infinite table)
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

export const getFacetedUniqueValues = <TData>(facets?: Record<string, FacetMetadataSchema>) => {
  return (table: TTable<TData>, columnId: string) => {
    return new Map(facets?.[columnId]?.rows?.map(({ value, total }) => [value, total]) || [])
  }
}

export const getFacetedMinMaxValues = <TData>(facets?: Record<string, FacetMetadataSchema>) => {
  return (table: TTable<TData>, columnId: string) => {
    const min = facets?.[columnId]?.min
    const max = facets?.[columnId]?.max
    if (typeof min === 'number' && typeof max === 'number') return [min, max]
    if (typeof min === 'number') return [min, min]
    if (typeof max === 'number') return [max, max]
    return undefined
  }
}

export const getLevelLabel = (value: (typeof _LEVELS)[number]): string => {
  switch (value) {
    case 'success':
      return '2xx'
    case 'warning':
      return '4xx'
    case 'error':
      return '5xx'
    default:
      return 'Unknown'
  }
}

export function getLevelRowClassName(value: (typeof _LEVELS)[number]): string {
  switch (value) {
    case 'success':
      return ''
    case 'warning':
      return cn(
        'bg-warning/5 hover:bg-warning/10 data-[state=selected]:bg-warning/20 focus-visible:bg-warning/10',
        'dark:bg-warning/10 dark:hover:bg-warning/20 dark:data-[state=selected]:bg-warning/30 dark:focus-visible:bg-warning/20'
      )
    case 'error':
      return cn(
        'bg-destructive/5 hover:bg-destructive/10 data-[state=selected]:bg-destructive/20 focus-visible:bg-destructive/10',
        'dark:bg-error/10 dark:hover:bg-destructive/20 dark:data-[state=selected]:bg-destructive/30 dark:focus-visible:bg-destructive/20'
      )
    case 'info':
      return cn(
        'bg-info/5 hover:bg-info/10 data-[state=selected]:bg-info/20 focus-visible:bg-info/10',
        'dark:bg-info/10 dark:hover:bg-info/20 dark:data-[state=selected]:bg-info/30 dark:focus-visible:bg-info/20'
      )
    default:
      return ''
  }
}
