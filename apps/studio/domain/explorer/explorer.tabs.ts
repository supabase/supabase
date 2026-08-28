import { Schema } from 'effect'
import type { KeyValueStore } from 'effect/unstable/persistence/KeyValueStore'
import type { Atom } from 'effect/unstable/reactivity'

import { tabsFactory } from '../tabs/tabs.factory'
import { tabsRuntime } from '../tabs/tabs.runtime'

const EXPLORER_TABS_STORAGE_KEY = 'studio.explorer.tabs'

const QueryTab = Schema.TaggedStruct('QueryTab', {})
export type QueryTab = typeof QueryTab.Type

const NotebookTab = Schema.TaggedStruct('NotebookTab', {
  notebookId: Schema.String,
  label: Schema.String,
})
export type NotebookTab = typeof NotebookTab.Type

const ChatTab = Schema.TaggedStruct('ChatTab', {
  chatId: Schema.String,
  label: Schema.String,
})
export type ChatTab = typeof ChatTab.Type

const ExplorerTab = Schema.Union([QueryTab, NotebookTab, ChatTab])
export type ExplorerTab = typeof ExplorerTab.Type

export const makeExplorerTabs = (runtime: Atom.AtomRuntime<KeyValueStore>) =>
  tabsFactory(runtime, EXPLORER_TABS_STORAGE_KEY, ExplorerTab)

export const explorerTabs = makeExplorerTabs(tabsRuntime)
