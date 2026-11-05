import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import Table from '@/components/to-be-cleaned/Table'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useEgressReport } from '@/data/reports/egress-report-query'

interface TopPathRow {
  path: string
  count: number
}

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
