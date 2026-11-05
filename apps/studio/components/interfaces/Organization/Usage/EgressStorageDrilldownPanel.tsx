import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import Table from '@/components/to-be-cleaned/Table'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useEgressStorageReport } from '@/data/reports/egress-storage-report-query'

interface StoragePathRow {
  path: string
  count: number
}

const EgressStoragePaths = ({ projectRef }: { projectRef: string }) => {
  const { data, error, isLoading } = useEgressStorageReport(projectRef)
  const rows = (data.topStoragePaths ?? []) as unknown as StoragePathRow[]

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
      <p className="text-sm text-foreground-light">Could not load the top storage objects right now.</p>
    )
  }

  if (rows.length === 0) {
    return <p className="text-sm text-foreground-light">No Storage object requests in this period.</p>
  }

  const headerClasses = 'text-xs! py-2! font-bold bg-surface-200!'
  const cellClasses = 'text-xs! py-2!'

  return (
    <Table
      containerClassName="overflow-x-auto"
      head={
        <>
          <Table.th className={headerClasses}>Object path</Table.th>
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
 * Collapsible, per-object storage drill-down shown inside the Cached vs uncached
 * egress section. Collapsed by default (runs only on expand). When no single
 * project is selected it renders a disabled trigger with a tooltip, matching the
 * other egress affordances.
 */
export const EgressStorageDrilldownPanel = () => {
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
        Show top storage objects
      </ButtonTooltip>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-3">
      <CollapsibleTrigger asChild>
        <Button icon={open ? <ChevronDownIcon /> : <ChevronRightIcon />}>
          {open ? 'Hide top storage objects' : 'Show top storage objects'}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {open && <EgressStoragePaths projectRef={projectRef} />}
      </CollapsibleContent>
    </Collapsible>
  )
}
