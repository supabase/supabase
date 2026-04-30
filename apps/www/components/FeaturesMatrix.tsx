import React, { useState } from 'react'
import Link from 'next/link'
import { Check, Minus, ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink } from 'lucide-react'
import { Badge, cn } from 'ui'
import type { FeatureType } from '~/data/features'
import { PRODUCT_STAGES } from '~/data/features'

type SortColumn = 'title' | 'stage' | 'selfHosted'
type SortDirection = 'asc' | 'desc'

const STAGE_ORDER: Record<PRODUCT_STAGES, number> = {
  [PRODUCT_STAGES.PRIVATE_ALPHA]: 0,
  [PRODUCT_STAGES.PUBLIC_ALPHA]: 1,
  [PRODUCT_STAGES.BETA]: 2,
  [PRODUCT_STAGES.PUBLIC_BETA]: 3,
  [PRODUCT_STAGES.GA]: 4,
}

function stageBadgeVariant(stage: PRODUCT_STAGES): 'default' | 'warning' | 'success' | 'destructive' {
  switch (stage) {
    case PRODUCT_STAGES.GA:
      return 'success'
    case PRODUCT_STAGES.PUBLIC_BETA:
    case PRODUCT_STAGES.BETA:
      return 'warning'
    case PRODUCT_STAGES.PRIVATE_ALPHA:
      return 'destructive'
    default:
      return 'default'
  }
}

function stageLabel(stage: PRODUCT_STAGES): string {
  switch (stage) {
    case PRODUCT_STAGES.GA:
      return 'GA'
    case PRODUCT_STAGES.PUBLIC_BETA:
      return 'Public Beta'
    case PRODUCT_STAGES.BETA:
      return 'Beta'
    case PRODUCT_STAGES.PUBLIC_ALPHA:
      return 'Public Alpha'
    case PRODUCT_STAGES.PRIVATE_ALPHA:
      return 'Private Alpha'
  }
}

function productLabel(product: string): string {
  const labels: Record<string, string> = {
    database: 'Database',
    authentication: 'Auth',
    storage: 'Storage',
    functions: 'Functions',
    realtime: 'Realtime',
    cron: 'Cron',
    queues: 'Queues',
    vector: 'Vector',
    platform: 'Platform',
    studio: 'Studio',
  }
  return labels[product] ?? product
}

function SortIcon({ column, sortColumn, sortDirection }: { column: SortColumn; sortColumn: SortColumn; sortDirection: SortDirection }) {
  if (sortColumn !== column) return <ChevronsUpDown size={12} className="opacity-40" />
  return sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
}

interface FeaturesMatrixProps {
  features: FeatureType[]
}

export function FeaturesMatrix({ features }: FeaturesMatrixProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  function handleSort(col: SortColumn) {
    if (sortColumn === col) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

  const sorted = [...features].sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1
    if (sortColumn === 'title') {
      return a.title.localeCompare(b.title) * dir
    }
    if (sortColumn === 'stage') {
      const stageA = STAGE_ORDER[a.status?.stage ?? PRODUCT_STAGES.GA]
      const stageB = STAGE_ORDER[b.status?.stage ?? PRODUCT_STAGES.GA]
      return (stageA - stageB) * dir
    }
    if (sortColumn === 'selfHosted') {
      const valA = a.status?.availableOnSelfHosted ? 1 : 0
      const valB = b.status?.availableOnSelfHosted ? 1 : 0
      return (valA - valB) * dir
    }
    return 0
  })

  const thClass =
    'px-3 py-2.5 text-left text-xs font-medium text-foreground-lighter uppercase tracking-wider whitespace-nowrap'
  const sortableThClass = cn(thClass, 'cursor-pointer select-none')

  return (
    <div className="mt-0 w-full overflow-x-auto rounded-b-xl border border-muted">
      <table className="w-full text-sm border-collapse table-fixed mt-0">
        <colgroup>
          <col />
          <col className="hidden md:table-column w-44" />
          <col className="w-28" />
          <col className="w-28" />
        </colgroup>
        <thead>
          <tr className="border-b border-muted bg-surface-100">
            <th className={sortableThClass} onClick={() => handleSort('title')}>
              <span className="flex items-center gap-1.5">
                Feature
                <SortIcon column="title" sortColumn={sortColumn} sortDirection={sortDirection} />
              </span>
            </th>
            <th className={cn(thClass, 'hidden md:table-cell')}>Products</th>
            <th className={sortableThClass} onClick={() => handleSort('stage')}>
              <span className="flex items-center gap-1.5">
                Stage
                <SortIcon column="stage" sortColumn={sortColumn} sortDirection={sortDirection} />
              </span>
            </th>
            <th className={sortableThClass} onClick={() => handleSort('selfHosted')}>
              <span className="flex items-center gap-1.5">
                Self-Hosted
                <SortIcon column="selfHosted" sortColumn={sortColumn} sortDirection={sortDirection} />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((feature, i) => {
            const selfHosted = feature.status?.availableOnSelfHosted
            const tooling = feature.status?.selfHostedTooling
            return (
              <tr
                key={feature.slug}
                className={cn(
                  'border-b border-muted last:border-0 transition-colors hover:bg-surface-100 group/row',
                  i % 2 === 0 ? 'bg-background' : 'bg-surface-75'
                )}
              >
                <td className="px-3 py-3 min-w-0">
                  <Link
                    href={`/features/${feature.slug}`}
                    className="flex items-center gap-2 text-foreground hover:text-foreground-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter rounded min-w-0"
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-md bg-surface-200 border border-muted flex items-center justify-center">
                      <feature.icon className="w-3.5 h-3.5 text-foreground-light group-hover/row:text-foreground transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-sm leading-tight block">{feature.title}</span>
                      <span className="hidden sm:block text-foreground-lighter text-xs leading-tight truncate">
                        {feature.subtitle}
                      </span>
                    </div>
                    <ExternalLink
                      size={12}
                      className="flex-shrink-0 opacity-0 group-hover/row:opacity-50 transition-opacity"
                    />
                  </Link>
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {feature.products.map((product) => (
                      <span
                        key={product}
                        className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-200 text-foreground-light border border-muted capitalize"
                      >
                        {productLabel(product)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3">
                  {feature.status ? (
                    <Badge variant={stageBadgeVariant(feature.status.stage)}>
                      {stageLabel(feature.status.stage)}
                    </Badge>
                  ) : (
                    <span className="text-foreground-muted text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {selfHosted ? (
                    <div className="flex items-center gap-1.5">
                      <Check size={14} className="text-brand flex-shrink-0" />
                      {tooling && (
                        <a
                          href={tooling.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-foreground-lighter hover:text-foreground transition-colors underline underline-offset-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          via {tooling.label}
                        </a>
                      )}
                    </div>
                  ) : (
                    <Minus size={14} className="text-foreground-muted" />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="px-4 py-8 text-center text-foreground-lighter text-sm">
          No features found with these filters
        </div>
      )}
    </div>
  )
}
