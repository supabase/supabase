import type { DiffOnMount, OnMount } from '@monaco-editor/react'
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
