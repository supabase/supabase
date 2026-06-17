import ReportWidget from '@/components/interfaces/Reports/ReportWidget'
import type { ReportWidgetRendererProps } from '@/components/interfaces/Reports/ReportWidget'
import type { BlockingRow } from '@/data/database/debugger/blocking-query'
import { blockingSql } from '@/data/database/debugger/blocking-query'
import type { LocksRow } from '@/data/database/debugger/locks-query'
import { locksSql } from '@/data/database/debugger/locks-query'
import type { LongRunningQueriesRow } from '@/data/database/debugger/long-running-queries-query'
import { buildLongRunningQueriesSql } from '@/data/database/debugger/long-running-queries-query'

function renderTable<T extends Record<string, unknown>>(
  emptyMessage: string
): (props: ReportWidgetRendererProps<T>) => React.ReactNode {
  return function TableRenderer({ data }: ReportWidgetRendererProps<T>) {
    if (!data || data.length === 0) {
      return <p className="text-sm text-foreground-light py-2">{emptyMessage}</p>
    }

    const columns = Object.keys(data[0]) as (keyof T)[]

    return (
      <div className="overflow-x-auto rounded border border-overlay">
        <table className="w-full text-xs">
          <thead className="bg-surface-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col)}
                  className="px-3 py-2 text-left font-medium text-foreground-light whitespace-nowrap"
                >
                  {String(col).replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-overlay">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-surface-100">
                {columns.map((col) => (
                  <td
                    key={String(col)}
                    className="px-3 py-2 text-foreground whitespace-nowrap max-w-xs truncate"
                  >
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
}

interface LocksActivitySectionProps {
  locksData: LocksRow[] | undefined
  blockingData: BlockingRow[] | undefined
  longRunningQueriesData: LongRunningQueriesRow[] | undefined
  isLocksLoading: boolean
  isBlockingLoading: boolean
  isLongRunningQueriesLoading: boolean
  isLocksError: boolean
  isBlockingError: boolean
  isLongRunningQueriesError: boolean
}

export function LocksActivitySection({
  locksData,
  blockingData,
  longRunningQueriesData,
  isLocksLoading,
  isBlockingLoading,
  isLongRunningQueriesLoading,
}: LocksActivitySectionProps) {
  const locksRenderer = renderTable<LocksRow>('No exclusive locks detected.')
  const blockingRenderer = renderTable<BlockingRow>('No blocked queries detected.')
  const longRunningRenderer = renderTable<LongRunningQueriesRow>(
    'No long-running queries detected (threshold: 5 minutes).'
  )

  return (
    <div className="space-y-4">
      <ReportWidget
        title="Active Locks"
        description="Queries holding exclusive locks. Persistent locks may indicate stuck transactions."
        data={locksData ?? []}
        isLoading={isLocksLoading}
        renderer={locksRenderer}
        params={{ sql: String(locksSql) } as any}
        queryType="db"
        resolvedSql={String(locksSql)}
      />
      <ReportWidget
        title="Blocking Queries"
        description="Queries that are blocking other queries from running."
        data={blockingData ?? []}
        isLoading={isBlockingLoading}
        renderer={blockingRenderer}
        params={{ sql: String(blockingSql) } as any}
        queryType="db"
        resolvedSql={String(blockingSql)}
      />
      <ReportWidget
        title="Long-Running Queries"
        description="Active queries running longer than 5 minutes."
        data={longRunningQueriesData ?? []}
        isLoading={isLongRunningQueriesLoading}
        renderer={longRunningRenderer}
        params={{ sql: String(buildLongRunningQueriesSql()) } as any}
        queryType="db"
        resolvedSql={String(buildLongRunningQueriesSql())}
      />
    </div>
  )
}
