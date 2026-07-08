import { Check, ChevronDown, ChevronsUpDown, ChevronUp, ExternalLink, Minus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Badge, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

import type { FeatureType } from '@/data/features'
import { PRODUCT_STAGES } from '@/data/features'

type SortColumn = 'title' | 'stage' | 'selfHosted'
type SortDirection = 'asc' | 'desc'

const STAGE_ORDER: Record<PRODUCT_STAGES, number> = {
  [PRODUCT_STAGES.PRIVATE_ALPHA]: 0,
  [PRODUCT_STAGES.PUBLIC_ALPHA]: 1,
  [PRODUCT_STAGES.BETA]: 2,
  [PRODUCT_STAGES.PUBLIC_BETA]: 3,
  [PRODUCT_STAGES.GA]: 4,
}

export function stageBadgeVariant(
  stage: PRODUCT_STAGES
): 'default' | 'warning' | 'success' | 'destructive' {
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

export function stageLabel(stage: PRODUCT_STAGES): string {
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

export function productLabel(product: string): string {
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

function SortIcon({
  column,
  sortColumn,
  sortDirection,
}: {
  column: SortColumn
  sortColumn: SortColumn
  sortDirection: SortDirection
}) {
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
    <div className="w-full overflow-x-auto max-w-full rounded-md border border-muted">
      <Table className="mt-0! table-fixed">
        <colgroup>
          <col className="w-auto" />
          <col className="hidden md:table-column w-30" />
          <col className="w-28" />
          <col className="w-28" />
        </colgroup>
        <TableHeader>
          <TableRow className="border-t-0">
            <TableHead
              className={cn(sortableThClass, 'md:w-96')}
              onClick={() => handleSort('title')}
            >
              <span className="flex items-center gap-1.5">
                Feature
                <SortIcon column="title" sortColumn={sortColumn} sortDirection={sortDirection} />
              </span>
            </TableHead>
            <TableHead className={cn(thClass, 'hidden md:table-cell')}>Products</TableHead>
            <TableHead className={sortableThClass} onClick={() => handleSort('stage')}>
              <span className="flex items-center gap-1.5">
                Stage
                <SortIcon column="stage" sortColumn={sortColumn} sortDirection={sortDirection} />
              </span>
            </TableHead>
            <TableHead className={sortableThClass} onClick={() => handleSort('selfHosted')}>
              <span className="flex items-center gap-1.5">
                Self-Hosted
                <SortIcon
                  column="selfHosted"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((feature, i) => {
            const selfHosted = feature.status?.availableOnSelfHosted
            const tooling = feature.status?.selfHostedTooling
            return (
              <TableRow
                key={feature.slug}
                className={cn(
                  'border-b border-muted last:border-0 transition-colors hover:bg-surface-100 group/row',
                  i % 2 === 0 ? 'bg-background' : 'bg-surface-75'
                )}
              >
                <TableCell className="px-3 py-3 min-w-0 hover:bg-transparent!">
                  <Link
                    href={`/features/${feature.slug}`}
                    className="flex items-center gap-2 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter rounded min-w-0"
                  >
                    <div className="shrink-0 w-7 h-7 rounded-md bg-surface-200 border border-muted hidden md:flex items-center justify-center">
                      <feature.icon className="w-3.5 h-3.5 text-foreground-light group-hover/row:text-foreground transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-sm leading-tight block text-foreground">
                        {feature.title}
                      </span>
                      <span className="hidden sm:block text-foreground-lighter text-xs leading-tight truncate">
                        {feature.subtitle}
                      </span>
                    </div>
                    <ExternalLink
                      size={12}
                      className="shrink-0 opacity-0 group-hover/row:opacity-50 transition-opacity"
                    />
                  </Link>
                </TableCell>
                <TableCell className="px-3 py-3 hidden md:table-cell hover:bg-transparent!">
                  <div className="flex flex-wrap gap-1">
                    {feature.products.map((product) => (
                      <span
                        key={product}
                        className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-200 text-foreground-light border capitalize"
                      >
                        {productLabel(product)}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="px-3 py-3 hover:bg-transparent!">
                  {feature.status ? (
                    <Badge variant={stageBadgeVariant(feature.status.stage)}>
                      {stageLabel(feature.status.stage)}
                    </Badge>
                  ) : (
                    <span className="text-foreground-muted text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="px-3 py-3 hover:bg-transparent!">
                  {selfHosted ? (
                    <div className="flex items-center gap-1.5">
                      <Check size={14} className="text-brand shrink-0" />
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
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {sorted.length === 0 && (
        <div className="px-4 py-8 text-center text-foreground-lighter text-sm">
          No features found with these filters
        </div>
      )}
    </div>
  )
}
