import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import Table from '@/components/to-be-cleaned/Table'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useEgressReport, useEgressTopQueries } from '@/data/reports/egress-report-query'

interface TopPathRow {
  path: string
  count: number
}

const BreakdownLoader = () => (
  <div className="space-y-2">
    <ShimmeringLoader />
    <ShimmeringLoader className="w-3/4" />
    <ShimmeringLoader className="w-1/2" />
  </div>
)

const headerClasses = 'text-xs! py-2! font-bold bg-surface-200!'
const cellClasses = 'text-xs! py-2!'

const EgressTopPaths = ({ projectRef }: { projectRef: string }) => {
  const { data, error, isLoading } = useEgressReport(projectRef)
  const rows = (data.topPaths ?? []) as unknown as TopPathRow[]

  if (isLoading) return <BreakdownLoader />
  if (error) {
    return (
      <p className="text-sm text-foreground-light">Could not load the top API paths right now.</p>
    )
  }
  if (rows.length === 0) {
    return <p className="text-sm text-foreground-light">No REST API requests in this period.</p>
  }

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

const EgressTopQueries = ({ projectRef }: { projectRef: string }) => {
  const { data, error, isLoading } = useEgressTopQueries(projectRef)
  const rows = data ?? []

  if (isLoading) return <BreakdownLoader />
  if (error) {
    return (
      <p className="text-sm text-foreground-light">
        Could not load the top queries. This needs the `pg_stat_statements` extension enabled.
      </p>
    )
  }
  if (rows.length === 0) {
    return <p className="text-sm text-foreground-light">No query statistics available yet.</p>
  }

  return (
    <Table
      containerClassName="overflow-x-auto"
      head={
        <>
          <Table.th className={headerClasses}>Query</Table.th>
          <Table.th className={`${headerClasses} text-right`}>Calls</Table.th>
          <Table.th className={`${headerClasses} text-right`}>Avg rows</Table.th>
        </>
      }
      body={rows.map((row, i) => (
        <Table.tr key={i}>
          <Table.td className={cellClasses}>
            <p className="font-mono text-foreground-light truncate max-w-md">{row.query}</p>
          </Table.td>
          <Table.td className={`${cellClasses} text-right`}>
            {Number(row.calls).toLocaleString()}
          </Table.td>
          <Table.td className={`${cellClasses} text-right`}>{row.avg_rows}</Table.td>
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
        Show egress breakdown
      </ButtonTooltip>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-3">
      <CollapsibleTrigger asChild>
        <Button icon={open ? <ChevronDownIcon /> : <ChevronRightIcon />}>
          {open ? 'Hide egress breakdown' : 'Show egress breakdown'}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-6">
        {open && (
          <>
            <div className="space-y-2">
              <p className="text-sm">Top API paths by requests</p>
              <EgressTopPaths projectRef={projectRef} />
            </div>
            <div className="space-y-2">
              <p className="text-sm">Top queries</p>
              <EgressTopQueries projectRef={projectRef} />
            </div>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
