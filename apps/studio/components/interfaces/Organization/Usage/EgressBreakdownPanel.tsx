import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import Table from '@/components/to-be-cleaned/Table'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useEgressReport } from '@/data/reports/egress-report-query'
import type { OrgMetricsUsage } from '@/data/usage/org-usage-query'

interface TopPathRow {
  path: string
  count: number
}

// Only surface the breakdown (and run its query) once a project is at least
// this fraction of its egress quota. Keeps the log query off the many projects
// that are nowhere near their limit.
const USAGE_THRESHOLD = 0.5

const EgressTopPaths = ({ projectRef }: { projectRef: string }) => {
  const { data, error, isLoading } = useEgressReport(projectRef)
  const rows = (data.topPaths ?? []) as unknown as TopPathRow[]

  if (isLoading) {
    return (
      <div className="space-y-2">
        <ShimmeringLoader />
        <ShimmeringLoader className="w-3/4" />
        <ShimmeringLoader className="w-1/2" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-foreground-light">Could not load the top API paths right now.</p>
    )
  }

  if (rows.length === 0) {
    return <p className="text-sm text-foreground-light">No REST API requests in this period.</p>
  }

  const headerClasses = 'text-xs! py-2! font-bold bg-surface-200!'
  const cellClasses = 'text-xs! py-2!'

  return (
    <Table
      containerClassName="overflow-x-auto"
      head={
        <>
          <Table.th className={headerClasses}>Endpoint</Table.th>
          <Table.th className={`${headerClasses} text-right`}>Requests</Table.th>
        </>
      }
      body={rows.map((row) => (
        <Table.tr key={row.path}>
          <Table.td className={cellClasses}>
            <span className="font-mono text-foreground-light">{row.path}</span>
          </Table.td>
          <Table.td className={`${cellClasses} text-right`}>{row.count.toLocaleString()}</Table.td>
        </Table.tr>
      ))}
    />
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
