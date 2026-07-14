import { useParams } from 'common'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Clock } from 'lucide-react'
import { useState } from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { EDGE_FUNCTION_CHART_INTERVALS, formatShortFromNow } from './EdgeFunctionOverview.utils'
import CopyButton from '@/components/ui/CopyButton'
import { ChartIntervalDropdown } from '@/components/ui/Logs/ChartIntervalDropdown'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

dayjs.extend(relativeTime)

interface EdgeFunctionOverviewHeaderProps {
  interval: string
  onIntervalChange: (interval: string) => void
  showIntervalDropdown?: boolean
  onIntervalDropdownOpenChange?: (open: boolean) => void
}

export const EdgeFunctionOverviewHeader = ({
  interval,
  onIntervalChange,
  showIntervalDropdown,
  onIntervalDropdownOpenChange,
}: EdgeFunctionOverviewHeaderProps) => {
  const { ref: projectRef, functionSlug } = useParams()
  const [isTimestampHoverCardOpen, setIsTimestampHoverCardOpen] = useState(false)
  const { data: organization } = useSelectedOrganizationQuery()

  const { data: selectedFunction } = useEdgeFunctionQuery({
    projectRef,
    slug: functionSlug,
  })
  const { data: endpoint } = useProjectApiUrl({ projectRef })

  const name = selectedFunction?.name || ''
  const functionUrl =
    endpoint && selectedFunction?.slug ? `${endpoint}/functions/v1/${selectedFunction.slug}` : ''
  const createdRelative = selectedFunction?.created_at
    ? dayjs(selectedFunction.created_at).fromNow()
    : undefined
  const updatedRelative = selectedFunction?.updated_at
    ? dayjs(selectedFunction.updated_at).fromNow()
    : undefined
  const updatedShortRelative = selectedFunction?.updated_at
    ? formatShortFromNow(selectedFunction.updated_at)
    : undefined

  return (
    <PageHeader size="full" className="pt-12 pb-12">
      <PageHeaderMeta>
        <PageHeaderSummary>
          <PageHeaderTitle>{name || functionSlug}</PageHeaderTitle>
          <PageHeaderDescription className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-sm!">
            {functionUrl ? (
              <div className="flex items-center gap-x-2">
                <span className="flex items-center gap-2">{functionUrl}</span>
                <ShortcutTooltip shortcutId={SHORTCUT_IDS.FUNCTION_DETAIL_COPY_URL} side="bottom">
                  <CopyButton iconOnly variant="text" text={functionUrl} />
                </ShortcutTooltip>
              </div>
            ) : null}

            <HoverCard
              openDelay={250}
              closeDelay={100}
              open={isTimestampHoverCardOpen}
              onOpenChange={setIsTimestampHoverCardOpen}
            >
              <HoverCardTrigger asChild>
                <button type="button" className="flex items-center gap-2 group">
                  <Clock size={16} strokeWidth={1.5} className="text-foreground-lighter" />
                  <span className="transition text-foreground-light group-hover:text-foreground underline decoration-dotted decoration-foreground-muted underline-offset-4">
                    {updatedShortRelative ?? 'Deploy status unavailable'}
                  </span>
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="bottom" align="start" className="w-40 p-0">
                {createdRelative && (
                  <div className="px-4 py-2 space-y-1">
                    <h3 className="heading-meta text-foreground-light">Created</h3>
                    {!!selectedFunction && (
                      <TimestampInfo
                        className="text-sm"
                        label={createdRelative}
                        utcTimestamp={selectedFunction.created_at}
                      />
                    )}
                  </div>
                )}
                {updatedRelative && (
                  <div className="px-4 py-2 space-y-1">
                    <h3 className="heading-meta text-foreground-light">Last deployed</h3>
                    {!!selectedFunction && (
                      <TimestampInfo
                        className="text-sm"
                        label={updatedRelative}
                        utcTimestamp={selectedFunction.updated_at}
                      />
                    )}
                  </div>
                )}
                {selectedFunction?.version !== undefined && (
                  <div className="px-4 py-2 space-y-1">
                    <h3 className="heading-meta text-foreground-light">Deployments</h3>
                    <p className="text-sm text-foreground">{selectedFunction.version}</p>
                  </div>
                )}
              </HoverCardContent>
            </HoverCard>
          </PageHeaderDescription>
        </PageHeaderSummary>
        <PageHeaderAside className="flex-wrap @xl:self-center">
          <ChartIntervalDropdown
            value={interval}
            onChange={onIntervalChange}
            intervals={EDGE_FUNCTION_CHART_INTERVALS}
            organizationSlug={organization?.slug}
            dropdownAlign="end"
            tooltipSide="left"
            open={showIntervalDropdown}
            onOpenChange={onIntervalDropdownOpenChange}
          />
        </PageHeaderAside>
      </PageHeaderMeta>
    </PageHeader>
  )
}
