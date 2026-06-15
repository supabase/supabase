import { useParams } from 'common'
import { useEffect, useRef } from 'react'

import { restoreOpenDraftSqlTabs } from './createDraftSqlTab'
import { prunePersistedDraftSqlTabs } from './draftSqlTabStorage.utils'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useProfile } from '@/lib/profile'
import { getSqlEditorV2StateSnapshot, useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { useTabsStateSnapshot } from '@/state/tabs'

export function useRestorePersistedDraftSqlTabs() {
  const { ref: projectRef } = useParams()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabs = useTabsStateSnapshot()
  const hasRestoredRef = useRef<string | null>(null)

  useEffect(() => {
    if (!projectRef || !project || !profile) return
    if (hasRestoredRef.current === projectRef) return

    hasRestoredRef.current = projectRef

    const openDraftIds = restoreOpenDraftSqlTabs({
      projectRef,
      projectId: project.id,
      ownerId: profile.id,
      snapV2,
      openTabs: tabs.openTabs,
      tabsMap: tabs.tabsMap,
      existingSnippetIds: new Set(Object.keys(getSqlEditorV2StateSnapshot().snippets)),
    })

    prunePersistedDraftSqlTabs(projectRef, openDraftIds)
  }, [profile, project, projectRef, snapV2, tabs.openTabs, tabs.tabsMap])
}
