import { untitledSnippetTitle } from './SQLEditor.constants'
import { createSqlSnippetSkeletonV2 } from './SQLEditor.utils'
import { IS_PLATFORM } from '@/lib/constants'
import type { QueryExecutionSource } from '@/state/query-execution-source'
import type { SnippetWithContent } from '@/state/sql-editor-v2'

export type SaveSqlSnippetParams = {
  id: string
  sql: string
  snippetName: string
  projectRef: string
  ownerId: number
  projectId: number
  querySource: QueryExecutionSource
  snippet: SnippetWithContent | undefined
  isHipaaProjectDisallowed: boolean
  addSnippet: (args: { projectRef: string; snippet: SnippetWithContent }) => void
  setSql: (args: {
    id: string
    sql: string
    shouldInvalidate?: boolean
    skipSave?: boolean
  }) => void
  addNeedsSaving: (id: string) => void
  generateSqlTitle: (args: { sql: string }) => Promise<{ title: string }>
  updateSnippet: (args: {
    id: string
    snippet: { name?: string; isDraftTab?: boolean }
    skipSave?: boolean
  }) => void
  onTabLabelUpdate?: (name: string) => void
  onDraftSaved?: () => void
  onNavigateToSnippet?: () => void
}

export async function saveSqlSnippet({
  id,
  sql,
  snippetName,
  projectRef,
  ownerId,
  projectId,
  querySource,
  snippet,
  isHipaaProjectDisallowed,
  addSnippet,
  setSql,
  addNeedsSaving,
  generateSqlTitle,
  updateSnippet,
  onTabLabelUpdate,
  onDraftSaved,
  onNavigateToSnippet,
}: SaveSqlSnippetParams): Promise<{ saved: boolean; reason?: 'empty' }> {
  const trimmedSql = sql.trim()
  if (!trimmedSql) {
    return { saved: false, reason: 'empty' }
  }

  let currentSnippet = snippet

  if (!currentSnippet) {
    const skeleton = createSqlSnippetSkeletonV2({
      idOverride: id,
      name: snippetName,
      sql: trimmedSql,
      owner_id: ownerId,
      project_id: projectId,
      querySource,
    })
    addSnippet({ projectRef, snippet: skeleton })
    currentSnippet = skeleton
    onNavigateToSnippet?.()
  }

  const shouldInvalidate = currentSnippet.isNotSavedInDatabaseYet

  if (currentSnippet.isDraftTab) {
    updateSnippet({ id, snippet: { isDraftTab: false }, skipSave: true })
    currentSnippet = { ...currentSnippet, isDraftTab: false }
    onDraftSaved?.()
  }

  setSql({ id, sql: trimmedSql, shouldInvalidate })
  addNeedsSaving(id)

  const snippetNameForRename = currentSnippet.name
  if (
    IS_PLATFORM &&
    !isHipaaProjectDisallowed &&
    snippetNameForRename.startsWith(untitledSnippetTitle)
  ) {
    try {
      const { title: name } = await generateSqlTitle({ sql: trimmedSql })
      updateSnippet({ id, snippet: { name } })
      addNeedsSaving(id)
      onTabLabelUpdate?.(name)
    } catch {
      // background title generation — no user feedback needed
    }
  }

  return { saved: true }
}
