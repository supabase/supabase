import { type SafeSqlFragment } from '@supabase/pg-meta'
import { useParams } from 'common'
import { useCallback } from 'react'
import { toast } from 'sonner'

import type { UtilityTab } from './SQLEditor.types'
import { buildExplainSql } from './SQLEditor.utils'
import { useSQLEditorContext } from './SQLEditorContext'
import { splitSqlStatements } from '@/components/interfaces/ExplainVisualizer/ExplainVisualizer.utils'
import { isValidConnString } from '@/data/fetchers'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'
import {
  isRoleImpersonationEnabled,
  useGetImpersonatedRoleState,
} from '@/state/role-impersonation-state'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'

type UseSqlEditorExplainArgs = {
  id: string
  isDiffOpen: boolean
  setActiveUtilityTab: (tab: UtilityTab) => void
}

export function useSqlEditorExplain({
  id,
  isDiffOpen,
  setActiveUtilityTab,
}: UseSqlEditorExplainArgs) {
  const { ref } = useParams()
  const { editorRef, clearHighlights } = useSQLEditorContext()
  const { data: project } = useSelectedProjectQuery()
  const sessionSnap = useSqlEditorSessionSnapshot()
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()

  const { data: databases } = useReadReplicasQuery(
    { projectRef: ref },
    { enabled: isValidConnString(project?.connectionString) }
  )

  const { mutate: executeExplain, isPending: isExplainExecuting } = useExecuteSqlMutation({
    onSuccess(data) {
      if (id) {
        sessionSnap.addExplainResult(id, data.result)
        setActiveUtilityTab('explain')
      }
    },
    onError(error) {
      if (id) {
        sessionSnap.addExplainResultError(id, error)
        setActiveUtilityTab('explain')
      }
    },
  })

  const executeExplainQuery = useCallback(
    async (sql: SafeSqlFragment) => {
      if (isDiffOpen) return

      if (editorRef.current !== null && !isExplainExecuting && project !== undefined) {
        // Check for multiple statements - EXPLAIN only works on a single statement
        const statements = splitSqlStatements(sql)
        if (statements.length > 1) {
          sessionSnap.addExplainResultError(id, {
            message:
              'EXPLAIN only works on a single SQL statement. Please select just one query to analyze.',
          })
          setActiveUtilityTab('explain')
          return
        }

        clearHighlights()

        const impersonatedRoleState = getImpersonatedRoleState()
        const connectionString = databases?.find(
          (db) => db.identifier === databaseSelectorState.selectedDatabaseId
        )?.connectionString
        if (!isValidConnString(connectionString)) {
          return toast.error('Unable to run query: Connection string is missing')
        }

        // Wrap in EXPLAIN ANALYZE (unless already an EXPLAIN), apply role
        // impersonation, and wrap in a rollback transaction so EXPLAIN ANALYZE
        // INSERT/UPDATE/DELETE queries don't actually modify data.
        const explainSqlWithTransaction = buildExplainSql(sql, impersonatedRoleState)

        executeExplain({
          projectRef: project.ref,
          connectionString: connectionString,
          sql: explainSqlWithTransaction,
          isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRoleState.role),
          handleError: (error) => {
            throw error
          },
        })
      }
    },
    [
      editorRef,
      isDiffOpen,
      id,
      isExplainExecuting,
      project,
      executeExplain,
      getImpersonatedRoleState,
      databaseSelectorState.selectedDatabaseId,
      databases,
      clearHighlights,
      sessionSnap,
      setActiveUtilityTab,
    ]
  )

  return { executeExplainQuery, isExplainExecuting }
}
