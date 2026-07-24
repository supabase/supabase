import type { DiffOnMount, OnMount } from '@monaco-editor/react'
import type { UntrustedSqlFragment } from '@supabase/pg-meta'
import { Dispatch, SetStateAction } from 'react'

export interface SQLTemplate {
  id: number
  type: 'template' | 'quickstart'
  title: string
  description: string
  sql: string
}

export type IStandaloneCodeEditor = Parameters<OnMount>[0]
export type IStandaloneDiffEditor = Parameters<DiffOnMount>[0]

export type ContentDiff = {
  original: string
  modified: string
}

/**
 * Semantic, Monaco-agnostic port onto the main editor. Hooks/controllers call
 * this instead of touching `editorRef.current` directly, so the editor is
 * swappable for a real in-memory adapter in tests without mocking.
 */
export type EditorController = {
  isReady: () => boolean
  getValue: () => string | undefined
  getSelectionStartLine: () => number | undefined
  getSql: (snippetContent?: UntrustedSqlFragment) => UntrustedSqlFragment | undefined
  replaceAll: (text: string, source: string) => void
  focus: () => void
  revealLineInCenter: (line: number) => void
  highlightErrorLine: (
    error: { position?: unknown; formattedError?: string },
    hasSelection: boolean
  ) => void
  clearHighlights: () => void
}

/** Semantic, Monaco-agnostic port onto the diff editor. */
export type DiffController = {
  isMounted: () => boolean
  getModifiedValue: () => string | undefined
  setDiff: (diff: ContentDiff, revealLine: number) => void
  attach: (editor: IStandaloneDiffEditor) => void
}

export type SQLEditorContextValues = {
  aiInput: string
  setAiInput: Dispatch<SetStateAction<string>>
  sqlDiff?: ContentDiff
  setSqlDiff: Dispatch<SetStateAction<ContentDiff | undefined>>
  setSelectedDiffType: Dispatch<SetStateAction<DiffType | undefined>>
}

export enum DiffType {
  Modification = 'modification',
  Addition = 'addition',
  NewSnippet = 'new-snippet',
}

export type PotentialIssues = {
  hasDestructiveOperations?: boolean
  hasUpdateWithoutWhere?: boolean
  hasAlterDatabasePreventConnection?: boolean
  createTablesMissingRLS?: { schema?: string; tableName: string }[]
}

/** The tabs available in the SQL editor's results/utility panel. */
export type UtilityTab = 'results'
