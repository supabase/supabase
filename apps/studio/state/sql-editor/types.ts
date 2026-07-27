import type { FolderStatus } from './sql-editor-lifecycle'
import type { SnippetFolder, SnippetWithContent } from '@/data/content/sql-folders-query'

export type StateSnippetFolder = {
  projectRef: string
  folder: SnippetFolder
  status: FolderStatus
  /**
   * The name to restore if an in-flight rename fails. Set while a rename is
   * saving and cleared once it settles. Stored per-folder (rather than as one
   * shared field) so concurrent renames of different folders can't clobber each
   * other's rollback target.
   */
  previousName?: string
}

export type StateSnippet = {
  projectRef: string
  splitSizes: number[]
  snippet: SnippetWithContent
}
