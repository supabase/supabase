import { PermissionAction } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { createDraftSqlTab } from './createDraftSqlTab'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useProfile } from '@/lib/profile'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { useTabsStateSnapshot } from '@/state/tabs'

export function useCreateDraftSqlTab() {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabs = useTabsStateSnapshot()
  const [autoSaveSnippets] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_AUTO_SAVE_SNIPPETS,
    true
  )

  const { can: canCreateSQLSnippet } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  const createDraftTab = useCallback(
    (options?: { initialSql?: string }) => {
      if (!projectRef) return console.error('Project ref is required')
      if (!project) return console.error('Project is required')
      if (!profile) return console.error('Profile is required')
      if (!canCreateSQLSnippet) return

      return createDraftSqlTab({
        projectRef,
        projectId: project.id,
        ownerId: profile.id,
        snapV2,
        tabs,
        router,
        initialSql: options?.initialSql,
        creationMode: autoSaveSnippets ? 'saved' : 'draft',
      })
    },
    [autoSaveSnippets, canCreateSQLSnippet, profile, project, projectRef, router, snapV2, tabs]
  )

  return { createDraftTab, canCreateSQLSnippet }
}
