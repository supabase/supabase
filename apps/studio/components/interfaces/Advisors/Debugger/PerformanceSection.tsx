import { useParams } from 'common'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

import ReportWidget from '@/components/interfaces/Reports/ReportWidget'
import type { ReportWidgetRendererProps } from '@/components/interfaces/Reports/ReportWidget'
import type { CacheHitRow } from '@/data/database/debugger/cache-hit-query'
import { cacheHitSql } from '@/data/database/debugger/cache-hit-query'
import type { IndexStatsRow } from '@/data/database/debugger/index-stats-query'
import { indexStatsSql } from '@/data/database/debugger/index-stats-query'
import type { IndexUsageRow } from '@/data/database/debugger/index-usage-query'
import { indexUsageSql } from '@/data/database/debugger/index-usage-query'
import type { SeqScansRow } from '@/data/database/debugger/seq-scans-query'
import { seqScansSql } from '@/data/database/debugger/seq-scans-query'
import type { UnusedIndexesRow } from '@/data/database/debugger/unused-indexes-query'
import { unusedIndexesSql } from '@/data/database/debugger/unused-indexes-query'

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

interface PerformanceSectionProps {
  cacheHitData: CacheHitRow[] | undefined
  indexUsageData: IndexUsageRow[] | undefined
  indexStatsData: IndexStatsRow[] | undefined
  seqScansData: SeqScansRow[] | undefined
  unusedIndexesData: UnusedIndexesRow[] | undefined
  isCacheHitLoading: boolean
  isIndexUsageLoading: boolean
  isIndexStatsLoading: boolean
  isSeqScansLoading: boolean
  isUnusedIndexesLoading: boolean
  hasPgStatStatements: boolean
}

export function PerformanceSection({
  cacheHitData,
  indexUsageData,
  indexStatsData,
  seqScansData,
  unusedIndexesData,
  isCacheHitLoading,
  isIndexUsageLoading,
  isIndexStatsLoading,
  isSeqScansLoading,
  isUnusedIndexesLoading,
  hasPgStatStatements,
}: PerformanceSectionProps) {
  const { ref } = useParams()

  return (
    <div className="space-y-4">
      <div className="rounded border border-overlay bg-surface-100 px-4 py-3 flex items-start gap-3">
        <ExternalLink size={14} className="mt-0.5 shrink-0 text-foreground-light" />
        <p className="text-xs text-foreground-light">
          For slow queries, most-called queries, and per-statement statistics, visit the{' '}
          <Link
            href={`/project/${ref}/observability/query-performance`}
            className="text-foreground underline underline-offset-2"
          >
            Query Performance
          </Link>{' '}
          page. Those metrics require <code>pg_stat_statements</code>
          {!hasPgStatStatements && <span className="text-warning"> (not currently enabled)</span>}.
        </p>
      </div>

      <ReportWidget
        title="Cache Hit Rates"
        description="Buffer cache hit ratio for tables and indexes. Values below 0.99 may indicate memory pressure."
        data={cacheHitData ?? []}
        isLoading={isCacheHitLoading}
        renderer={renderTable<CacheHitRow>('No cache hit data available.')}
        params={{ sql: String(cacheHitSql) } as any}
        queryType="db"
        resolvedSql={String(cacheHitSql)}
      />
      <ReportWidget
        title="Index Usage"
        description="Percentage of scans that used an index vs. a sequential scan per table."
        data={indexUsageData ?? []}
        isLoading={isIndexUsageLoading}
        renderer={renderTable<IndexUsageRow>('No index usage data available.')}
        params={{ sql: String(indexUsageSql) } as any}
        queryType="db"
        resolvedSql={String(indexUsageSql)}
      />
      <ReportWidget
        title="Index Stats"
        description="Size, scan counts, and usage flags for all user indexes."
        data={indexStatsData ?? []}
        isLoading={isIndexStatsLoading}
        renderer={renderTable<IndexStatsRow>('No index stats available.')}
        params={{ sql: String(indexStatsSql) } as any}
        queryType="db"
        resolvedSql={String(indexStatsSql)}
      />
      <ReportWidget
        title="Sequential Scans"
        description="Tables ordered by sequential scan count. High counts on large tables may indicate missing indexes."
        data={seqScansData ?? []}
        isLoading={isSeqScansLoading}
        renderer={renderTable<SeqScansRow>('No sequential scan data available.')}
        params={{ sql: String(seqScansSql) } as any}
        queryType="db"
        resolvedSql={String(seqScansSql)}
      />
      <ReportWidget
        title="Unused Indexes"
        description="Indexes that have never been used in a scan. Unused indexes waste space and slow writes."
        data={unusedIndexesData ?? []}
        isLoading={isUnusedIndexesLoading}
        renderer={renderTable<UnusedIndexesRow>('No unused indexes found.')}
        params={{ sql: String(unusedIndexesSql) } as any}
        queryType="db"
        resolvedSql={String(unusedIndexesSql)}
      />
    </div>
  )
}
