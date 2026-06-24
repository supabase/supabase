import type { Snippet, SnippetFolder } from '@/data/content/sql-folders-query'
import type { SqlSnippets } from '@/types'

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

// [Joshen] API codegen is somehow missing the content property
export interface SnippetWithContent extends Snippet {
  content?: SqlSnippets.Content
  isNotSavedInDatabaseYet?: boolean
}
