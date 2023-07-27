import { DiffOnMount, OnMount } from '@monaco-editor/react'

export interface SQLTemplate {
  id: number
  type: 'template' | 'quickstart'
  title: string
  description: string
  sql: string
}

export type IStandaloneCodeEditor = Parameters<OnMount>[0]
export type IStandaloneDiffEditor = Parameters<DiffOnMount>[0]
