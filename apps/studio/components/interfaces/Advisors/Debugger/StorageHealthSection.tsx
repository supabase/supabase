import ReportWidget from '@/components/interfaces/Reports/ReportWidget'
import type { ReportWidgetRendererProps } from '@/components/interfaces/Reports/ReportWidget'
import type { BloatRow } from '@/data/database/debugger/bloat-query'
import { bloatSql } from '@/data/database/debugger/bloat-query'
import type { TableRecordCountsRow } from '@/data/database/debugger/table-record-counts-query'
import { tableRecordCountsSql } from '@/data/database/debugger/table-record-counts-query'
import type { TableStatsRow } from '@/data/database/debugger/table-stats-query'
import { tableStatsSql } from '@/data/database/debugger/table-stats-query'
import type { TrafficProfileRow } from '@/data/database/debugger/traffic-profile-query'
import { trafficProfileSql } from '@/data/database/debugger/traffic-profile-query'
import type { VacuumStatsRow } from '@/data/database/debugger/vacuum-stats-query'
import { vacuumStatsSql } from '@/data/database/debugger/vacuum-stats-query'

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

interface StorageHealthSectionProps {
  bloatData: BloatRow[] | undefined
  vacuumStatsData: VacuumStatsRow[] | undefined
  tableStatsData: TableStatsRow[] | undefined
  tableRecordCountsData: TableRecordCountsRow[] | undefined
  trafficProfileData: TrafficProfileRow[] | undefined
  isBloatLoading: boolean
  isVacuumStatsLoading: boolean
  isTableStatsLoading: boolean
  isTableRecordCountsLoading: boolean
  isTrafficProfileLoading: boolean
}

export function StorageHealthSection({
  bloatData,
  vacuumStatsData,
  tableStatsData,
  tableRecordCountsData,
  trafficProfileData,
  isBloatLoading,
  isVacuumStatsLoading,
  isTableStatsLoading,
  isTableRecordCountsLoading,
  isTrafficProfileLoading,
}: StorageHealthSectionProps) {
  return (
    <div className="space-y-4">
      <ReportWidget
        title="Table and Index Bloat"
        description="Estimated bloat for tables and indexes. High bloat wastes disk space and can slow queries."
        data={bloatData ?? []}
        isLoading={isBloatLoading}
        renderer={renderTable<BloatRow>('No significant bloat detected.')}
        params={{ sql: String(bloatSql) } as any}
        queryType="db"
        resolvedSql={String(bloatSql)}
      />
      <ReportWidget
        title="Vacuum Stats"
        description="Last vacuum/analyze timestamps and autovacuum thresholds per table."
        data={vacuumStatsData ?? []}
        isLoading={isVacuumStatsLoading}
        renderer={renderTable<VacuumStatsRow>('No vacuum stats available.')}
        params={{ sql: String(vacuumStatsSql) } as any}
        queryType="db"
        resolvedSql={String(vacuumStatsSql)}
      />
      <ReportWidget
        title="Table Stats"
        description="Size and sequential scan count per table."
        data={tableStatsData ?? []}
        isLoading={isTableStatsLoading}
        renderer={renderTable<TableStatsRow>('No table stats available.')}
        params={{ sql: String(tableStatsSql) } as any}
        queryType="db"
        resolvedSql={String(tableStatsSql)}
      />
      <ReportWidget
        title="Table Record Counts"
        description="Estimated live row counts per user table."
        data={tableRecordCountsData ?? []}
        isLoading={isTableRecordCountsLoading}
        renderer={renderTable<TableRecordCountsRow>('No tables found.')}
        params={{ sql: String(tableRecordCountsSql) } as any}
        queryType="db"
        resolvedSql={String(tableRecordCountsSql)}
      />
      <ReportWidget
        title="Traffic Profile"
        description="Most-active tables by read and write I/O."
        data={trafficProfileData ?? []}
        isLoading={isTrafficProfileLoading}
        renderer={renderTable<TrafficProfileRow>('No traffic data available.')}
        params={{ sql: String(trafficProfileSql) } as any}
        queryType="db"
        resolvedSql={String(trafficProfileSql)}
      />
    </div>
  )
}
