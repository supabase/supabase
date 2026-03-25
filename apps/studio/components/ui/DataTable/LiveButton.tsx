import type { FetchPreviousPageOptions } from '@tanstack/react-query'
import { CirclePause, CirclePlay } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import { useEffect } from 'react'

import { useHotKey } from 'hooks/ui/useHotKey'
import { Button, cn } from 'ui'
import { useDataTable } from './providers/DataTableProvider'

const REFRESH_INTERVAL = 10_000

interface LiveButtonProps {
  searchParamsParser: any
  fetchPreviousPage?: (options?: FetchPreviousPageOptions | undefined) => Promise<unknown>
}

export function LiveButton({ fetchPreviousPage, searchParamsParser }: LiveButtonProps) {
  const [{ live, date, sort }, setSearch] = useQueryStates(searchParamsParser)
  const { table } = useDataTable()
  useHotKey(handleClick, 'j')

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    async function fetchData() {
      if (live) {
        await fetchPreviousPage?.()
        timeoutId = setTimeout(fetchData, REFRESH_INTERVAL)
      } else {
        clearTimeout(timeoutId)
      }
    }

    fetchData()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [live, fetchPreviousPage])

  // REMINDER: make sure to reset live when date is set
  // TODO: test properly
  useEffect(() => {
    if ((date || sort) && live) {
      setSearch((prev) => ({ ...prev, live: null }))
    }
  }, [date, sort])

  function handleClick() {
    setSearch((prev) => ({
      ...prev,
      live: !prev.live,
      date: null,
      sort: null,
    }))
    table.getColumn('date')?.setFilterValue(undefined)
    table.resetSorting()
  }

  return (
    <Button
      className={cn(live && 'border-info text-info hover:text-info')}
      onClick={handleClick}
      type={live ? 'primary' : 'default'}
      size="tiny"
      icon={live ? <CirclePause className="h-4 w-4" /> : <CirclePlay className="h-4 w-4" />}
    >
      Live
    </Button>
  )
}
