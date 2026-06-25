import type { SnippetFolder, SnippetWithContent } from '@/data/content/sql-folders-query'

export type StateSnippetFolder = {
  projectRef: string
  folder: SnippetFolder
  status?: 'editing' | 'saving' | 'idle'
}

export type StateSnippet = {
  projectRef: string
  splitSizes: number[]
  snippet: SnippetWithContent
}
