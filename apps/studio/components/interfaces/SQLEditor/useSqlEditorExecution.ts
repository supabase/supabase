import { type SafeSqlFragment } from '@supabase/pg-meta'
import { useQueryClient } from '@tanstack/react-query'
import { IS_PLATFORM, useParams } from 'common'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { untitledSnippetTitle } from './SQLEditor.constants'
import type { PotentialIssues } from './SQLEditor.types'
import {
  checkAlterDatabaseConnection,
  checkDestructiveQuery,
  checkIfAppendLimitRequired,
  filterTablesCoveredByEnsureRLSTrigger,
  getCreateTablesMissingRLS,
  hasActiveEnsureRLSTrigger,
  isUpdateWithoutWhere,
  suffixWithLimit,
} from './SQLEditor.utils'
import { useSQLEditorContext } from './SQLEditorContext'
import { useDatabaseEventTriggersQuery } from '@/data/database-event-triggers/database-event-triggers-query'
import { isValidConnString } from '@/data/fetchers'
import { lintKeys } from '@/data/lint/keys'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useOrgAiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import { useTrack } from '@/lib/telemetry/track'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'
import {
  isRoleImpersonationEnabled,
  useGetImpersonatedRoleState,
} from '@/state/role-impersonation-state'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'
import { getSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

type UseSqlEditorExecutionArgs = {
  id: string
  isDiffOpen: boolean
  hasSelection: boolean
  setAiTitle: (id: string, sql: string) => void
}

export function useSqlEditorExecution({
  id,
  isDiffOpen,
  hasSelection,
  setAiTitle,
}: UseSqlEditorExecutionArgs) {
  const { ref } = useParams()
  const {
    editorRef,
    clearPendingRunRefocus,
    refocusEditorAfterRunIfNeeded,
    clearHighlights,
    applyErrorHighlight,
  } = useSQLEditorContext()

  const { data: project } = useSelectedProjectQuery()
  const queryClient = useQueryClient()
  const track = useTrack()
  const sessionSnap = useSqlEditorSessionSnapshot()
  const limit = sessionSnap.limit
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()
  const { aiOptInLevel } = useOrgAiOptInLevel()

  const { data: databases } = useReadReplicasQuery(
    { projectRef: ref },
    { enabled: isValidConnString(project?.connectionString) }
  )
  const { data: eventTriggers } = useDatabaseEventTriggersQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { enabled: isValidConnString(project?.connectionString) }
  )

  const [potentialIssues, setPotentialIssues] = useState<PotentialIssues>()

  const { mutate: execute, isPending: isExecuting } = useExecuteSqlMutation({
    onSuccess(data, vars) {
      if (id) {
        sessionSnap.addResult(id, data.result, vars.autoLimit)
      }

      // revalidate lint query
      queryClient.invalidateQueries({ queryKey: lintKeys.lint(ref) })
      refocusEditorAfterRunIfNeeded()
    },
    onError(error: any, vars) {
      if (id) {
        applyErrorHighlight(error, hasSelection)
        sessionSnap.addResultError(id, error, vars.autoLimit)
      }

      refocusEditorAfterRunIfNeeded()
    },
  })

  const executeQuery = useCallback(
    async (sql: SafeSqlFragment, force: boolean = false) => {
      if (isDiffOpen) {
        clearPendingRunRefocus()
        return
      }

      if (editorRef.current === null || isExecuting || project === undefined) {
        clearPendingRunRefocus()
        return
      }

      const hasDestructiveOperations = checkDestructiveQuery(sql)
      const hasUpdateWithoutWhere = isUpdateWithoutWhere(sql)
      const hasAlterDatabasePreventConnection = checkAlterDatabaseConnection(sql)
      const createTablesMissingRLS = filterTablesCoveredByEnsureRLSTrigger(
        getCreateTablesMissingRLS(sql),
        hasActiveEnsureRLSTrigger(eventTriggers)
      )

      const queryHasIssues =
        !force &&
        (hasDestructiveOperations ||
          hasUpdateWithoutWhere ||
          hasAlterDatabasePreventConnection ||
          createTablesMissingRLS.length > 0)

      if (queryHasIssues) {
        setPotentialIssues({
          hasDestructiveOperations,
          hasUpdateWithoutWhere,
          hasAlterDatabasePreventConnection,
          createTablesMissingRLS,
        })
        return
      }

      // use the latest state for the title-generation check
      const snippet = getSqlEditorV2StateSnapshot().snippets[id]
      if (
        // Don't auto-generate a title when the org has disabled AI or is a HIPAA project,
        // as that would silently forward the query to the AI provider without consent
        aiOptInLevel !== 'disabled' &&
        snippet?.snippet.name.startsWith(untitledSnippetTitle) &&
        IS_PLATFORM
      ) {
        // Intentionally don't await title gen (lazy)
        setAiTitle(id, sql)
      }

      clearHighlights()

      const impersonatedRoleState = getImpersonatedRoleState()
      const connectionString = databases?.find(
        (db) => db.identifier === databaseSelectorState.selectedDatabaseId
      )?.connectionString
      if (!isValidConnString(connectionString)) {
        clearPendingRunRefocus()
        return toast.error('Unable to run query: Connection string is missing')
      }

      const { appendAutoLimit } = checkIfAppendLimitRequired(sql, limit)
      const formattedSql = suffixWithLimit(sql, limit)

      execute({
        projectRef: project.ref,
        connectionString: connectionString,
        sql: wrapWithRoleImpersonation(formattedSql, impersonatedRoleState),
        autoLimit: appendAutoLimit ? limit : undefined,
        isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRoleState.role),
        isStatementTimeoutDisabled: true,
        contextualInvalidation: true,
        handleError: (error) => {
          throw error
        },
      })

      track('sql_editor_query_run_button_clicked')
    },
    [
      editorRef,
      clearHighlights,
      clearPendingRunRefocus,
      isDiffOpen,
      id,
      isExecuting,
      project,
      aiOptInLevel,
      execute,
      getImpersonatedRoleState,
      setAiTitle,
      databaseSelectorState.selectedDatabaseId,
      databases,
      eventTriggers,
      limit,
      track,
    ]
  )

  const resetPotentialIssues = useCallback(() => setPotentialIssues(undefined), [])

  return { executeQuery, isExecuting, potentialIssues, resetPotentialIssues }
}
