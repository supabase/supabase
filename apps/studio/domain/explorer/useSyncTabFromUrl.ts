import { RegistryContext } from '@effect/atom-react'
import { useContext, useLayoutEffect } from 'react'

import { NotebookId } from '../notebooks/notebook.schema'
import { openChatTab, openNotebookTab } from './explorer.open-tab'

/**
 * Bridges a `/explorer-test/notebook/$id` route into explorer tab state:
 * selects the tab already open for `notebookId`, or opens a new one (deep
 * link). Mirrors `useSyncProjectRef` — the write must happen before paint,
 * so it's a `useLayoutEffect`, not derived during render.
 */
export const useSyncNotebookTabFromUrl = (notebookId: string) => {
  const registry = useContext(RegistryContext)

  useLayoutEffect(() => {
    openNotebookTab(registry, NotebookId.make(notebookId))
  }, [registry, notebookId])
}

/**
 * Bridges a `/explorer-test/chat/$id` route into explorer tab state. Chat
 * content still lives in legacy state, which is either already hydrated or
 * hydrates asynchronously on its own — there's nothing to fetch here.
 */
export const useSyncChatTabFromUrl = (chatId: string) => {
  const registry = useContext(RegistryContext)

  useLayoutEffect(() => {
    openChatTab(registry, chatId)
  }, [registry, chatId])
}
