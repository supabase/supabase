import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { useState } from 'react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import { TopApiRoutesRenderer } from '@/components/interfaces/Reports/renderers/ApiRenderers'
import {
  CacheHitRateChartRenderer,
  TopCacheMissesRenderer,
} from '@/components/interfaces/Reports/renderers/StorageRenderers'
import ReportWidget from '@/components/interfaces/Reports/ReportWidget'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useEgressReport } from '@/data/reports/egress-report-query'

export type EgressBreakdownKind = 'rest' | 'cache'

const EgressBreakdownChart = ({
  projectRef,
  kind,
}: {
  projectRef: string
  kind: EgressBreakdownKind
}) => {
  const { data, error, isLoading } = useEgressReport(projectRef)

  if (kind === 'rest') {
    return (
      <ReportWidget
        isLoading={isLoading}
        title="Top API paths by requests"
        tooltip="Ranked by request count for the last hour. Logs do not yet include response bytes."
        data={data.topRoutes || []}
        error={error.topRoutes}
        renderer={TopApiRoutesRenderer}
      />
    )
  }

  return (
    <ReportWidget
      isLoading={isLoading}
      title="Request caching"
      tooltip="Share of storage requests served from the edge cache. A higher hit rate lowers uncached egress."
      data={data.cacheHitRate || []}
      error={error.cacheHitRate}
      renderer={CacheHitRateChartRenderer}
      append={TopCacheMissesRenderer}
      appendProps={{ data: data.topCacheMisses || [] }}
    />
  )
}

/**
 * Collapsible, project-scoped egress breakdown shown inside a usage section.
 * Collapsed by default. When no single project is selected it renders a
 * disabled trigger with a tooltip, matching the Debug egress button.
 */
export const EgressBreakdownPanel = ({ kind }: { kind: EgressBreakdownKind }) => {
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
        Show request breakdown
      </ButtonTooltip>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-3">
      <CollapsibleTrigger asChild>
        <Button icon={open ? <ChevronDownIcon /> : <ChevronRightIcon />}>
          {open ? 'Hide request breakdown' : 'Show request breakdown'}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {open && <EgressBreakdownChart projectRef={projectRef} kind={kind} />}
      </CollapsibleContent>
    </Collapsible>
  )
}
