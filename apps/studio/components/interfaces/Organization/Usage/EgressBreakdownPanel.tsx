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
import { formatBytes } from '@/lib/helpers'

// Log rows arrive untyped (LogData[]); parse at the boundary instead of casting.
// coerce handles BigQuery integers and OTEL floats alike.
const TopPathsSchema = z.array(
  z.object({
    path: z.string(),
    count: z.coerce.number(),
    egress_bytes: z.coerce.number(),
  })
)

const EgressTopPaths = ({ projectRef }: { projectRef: string }) => {
  const { logData, error, isLoading } = useEgressReport(projectRef)
  const parsed = TopPathsSchema.safeParse(logData)
  // The query also limits to 5; cap here too so the panel never grows past 5 rows.
  const rows = parsed.success ? parsed.data.slice(0, 5) : []

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading top API paths" className="space-y-2">
        <ShimmeringLoader />
        <ShimmeringLoader className="w-3/4" />
        <ShimmeringLoader className="w-1/2" />
      </div>
    )
  }

  if (error) {
    const message =
      typeof error === 'string' ? error : 'Could not load the top API paths right now.'
    return (
      <AlertError
        error={{ message }}
        subject="Failed to load top API paths"
        projectRef={projectRef}
      />
    )
  }

  if (rows.length === 0) {
    return <p className="text-sm text-foreground-light">No API requests in the past 24 hours.</p>
  }

  const headerClasses = 'text-xs! py-2! font-bold'
  const cellClasses = 'text-xs! py-2!'

  return (
    <div className="space-y-2">
      <p className="text-xs text-foreground-lighter">
        Top 5 paths by response size in the last 24 hours. This is an estimate and can differ from
        billed egress.
      </p>
      <Table
        className="table-fixed w-full"
        head={
          <>
            <Table.th className={headerClasses}>Endpoint</Table.th>
            <Table.th className={`${headerClasses} text-right w-28`}>Egress</Table.th>
            <Table.th className={`${headerClasses} text-right w-28`}>Requests</Table.th>
          </>
        }
        body={rows.map((row) => (
          <Table.tr key={row.path}>
            <Table.td className={cellClasses}>
              <span className="block truncate font-mono text-foreground-light" title={row.path}>
                {row.path}
              </span>
            </Table.td>
            <Table.td className={`${cellClasses} text-right whitespace-nowrap`}>
              {formatBytes(row.egress_bytes)}
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
export const EgressBreakdownPanel = () => {
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
