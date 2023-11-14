import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { isError } from 'data/utils/error-check'
import {
  useFlag,
  useLocalStorageQuery,
  useSelectedOrganization,
  useSelectedProject,
  useStore,
} from 'hooks'
import { IS_PLATFORM, OPT_IN_TAGS } from 'lib/constants'
import { format } from 'sql-formatter'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { AiIconAnimation, Button } from 'ui'
import { useSqlEditor } from '../SQLEditor'
import { sqlAiDisclaimerComment } from '../SQLEditor.constants'
import Results from './Results'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'

export type UtilityTabResultsProps = {
  id: string
  isExecuting?: boolean
}

const UtilityTabResults = ({ id, isExecuting }: UtilityTabResultsProps) => {
  const { ui } = useStore()
  const organization = useSelectedOrganization()
  const snap = useSqlEditorStateSnapshot()
  const { mutateAsync: debugSql, isLoading: isDebugSqlLoading } = useSqlDebugMutation()
  const { setDebugSolution, setAiInput, setSqlDiff, sqlDiff } = useSqlEditor()
  const selectedOrganization = useSelectedOrganization()
  const selectedProject = useSelectedProject()
  const isOptedInToAI = selectedOrganization?.opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false
  const [hasEnabledAISchema] = useLocalStorageQuery('supabase_sql-editor-ai-schema-enabled', true)

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
  const supabaseAIEnabled = useFlag('sqlEditorSupabaseAI')

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })

  // Customers on HIPAA plans should not have access to Supabase AI
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const isTimeout =
    result?.error?.message?.includes('canceling statement due to statement timeout') ||
    result?.error?.message?.includes('upstream request timeout')

  if (isUtilityPanelCollapsed) return null

  if (isExecuting) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Running...</p>
      </div>
    )
  } else if (result?.error) {
    const formattedError = (result.error?.formattedError?.split('\n') ?? []).filter(
      (x: string) => x.length > 0
    )

    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <div className="flex flex-row justify-between items-start py-4 px-6">
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
            <div>
              {formattedError.length > 0 ? (
                formattedError.map((x: string, i: number) => (
                  <pre key={`error-${i}`} className="font-mono text-sm">
                    {x}
                  </pre>
                ))
              ) : (
                <p className="font-mono text-sm">{result.error.error}</p>
              )}
            </div>
          )}
          {supabaseAIEnabled && !hasHipaaAddon && (
            <Button
              icon={
                <div className="scale-75">
                  <AiIconAnimation className="w-3 h-3" loading={isDebugSqlLoading} />
                </div>
              }
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
                } catch (error: unknown) {
                  if (isError(error)) {
                    ui.setNotification({
                      category: 'error',
                      message: `Failed to debug: ${error.message}`,
                    })
                  }
                }
              }}
            >
              Debug with Supabase AI
            </Button>
          )}
        </div>
      </div>
    )
  } else if (!result) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
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
