import { useParams } from 'common'
import toast from 'react-hot-toast'
import { format } from 'sql-formatter'
import { AiIconAnimation, Button } from 'ui'

import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { isError } from 'data/utils/error-check'
import { useLocalStorageQuery, useSelectedOrganization, useSelectedProject } from 'hooks'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS, OPT_IN_TAGS } from 'lib/constants'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { useSqlEditor } from '../SQLEditor'
import { sqlAiDisclaimerComment } from '../SQLEditor.constants'
import { DiffType } from '../SQLEditor.types'
import Results from './Results'

export type UtilityTabResultsProps = {
  id: string
  isExecuting?: boolean
}

const UtilityTabResults = ({ id, isExecuting }: UtilityTabResultsProps) => {
  const { ref } = useParams()
  const snap = useSqlEditorStateSnapshot()
  const state = useDatabaseSelectorStateSnapshot()
  const selectedProject = useSelectedProject()
  const organization = useSelectedOrganization()

  const { sqlDiff, setDebugSolution, setAiInput, setSqlDiff, setSelectedDiffType } = useSqlEditor()
  const { mutateAsync: debugSql, isLoading: isDebugSqlLoading } = useSqlDebugMutation()

  const isOptedInToAI = organization?.opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false
  const [hasEnabledAISchema] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.SQL_EDITOR_AI_SCHEMA, true)
  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && hasEnabledAISchema

  const { data } = useEntityDefinitionsQuery(
    {
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    { enabled: includeSchemaMetadata }
  )

  const entityDefinitions = includeSchemaMetadata ? data?.map((def) => def.sql.trim()) : undefined

  const snippet = snap.snippets[id]
  const result = snap.results[id]?.[0]
  const isUtilityPanelCollapsed = (snippet?.splitSizes?.[1] ?? 0) === 0

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })

  // Customers on HIPAA plans should not have access to Supabase AI
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const isTimeout =
    result?.error?.message?.includes('canceling statement due to statement timeout') ||
    result?.error?.message?.includes('upstream request timeout')

  if (isUtilityPanelCollapsed) return null

  if (isExecuting) {
    return (
      <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Running...</p>
      </div>
    )
  } else if (result?.error) {
    const formattedError = (result.error?.formattedError?.split('\n') ?? []).filter(
      (x: string) => x.length > 0
    )
    const readReplicaError =
      state.selectedDatabaseId !== ref &&
      result.error.message.includes('in a read-only transaction')

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
            <div className="">
              {formattedError.length > 0 ? (
                formattedError.map((x: string, i: number) => (
                  <pre key={`error-${i}`} className="font-mono text-sm text-wrap">
                    {x}
                  </pre>
                ))
              ) : (
                <>
                  <p className="font-mono text-sm">Error: {result.error?.message}</p>
                  {readReplicaError && (
                    <p className="text-sm text-foreground-light">
                      Note: Read replicas are for read only queries. Run write queries on the
                      primary database instead.
                    </p>
                  )}
                </>
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
                icon={<AiIconAnimation className="scale-75 w-3 h-3" loading={isDebugSqlLoading} />}
                disabled={!!sqlDiff || isDebugSqlLoading}
                onClick={async () => {
                  try {
                    const { solution, sql } = await debugSql({
                      sql: snippet.snippet.content.sql.replace(sqlAiDisclaimerComment, '').trim(),
                      errorMessage: result.error.message,
                      entityDefinitions,
                    })

                    const formattedSql =
                      sqlAiDisclaimerComment +
                      '\n\n' +
                      format(sql, {
                        language: 'postgresql',
                        keywordCase: 'lower',
                      })
                    setAiInput('')
                    setDebugSolution(solution)
                    setSqlDiff({
                      original: snippet.snippet.content.sql,
                      modified: formattedSql,
                    })
                    setSelectedDiffType(DiffType.Modification)
                  } catch (error: unknown) {
                    // [Joshen] There's a tendency for the SQL debug to chuck a lengthy error message
                    // that's not relevant for the user - so we prettify it here by avoiding to return the
                    // entire error body from the assistant
                    if (isError(error)) {
                      toast.error(
                        `Sorry, the assistant failed to debug your query! Please try again with a different one.`
                      )
                    }
                  }
                }}
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
  }

  return (
    <div className="h-full flex flex-col">
      <Results id={id} rows={result.rows} />
    </div>
  )
}

export default UtilityTabResults
