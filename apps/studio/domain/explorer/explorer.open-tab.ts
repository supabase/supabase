import { Array, Option } from 'effect'
import type { AtomRegistry } from 'effect/unstable/reactivity'

import { NotebookId } from '../notebooks/notebook.schema'
import { explorerTabs, type ExplorerTab } from './explorer.tabs'

const selectOrAddTab = (
  registry: AtomRegistry.AtomRegistry,
  predicate: (data: ExplorerTab) => boolean,
  create: () => ExplorerTab
) => {
  const existing = Array.findFirst(registry.get(explorerTabs.tabsAtom), (tab) =>
    predicate(tab.data)
  )
  const id = existing.pipe(
    Option.map((tab) => tab.id),
    Option.getOrElse(() => explorerTabs.addTab(registry, create()))
  )
  registry.set(explorerTabs.currentTabAtom, id)
  return id
}

/**
 * Opens a notebook tab, reusing one already open for `notebookId`.
 */
export const openNotebookTab = (registry: AtomRegistry.AtomRegistry, notebookId: NotebookId) =>
  selectOrAddTab(
    registry,
    (data) => data._tag === 'NotebookTab' && data.notebookId === notebookId,
    () => ({ _tag: 'NotebookTab', notebookId })
  )

/** Opens a chat tab, reusing one already open for `chatId`. Chat content still lives in legacy state. */
export const openChatTab = (registry: AtomRegistry.AtomRegistry, chatId: string) =>
  selectOrAddTab(
    registry,
    (data) => data._tag === 'ChatTab' && data.chatId === chatId,
    () => ({ _tag: 'ChatTab', chatId })
  )
