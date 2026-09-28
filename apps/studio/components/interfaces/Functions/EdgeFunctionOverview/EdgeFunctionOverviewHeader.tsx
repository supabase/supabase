import { useParams } from 'common'
import dayjs from 'dayjs'
import { Clock } from 'lucide-react'
import type { ReactNode } from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import CopyButton from '@/components/ui/CopyButton'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

interface EdgeFunctionOverviewHeaderProps {
  /** Controls shown beside the name and URL, e.g. the chart period selector */
  actions?: ReactNode
}

/**
 * Top section of an edge function's Overview tab: the function name, its invoke URL and when it
 * was last deployed.
 */
export const EdgeFunctionOverviewHeader = ({ actions }: EdgeFunctionOverviewHeaderProps) => {
  const { ref: projectRef, functionSlug } = useParams()
  const { data: selectedFunction, isPending: isLoadingFunction } = useEdgeFunctionQuery({
    projectRef,
    slug: functionSlug,
  })
  const { data: endpoint } = useProjectApiUrl({ projectRef })

  const functionUrl =
    endpoint && selectedFunction?.slug ? `${endpoint}/functions/v1/${selectedFunction.slug}` : ''
  const createdRelative = selectedFunction?.created_at
    ? dayjs(selectedFunction.created_at).fromNow()
    : undefined
  const updatedRelative = selectedFunction?.updated_at
    ? dayjs(selectedFunction.updated_at).fromNow()
    : undefined

  return (
    <PageHeader>
      <PageHeaderMeta>
        <PageHeaderSummary>
          <PageHeaderTitle>{selectedFunction?.name || functionSlug}</PageHeaderTitle>
          <PageHeaderDescription className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1 text-sm!">
            {isLoadingFunction && <ShimmeringLoader className="h-4 w-64 py-0" />}
            {!!functionUrl && (
              <span className="flex items-center gap-x-2">
                <span className="break-all">{functionUrl}</span>
                <ShortcutTooltip shortcutId={SHORTCUT_IDS.FUNCTION_DETAIL_COPY_URL} side="bottom">
                  <CopyButton iconOnly variant="text" text={functionUrl} />
                </ShortcutTooltip>
              </span>
            )}

            {!!selectedFunction && (
              <HoverCard openDelay={250} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button type="button" tabIndex={0} className="flex items-center gap-2 group">
                    <Clock size={16} strokeWidth={1.5} className="text-foreground-lighter" />
                    <span className="transition text-foreground-light group-hover:text-foreground underline decoration-dotted decoration-foreground-muted underline-offset-4">
                      {updatedRelative ?? 'Deploy status unavailable'}
                    </span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent side="bottom" align="start" className="w-40 p-0">
                  {createdRelative && (
                    <div className="px-4 py-2 space-y-1">
                      <h3 className="heading-meta text-foreground-light">Created</h3>
                      <TimestampInfo
                        className="text-sm"
                        label={createdRelative}
                        utcTimestamp={selectedFunction.created_at}
                      />
                    </div>
                  )}
                  {updatedRelative && (
                    <div className="px-4 py-2 space-y-1">
                      <h3 className="heading-meta text-foreground-light">Last deployed</h3>
                      <TimestampInfo
                        className="text-sm"
                        label={updatedRelative}
                        utcTimestamp={selectedFunction.updated_at}
                      />
                    </div>
                  )}
                  {selectedFunction.version !== undefined && (
                    <div className="px-4 py-2 space-y-1">
                      <h3 className="heading-meta text-foreground-light">Deployments</h3>
                      <p className="text-sm text-foreground">{selectedFunction.version}</p>
                    </div>
                  )}
                </HoverCardContent>
              </HoverCard>
            )}
          </PageHeaderDescription>
        </PageHeaderSummary>
        {actions && <PageHeaderAside>{actions}</PageHeaderAside>}
      </PageHeaderMeta>
    </PageHeader>
  )
}
