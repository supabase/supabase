import { acceptUntrustedSql, untrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { cn, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'

import { useSqlEditorDiff, useSqlEditorPrompt } from './hooks'
import { RunQueryWarningModal } from './RunQueryWarningModal'
import { appendEnableRLSStatements } from './SQLEditor.utils'
import { SQLEditorProvider, useSQLEditorContext } from './SQLEditorContext'
import { useAddDefinitions } from './useAddDefinitions'
import { useEditorMount } from './useEditorMount'
import { usePrettifyQuery } from './usePrettifyQuery'
import { useSnippetIdentity } from './useSnippetIdentity'
import { useSnippetTitleGenerator } from './useSnippetTitleGenerator'
import { useSqlEditorAi } from './useSqlEditorAi'
import { useSqlEditorExecution } from './useSqlEditorExecution'
import { useSqlEditorExplain } from './useSqlEditorExplain'
import { useSqlEditorShortcuts } from './useSqlEditorShortcuts'
import { UtilityActions } from './UtilityPanel/UtilityActions'
import { UtilityPanel } from './UtilityPanel/UtilityPanel'
import ResizableAIWidget from '@/components/ui/AIEditor/ResizableAIWidget'
import { isValidConnString } from '@/data/fetchers'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { detectOS } from '@/lib/helpers'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'
import {
  getSqlEditorV2StateSnapshot,
  useSqlEditorV2StateSnapshot,
} from '@/state/sql-editor/sql-editor-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

// Load the monaco editor client-side only (does not behave well server-side)
const MonacoEditor = dynamic(
  () => import('./MonacoEditor').then(({ MonacoEditor }) => MonacoEditor),
  { ssr: false }
)
const DiffEditor = dynamic(
  () => import('../../ui/DiffEditor').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

const SQLEditorContent = () => {
  const {
    editorRef,
    monacoRef,
    diffEditorRef,
    scrollTopRef,
    refocusEditor,
    clearPendingRunRefocus,
    markRefocusAfterRun,
    getEditorSql: getEditorSqlFromEditor,
  } = useSQLEditorContext()

  const os = detectOS()
  const { ref } = useParams()

  const { data: project } = useSelectedProjectQuery()

  const tabs = useTabsStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const databaseSelectorState = useDatabaseSelectorStateSnapshot()

  // [Ali] Kill switch to hide the SQL Editor Explain tab and its entry points
  const disablePrettyExplain = useFlag('DisablePrettyExplainOnSqlEditor')

  const diff = useSqlEditorDiff()
  const { isDiffOpen, defaultSqlDiff } = diff
  const prompt = useSqlEditorPrompt()
  const { promptState, setPromptState, promptInput, setPromptInput, resetPrompt } = prompt

  const [hasSelection, setHasSelection] = useState<boolean>(false)
  const [activeUtilityTab, setActiveUtilityTab] = useState<string>('results')

  const { id, urlId, generatedNewSnippetName, isLoading } = useSnippetIdentity()
  const { onMount, editorMountCount } = useEditorMount({ id })

  useAddDefinitions(id, monacoRef.current)

  const { data: databases, isSuccess: isSuccessReadReplicas } = useReadReplicasQuery(
    {
      projectRef: ref,
    },
    { enabled: isValidConnString(project?.connectionString) }
  )

  const { setAiTitle } = useSnippetTitleGenerator()

  const prettifyQuery = usePrettifyQuery({ id, isDiffOpen })

  // Reads the SQL to run from the editor as an UntrustedSqlFragment. The
  // untrusted→safe promotion (acceptUntrustedSql) happens in the run / explain
  // gesture + warning-modal handlers below — as close to the user action as
  // possible — before the SQL reaches the execute* pipelines.
  const readEditorSql = useCallback((): UntrustedSqlFragment | undefined => {
    const snippet = getSqlEditorV2StateSnapshot().snippets[id]
    return getEditorSqlFromEditor(snippet?.snippet.content?.unchecked_sql)
  }, [getEditorSqlFromEditor, id])

  const { executeQuery, isExecuting, potentialIssues, resetPotentialIssues } =
    useSqlEditorExecution({
      id,
      isDiffOpen,
      hasSelection,
      activeUtilityTab,
      setActiveUtilityTab,
      setAiTitle,
    })

  const { executeExplainQuery, isExplainExecuting } = useSqlEditorExplain({
    id,
    isDiffOpen,
    setActiveUtilityTab,
  })

  // Run/explain gestures. These are the deliberate user actions, so the
  // untrusted→safe promotion (acceptUntrustedSql) happens here — as close to the
  // event handler as possible — before the SQL reaches the execute* pipelines.
  const executeQueryFromButton = useCallback(() => {
    markRefocusAfterRun()
    refocusEditor()
    const sql = readEditorSql()
    if (sql === undefined) return clearPendingRunRefocus()
    void executeQuery(acceptUntrustedSql(sql))
  }, [clearPendingRunRefocus, executeQuery, markRefocusAfterRun, readEditorSql, refocusEditor])

  const handleRunShortcut = useCallback(() => {
    const sql = readEditorSql()
    if (sql !== undefined) void executeQuery(acceptUntrustedSql(sql))
  }, [executeQuery, readEditorSql])

  const handleRunExplain = useCallback(() => {
    const sql = readEditorSql()
    if (sql !== undefined) void executeExplainQuery(acceptUntrustedSql(sql))
  }, [executeExplainQuery, readEditorSql])

  const {
    handlePrompt,
    acceptAiHandler,
    discardAiHandler,
    onDebug,
    buildDebugPrompt,
    handleDiffEditorMount,
    isCompletionLoading,
    showWidget,
  } = useSqlEditorAi({ id, editorMountCount, diff, prompt })

  useSqlEditorShortcuts({
    isDiffOpen,
    isPromptOpen: promptState.isOpen,
    disablePrettyExplain,
    prettifyQuery,
    runExplain: handleRunExplain,
    acceptAiHandler,
    discardAiHandler,
    resetPrompt,
  })

  /** All useEffects are at the bottom before returning the TSX */

  const saveScrollPosition = useEffectEvent((snippetId: string) => {
    if (ref) {
      const tabId = createTabId('sql', { id: snippetId })
      tabs.updateTab(tabId, { scrollTop: scrollTopRef.current })
    }
  })
  useEffect(() => {
    // Save the departing snippet's scroll position on unmount / snippet switch.
    return () => saveScrollPosition(id)
    // Temporary until we update eslint to ignore useEffectEvent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (isSuccessReadReplicas) {
      const primaryDatabase = databases.find((db) => db.identifier === ref)
      databaseSelectorState.setSelectedDatabaseId(primaryDatabase?.identifier)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessReadReplicas, databases, ref])

  return (
    <>
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
          refocusEditor()
          // The user has reviewed the warning and confirmed — promote here.
          const sql = readEditorSql()
          if (sql === undefined) return clearPendingRunRefocus()
          void executeQuery(acceptUntrustedSql(sql), true)
        }}
        onConfirmWithRLS={() => {
          const tables = potentialIssues?.createTablesMissingRLS ?? []
          if (tables.length === 0) return
          const baseSql = readEditorSql() ?? untrustedSql('')
          const rewrittenSql = appendEnableRLSStatements(baseSql, tables)
          markRefocusAfterRun()
          resetPotentialIssues()
          refocusEditor()
          // The user has reviewed the warning and confirmed — promote here.
          void executeQuery(acceptUntrustedSql(untrustedSql(rewrittenSql)), true)
        }}
      />

      <div className="flex flex-col h-full">
        <UtilityActions
          id={id}
          isExecuting={isExecuting}
          isDisabled={isDiffOpen}
          hasSelection={hasSelection}
          prettifyQuery={prettifyQuery}
          executeQuery={executeQueryFromButton}
          className="px-4 min-h-[42px] border-b shrink-0"
        />
        <ResizablePanelGroup
          className="relative flex-1 min-h-0"
          orientation="vertical"
          autoSaveId={LOCAL_STORAGE_KEYS.SQL_EDITOR_SPLIT_SIZE}
        >
          <ResizablePanel defaultSize="50" maxSize="70">
            <div className="grow overflow-y-auto border-b h-full">
              {isLoading ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="animate-spin text-brand" />
                </div>
              ) : (
                <>
                  {isDiffOpen && (
                    <div className="w-full h-full">
                      <DiffEditor
                        language="pgsql"
                        original={defaultSqlDiff.original}
                        modified={defaultSqlDiff.modified}
                        onMount={handleDiffEditorMount}
                      />
                      {showWidget && (
                        <ResizableAIWidget
                          editor={diffEditorRef.current!}
                          id="ask-ai-diff"
                          value={promptInput}
                          onChange={setPromptInput}
                          onSubmit={(prompt: string) => {
                            handlePrompt(prompt, {
                              beforeSelection: promptState.beforeSelection,
                              selection: promptState.selection || defaultSqlDiff.modified,
                              afterSelection: promptState.afterSelection,
                            })
                          }}
                          onAccept={acceptAiHandler}
                          onReject={discardAiHandler}
                          onCancel={resetPrompt}
                          isDiffVisible={true}
                          isLoading={isCompletionLoading}
                          startLineNumber={Math.max(0, promptState.startLineNumber)}
                          endLineNumber={promptState.endLineNumber}
                        />
                      )}
                    </div>
                  )}
                  <div key={id} className="w-full h-full relative">
                    <MonacoEditor
                      autoFocus
                      placeholder={
                        !promptState.isOpen && !editorRef.current?.getValue()
                          ? 'Hit ' +
                            (os === 'macos' ? 'CMD+SHIFT+K' : `CTRL+SHIFT+K`) +
                            ' to generate query or just start typing'
                          : ''
                      }
                      id={id}
                      snippetName={
                        urlId === 'new'
                          ? generatedNewSnippetName
                          : (snapV2.snippets[id]?.snippet.name ?? generatedNewSnippetName)
                      }
                      className={cn(isDiffOpen && 'hidden')}
                      editorRef={editorRef}
                      monacoRef={monacoRef}
                      executeQuery={handleRunShortcut}
                      executeExplainQuery={handleRunExplain}
                      showExplainAction={!disablePrettyExplain}
                      prettifyQuery={prettifyQuery}
                      onHasSelection={setHasSelection}
                      onMount={onMount}
                      onPrompt={({
                        selection,
                        beforeSelection,
                        afterSelection,
                        startLineNumber,
                        endLineNumber,
                      }) => {
                        setPromptState((prev) => ({
                          ...prev,
                          isOpen: true,
                          selection,
                          beforeSelection,
                          afterSelection,
                          startLineNumber,
                          endLineNumber,
                        }))
                      }}
                    />
                    {editorRef.current && promptState.isOpen && !isDiffOpen && (
                      <ResizableAIWidget
                        editor={editorRef.current}
                        id="ask-ai"
                        value={promptInput}
                        onChange={setPromptInput}
                        onSubmit={(prompt: string) => {
                          handlePrompt(prompt, {
                            beforeSelection: promptState.beforeSelection,
                            selection: promptState.selection,
                            afterSelection: promptState.afterSelection,
                          })
                        }}
                        onCancel={resetPrompt}
                        isDiffVisible={false}
                        isLoading={isCompletionLoading}
                        startLineNumber={Math.max(0, promptState.startLineNumber)}
                        endLineNumber={promptState.endLineNumber}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="50" maxSize="70">
            {isLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="animate-spin text-brand" />
              </div>
            ) : (
              <UtilityPanel
                id={id}
                isExecuting={isExecuting}
                isExplainExecuting={isExplainExecuting}
                isDisabled={isDiffOpen}
                executeExplainQuery={handleRunExplain}
                showExplainTab={!disablePrettyExplain}
                onDebug={onDebug}
                buildDebugPrompt={buildDebugPrompt}
                activeTab={activeUtilityTab}
                onActiveTabChange={setActiveUtilityTab}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  )
}

export const SQLEditor = () => (
  <SQLEditorProvider>
    <SQLEditorContent />
  </SQLEditorProvider>
)
