import { useState } from 'react'

import type { IStandaloneCodeEditor } from './SQLEditor.types'
import { useSQLEditorContext } from './SQLEditorContext'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

/**
 * Owns the editor `onMount` handler (scroll-position restore + tracking) and the
 * mount counter that lets a diff request which arrived before the editor was
 * ready re-run once it is.
 */
export function useEditorMount({ id }: { id: string }) {
  const { scrollTopRef } = useSQLEditorContext()
  const tabs = useTabsStateSnapshot()

  // Bumped on every editor mount (including the keyed remount on snippet switch)
  // so a diff request that arrived before the editor was ready gets re-processed.
  const [editorMountCount, setEditorMountCount] = useState(0)

  const onMount = (editor: IStandaloneCodeEditor) => {
    setEditorMountCount((count) => count + 1)

    const tabId = createTabId('sql', { id })
    const tabData = tabs.tabsMap[tabId]

    // [Joshen] Tiny timeout to give a bit of time for the content to load before scrolling
    setTimeout(() => {
      if (tabData?.metadata?.scrollTop) {
        editor.setScrollTop(tabData.metadata.scrollTop)
      }
    }, 20)
    editor.onDidScrollChange((e) => (scrollTopRef.current = e.scrollTop))
  }

  return { onMount, editorMountCount }
}
