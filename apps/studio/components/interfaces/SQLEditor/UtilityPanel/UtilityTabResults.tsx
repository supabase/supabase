import { useParams } from 'common'
import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { AiAssistantDropdown } from 'components/ui/AiAssistantDropdown'
import CopyButton from 'components/ui/CopyButton'
import { InlineLink, InlineLinkClassName } from 'components/ui/InlineLink'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { DOCS_URL } from 'lib/constants'
import { ExternalLink, Loader2 } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { forwardRef } from 'react'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import Results from './Results'

export type UtilityTabResultsProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  onDebug: () => void
  buildDebugPrompt: () => string
  isDebugging?: boolean
}

const UtilityTabResults = forwardRef<HTMLDivElement, UtilityTabResultsProps>(
  ({ id, isExecuting, isDisabled, isDebugging, onDebug, buildDebugPrompt }) => {
    const { ref } = useParams()
    const state = useDatabaseSelectorStateSnapshot()
    const { data: organization } = useSelectedOrganizationQuery()
    const snapV2 = useSqlEditorV2StateSnapshot()
    const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))

    const result = snapV2.results[id]?.[0]
    const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })

    // Customers on HIPAA plans should not have access to Supabase AI
    const { data: projectSettings } = useProjectSettingsV2Query({ projectRef: ref })
    const hasHipaaAddon = subscriptionHasHipaaAddon(subscription) && projectSettings?.is_sensitive

    const isTimeout =
      result?.error?.message?.includes('canceling statement due to statement timeout') ||
      result?.error?.message?.includes('upstream request timeout') ||
      result?.error?.message?.includes('Query read timeout')

    const isNetWorkError = result?.error?.message?.includes('EHOSTUNREACH')

    if (isExecuting) {
      return (
        <div className="flex items-center gap-x-4 px-6 py-4 bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark">
          <Loader2 size={14} className="animate-spin" />
          <p className="m-0 border-0 font-mono text-sm">Running...</p>
        </div>
      )
    } else if (result?.error) {
      const formattedError = (result.error?.formattedError?.split('\n') ?? []).filter(
        (x: string) => x.length > 0
      )
      const readReplicaError =
        state.selectedDatabaseId !== ref &&
        result.error.message.includes('in a read-only transaction')
      const payloadTooLargeError = result.error.message.includes(
        'Query is too large to be run via the SQL Editor'
      )

      return (
        <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark overflow-y-auto">
          <div className="flex flex-row justify-between items-start py-4 px-6 gap-x-4">
            {isTimeout ? (
              <div className="flex flex-col gap-y-1">
                <p className="font-mono text-sm tracking-tight">
                  Error: SQL query ran into an upstream timeout
                </p>
                <p className="text-sm text-foreground-light">
                  You can either{' '}
                  <InlineLink
                    href={`${DOCS_URL}/guides/platform/performance#examining-query-performance`}
                  >
                    optimize your query
                  </InlineLink>
                  , or{' '}
                  <InlineLink href={`${DOCS_URL}/guides/database/timeouts`}>
                    increase the statement timeout
                  </InlineLink>
                  {' or '}
                  <span
                    className={cn(InlineLinkClassName, 'cursor-pointer')}
                    onClick={() => setShowConnect(true)}
                  >
                    connect to your database directly
                  </span>
                  .
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-y-1">
                {formattedError.length > 0 ? (
                  formattedError.map((x: string, i: number) => (
                    <pre key={`error-${i}`} className="font-mono text-sm text-wrap">
                      {x}
                    </pre>
                  ))
                ) : (
                  <p className="font-mono text-sm tracking-tight">Error: {result.error?.message}</p>
                )}
                {!isTimeout && !isNetWorkError && result.autoLimit && (
                  <p className="text-sm text-foreground-light">
                    Note: A limit of {result.autoLimit} was applied to your query. If this was the
                    cause of a syntax error, try selecting "No limit" instead and re-run the query.
                  </p>
                )}
                {readReplicaError && (
                  <p className="text-sm text-foreground-light">
                    Note: Read replicas are for read only queries. Run write queries on the primary
                    database instead.
                  </p>
                )}
                {payloadTooLargeError && (
                  <p className="text-sm text-foreground-light flex items-center gap-x-1">
                    Run this query by{' '}
                    <span
                      onClick={() => setShowConnect(true)}
                      className={cn(InlineLinkClassName, 'flex items-center gap-x-1')}
                    >
                      connecting to your database directly
                      <ExternalLink size={12} />
                    </span>
                    .
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-x-2">
              {readReplicaError && (
                <Button
                  className="py-2"
                  type="default"
                  onClick={() => {
                    state.setSelectedDatabaseId(ref)
                    snapV2.resetResults(id)
                  }}
                >
                  Switch to primary database
                </Button>
              )}
              {formattedError.length > 0 && (
                <Tooltip>
                  <TooltipTrigger>
                    <CopyButton iconOnly type="default" text={formattedError.join('\n')} />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="center">
                    <span>Copy error</span>
                  </TooltipContent>
                </Tooltip>
              )}
              {!hasHipaaAddon && (
                <AiAssistantDropdown
                  label="Debug with Assistant"
                  buildPrompt={buildDebugPrompt}
                  onOpenAssistant={onDebug}
                  telemetrySource="sql_debug"
                  disabled={!!isDisabled || isDebugging}
                  loading={isDebugging}
                />
              )}
            </div>
          </div>
        </div>
      )
    } else if (!result) {
      return (
        <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark overflow-y-auto">
          <p className="m-0 border-0 px-4 py-4 text-sm text-foreground-light">
            Click <code>Run</code> to execute your query.
          </p>
        </div>
      )
    } else if (result.rows.length <= 0) {
      return (
        <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark overflow-y-auto">
          <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Success. No rows returned</p>
        </div>
      )
    }

    return <Results rows={result.rows} />
  }
)

UtilityTabResults.displayName = 'UtilityTabResults'
export default UtilityTabResults
