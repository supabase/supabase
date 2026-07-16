import { acceptUntrustedSql } from '@supabase/pg-meta'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback } from 'react'
import { cn } from 'ui'

import { useSQLEditorContext } from './SQLEditorContext'
import {
  useSqlEditorAssistant,
  useSqlEditorRun,
  useSqlEditorSnippet,
  useSqlEditorUi,
} from './SQLEditorControllers'
import ResizableAIWidget from '@/components/ui/AIEditor/ResizableAIWidget'
import { detectOS } from '@/lib/helpers'

// Load the monaco editor client-side only (does not behave well server-side)
const MonacoEditor = dynamic(
  () => import('./MonacoEditor').then(({ MonacoEditor }) => MonacoEditor),
  { ssr: false }
)
const DiffEditor = dynamic(
  () => import('../../ui/DiffEditor').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

const generatePlaceholder = (os: string | undefined) =>
  `Hit ${os === 'macos' ? 'CMD+SHIFT+K' : 'CTRL+SHIFT+K'} to generate query or just start typing`

/**
 * The ask-AI widget anchored to the diff editor's modified pane. Reads the diff
 * editor ref from context and assembles the prompt context from the current
 * selection.
 */
const DiffPromptWidget = () => {
  const { diffEditorRef } = useSQLEditorContext()
  const { diff, prompt, ai } = useSqlEditorAssistant()
  const { defaultSqlDiff } = diff
  const { promptState, promptInput, setPromptInput, resetPrompt } = prompt
  const { handlePrompt, acceptAiHandler, discardAiHandler, isCompletionLoading } = ai

  return (
    <ResizableAIWidget
      editor={diffEditorRef.current!}
      id="ask-ai-diff"
      value={promptInput}
      onChange={setPromptInput}
      onSubmit={(value: string) => {
        handlePrompt(value, {
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
  )
}

/** The diff editor + its ask-AI widget, shown while a diff is open. */
const SQLEditorDiffView = () => {
  const { diff, ai } = useSqlEditorAssistant()
  const { defaultSqlDiff } = diff
  const { handleDiffEditorMount, showWidget } = ai

  return (
    <div className="w-full h-full">
      <DiffEditor
        language="pgsql"
        original={defaultSqlDiff.original}
        modified={defaultSqlDiff.modified}
        onMount={handleDiffEditorMount}
      />
      {showWidget && <DiffPromptWidget />}
    </div>
  )
}

/** The ask-AI widget anchored to the main editor. */
const MainPromptWidget = () => {
  const { editorRef } = useSQLEditorContext()
  const { prompt, ai } = useSqlEditorAssistant()
  const { promptState, promptInput, setPromptInput, resetPrompt } = prompt
  const { handlePrompt, isCompletionLoading } = ai

  return (
    <ResizableAIWidget
      editor={editorRef.current!}
      id="ask-ai"
      value={promptInput}
      onChange={setPromptInput}
      onSubmit={(value: string) => {
        handlePrompt(value, {
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
  )
}

/**
 * The main Monaco editor + its ask-AI widget. Always mounted (hidden behind the
 * diff editor while a diff is open) so the editor instance and its model survive
 * the diff lifecycle. The `editorRef.current` reads in the placeholder and the
 * widget gate happen during render and stay fresh because this component
 * subscribes to `promptState` / `isDiffOpen` via context.
 */
const SQLEditorMainView = () => {
  const { editorRef, monacoRef } = useSQLEditorContext()
  const { id, snippetName } = useSqlEditorSnippet()
  const { diff, prompt } = useSqlEditorAssistant()
  const { isDiffOpen } = diff
  const { promptState, openPrompt } = prompt
  const { executeQuery, readEditorSql, prettifyQuery } = useSqlEditorRun()
  const { onMount, setHasSelection } = useSqlEditorUi()

  const os = detectOS()

  // Run gesture from the editor — promote here, at the user action.
  const runQuery = useCallback(() => {
    const sql = readEditorSql()
    if (sql !== undefined) void executeQuery(acceptUntrustedSql(sql))
  }, [executeQuery, readEditorSql])

  return (
    <div key={id} className="w-full h-full relative">
      <MonacoEditor
        autoFocus
        placeholder={
          !promptState.isOpen && !editorRef.current?.getValue() ? generatePlaceholder(os) : ''
        }
        id={id}
        snippetName={snippetName}
        className={cn(isDiffOpen && 'hidden')}
        editorRef={editorRef}
        monacoRef={monacoRef}
        executeQuery={runQuery}
        prettifyQuery={prettifyQuery}
        onHasSelection={setHasSelection}
        onMount={onMount}
        onPrompt={openPrompt}
      />
      {editorRef.current && promptState.isOpen && !isDiffOpen && <MainPromptWidget />}
    </div>
  )
}

/** The top (editor) resizable panel: loading state, diff view, and main editor. */
export const SQLEditorEditorPanel = () => {
  const { isLoading } = useSqlEditorSnippet()
  const { diff } = useSqlEditorAssistant()

  return (
    <div className="grow overflow-y-auto border-b h-full">
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="animate-spin text-brand" />
        </div>
      ) : (
        <>
          {diff.isDiffOpen && <SQLEditorDiffView />}
          <SQLEditorMainView />
        </>
      )}
    </div>
  )
}
