import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { LOCAL_STORAGE_KEYS } from 'common'
import { Loader2 } from 'lucide-react'
import { useCallback } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'

import { RunQueryWarningModal } from './RunQueryWarningModal'
import type { UtilityTab } from './SQLEditor.types'
import { appendEnableRLSStatements } from './SQLEditor.utils'
import { useSQLEditorContext } from './SQLEditorContext'
import {
  useSqlEditorAssistant,
  useSqlEditorRun,
  useSqlEditorSnippet,
  useSqlEditorUi,
} from './SQLEditorControllers'
import { SQLEditorEditorPanel } from './SQLEditorEditorPanel'
import { UtilityActions } from './UtilityPanel/UtilityActions'
import { UtilityPanel } from './UtilityPanel/UtilityPanel'

const SQLEditorRunWarningModal = () => {
  const { refocusEditor, clearPendingRunRefocus, markRefocusAfterRun } = useSQLEditorContext()
  const { potentialIssues, resetPotentialIssues, executeQuery, readEditorSql } = useSqlEditorRun()

  return (
    <RunQueryWarningModal
      visible={!!potentialIssues}
      potentialIssues={potentialIssues}
      onCancel={() => {
        clearPendingRunRefocus()
        resetPotentialIssues()
        refocusEditor()
      }}
      onConfirm={() => {
        markRefocusAfterRun()
        resetPotentialIssues()
        const sql = readEditorSql()
        if (sql === undefined) return clearPendingRunRefocus()
        // The user has reviewed the warning and confirmed — promote here.
        void executeQuery(acceptUntrustedSql(sql), true)
      }}
      onConfirmWithRLS={() => {
        const tables = potentialIssues?.createTablesMissingRLS ?? []
        if (tables.length === 0) return
        const baseSql = readEditorSql() ?? untrustedSql('')
        const rewrittenSql = appendEnableRLSStatements(baseSql, tables)
        markRefocusAfterRun()
        resetPotentialIssues()
        // The user has reviewed the warning and confirmed — promote here.
        void executeQuery(acceptUntrustedSql(untrustedSql(rewrittenSql)), true)
      }}
    />
  )
}

/** The top-bar controls (run / prettify / etc.). */
const SQLEditorToolbar = () => {
  const { clearPendingRunRefocus, markRefocusAfterRun } = useSQLEditorContext()
  const { id } = useSqlEditorSnippet()
  const { diff } = useSqlEditorAssistant()
  const { executeQuery, readEditorSql, isExecuting, prettifyQuery } = useSqlEditorRun()
  const { hasSelection } = useSqlEditorUi()

  // Run gesture from the toolbar button — promote here, at the user action.
  const runQuery = useCallback(() => {
    markRefocusAfterRun()
    const sql = readEditorSql()
    if (sql === undefined) return clearPendingRunRefocus()
    void executeQuery(acceptUntrustedSql(sql))
  }, [clearPendingRunRefocus, executeQuery, markRefocusAfterRun, readEditorSql])

  return (
    <UtilityActions
      id={id}
      isExecuting={isExecuting}
      isDisabled={diff.isDiffOpen}
      hasSelection={hasSelection}
      prettifyQuery={prettifyQuery}
      executeQuery={runQuery}
      className="px-4 min-h-[42px] border-b shrink-0"
    />
  )
}

/** The bottom (results) resizable panel: loading state + utility panel. */
const SQLEditorResultsPanel = () => {
  const { id, isLoading } = useSqlEditorSnippet()
  const { diff, ai } = useSqlEditorAssistant()
  const { isExecuting } = useSqlEditorRun()
  const { activeUtilityTab, setActiveUtilityTab } = useSqlEditorUi()

  return isLoading ? (
    <div className="flex h-full w-full items-center justify-center">
      <Loader2 className="animate-spin text-brand" />
    </div>
  ) : (
    <UtilityPanel
      id={id}
      isExecuting={isExecuting}
      isDisabled={diff.isDiffOpen}
      onDebug={ai.onDebug}
      buildDebugPrompt={ai.buildDebugPrompt}
      activeTab={activeUtilityTab}
      onActiveTabChange={(tab) => setActiveUtilityTab(tab as UtilityTab)}
    />
  )
}

/** The SQL editor shell: warning modal, toolbar, and the editor/results split. */
export const SQLEditorLayout = () => {
  return (
    <>
      <SQLEditorRunWarningModal />

      <div className="flex flex-col h-full">
        <SQLEditorToolbar />
        <ResizablePanelGroup
          className="relative flex-1 min-h-0"
          orientation="vertical"
          autoSaveId={LOCAL_STORAGE_KEYS.SQL_EDITOR_SPLIT_SIZE}
        >
          <ResizablePanel defaultSize="50" maxSize="70">
            <SQLEditorEditorPanel />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="50" maxSize="70">
            <SQLEditorResultsPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  )
}
