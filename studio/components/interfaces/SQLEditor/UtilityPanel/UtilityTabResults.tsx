import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { isError } from 'data/utils/error-check'
import { useLocalStorageQuery, useSelectedOrganization, useSelectedProject, useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { format } from 'sql-formatter'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { AiIcon, Button, IconLoader } from 'ui'
import { useSqlEditor } from '../SQLEditor'
import { sqlAiDisclaimerComment } from '../SQLEditor.constants'
import Results from './Results'

export type UtilityTabResultsProps = {
  id: string
  isExecuting?: boolean
}

const UtilityTabResults = ({ id, isExecuting }: UtilityTabResultsProps) => {
  const { ui } = useStore()
  const snap = useSqlEditorStateSnapshot()
  const { mutateAsync: debugSql, isLoading: isDebugSqlLoading } = useSqlDebugMutation()
  const { setDebugSolution, setAiInput, setSqlDiff, sqlDiff } = useSqlEditor()
  const selectedOrganization = useSelectedOrganization()
  const selectedProject = useSelectedProject()
  const isOptedInToAI =
    selectedOrganization?.opt_in_tags?.includes('AI_SQL_GENERATOR_OPT_IN') ?? false
  const [isOptedInToAISchema] = useLocalStorageQuery('supabase_sql-editor-ai-schema-enabled', false)

  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && isOptedInToAISchema

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

  if (isUtilityPanelCollapsed) return null

  if (isExecuting) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Running...</p>
      </div>
    )
  } else if (result?.error) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <div className="flex flex-row justify-between items-center pr-8">
          <p className="m-0 border-0 px-6 py-4 font-mono">{result.error.message ?? result.error}</p>
          <Button
            icon={
              !isDebugSqlLoading ? (
                <AiIcon className="w-3 h-3" />
              ) : (
                <IconLoader className="animate-spin" size={14} />
              )
            }
            disabled={!!sqlDiff}
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
                    message: error.message,
                  })
                }
              }
            }}
          >
            Debug using AI
          </Button>
        </div>
        {(result.error.message ?? result.error)?.includes(
          'canceling statement due to statement timeout'
        ) && (
          <p className="m-0 border-0 px-6 py-4 font-mono">
            You can either{' '}
            <a
              className="underline"
              href="https://supabase.com/docs/guides/platform/performance#examining-query-performance"
            >
              optimize your query
            </a>
            , or{' '}
            <a className="underline" href="https://supabase.com/docs/guides/database/timeouts">
              increase the statement timeout
            </a>
            .
          </p>
        )}
      </div>
    )
  } else if (!result) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 text-sm text-scale-1100">
          Click <code>RUN</code> to execute your query.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full">
      <Results id={id} rows={result.rows} />
    </div>
  )
}

export default UtilityTabResults
