import type { Monaco } from '@monaco-editor/react'
import type { UntrustedSqlFragment } from '@supabase/pg-meta'
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  type PropsWithChildren,
  type RefObject,
} from 'react'

import type {
  ContentDiff,
  DiffController,
  EditorController,
  IStandaloneCodeEditor,
  IStandaloneDiffEditor,
} from './SQLEditor.types'
import { computeErrorHighlightLine, getEditorSql } from './SQLEditor.utils'

type SQLEditorContextValue = {
  editorRef: RefObject<IStandaloneCodeEditor | null>
  monacoRef: RefObject<Monaco | null>
  diffEditorRef: RefObject<IStandaloneDiffEditor | null>
  scrollTopRef: RefObject<number>
  /** Focus the editor on the next frame (after layout settles). */
  refocusEditor: () => void
  /** Cancel a pending "refocus after the run finishes" request. */
  clearPendingRunRefocus: () => void
  /** Request that the editor be refocused once the current run finishes. */
  markRefocusAfterRun: () => void
  /** Refocus the editor iff a run-refocus was requested, then clear the flag. */
  refocusEditorAfterRunIfNeeded: () => void
  /** Semantic port onto the main editor — no hook should touch `editorRef.current` directly. */
  editor: EditorController
  /** Semantic port onto the diff editor — no hook should touch `diffEditorRef.current` directly. */
  diff: DiffController
}

const SQLEditorContext = createContext<SQLEditorContextValue | null>(null)

export const useSQLEditorContext = () => {
  const context = use(SQLEditorContext)
  if (!context) {
    throw new Error('useSQLEditorContext must be used within a SQLEditorProvider')
  }
  return context
}

type SQLEditorProviderProps = PropsWithChildren<{
  /**
   * Test-only seam: production omits these and gets the real Monaco-backed
   * controllers built from `editorRef`/`diffEditorRef` below. Tests pass a
   * real in-memory implementation (see `tests/lib/sql-editor-test-utils.tsx`)
   * instead of mocking Monaco.
   */
  editor?: EditorController
  diff?: DiffController
}>

export const SQLEditorProvider = ({
  children,
  editor: editorProp,
  diff: diffProp,
}: SQLEditorProviderProps) => {
  const editorRef = useRef<IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const diffEditorRef = useRef<IStandaloneDiffEditor | null>(null)
  const scrollTopRef = useRef<number>(0)
  const shouldRefocusAfterRunRef = useRef(false)
  // Decorations are only ever manipulated imperatively, so they live in a ref
  // rather than React state (nothing renders off them).
  const lineHighlightsRef = useRef<string[]>([])

  const refocusEditor = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => editorRef.current?.focus(), 0)
    })
  }, [])

  const clearPendingRunRefocus = useCallback(() => {
    shouldRefocusAfterRunRef.current = false
  }, [])

  const markRefocusAfterRun = useCallback(() => {
    shouldRefocusAfterRunRef.current = true
  }, [])

  const refocusEditorAfterRunIfNeeded = useCallback(() => {
    if (!shouldRefocusAfterRunRef.current) return

    shouldRefocusAfterRunRef.current = false
    refocusEditor()
  }, [refocusEditor])

  const isEditorReady = useCallback(() => editorRef.current !== null, [])

  const getEditorValue = useCallback(() => editorRef.current?.getValue(), [])

  const getSelectionStartLine = useCallback(
    () => editorRef.current?.getSelection()?.startLineNumber,
    []
  )

  const getSqlFromEditor = useCallback((snippetContent?: UntrustedSqlFragment) => {
    const editorInstance = editorRef.current
    if (!editorInstance) return undefined
    return getEditorSql(editorInstance, snippetContent)
  }, [])

  const replaceAll = useCallback((text: string, source: string) => {
    const editorInstance = editorRef.current
    const model = editorInstance?.getModel()
    if (!editorInstance || !model) return
    editorInstance.executeEdits(source, [{ text, range: model.getFullModelRange() }])
  }, [])

  const focusEditor = useCallback(() => {
    editorRef.current?.focus()
  }, [])

  const revealLineInCenter = useCallback((line: number) => {
    editorRef.current?.revealLineInCenter(line)
  }, [])

  const clearHighlights = useCallback(() => {
    if (lineHighlightsRef.current.length > 0) {
      editorRef.current?.deltaDecorations(lineHighlightsRef.current, [])
      lineHighlightsRef.current = []
    }
  }, [])

  const highlightErrorLine = useCallback(
    (error: { position?: unknown; formattedError?: string }, hasSelection: boolean) => {
      if (!error.position || !monacoRef.current) return

      const editorInstance = editorRef.current
      const monaco = monacoRef.current
      const startLineNumber = hasSelection
        ? (editorInstance?.getSelection()?.startLineNumber ?? 0)
        : 0
      const line = computeErrorHighlightLine(error, startLineNumber)
      if (isNaN(line)) return

      const decorations = editorInstance?.deltaDecorations(
        [],
        [
          {
            range: new monaco.Range(line, 1, line, 20),
            options: {
              isWholeLine: true,
              inlineClassName: 'bg-warning-400',
            },
          },
        ]
      )
      if (decorations) {
        editorInstance?.revealLineInCenter(line)
        lineHighlightsRef.current = decorations
      }
    },
    []
  )

  const builtEditor = useMemo<EditorController>(
    () => ({
      isReady: isEditorReady,
      getValue: getEditorValue,
      getSelectionStartLine,
      getSql: getSqlFromEditor,
      replaceAll,
      focus: focusEditor,
      revealLineInCenter,
      highlightErrorLine,
      clearHighlights,
    }),
    [
      isEditorReady,
      getEditorValue,
      getSelectionStartLine,
      getSqlFromEditor,
      replaceAll,
      focusEditor,
      revealLineInCenter,
      highlightErrorLine,
      clearHighlights,
    ]
  )
  const editor = editorProp ?? builtEditor

  const isDiffMounted = useCallback(() => diffEditorRef.current !== null, [])

  const getModifiedValue = useCallback(
    () => diffEditorRef.current?.getModel()?.modified.getValue(),
    []
  )

  const setDiff = useCallback((contentDiff: ContentDiff, revealLine: number) => {
    const diffEditorInstance = diffEditorRef.current
    const model = diffEditorInstance?.getModel()
    if (!diffEditorInstance || !model || !model.original || !model.modified) return

    model.original.setValue(contentDiff.original)
    model.modified.setValue(contentDiff.modified)
    diffEditorInstance.getModifiedEditor().revealLineInCenter(revealLine)
  }, [])

  const attachDiffEditor = useCallback((editorInstance: IStandaloneDiffEditor) => {
    diffEditorRef.current = editorInstance
  }, [])

  const builtDiff = useMemo<DiffController>(
    () => ({
      isMounted: isDiffMounted,
      getModifiedValue,
      setDiff,
      attach: attachDiffEditor,
    }),
    [isDiffMounted, getModifiedValue, setDiff, attachDiffEditor]
  )
  const diff = diffProp ?? builtDiff

  const value = useMemo<SQLEditorContextValue>(
    () => ({
      editorRef,
      monacoRef,
      diffEditorRef,
      scrollTopRef,
      refocusEditor,
      clearPendingRunRefocus,
      markRefocusAfterRun,
      refocusEditorAfterRunIfNeeded,
      editor,
      diff,
    }),
    [
      refocusEditor,
      clearPendingRunRefocus,
      markRefocusAfterRun,
      refocusEditorAfterRunIfNeeded,
      editor,
      diff,
    ]
  )

  return <SQLEditorContext.Provider value={value}>{children}</SQLEditorContext.Provider>
}
