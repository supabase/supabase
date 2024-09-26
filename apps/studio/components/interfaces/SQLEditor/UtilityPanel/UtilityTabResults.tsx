import { ExternalLink, Loader2 } from 'lucide-react'

import { useParams } from 'common'
import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { AiIconAnimation, Button } from 'ui'
import Results from './Results'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { useFlag } from 'hooks/ui/useFlag'
import Link from 'next/link'

export type UtilityTabResultsProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  onDebug: () => void
  isDebugging?: boolean
}

const UtilityTabResults = ({
  id,
  isExecuting,
  isDisabled,
  isDebugging,
  onDebug,
}: UtilityTabResultsProps) => {
  const { ref } = useParams()
  const state = useDatabaseSelectorStateSnapshot()
  const organization = useSelectedOrganization()

  const snap = useSqlEditorStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const enableFolders = useFlag('sqlFolderOrganization')

  const result = enableFolders ? snapV2.results[id]?.[0] : snap.results[id]?.[0]
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })

  // Customers on HIPAA plans should not have access to Supabase AI
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const isTimeout =
    result?.error?.message?.includes('canceling statement due to statement timeout') ||
    result?.error?.message?.includes('upstream request timeout')

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
      <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark">
        <div className="flex flex-row justify-between items-start py-4 px-6 gap-x-4">
          {isTimeout ? (
            <div className="flex flex-col gap-y-1">
              <p className="font-mono text-sm">SQL query ran into an upstream timeout</p>
              <p className="font-mono text-sm text-foreground-light">
                You can either{' '}
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="underline transition hover:text-foreground"
                  href="https://supabase.com/docs/guides/platform/performance#examining-query-performance"
                >
                  optimize your query
                </a>
                , or{' '}
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="underline transition hover:text-foreground"
                  href="https://supabase.com/docs/guides/database/timeouts"
                >
                  increase the statement timeout
                </a>
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
              {result.autoLimit && (
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
                  <Link
                    target="_blank"
                    rel="noreferrer"
                    href={`/project/${ref}/settings/database`}
                    className="underline transition hover:text-foreground flex items-center gap-x-1"
                  >
                    connecting to your database directly
                    <ExternalLink size={12} />
                  </Link>
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
                  snap.resetResult(id)
                }}
              >
                Switch to primary database
              </Button>
            )}
            {!hasHipaaAddon && (
              <Button
                icon={<AiIconAnimation className="scale-75 w-3 h-3" loading={isDebugging} />}
                disabled={!!isDisabled || isDebugging}
                onClick={onDebug}
              >
                Debug with Supabase AI
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  } else if (!result) {
    return (
      <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 text-sm text-foreground-light">
          Click <code>Run</code> to execute your query.
        </p>
      </div>
    )
  } else if (result.rows.length <= 0) {
    return (
      <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Success. No rows returned</p>
      </div>
    )
  }

  return <Results rows={result.rows} />
}

export default UtilityTabResults
