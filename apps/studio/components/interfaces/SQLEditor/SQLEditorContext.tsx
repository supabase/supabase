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

import type { IStandaloneCodeEditor, IStandaloneDiffEditor } from './SQLEditor.types'
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
  getEditorSql: (snippetContent?: UntrustedSqlFragment) => UntrustedSqlFragment | undefined
  /** Clear any active error-highlight decorations. */
  clearHighlights: () => void
  /** Highlight and reveal the line referenced by an execute error's position. */
  applyErrorHighlight: (
    error: { position?: unknown; formattedError?: string },
    hasSelection: boolean
  ) => void
}

const SQLEditorContext = createContext<SQLEditorContextValue | null>(null)

export const useSQLEditorContext = () => {
  const context = use(SQLEditorContext)
  if (!context) {
    throw new Error('useSQLEditorContext must be used within a SQLEditorProvider')
  }
  return context
}

export const SQLEditorProvider = ({ children }: PropsWithChildren) => {
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

  const getEditorSqlFromEditor = useCallback((snippetContent?: UntrustedSqlFragment) => {
    const editor = editorRef.current
    if (!editor) return undefined
    return getEditorSql(editor, snippetContent)
  }, [])

  const clearHighlights = useCallback(() => {
    if (lineHighlightsRef.current.length > 0) {
      editorRef.current?.deltaDecorations(lineHighlightsRef.current, [])
      lineHighlightsRef.current = []
    }
  }, [])

  const applyErrorHighlight = useCallback(
    (error: { position?: unknown; formattedError?: string }, hasSelection: boolean) => {
      if (!error.position || !monacoRef.current) return

      const editor = editorRef.current
      const monaco = monacoRef.current
      const startLineNumber = hasSelection ? (editor?.getSelection()?.startLineNumber ?? 0) : 0
      const line = computeErrorHighlightLine(error, startLineNumber)
      if (isNaN(line)) return

      const decorations = editor?.deltaDecorations(
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
        editor?.revealLineInCenter(line)
        lineHighlightsRef.current = decorations
      }
    },
    []
  )

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
      getEditorSql: getEditorSqlFromEditor,
      clearHighlights,
      applyErrorHighlight,
    }),
    [
      refocusEditor,
      clearPendingRunRefocus,
      markRefocusAfterRun,
      refocusEditorAfterRunIfNeeded,
      getEditorSqlFromEditor,
      clearHighlights,
      applyErrorHighlight,
    ]
  )

  return <SQLEditorContext.Provider value={value}>{children}</SQLEditorContext.Provider>
}
