import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { z } from 'zod'

import Table from '@/components/to-be-cleaned/Table'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useEgressReport } from '@/data/reports/egress-report-query'
import type { OrgMetricsUsage } from '@/data/usage/org-usage-query'

// Log rows arrive untyped (LogData[]); parse at the boundary instead of casting.
// coerce handles the BigQuery integer count and the OTEL float count alike.
const TopPathsSchema = z.array(
  z.object({
    status_code: z.coerce.number().optional(),
    path: z.string(),
    count: z.coerce.number(),
  })
)

// Only surface the breakdown (and run its query) once a project is at least
// this fraction of its egress quota. Keeps the log query off the many projects
// that are nowhere near their limit.
const USAGE_THRESHOLD = 0.5

const EgressTopPaths = ({ projectRef }: { projectRef: string }) => {
  const { data, error, isLoading } = useEgressReport(projectRef)
  const parsed = TopPathsSchema.safeParse(data.topPaths ?? [])
  const rows = parsed.success ? parsed.data : []

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading top API paths" className="space-y-2">
        <ShimmeringLoader />
        <ShimmeringLoader className="w-3/4" />
        <ShimmeringLoader className="w-1/2" />
      </div>
    )
  }

  if (error.topPaths) {
    const message =
      typeof error.topPaths === 'string'
        ? error.topPaths
        : 'Could not load the top API paths right now.'
    return (
      <AlertError
        error={{ message }}
        subject="Failed to load top API paths"
        projectRef={projectRef}
      />
    )
  }

  if (rows.length === 0) {
    return <p className="text-sm text-foreground-light">No REST API requests in the last hour.</p>
  }

  // Sticky header stays visible while the body scrolls (~4 rows tall).
  const headerClasses = 'text-xs! py-2! font-bold bg-surface-200! sticky top-0 z-10'
  const cellClasses = 'text-xs! py-2!'

  return (
    <div className="space-y-2">
      <p className="text-xs text-foreground-lighter">Based on the past hour of requests.</p>
      <Table
        className="table-fixed w-full"
        containerClassName="max-h-44 overflow-y-auto"
        head={
          <>
            <Table.th className={`${headerClasses} w-16`}>Status</Table.th>
            <Table.th className={headerClasses}>Endpoint</Table.th>
            <Table.th className={`${headerClasses} text-right w-28`}>Requests</Table.th>
          </>
        }
        body={rows.map((row) => (
          <Table.tr key={`${row.status_code ?? 'na'}-${row.path}`}>
            <Table.td className={`${cellClasses} font-mono text-foreground-light`}>
              {row.status_code || '—'}
            </Table.td>
            <Table.td className={cellClasses}>
              <span className="block truncate font-mono text-foreground-light" title={row.path}>
                {row.path}
              </span>
            </Table.td>
            <Table.td className={`${cellClasses} text-right whitespace-nowrap`}>
              {row.count.toLocaleString()}
            </Table.td>
          </Table.tr>
        ))}
      />
    </div>
  )
}

/**
 * Collapsible, endpoint-level top API paths shown inside the usage Egress
 * section. Collapsed by default, so the query runs only on expand. When no
 * single project is selected it renders a disabled trigger with a tooltip,
 * matching the rest of the egress affordances.
 */
export const EgressBreakdownPanel = ({ usageMeta }: { usageMeta?: OrgMetricsUsage }) => {
  const [{ projectRef }] = useQueryStates({ projectRef: parseAsString })
  const [open, setOpen] = useState(false)

  if (!projectRef) {
    return (
      <ButtonTooltip
        disabled
        icon={<ChevronRightIcon />}
        tooltip={{
          content: { side: 'bottom', text: 'Select a single project to view the breakdown' },
        }}
      >
        Show top API paths
      </ButtonTooltip>
    )
  }

  // When the project has a known egress quota and is below the threshold, show a
  // quiet hint instead of the control — nothing queries until it matters.
  const freeUnits = usageMeta?.pricing_free_units ?? 0
  const usageRatio = freeUnits > 0 ? (usageMeta?.usage ?? 0) / freeUnits : undefined
  if (usageRatio !== undefined && usageRatio < USAGE_THRESHOLD) {
    return (
      <p className="text-sm text-foreground-light">
        Egress is under {Math.round(USAGE_THRESHOLD * 100)}% of your quota. The top API paths
        breakdown appears as you get closer to it.
      </p>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-3">
      <CollapsibleTrigger asChild>
        <Button icon={open ? <ChevronDownIcon /> : <ChevronRightIcon />}>
          {open ? 'Hide top API paths' : 'Show top API paths'}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>{open && <EgressTopPaths projectRef={projectRef} />}</CollapsibleContent>
    </Collapsible>
  )
}
