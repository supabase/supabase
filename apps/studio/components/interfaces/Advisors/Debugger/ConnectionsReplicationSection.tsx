import ReportWidget from '@/components/interfaces/Reports/ReportWidget'
import type { ReportWidgetRendererProps } from '@/components/interfaces/Reports/ReportWidget'
import type { DbStatsRow } from '@/data/database/debugger/db-stats-query'
import { dbStatsSql } from '@/data/database/debugger/db-stats-query'
import type { ReplicationSlotsRow } from '@/data/database/debugger/replication-slots-query'
import { replicationSlotsSql } from '@/data/database/debugger/replication-slots-query'
import type { RoleStatsRow } from '@/data/database/debugger/role-stats-query'
import { roleStatsSql } from '@/data/database/debugger/role-stats-query'

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

interface ConnectionsReplicationSectionProps {
  roleStatsData: RoleStatsRow[] | undefined
  replicationSlotsData: ReplicationSlotsRow[] | undefined
  dbStatsData: DbStatsRow[] | undefined
  isRoleStatsLoading: boolean
  isReplicationSlotsLoading: boolean
  isDbStatsLoading: boolean
}

export function ConnectionsReplicationSection({
  roleStatsData,
  replicationSlotsData,
  dbStatsData,
  isRoleStatsLoading,
  isReplicationSlotsLoading,
  isDbStatsLoading,
}: ConnectionsReplicationSectionProps) {
  return (
    <div className="space-y-4">
      <ReportWidget
        title="Role Connection Stats"
        description="Active connections and connection limits per database role."
        data={roleStatsData ?? []}
        isLoading={isRoleStatsLoading}
        renderer={renderTable<RoleStatsRow>('No role stats available.')}
        params={{ sql: String(roleStatsSql) } as any}
        queryType="db"
        resolvedSql={String(roleStatsSql)}
      />
      <ReportWidget
        title="Replication Slots"
        description="Active and inactive replication slots. Inactive slots with high lag can cause disk bloat."
        data={replicationSlotsData ?? []}
        isLoading={isReplicationSlotsLoading}
        renderer={renderTable<ReplicationSlotsRow>('No replication slots found.')}
        params={{ sql: String(replicationSlotsSql) } as any}
        queryType="db"
        resolvedSql={String(replicationSlotsSql)}
      />
      <ReportWidget
        title="Database Stats"
        description="Overall database size, cache hit rates, and WAL size."
        data={dbStatsData ?? []}
        isLoading={isDbStatsLoading}
        renderer={renderTable<DbStatsRow>('No database stats available.')}
        params={{ sql: String(dbStatsSql) } as any}
        queryType="db"
        resolvedSql={String(dbStatsSql)}
      />
    </div>
  )
}
