import { useParams } from 'common'
import { ExternalLink } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useCallback } from 'react'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { subscriptionHasHipaaAddon } from '../../Billing/Subscription/Subscription.utils'
import { type SqlSnippetSource } from '../../SQLEditor/querySource'
import { buildDebugPromptText } from '../../SQLEditor/SQLEditor.utils'
import { useCreateChat } from '../hooks'
import { type QueryResult } from '../types'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import CopyButton from '@/components/ui/CopyButton'
import { InlineLink, InlineLinkClassName } from '@/components/ui/InlineLink'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { getSqlErrorLines } from '@/data/sql/utils'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { DOCS_URL, IS_PLATFORM } from '@/lib/constants'

export const QueryResultError = ({
  error,
  autoLimit,
  sql,
  source,
  onDebug,
}: {
  error: NonNullable<QueryResult['error']>
  autoLimit?: QueryResult['autoLimit']
  sql?: string
  source?: SqlSnippetSource
  /** Overrides the default "open a new debug chat" behavior — used when this query block
   * is already rendered inside an open assistant conversation, so debugging should write
   * into that conversation's composer instead of abandoning it for a new chat. */
  onDebug?: (prompt: string) => void
}) => {
  const { ref } = useParams()

  const { data: org } = useSelectedOrganizationQuery()
  const { data: subscription, isSuccess: isSubscriptionResolved } = useOrgSubscriptionQuery({
    orgSlug: org?.slug,
  })
  const { data: projectSettings, isSuccess: isProjectSettingsResolved } = useProjectSettingsV2Query(
    {
      projectRef: ref,
    }
  )
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription) && projectSettings?.is_sensitive
  // Default deny until both eligibility queries have actually succeeded - a disabled or
  // failed query also reports isLoading: false, so isLoading can't tell "confirmed no
  // addon" apart from "don't know yet", and the assistant sends the SQL and error to an
  // LLM. Self-hosted has no HIPAA concept at all (subscriptionHasHipaaAddon short-circuits
  // to false there), so there's nothing to wait on outside of platform.
  const isCheckingHipaaEligibility =
    IS_PLATFORM && (!isSubscriptionResolved || !isProjectSettingsResolved)

  const { createChat, isCreating } = useCreateChat()

  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))

  const canDebug = sql !== undefined && source !== undefined

  const buildDebugPrompt = useCallback(
    () => (canDebug ? buildDebugPromptText(sql, error.message, source) : ''),
    [canDebug, sql, error.message, source]
  )

  const handleDebug = () =>
    onDebug
      ? onDebug(buildDebugPrompt())
      : createChat({ name: 'Debug SQL snippet', initialMessage: buildDebugPrompt() })

  const isTimeout =
    error.message?.includes('canceling statement due to statement timeout') ||
    error.message?.includes('upstream request timeout') ||
    error.message?.includes('Query read timeout')
  const isNetWorkError = error.message?.includes('EHOSTUNREACH')

  const errorLines = getSqlErrorLines(error)
  // [Joshen] Need to check if a replica is selected as well
  const readReplicaError = error.message.includes('in a read-only transaction')
  const payloadTooLargeError = error.message.includes(
    'Query is too large to be run via the SQL Editor'
  )

  return (
    <div className="w-full bg-table-header-light in-data-[theme*=dark]:bg-table-header-dark overflow-y-auto">
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
              <button
                type="button"
                tabIndex={0}
                className={cn(InlineLinkClassName, 'cursor-pointer')}
                onClick={() => setShowConnect(true)}
              >
                connect to your database directly
              </button>
              .
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-y-1">
            {errorLines.length > 0 ? (
              errorLines.map((x: string, i: number) => (
                <pre key={`error-${i}`} className="font-mono text-sm text-wrap">
                  {x}
                </pre>
              ))
            ) : (
              <p className="font-mono text-sm tracking-tight">Error: {error.message}</p>
            )}
            {!isTimeout && !isNetWorkError && autoLimit && (
              <p className="text-sm text-foreground-light">
                Note: A limit of {autoLimit} was applied to your query. If this was the cause of a
                syntax error, try selecting "No limit" instead and re-run the query.
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
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => setShowConnect(true)}
                  className={cn(InlineLinkClassName, 'flex items-center gap-x-1')}
                >
                  connecting to your database directly
                  <ExternalLink size={12} />
                </button>
                .
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-x-2">
          {readReplicaError && (
            <Button
              className="py-2"
              variant="default"
              // [Joshen] TODO
              onClick={() => {}}
            >
              Switch to primary database
            </Button>
          )}
          {errorLines.length > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <CopyButton iconOnly variant="default" text={errorLines.join('\n')} />
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                <span>Copy error</span>
              </TooltipContent>
            </Tooltip>
          )}
          {!hasHipaaAddon && !isCheckingHipaaEligibility && canDebug && (
            <AiAssistantDropdown
              telemetrySource="sql_debug"
              label="Debug with Assistant"
              buildPrompt={buildDebugPrompt}
              onOpenAssistant={handleDebug}
              disabled={isCreating}
              loading={isCreating}
            />
          )}
        </div>
      </div>
    </div>
  )
}
