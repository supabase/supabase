import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { useSqlEditorDiff, useSqlEditorPrompt } from './hooks'
import type { SqlSnippetSource } from './querySource'
import { DiffType, type IStandaloneDiffEditor } from './SQLEditor.types'
import {
  assembleCompletionDiff,
  buildCompletionRequestBody,
  buildDebugChatArgs,
  buildDebugPromptText,
  createSqlSnippetSkeletonV2,
  extractDebugContext,
  planDiffRequestApplication,
  sqlSourceToDialect,
} from './SQLEditor.utils'
import { useSQLEditorContext } from './SQLEditorContext'
import { useSnippetTitleGenerator } from './useSnippetTitleGenerator'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { constructHeaders } from '@/data/fetchers'
import { stripSqlCodeFences } from '@/data/logs/logs-sql-rewrite'
import { isError } from '@/data/utils/error-check'
import { useLogsAttributeKeys } from '@/hooks/analytics/useLogsAttributeKeys'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { BASE_PATH } from '@/lib/constants'
import { formatSql } from '@/lib/formatSql'
import { useProfile } from '@/lib/profile'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'
import { useSqlEditorDiffRequestSnapshot } from '@/state/sql-editor/sql-editor-diff-request'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

type UseSqlEditorAiArgs = {
  id: string
  /** Bumped on every editor mount; drives one-shot draining of a pending diff request. */
  editorMountCount: number
  diff: ReturnType<typeof useSqlEditorDiff>
  prompt: ReturnType<typeof useSqlEditorPrompt>
  /**
   * Where the snippet runs. Selects the dialect the AI writes in — logs snippets
   * get ClickHouse SQL for the `logs` table, database snippets get Postgres.
   */
  sqlSource: SqlSnippetSource
}

/**
 * Owns the Assistant / diff cluster: SQL completion, the ask-AI prompt flow, the
 * accept/discard diff handlers, the debug-prompt helpers, and the fragile diff
 * lifecycle effects (one-shot diff-request drain, diff-editor value sync, and the
 * ask-AI widget visibility).
 */
export function useSqlEditorAi({
  id,
  editorMountCount,
  diff,
  prompt,
  sqlSource,
}: UseSqlEditorAiArgs) {
  const {
    sourceSqlDiff,
    setSourceSqlDiff,
    selectedDiffType,
    setSelectedDiffType,
    setIsAcceptDiffLoading,
    isDiffOpen,
    defaultSqlDiff,
    closeDiff,
  } = diff
  const { promptState, setPromptState, resetPrompt } = prompt

  const { editor, diff: diffController, refocusEditor } = useSQLEditorContext()

  const router = useRouter()
  const { ref } = useParams()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const track = useTrack()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const sessionSnap = useSqlEditorSessionSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const diffRequest = useSqlEditorDiffRequestSnapshot()
  const { generateSqlTitle } = useSnippetTitleGenerator()

  const [isCompletionLoading, setIsCompletionLoading] = useState<boolean>(false)
  const [isDiffEditorMounted, setIsDiffEditorMounted] = useState(false)
  const [showWidget, setShowWidget] = useState(false)

  const dialect = sqlSourceToDialect(sqlSource)
  const isClickhouse = dialect === 'clickhouse'

  // Grounds ClickHouse edits in the source's real log_attributes keys, the same way
  // the whole-query rewrite does — otherwise inline edits invent dotted paths.
  // Looked up when the user submits, not while they type.
  const { fetchAttributeKeys } = useLogsAttributeKeys()

  const handleNewQuery = useCallback(
    async (sql: string, name: string) => {
      if (!ref) return console.error('Project ref is required')
      if (!profile) return console.error('Profile is required')
      if (!project) return console.error('Project is required')

      try {
        const snippet = createSqlSnippetSkeletonV2({
          name,
          sql,
          owner_id: profile.id,
          project_id: project.id,
        })
        snapV2.addSnippet({ projectRef: ref, snippet })
        snapV2.addNeedsSaving(snippet.id!)
        router.push(`/project/${ref}/sql/${snippet.id}`)
      } catch (error: any) {
        toast.error(`Failed to create new query: ${error.message}`)
      }
    },
    [profile, project, ref, router, snapV2]
  )

  const buildDebugPrompt = useCallback(() => {
    const snippet = snapV2.snippets[id]
    const result = sessionSnap.results[id]?.[0]
    const { sql, errorMessage } = extractDebugContext(snippet, result)

    return buildDebugPromptText(sql, errorMessage, sqlSource)
  }, [id, sessionSnap.results, snapV2.snippets, sqlSource])

  const onDebug = useCallback(async () => {
    try {
      const snippet = snapV2.snippets[id]
      const result = sessionSnap.results[id]?.[0]
      openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
      aiSnap.newChat(buildDebugChatArgs(snippet, result, sqlSource))
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
  }, [id, sessionSnap.results, snapV2.snippets, aiSnap, openSidebar, sqlSource])

  const acceptAiHandler = useCallback(async () => {
    try {
      setIsAcceptDiffLoading(true)

      if (!sourceSqlDiff || !editor.isReady() || !diffController.isMounted()) {
        toast.error('Unable to apply the AI SQL diff right now. Please try again.')
        return
      }

      const sql = diffController.getModifiedValue()
      if (sql === undefined) {
        toast.error('Unable to apply the AI edit because the diff editor returned no SQL.')
        return
      }

      if (selectedDiffType === DiffType.NewSnippet) {
        const { title } = await generateSqlTitle({ sql })
        await handleNewQuery(sql, title)
      } else {
        editor.replaceAll(sql, 'apply-ai-edit')
      }

      track('assistant_sql_diff_handler_evaluated', { handlerAccepted: true })

      setSelectedDiffType(DiffType.Modification)
      resetPrompt()
      closeDiff()
      refocusEditor()
    } finally {
      setIsAcceptDiffLoading(false)
    }
  }, [
    editor,
    diffController,
    sourceSqlDiff,
    selectedDiffType,
    generateSqlTitle,
    handleNewQuery,
    track,
    setIsAcceptDiffLoading,
    setSelectedDiffType,
    resetPrompt,
    closeDiff,
    refocusEditor,
  ])

  const discardAiHandler = useCallback(() => {
    track('assistant_sql_diff_handler_evaluated', { handlerAccepted: false })
    resetPrompt()
    closeDiff()
    refocusEditor()
  }, [closeDiff, resetPrompt, track, refocusEditor])

  const complete = useCallback(
    async (
      _prompt: string,
      options?: {
        headers?: Record<string, string>
        body?: { completionMetadata?: any }
      }
    ) => {
      try {
        setIsCompletionLoading(true)

        const response = await fetch(`${BASE_PATH}/api/ai/code/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(options?.headers ?? {}),
          },
          body: JSON.stringify(
            buildCompletionRequestBody({
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              orgSlug: org?.slug,
              dialect,
              options: options?.body,
            })
          ),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to generate completion')
        }

        // API returns a JSON-encoded string
        const text: string = await response.json()

        const meta = options?.body?.completionMetadata ?? {}
        // The clickhouse system prompt forbids fences, but strip them defensively
        // so a chatty model can't leak backticks into the snippet.
        const { original, modified } = assembleCompletionDiff(
          meta,
          isClickhouse ? stripSqlCodeFences(text) : text
        )

        // sql-formatter is Postgres-only — it mangles ClickHouse backticks and
        // map lookups — so ClickHouse output goes into the diff unformatted.
        const formattedModified = isClickhouse ? modified : formatSql(modified)
        setSourceSqlDiff({ original, modified: formattedModified })
        setSelectedDiffType(DiffType.Modification)
        setPromptState((prev) => ({ ...prev, isLoading: false }))
        setIsCompletionLoading(false)
      } catch (error: any) {
        toast.error(`Failed to generate SQL: ${error?.message ?? 'Unknown error'}`)
        setIsCompletionLoading(false)
        throw error
      }
    },
    [
      dialect,
      isClickhouse,
      org?.slug,
      project?.connectionString,
      project?.ref,
      setPromptState,
      setSelectedDiffType,
      setSourceSqlDiff,
    ]
  )

  const handlePrompt = useCallback(
    async (
      prompt: string,
      context: {
        beforeSelection: string
        selection: string
        afterSelection: string
      }
    ) => {
      try {
        setPromptState((prev) => ({
          ...prev,
          selection: context.selection,
          beforeSelection: context.beforeSelection,
          afterSelection: context.afterSelection,
        }))
        // ClickHouse only: there's no server-side schema to fetch for the logs
        // table, so the real log_attributes keys travel with the request. Detected
        // from the whole document, which is what the three context fields spell.
        const [headerData, availableKeys] = await Promise.all([
          constructHeaders(),
          isClickhouse
            ? fetchAttributeKeys(
                context.beforeSelection + context.selection + context.afterSelection
              )
            : undefined,
        ])

        const authorizationHeader = headerData.get('Authorization')

        // The instruction goes over as-is for both dialects — the route assembles
        // the schema section and the cursor context around it, so there's exactly
        // one place that knows how a completion prompt is built.
        await complete(prompt, {
          ...(authorizationHeader
            ? { headers: { Authorization: authorizationHeader } }
            : undefined),
          body: {
            completionMetadata: {
              textBeforeCursor: context.beforeSelection,
              textAfterCursor: context.afterSelection,
              language: 'pgsql',
              prompt,
              selection: context.selection,
              ...(availableKeys ? { availableKeys } : {}),
            },
          },
        })
      } catch (error) {
        setPromptState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [complete, fetchAttributeKeys, isClickhouse, setPromptState]
  )

  const handleDiffEditorMount = useCallback(
    (mountedDiffEditor: IStandaloneDiffEditor) => {
      diffController.attach(mountedDiffEditor)
      setIsDiffEditorMounted(true)
    },
    [diffController]
  )

  const resetDiff = useEffectEvent(() => {
    if (id) {
      closeDiff()
      setPromptState((prev) => ({ ...prev, isOpen: false }))
    }
  })
  useEffect(() => {
    resetDiff()
  }, [id])

  const syncDiffEditor = useEffectEvent(() => {
    if (isDiffOpen) {
      diffController.setDiff(defaultSqlDiff, promptState.startLineNumber)
    }
  })
  useEffect(() => {
    syncDiffEditor()
  }, [selectedDiffType, sourceSqlDiff])

  const drainDiffRequest = useEffectEvent(() => {
    const request = diffRequest.pending
    if (request === undefined) return

    // Editor isn't ready yet; leave the request pending. editorMountCount bumps
    // on mount and re-runs this effect, so the request applies once mounted.
    if (!editor.isReady()) return

    const existingValue = editor.getValue() ?? ''
    const plan = planDiffRequestApplication({ existingValue, request })
    if (plan.kind === 'replace') {
      // if the editor is empty, just copy over the code
      editor.replaceAll(plan.text, 'apply-ai-message')
    } else {
      setSourceSqlDiff(plan.diff)
      setSelectedDiffType(plan.diffType)
    }

    // One-shot: drain the request so it can't re-apply to a later editor or session.
    diffRequest.consumeDiffRequest()
  })
  useEffect(() => {
    drainDiffRequest()
  }, [diffRequest.pending, editorMountCount])

  // We want to check if the diff editor is mounted and if it is, we want to show the widget
  // We also want to cleanup the widget when the diff editor is closed
  useEffect(() => {
    if (!isDiffOpen) {
      setIsDiffEditorMounted(false)
      setShowWidget(false)
    } else if (diffController.isMounted() && isDiffEditorMounted) {
      setShowWidget(true)
      return () => setShowWidget(false)
    }
  }, [diffController, isDiffOpen, isDiffEditorMounted])

  return useMemo(
    () => ({
      handlePrompt,
      acceptAiHandler,
      discardAiHandler,
      onDebug,
      buildDebugPrompt,
      handleDiffEditorMount,
      isCompletionLoading,
      showWidget,
    }),
    [
      handlePrompt,
      acceptAiHandler,
      discardAiHandler,
      onDebug,
      buildDebugPrompt,
      handleDiffEditorMount,
      isCompletionLoading,
      showWidget,
    ]
  )
}
