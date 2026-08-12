import { useParams } from 'common'
import { ExternalLink } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { subscriptionHasHipaaAddon } from '../../Billing/Subscription/Subscription.utils'
import { Results } from '../../SQLEditor/UtilityPanel/Results'
import { getSqlErrorLines } from '../../SQLEditor/UtilityPanel/UtilityTabResults.utils'
import { type QueryResult } from '../ExplorerQuery/ExplorerQuery.types'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import CopyButton from '@/components/ui/CopyButton'
import { InlineLink, InlineLinkClassName } from '@/components/ui/InlineLink'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { DOCS_URL } from '@/lib/constants'

interface QueryResultTableProps {
  result?: QueryResult
}

// [Joshen] This is essentially a duplicate of UtilityTabResults from the SQL Editor
// I'll eventually migrate the Results component over - just trying to avoid bloating
// changes wherever possible

export const QueryResultTable = ({ result }: QueryResultTableProps) => {
  const { rows, error, autoLimit } = result ?? {}

  if (!result) {
    return <p className="text-xs text-foreground-light">Run the query to see results</p>
  }

  if (error) {
    return <QueryError error={error} autoLimit={autoLimit} />
  }

  if ((rows ?? []).length === 0) {
    return <p className="text-xs text-foreground-light">Success. No rows returned</p>
  }

  if (rows && rows.length > 0) {
    return <QueryResults rows={rows} />
  }
}

const QueryError = ({
  error,
  autoLimit,
}: {
  error: NonNullable<QueryResult['error']>
  autoLimit?: QueryResult['autoLimit']
}) => {
  const { ref } = useParams()

  const { data: org } = useSelectedOrganizationQuery()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: org?.slug })
  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef: ref })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription) && projectSettings?.is_sensitive

  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))

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
    <div className="bg-table-header-light in-data-[theme*=dark]:bg-table-header-dark overflow-y-auto">
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
          {!hasHipaaAddon && (
            // [Joshen] TODO
            <AiAssistantDropdown
              telemetrySource="sql_debug"
              label="Debug with Assistant"
              buildPrompt={() => ''}
              onOpenAssistant={() => {}}
              disabled={false}
              loading={false}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// [Joshen] Eventually migrate the Results component here from SQL Editor
const QueryResults = ({ rows }: { rows: NonNullable<QueryResult['rows']> }) => {
  return <Results rows={rows} />
}
