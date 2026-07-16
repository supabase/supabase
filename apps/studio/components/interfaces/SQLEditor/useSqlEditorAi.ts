import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { useSqlEditorDiff, useSqlEditorPrompt } from './hooks'
import { DiffType, type IStandaloneDiffEditor } from './SQLEditor.types'
import {
  assembleCompletionDiff,
  buildDebugChatArgs,
  buildDebugPromptText,
  createSqlSnippetSkeletonV2,
  extractDebugContext,
} from './SQLEditor.utils'
import { useSQLEditorContext } from './SQLEditorContext'
import { useSnippetTitleGenerator } from './useSnippetTitleGenerator'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { constructHeaders } from '@/data/fetchers'
import { isError } from '@/data/utils/error-check'
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
}

/**
 * Owns the Assistant / diff cluster: SQL completion, the ask-AI prompt flow, the
 * accept/discard diff handlers, the debug-prompt helpers, and the fragile diff
 * lifecycle effects (one-shot diff-request drain, diff-editor value sync, and the
 * ask-AI widget visibility).
 */
export function useSqlEditorAi({ id, editorMountCount, diff, prompt }: UseSqlEditorAiArgs) {
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

  const { editorRef, diffEditorRef, refocusEditor } = useSQLEditorContext()

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

    return buildDebugPromptText(sql, errorMessage)
  }, [id, sessionSnap.results, snapV2.snippets])

  const onDebug = useCallback(async () => {
    try {
      const snippet = snapV2.snippets[id]
      const result = sessionSnap.results[id]?.[0]
      openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
      aiSnap.newChat(buildDebugChatArgs(snippet, result))
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
  }, [id, sessionSnap.results, snapV2.snippets, aiSnap, openSidebar])

  const acceptAiHandler = useCallback(async () => {
    try {
      setIsAcceptDiffLoading(true)

      // TODO: show error if undefined
      if (!sourceSqlDiff || !editorRef.current || !diffEditorRef.current) return

      const editorModel = editorRef.current.getModel()
      const diffModel = diffEditorRef.current.getModel()

      if (!editorModel || !diffModel) return

      const sql = diffModel.modified.getValue()

      if (selectedDiffType === DiffType.NewSnippet) {
        const { title } = await generateSqlTitle({ sql })
        await handleNewQuery(sql, title)
      } else {
        editorRef.current.executeEdits('apply-ai-edit', [
          {
            text: sql,
            range: editorModel.getFullModelRange(),
          },
        ])
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
    editorRef,
    diffEditorRef,
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
          body: JSON.stringify({
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            language: 'sql',
            orgSlug: org?.slug,
            ...(options?.body ?? {}),
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to generate completion')
        }

        // API returns a JSON-encoded string
        const text: string = await response.json()

        const meta = options?.body?.completionMetadata ?? {}
        const { original, modified } = assembleCompletionDiff(meta, text)

        const formattedModified = formatSql(modified)
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
        const headerData = await constructHeaders()

        const authorizationHeader = headerData.get('Authorization')

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
            },
          },
        })
      } catch (error) {
        setPromptState((prev) => ({ ...prev, isLoading: false }))
      }
    },
    [complete, setPromptState]
  )

  const handleDiffEditorMount = useCallback(
    (editor: IStandaloneDiffEditor) => {
      diffEditorRef.current = editor
      setIsDiffEditorMounted(true)
    },
    [diffEditorRef]
  )

  const resetDiff = useEffectEvent(() => {
    if (id) {
      closeDiff()
      setPromptState((prev) => ({ ...prev, isOpen: false }))
    }
  })
  useEffect(() => {
    resetDiff()
    // Temporary until we update eslint to ignore useEffectEvent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (isDiffOpen) {
      const diffEditor = diffEditorRef.current
      const model = diffEditor?.getModel()
      if (model && model.original && model.modified) {
        model.original.setValue(defaultSqlDiff.original)
        model.modified.setValue(defaultSqlDiff.modified)
        // scroll to the start line of the modification
        const modifiedEditor = diffEditor!.getModifiedEditor()
        const startLine = promptState.startLineNumber
        modifiedEditor.revealLineInCenter(startLine)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDiffType, sourceSqlDiff])

  const drainDiffRequest = useEffectEvent(() => {
    const request = diffRequest.pending
    if (request === undefined) return

    const editorModel = editorRef.current?.getModel()
    // Editor isn't ready yet; leave the request pending. editorMountCount bumps
    // on mount and re-runs this effect, so the request applies once mounted.
    if (!editorModel) return

    const { diffType, sql } = request
    const existingValue = editorRef.current?.getValue() ?? ''
    if (existingValue.length === 0) {
      // if the editor is empty, just copy over the code
      editorRef.current?.executeEdits('apply-ai-message', [
        {
          text: `${sql}`,
          range: editorModel.getFullModelRange(),
        },
      ])
    } else {
      const currentSql = editorRef.current?.getValue()
      const diff = { original: currentSql || '', modified: sql }
      setSourceSqlDiff(diff)
      setSelectedDiffType(diffType)
    }

    // One-shot: drain the request so it can't re-apply to a later editor or session.
    diffRequest.consumeDiffRequest()
  })
  useEffect(() => {
    drainDiffRequest()
    // until we can upgrade eslint to ignore useEffectEvent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diffRequest.pending, editorMountCount])

  // We want to check if the diff editor is mounted and if it is, we want to show the widget
  // We also want to cleanup the widget when the diff editor is closed
  useEffect(() => {
    if (!isDiffOpen) {
      setIsDiffEditorMounted(false)
      setShowWidget(false)
    } else if (diffEditorRef.current && isDiffEditorMounted) {
      setShowWidget(true)
      return () => setShowWidget(false)
    }
  }, [diffEditorRef, isDiffOpen, isDiffEditorMounted])

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
