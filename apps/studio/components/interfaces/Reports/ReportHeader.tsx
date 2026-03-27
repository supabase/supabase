'use client'

import { useParams } from 'common'
import { DatabaseSelector } from 'components/ui/DatabaseSelector'
import { useRouter as useCompatRouter } from 'next/compat/router'
import { usePathname, useRouter as useAppRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

interface ReportHeaderProps {
  title: string
  showDatabaseSelector?: boolean
}

/** App Router: reconstruct a single-value query map from the current URL (no duplicate keys). */
function queryFromSearchParams(
  searchParams: ReturnType<typeof useSearchParams> | null
) {
  const q: Record<string, string | string[] | undefined> = {}
  if (!searchParams) return q
  searchParams.forEach((value, key) => {
    q[key] = value
  })
  return q
}

const ReportHeader = ({ title, showDatabaseSelector }: ReportHeaderProps) => {
  const compatRouter = useCompatRouter()
  const appRouter = useAppRouter()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()

  const query = useMemo(() => {
    if (compatRouter != null) {
      return compatRouter.query ?? {}
    }
    return queryFromSearchParams(searchParams)
  }, [compatRouter, compatRouter?.query, searchParams])

  const { ref } = useParams()
  const { db: _db, chart: _chart, ...params } = query

  return (
    <div className="flex flex-row justify-between gap-4 items-center">
      <h1>{title}</h1>
      {showDatabaseSelector && (
        <DatabaseSelector
          onSelectId={(selectedDb) => {
            if (compatRouter) {
              void compatRouter.push({
                pathname: compatRouter.pathname ?? '/',
                query: selectedDb !== ref ? { ...params, db: selectedDb } : params,
              })
            } else {
              const next = new URLSearchParams(searchParams?.toString() ?? '')
              if (selectedDb !== ref) {
                next.set('db', selectedDb)
              } else {
                next.delete('db')
              }
              const qs = next.toString()
              void appRouter.push(qs ? `${pathname}?${qs}` : pathname)
            }
          }}
        />
      )}
    </div>
  )
}
export default ReportHeader
