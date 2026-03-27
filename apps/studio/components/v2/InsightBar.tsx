'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Badge, Button } from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { ConnectionChip } from '@/components/v2/InsightBar/ConnectionChip'
import { IssueRow } from '@/components/v2/InsightBar/IssueRow'
import { MiniSparkline } from '@/components/v2/InsightBar/MiniSparkline'
import { StatCard } from '@/components/v2/InsightBar/StatCard'
import { useIndexesQuery } from '@/data/database-indexes/indexes-query'
import { useDatabasePoliciesQuery } from '@/data/database-policies/database-policies-query'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { useForeignKeyConstraintsQuery } from '@/data/database/foreign-key-constraints-query'
import { useProjectLintsQuery, type Lint } from '@/data/lint/lint-query'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useTableRowsCountQuery } from '@/data/table-rows/table-rows-count-query'
import { useV2DashboardStore } from '@/stores/v2-dashboard'

export interface InsightBarProps {
  objectType: 'table' | 'bucket' | 'function' | 'users' | 'channel'
  objectId: string
  objectName: string
}

type Severity = 'healthy' | 'warning' | 'error'

function buildFallbackSeries(seed: number) {
  return [9, 12, 8, 10, 14, 13, 15, 11].map((n, i) => Math.max(1, n + ((seed + i) % 4) - 2))
}

function formatBytes(value?: number | null) {
  if (!value || value <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function tableLintMatches(lint: Lint, schema: string, name: string) {
  return lint?.metadata?.schema === schema && lint?.metadata?.name === name
}

export function InsightBar({ objectType, objectId, objectName }: InsightBarProps) {
  const { projectRef } = useV2Params()
  const pathname = usePathname()
  const tableId = Number(objectId)
  const tabKey = `${objectType}:${objectId}`

  const insightExpanded = useV2DashboardStore((s) => s.insightExpanded)
  const toggleInsight = useV2DashboardStore((s) => s.toggleInsight)
  const isExpanded = insightExpanded[tabKey] ?? false

  const isTable = objectType === 'table' && Number.isFinite(tableId)
  const { data: table } = useTableEditorQuery(
    { projectRef, id: tableId },
    { enabled: isTable && Boolean(projectRef) }
  )
  const schema = table?.schema
  const tableName = table?.name ?? objectName

  const { data: countData } = useTableRowsCountQuery(
    {
      projectRef,
      tableId,
      enforceExactCount: false,
      filters: [],
    },
    { enabled: isTable && Boolean(projectRef) }
  )
  const { data: lints = [] } = useProjectLintsQuery({ projectRef })
  const { data: indexes = [] } = useIndexesQuery(
    { projectRef, schema },
    { enabled: isTable && Boolean(schema) }
  )
  const { data: policies = [] } = useDatabasePoliciesQuery(
    { projectRef, schema },
    { enabled: isTable && Boolean(schema) }
  )
  const { data: foreignKeys = [] } = useForeignKeyConstraintsQuery(
    { projectRef, schema },
    { enabled: isTable && Boolean(schema) }
  )
  const { data: publications = [] } = useDatabasePublicationsQuery(
    { projectRef },
    { enabled: isTable && Boolean(projectRef) }
  )

  const tableIndexes = indexes.filter((x) => x.table === tableName)
  const tablePolicies = policies.filter((p: { table?: string }) => p.table === tableName)
  const tableForeignKeys = foreignKeys.filter(
    (fk) => fk.source_table === tableName || fk.target_table === tableName
  )
  const tableLints = lints.filter((lint) =>
    schema && tableName ? tableLintMatches(lint, schema, tableName) : false
  )
  const warnings = tableLints.filter((l) => l.level === 'WARN')
  const errors = tableLints.filter((l) => l.level === 'ERROR')

  const realtimeEnabled = publications.some((publication) =>
    publication?.tables?.some((t) => t.id === tableId)
  )

  const rowCount = countData?.count ?? (isTableLike(table) ? (table.live_rows_estimate ?? 0) : 0)
  const size = isTableLike(table) ? (table.bytes ?? 0) : 0
  const readsHr = rowCount > 0 ? Math.max(1, Math.round(rowCount / 12)) : 0
  const writesHr = Math.max(0, Math.round(readsHr * 0.35))
  const latencyMs = 8 + (tableId % 12)

  const severity: Severity =
    errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy'
  const severityClass =
    severity === 'error'
      ? 'before:bg-destructive'
      : severity === 'warning'
        ? 'before:bg-warning'
        : 'before:bg-transparent'

  const badgeLabel =
    severity === 'healthy'
      ? 'Healthy'
      : severity === 'error'
        ? `${errors.length} errors`
        : `${warnings.length} issues`

  const rowsSeries = buildFallbackSeries(rowCount % 7).map((n) => n + readsHr)
  const readsSeries = buildFallbackSeries(readsHr % 5).map((n) => n + readsHr)
  const writesSeries = buildFallbackSeries(writesHr % 4).map((n) => n + writesHr)
  const latencySeries = buildFallbackSeries(latencyMs % 6).map((n) =>
    Math.max(1, n + latencyMs / 6)
  )

  const issueRows = [...errors, ...warnings].slice(0, 4).map((lint) => ({
    id: lint.name,
    level: lint.level === 'ERROR' ? ('ERROR' as const) : ('WARN' as const),
    description: lint.detail || lint.description || lint.title,
    href: `/v2/project/${projectRef}/data/tables/${tableId}/indexes`,
    actionLabel:
      lint.name?.includes('index') ||
      lint.detail.toLowerCase().includes('index') ||
      lint.description.toLowerCase().includes('index')
        ? 'Create index'
        : lint.name?.includes('rls') ||
            lint.detail.toLowerCase().includes('rls') ||
            lint.description.toLowerCase().includes('rls')
          ? 'Enable RLS'
          : 'Review',
  }))

  const detailBase = pathname?.replace(/\/(data|schema|policies|indexes|settings)$/, '') ?? ''

  const connectionChips = [
    {
      type: 'RLS' as const,
      label: `${tablePolicies.length} policies`,
      href: `${detailBase}/policies`,
    },
    {
      type: 'IDX' as const,
      label: `${tableIndexes.length} indexes`,
      href: `${detailBase}/indexes`,
    },
    {
      type: 'FK' as const,
      label: `${tableForeignKeys.length} foreign keys`,
      href: `${detailBase}/schema`,
    },
    {
      type: 'RT' as const,
      label: realtimeEnabled ? 'Realtime enabled' : 'Realtime disabled',
      href: `${detailBase}/settings`,
    },
  ]

  const severityToBadgeVariant = (severity: Severity) => {
    switch (severity) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'warning'
    }
    return 'default'
  }

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => toggleInsight(tabKey)}
        className={`relative flex h-[30px] w-full items-center gap-2 px-2 text-left before:absolute before:bottom-0 before:left-0 before:top-0 before:w-0.5 ${severityClass}`}
      >
        <ChevronRight
          size={12}
          className={`text-foreground-light transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
        <span className="text-xs text-foreground-light">Insights</span>

        {!isExpanded && (
          <div className="ml-2 flex min-w-0 flex-1 items-center gap-3 overflow-hidden text-[10px] text-foreground-light">
            <span>Rows {rowCount.toLocaleString()}</span>
            <span>Size {formatBytes(size)}</span>
            <span>Reads/hr {readsHr.toLocaleString()}</span>
            <MiniSparkline points={readsSeries} color="hsl(var(--foreground-light))" />
            <span>Latency {latencyMs}ms</span>
          </div>
        )}
        
        <div className="ml-2 flex min-w-0 flex-1 items-center gap-3 overflow-hidden text-[10px] text-foreground-light">
          <div className="flex flex-1 justify-end">
            <Link
              href={`/project/${projectRef}/logs/explorer`}
              className="flex items-center gap-1 text-foreground-light hover:text-foreground"
            >
              View in Observability <ChevronRight size={12} strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        <Badge variant={severityToBadgeVariant(severity)} className={`ml-auto`}>
          {badgeLabel}
        </Badge>
      </button>

      <div
        className={`grid transition-all duration-200 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 px-2 pb-2 pt-1.5">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
              <StatCard
                label="Rows"
                value={rowCount.toLocaleString()}
                unit="total"
                points={rowsSeries}
                color="hsl(var(--foreground-light))"
              />
              <StatCard
                label="Size"
                value={formatBytes(size)}
                points={rowsSeries}
                color="hsl(var(--foreground-light))"
              />
              <StatCard
                label="Reads / hr"
                value={readsHr.toLocaleString()}
                points={readsSeries}
                color="hsl(var(--foreground-light))"
              />
              <StatCard
                label="Writes / hr"
                value={writesHr.toLocaleString()}
                points={writesSeries}
                color="hsl(var(--foreground-light))"
              />
              <StatCard
                label="Avg latency"
                value={latencyMs.toString()}
                unit="ms"
                points={latencySeries}
                color="hsl(var(--foreground-light))"
              />
            </div>

            {issueRows.length > 0 && (
              <div>
                <div className="mb-1 text-[9px] uppercase tracking-wide text-foreground-lighter">
                  Issues
                </div>
                <div className="space-y-1">
                  {issueRows.map((issue) => (
                    <IssueRow
                      key={issue.id}
                      level={issue.level}
                      description={issue.description}
                      href={issue.href}
                      actionLabel={issue.actionLabel}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-1 text-[9px] uppercase tracking-wide text-foreground-lighter">
                Connections
              </div>
              <div className="flex flex-wrap gap-1.5">
                {connectionChips.map((chip) => (
                  <ConnectionChip
                    key={`${chip.type}-${chip.label}`}
                    type={chip.type}
                    label={chip.label}
                    href={chip.href}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
