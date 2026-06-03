import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { clearPersistedDraftSqlTab } from './createDraftSqlTab'
import { saveSqlSnippet } from './saveSqlSnippet.utils'
import { useSqlTitleGenerateMutation } from '@/data/ai/sql-title-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useOrgAiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useProfile } from '@/lib/profile'
import { useQueryExecutionSourceSnapshot } from '@/state/query-execution-source'
import { getSqlEditorV2StateSnapshot, useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export type UseSaveSqlSnippetOptions = {
  id: string
  snippetName: string
  getEditorSql: () => string | undefined
}

export function useSaveSqlSnippet({ id, snippetName, getEditorSql }: UseSaveSqlSnippetOptions) {
  const { ref: projectRef } = useParams()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabs = useTabsStateSnapshot()
  const querySourceState = useQueryExecutionSourceSnapshot()
  const { isHipaaProjectDisallowed } = useOrgAiOptInLevel()
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()

  const { can: canCreateSQLSnippet } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  const saveQuery = useCallback(async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!project) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')

    const state = getSqlEditorV2StateSnapshot()
    const snippet = state.snippets[id]?.snippet
    const isReadOnly = snippet?.visibility === 'project' && snippet?.owner_id !== profile.id

    if (isReadOnly) return

    if (!canCreateSQLSnippet) {
      return toast('Your queries will not be saved as you do not have sufficient permissions')
    }

    const sql = getEditorSql() ?? ''
    const result = await saveSqlSnippet({
      id,
      sql,
      snippetName,
      projectRef,
      ownerId: profile.id,
      projectId: project.id,
      querySource: querySourceState.executionSource,
      snippet,
      isHipaaProjectDisallowed,
      addSnippet: snapV2.addSnippet,
      setSql: snapV2.setSql,
      addNeedsSaving: snapV2.addNeedsSaving,
      generateSqlTitle,
      updateSnippet: snapV2.updateSnippet,
      onTabLabelUpdate: (name) => {
        const tabId = createTabId('sql', { id })
        tabs.updateTab(tabId, { label: name })
      },
      onDraftSaved: () => {
        const tabId = createTabId('sql', { id })
        tabs.updateTab(tabId, { metadata: { isDraft: false } })
        if (projectRef) {
          clearPersistedDraftSqlTab(projectRef, id)
        }
      },
    })

    if (result.reason === 'empty') {
      toast.error('Nothing to save')
    }
  }, [
    canCreateSQLSnippet,
    generateSqlTitle,
    getEditorSql,
    id,
    isHipaaProjectDisallowed,
    profile,
    project,
    projectRef,
    querySourceState.executionSource,
    snippetName,
    snapV2.addNeedsSaving,
    snapV2.addSnippet,
    snapV2.setSql,
    snapV2.updateSnippet,
    tabs,
  ])

  const snippet = snapV2.snippets[id]
  const isReadOnly =
    snippet?.snippet.visibility === 'project' && snippet?.snippet.owner_id !== profile?.id
  const isSaving = snapV2.savingStates[id] === 'UPDATING'

  return {
    saveQuery,
    isReadOnly,
    isSaving,
    canSave: canCreateSQLSnippet && !isReadOnly,
  }
}
