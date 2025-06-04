'use client'

import { useDataTable } from 'components/interfaces/DataTableDemo/components/data-table/data-table-provider'
import { Button } from 'ui'
import { useHotKey } from 'components/interfaces/DataTableDemo/hooks/use-hot-key'
import { cn } from 'ui'
import type { FetchPreviousPageOptions } from '@tanstack/react-query'
import { CirclePause, CirclePlay } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import * as React from 'react'
import { searchParamsParser } from '../search-params'

const REFRESH_INTERVAL = 10_000

interface LiveButtonProps {
  fetchPreviousPage?: (options?: FetchPreviousPageOptions | undefined) => Promise<unknown>
}

export function LiveButton({ fetchPreviousPage }: LiveButtonProps) {
  const [{ live, date, sort }, setSearch] = useQueryStates(searchParamsParser)
  const { table } = useDataTable()
  useHotKey(handleClick, 'j')

  React.useEffect(() => {
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
  React.useEffect(() => {
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
      size="small"
      icon={
        live ? <CirclePause className="mr-2 h-4 w-4" /> : <CirclePlay className="mr-2 h-4 w-4" />
      }
    >
      Live
    </Button>
  )
}
