import { Array, Option } from 'effect'
import type { AtomRegistry } from 'effect/unstable/reactivity'

import { NotebookId } from '../notebooks/notebook.schema'
import { notebooksAtoms } from '../notebooks/notebooks.atoms'
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

/** Opens a notebook tab, reusing one already open for `notebookId` — and (re)loads its content/name. */
export const openNotebookTab = (
  registry: AtomRegistry.AtomRegistry,
  projectRef: string,
  notebookId: NotebookId
) => {
  const id = selectOrAddTab(
    registry,
    (data) => data._tag === 'NotebookTab' && data.notebookId === notebookId,
    () => ({ _tag: 'NotebookTab', notebookId })
  )
  notebooksAtoms.loadNotebook(registry, projectRef, notebookId)
  return id
}

/** Opens a chat tab, reusing one already open for `chatId`. Chat content still lives in legacy state. */
export const openChatTab = (registry: AtomRegistry.AtomRegistry, chatId: string) =>
  selectOrAddTab(
    registry,
    (data) => data._tag === 'ChatTab' && data.chatId === chatId,
    () => ({ _tag: 'ChatTab', chatId })
  )
