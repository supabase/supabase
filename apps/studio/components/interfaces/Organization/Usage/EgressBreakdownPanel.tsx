import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { ReactNode, useState } from 'react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import Table from '@/components/to-be-cleaned/Table'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useEgressReport } from '@/data/reports/egress-report-query'

interface TopPathRow {
  path: string
  count: number
}

interface TopConsumerRow {
  user_agent: string
  ip: string
  count: number
}

const headerClasses = 'text-xs! py-2! font-bold bg-surface-200!'
const cellClasses = 'text-xs! py-2!'

const LoadingRows = () => (
  <div className="space-y-2">
    <ShimmeringLoader />
    <ShimmeringLoader className="w-3/4" />
    <ShimmeringLoader className="w-1/2" />
  </div>
)

const EgressTopPaths = ({ projectRef }: { projectRef: string }) => {
  const { data, error, isLoading } = useEgressReport(projectRef)
  const rows = (data.topPaths ?? []) as unknown as TopPathRow[]

  if (isLoading) return <LoadingRows />
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

const EgressTopConsumers = ({ projectRef }: { projectRef: string }) => {
  const { data, error, isLoading } = useEgressReport(projectRef)
  const rows = (data.topConsumers ?? []) as unknown as TopConsumerRow[]

  if (isLoading) return <LoadingRows />
  if (error) {
    return (
      <p className="text-sm text-foreground-light">Could not load the top consumers right now.</p>
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
          <Table.th className={headerClasses}>User agent</Table.th>
          <Table.th className={headerClasses}>IP</Table.th>
          <Table.th className={`${headerClasses} text-right`}>Requests</Table.th>
        </>
      }
      body={rows.map((row) => (
        <Table.tr key={`${row.user_agent}-${row.ip}`}>
          <Table.td className={cellClasses}>
            <span className="truncate max-w-xs text-foreground-light">
              {row.user_agent || 'Unknown'}
            </span>
          </Table.td>
          <Table.td className={cellClasses}>
            <span className="font-mono text-foreground-light">{row.ip || 'Unknown'}</span>
          </Table.td>
          <Table.td className={`${cellClasses} text-right`}>{row.count.toLocaleString()}</Table.td>
        </Table.tr>
      ))}
    />
  )
}

const BreakdownSection = ({
  showLabel,
  hideLabel,
  children,
}: {
  showLabel: string
  hideLabel: string
  children: ReactNode
}) => {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-3">
      <CollapsibleTrigger asChild>
        <Button icon={open ? <ChevronDownIcon /> : <ChevronRightIcon />}>
          {open ? hideLabel : showLabel}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>{open && children}</CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Collapsible egress breakdowns shown inside the usage Egress section: the top
 * API paths and the top consumers (user-agent + IP) that drive them. Each is
 * collapsed by default, so a query runs only on expand. When no single project
 * is selected, disabled triggers with a tooltip replace them.
 */
export const EgressBreakdownPanel = () => {
  const [{ projectRef }] = useQueryStates({ projectRef: parseAsString })

  if (!projectRef) {
    return (
      <div className="flex flex-wrap gap-2">
        {['Show top API paths', 'Show top consumers'].map((label) => (
          <ButtonTooltip
            key={label}
            disabled
            icon={<ChevronRightIcon />}
            tooltip={{
              content: { side: 'bottom', text: 'Select a single project to view the breakdown' },
            }}
          >
            {label}
          </ButtonTooltip>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <BreakdownSection showLabel="Show top API paths" hideLabel="Hide top API paths">
        <EgressTopPaths projectRef={projectRef} />
      </BreakdownSection>
      <BreakdownSection showLabel="Show top consumers" hideLabel="Hide top consumers">
        <EgressTopConsumers projectRef={projectRef} />
      </BreakdownSection>
    </div>
  )
}
