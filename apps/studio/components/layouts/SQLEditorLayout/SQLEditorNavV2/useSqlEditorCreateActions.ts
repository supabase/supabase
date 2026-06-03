import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { createDraftSqlTab } from '@/components/interfaces/SQLEditor/createDraftSqlTab'
import { generateSnippetTitle } from '@/components/interfaces/SQLEditor/SQLEditor.constants'
import { createSqlSnippetSkeletonV2 } from '@/components/interfaces/SQLEditor/SQLEditor.utils'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'
import { useProfile } from '@/lib/profile'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { useTabsStateSnapshot } from '@/state/tabs'

export type SqlEditorSnippetCreateTarget = 'private' | 'shared' | 'favorite'

export function useSqlEditorCreateActions() {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabs = useTabsStateSnapshot()
  const assistant = useAiAssistantStateSnapshot()
  const [, setShowNewReportModal] = useQueryState('newReport', parseAsBoolean.withDefault(false))
  const { reportsAll } = useIsFeatureEnabled(['reports:all'])
  const canCreateNotebook = IS_PLATFORM && reportsAll

  const { can: canCreateSQLSnippet } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  const createNewFolder = useCallback(() => {
    if (!projectRef) return console.error('Project ref is required')
    snapV2.addNewFolder({ projectRef })
  }, [projectRef, snapV2])

  const createNewSnippet = useCallback(
    async (target: SqlEditorSnippetCreateTarget = 'private') => {
      if (!projectRef) return console.error('Project ref is required')
      if (!project) return console.error('Project is required')
      if (!profile) return console.error('Profile is required')
      if (!canCreateSQLSnippet) {
        return toast('Your queries will not be saved as you do not have sufficient permissions')
      }

      try {
        if (target === 'private') {
          createDraftSqlTab({
            projectRef,
            projectId: project.id,
            ownerId: profile.id,
            snapV2,
            tabs,
            router,
          })
          return
        }

        const snippet = createSqlSnippetSkeletonV2({
          name: generateSnippetTitle(),
          sql: '',
          owner_id: profile.id,
          project_id: project.id,
          ...(target === 'shared'
            ? { visibility: 'project' as const, folder_id: null }
            : { favorite: true }),
        })

        snapV2.addSnippet({ projectRef, snippet })
        snapV2.addNeedsSaving(snippet.id)
        await router.push(`/project/${projectRef}/sql/${snippet.id}`)
      } catch (error: any) {
        toast.error(`Failed to create new query: ${error.message}`)
      }
    },
    [canCreateSQLSnippet, profile, project, projectRef, router, snapV2, tabs]
  )

  const createNewChat = useCallback(() => {
    if (!projectRef) return console.error('Project ref is required')
    const newChatId = assistant.newChat()
    void router.push(`/project/${projectRef}/sql/chats/${newChatId}`)
  }, [assistant, projectRef, router])

  const createNewNotebook = useCallback(() => {
    void setShowNewReportModal(true)
  }, [setShowNewReportModal])

  return {
    canCreateNotebook,
    canCreateSQLSnippet,
    createNewChat,
    createNewFolder,
    createNewNotebook,
    createNewSnippet,
  }
}
