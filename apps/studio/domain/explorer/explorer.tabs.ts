import { Match, Option, Schema } from 'effect'
import type { KeyValueStore } from 'effect/unstable/persistence/KeyValueStore'
import { Atom } from 'effect/unstable/reactivity'

import { NotebookId } from '../notebooks/notebook.schema'
import { tabsFactory } from '../tabs/tabs.factory'
import { tabsRuntime } from '../tabs/tabs.runtime'

const EXPLORER_TABS_STORAGE_KEY = 'studio.explorer.tabs'

const QueryTab = Schema.TaggedStruct('QueryTab', {})
export type QueryTab = typeof QueryTab.Type

const NotebookTab = Schema.TaggedStruct('NotebookTab', {
  notebookId: NotebookId,
})
export type NotebookTab = typeof NotebookTab.Type

const ChatTab = Schema.TaggedStruct('ChatTab', {
  chatId: Schema.String,
})
export type ChatTab = typeof ChatTab.Type

const ExplorerTab = Schema.Union([QueryTab, NotebookTab, ChatTab])
export type ExplorerTab = typeof ExplorerTab.Type

export const makeExplorerTabs = (runtime: Atom.AtomRuntime<KeyValueStore>) =>
  tabsFactory(runtime, EXPLORER_TABS_STORAGE_KEY, ExplorerTab)

export const explorerTabs = makeExplorerTabs(tabsRuntime)

/** The URL shape a tab maps to: `/explorer-test/<_tag>/<contentId>`. `_tag` matches
 *  the naming `Match.tagsExhaustive` expects, so callers can match on it exhaustively. */
export type ExplorerTabRoute =
  | { readonly _tag: 'query'; readonly contentId: string }
  | { readonly _tag: 'notebook'; readonly contentId: string }
  | { readonly _tag: 'chat'; readonly contentId: string }

/**
 * Query tabs have no stable external id, so their own (internal) tab id
 * doubles as the URL content-id — it only ever resolves back to a tab that's
 * already open, so it's never used to reconstruct one from a bare URL.
 */
export const currentTabRouteAtom: Atom.Atom<Option.Option<ExplorerTabRoute>> = Atom.readable(
  (get) =>
    get(explorerTabs.currentTabDataAtom).pipe(
      Option.map(
        (tab): ExplorerTabRoute =>
          Match.value(tab.data).pipe(
            Match.tagsExhaustive({
              QueryTab: (): ExplorerTabRoute => ({ _tag: 'query', contentId: tab.id }),
              NotebookTab: (data): ExplorerTabRoute => ({
                _tag: 'notebook',
                contentId: data.notebookId,
              }),
              ChatTab: (data): ExplorerTabRoute => ({ _tag: 'chat', contentId: data.chatId }),
            })
          )
      )
    )
)
