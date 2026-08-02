import { type UntrustedSqlFragment } from '@supabase/pg-meta'
import { useParams } from 'common'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  type Context,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react'

import { useSqlEditorDiff, useSqlEditorPrompt } from './hooks'
import { type QuerySource } from './querySource'
import type { UtilityTab } from './SQLEditor.types'
import { useSQLEditorContext } from './SQLEditorContext'
import { useAddDefinitions } from './useAddDefinitions'
import { useEditorMount } from './useEditorMount'
import { useLogsSqlExecution } from './useLogsSqlExecution'
import { usePrettifyQuery } from './usePrettifyQuery'
import { useRunSource } from './useRunSource'
import { useSnippetIdentity } from './useSnippetIdentity'
import { useSnippetTitleGenerator } from './useSnippetTitleGenerator'
import { useSqlEditorAi } from './useSqlEditorAi'
import { useSqlEditorExecution } from './useSqlEditorExecution'
import { useSqlEditorShortcuts } from './useSqlEditorShortcuts'
import { isValidConnString } from '@/data/fetchers'
import {
  untrustedLogSql,
  type SafeLogSqlFragment,
  type UntrustedLogSqlFragment,
} from '@/data/logs/safe-analytics-sql'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'
import {
  getSqlEditorV2StateSnapshot,
  useSqlEditorV2StateSnapshot,
} from '@/state/sql-editor/sql-editor-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

/**
 * Reactive SQL-editor controllers, distributed via a handful of focused
 * contexts so the visual tree consumes exactly the slice it needs instead of
 * prop-drilling whole hook bundles. The stable Monaco refs + imperative helpers
 * live in `SQLEditorContext`; this provider owns everything that changes with
 * state.
 *
 * SQL that a user runs is NOT promoted to safety here — the provider only
 * exposes the already-safe `executeQuery` pipeline plus
 * `readEditorSql` (which returns an `UntrustedSqlFragment`). Each user-action
 * site (the toolbar/editor/results components and the shortcut handlers)
 * promotes with `acceptUntrustedSql` right where the user acts, so the promotion
 * is auditable.
 */

type SnippetContextValue = {
  id: string
  snippetName: string
  isLoading: boolean
}

type AssistantContextValue = {
  diff: ReturnType<typeof useSqlEditorDiff>
  prompt: ReturnType<typeof useSqlEditorPrompt>
  ai: ReturnType<typeof useSqlEditorAi>
}

type SqlEditorExecution = ReturnType<typeof useSqlEditorExecution>
type SqlEditorMount = ReturnType<typeof useEditorMount>

/** Running SQL: the safe execute pipeline, its status, and formatting. */
type RunContextValue = {
  executeQuery: SqlEditorExecution['executeQuery']
  readEditorSql: () => UntrustedSqlFragment | undefined
  isExecuting: boolean
  potentialIssues: SqlEditorExecution['potentialIssues']
  resetPotentialIssues: () => void
  prettifyQuery: () => void
  runSource: QuerySource
  executeLogsQuery: (sql: SafeLogSqlFragment) => void
  readEditorLogsSql: () => UntrustedLogSqlFragment | undefined
}

/** Editor-surface UI state: selection, the active results tab, and mount. */
type UiContextValue = {
  hasSelection: boolean
  setHasSelection: Dispatch<SetStateAction<boolean>>
  activeUtilityTab: UtilityTab
  setActiveUtilityTab: Dispatch<SetStateAction<UtilityTab>>
  onMount: SqlEditorMount['onMount']
}

const SnippetContext = createContext<SnippetContextValue | null>(null)
const AssistantContext = createContext<AssistantContextValue | null>(null)
const RunContext = createContext<RunContextValue | null>(null)
const UiContext = createContext<UiContextValue | null>(null)

function useGuardedContext<T>(context: Context<T | null>, hookName: string): T {
  const value = use(context)
  if (!value) {
    throw new Error(`${hookName} must be used within a SQLEditorControllersProvider`)
  }
  return value
}

/** Snippet identity + display name for the current tab. */
export const useSqlEditorSnippet = () => useGuardedContext(SnippetContext, 'useSqlEditorSnippet')

/** The Assistant / diff cluster controllers (diff, prompt, ai). */
export const useSqlEditorAssistant = () =>
  useGuardedContext(AssistantContext, 'useSqlEditorAssistant')

/** Run execution, warnings, and query formatting. */
export const useSqlEditorRun = () => useGuardedContext(RunContext, 'useSqlEditorRun')

/** Editor-surface UI state (selection, active results tab, editor mount). */
export const useSqlEditorUi = () => useGuardedContext(UiContext, 'useSqlEditorUi')

export const SQLEditorControllersProvider = ({ children }: PropsWithChildren) => {
  const { monacoRef, scrollTopRef, editor } = useSQLEditorContext()

  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const tabs = useTabsStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { setSelectedDatabaseId } = useDatabaseSelectorStateSnapshot()

  const diff = useSqlEditorDiff()
  const { isDiffOpen } = diff
  const prompt = useSqlEditorPrompt()
  const { promptState, resetPrompt } = prompt

  const [hasSelection, setHasSelection] = useState<boolean>(false)
  const [activeUtilityTab, setActiveUtilityTab] = useState<UtilityTab>('results')

  const { id, urlId, generatedNewSnippetName, isLoading } = useSnippetIdentity()
  const { onMount, editorMountCount } = useEditorMount({ id })

  const runSource = useRunSource(id)

  useAddDefinitions(id, monacoRef.current, { enabled: runSource.type !== 'logs' })

  const { data: databases, isSuccess: isSuccessReadReplicas } = useReadReplicasQuery(
    {
      projectRef: ref,
    },
    { enabled: isValidConnString(project?.connectionString) }
  )

  const { setAiTitle } = useSnippetTitleGenerator()

  const prettifyQuery = usePrettifyQuery({ id, isDiffOpen })

  // Reads the SQL to run from the editor as an UntrustedSqlFragment. Promotion
  // to safety (acceptUntrustedSql) happens at each user-action site, never here.
  const readEditorSql = useCallback((): UntrustedSqlFragment | undefined => {
    const snippet = getSqlEditorV2StateSnapshot().snippets[id]?.snippet
    const fallback = snippet?.type === 'log_sql' ? undefined : snippet?.content?.unchecked_sql
    return editor.getSql(fallback)
  }, [editor, id])

  // Reads the SQL to run from the editor as an UntrustedLogSqlFragment — the logs
  // sibling of readEditorSql. Promotion (acceptUntrustedLogsSql) happens at each
  // user-action site, never here.
  const readEditorLogsSql = useCallback((): UntrustedLogSqlFragment | undefined => {
    const snippet = getSqlEditorV2StateSnapshot().snippets[id]?.snippet
    const fallback = snippet?.type === 'log_sql' ? snippet.content?.unchecked_sql : undefined
    const sql = editor.getSql(fallback)
    return sql === undefined ? undefined : untrustedLogSql(sql)
  }, [editor, id])

  const {
    executeQuery,
    isExecuting: isExecutingDb,
    potentialIssues,
    resetPotentialIssues,
  } = useSqlEditorExecution({
    id,
    isDiffOpen,
    hasSelection,
    setAiTitle,
  })

  const { executeLogsQuery, isExecuting: isExecutingLogs } = useLogsSqlExecution({ id })

  const isExecuting = isExecutingDb || isExecutingLogs

  const ai = useSqlEditorAi({ id, editorMountCount, diff, prompt })
  const { acceptAiHandler, discardAiHandler } = ai

  useSqlEditorShortcuts({
    isDiffOpen,
    isPromptOpen: promptState.isOpen,
    prettifyQuery,
    acceptAiHandler,
    discardAiHandler,
    resetPrompt,
  })

  const saveScrollPosition = useEffectEvent((snippetId: string) => {
    if (ref) {
      const tabId = createTabId('sql', { id: snippetId })
      tabs.updateTab(tabId, { scrollTop: scrollTopRef.current })
    }
  })
  useEffect(() => {
    // Save the departing snippet's scroll position on unmount / snippet switch.
    return () => saveScrollPosition(id)
  }, [id])

  useEffect(() => {
    if (isSuccessReadReplicas) {
      const primaryDatabase = databases.find((db) => db.identifier === ref)
      setSelectedDatabaseId(primaryDatabase?.identifier)
    }
  }, [isSuccessReadReplicas, databases, ref, setSelectedDatabaseId])

  const snippetName =
    urlId === 'new'
      ? generatedNewSnippetName
      : (snapV2.snippets[id]?.snippet.name ?? generatedNewSnippetName)

  const snippetValue = useMemo<SnippetContextValue>(
    () => ({ id, snippetName, isLoading }),
    [id, snippetName, isLoading]
  )

  const assistantValue = useMemo<AssistantContextValue>(
    () => ({ diff, prompt, ai }),
    [diff, prompt, ai]
  )

  const runValue = useMemo<RunContextValue>(
    () => ({
      executeQuery,
      readEditorSql,
      isExecuting,
      potentialIssues,
      resetPotentialIssues,
      prettifyQuery,
      runSource,
      executeLogsQuery,
      readEditorLogsSql,
    }),
    [
      executeQuery,
      readEditorSql,
      isExecuting,
      potentialIssues,
      resetPotentialIssues,
      prettifyQuery,
      runSource,
      executeLogsQuery,
      readEditorLogsSql,
    ]
  )

  const uiValue = useMemo<UiContextValue>(
    () => ({ hasSelection, setHasSelection, activeUtilityTab, setActiveUtilityTab, onMount }),
    [hasSelection, activeUtilityTab, onMount]
  )

  return (
    <SnippetContext.Provider value={snippetValue}>
      <AssistantContext.Provider value={assistantValue}>
        <RunContext.Provider value={runValue}>
          <UiContext.Provider value={uiValue}>{children}</UiContext.Provider>
        </RunContext.Provider>
      </AssistantContext.Provider>
    </SnippetContext.Provider>
  )
}
