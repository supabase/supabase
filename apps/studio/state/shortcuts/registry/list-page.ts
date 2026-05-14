import { RegistryDefinations } from '../types'

/**
 * Shared shortcuts for "list pages" — the conventional Database/* page shape
 * with a schema selector, a search input, a primary "create new" action, and
 * one or more facet filters.
 *
 * Pages register their per-page handlers via `useShortcut`. Pass a `label`
 * override to make the Cmd+K entry and hover tooltip read e.g. "Search tables"
 * instead of the generic "Focus search" stored here.
 */
export const LIST_PAGE_SHORTCUT_IDS = {
  LIST_PAGE_FOCUS_SCHEMA: 'list-page.focus-schema',
  LIST_PAGE_FOCUS_SEARCH: 'list-page.focus-search',
  LIST_PAGE_NEW_ITEM: 'list-page.new-item',
  LIST_PAGE_RESET_FILTERS: 'list-page.reset-filters',
}

export type ListPageShortcutId =
  (typeof LIST_PAGE_SHORTCUT_IDS)[keyof typeof LIST_PAGE_SHORTCUT_IDS]

export const listPageRegistry: RegistryDefinations<ListPageShortcutId> = {
  [LIST_PAGE_SHORTCUT_IDS.LIST_PAGE_FOCUS_SCHEMA]: {
    id: LIST_PAGE_SHORTCUT_IDS.LIST_PAGE_FOCUS_SCHEMA,
    label: 'Open schema selector',
    sequence: ['O', 'S'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
  [LIST_PAGE_SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH]: {
    id: LIST_PAGE_SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    label: 'Focus search',
    sequence: ['Shift+F'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [LIST_PAGE_SHORTCUT_IDS.LIST_PAGE_NEW_ITEM]: {
    id: LIST_PAGE_SHORTCUT_IDS.LIST_PAGE_NEW_ITEM,
    label: 'Create new item',
    sequence: ['Shift+N'],
    showInSettings: false,
    options: { registerInCommandMenu: true },
  },
  [LIST_PAGE_SHORTCUT_IDS.LIST_PAGE_RESET_FILTERS]: {
    id: LIST_PAGE_SHORTCUT_IDS.LIST_PAGE_RESET_FILTERS,
    label: 'Reset filters',
    sequence: ['F', 'C'],
    showInSettings: false,
    options: { ignoreInputs: true, registerInCommandMenu: true },
  },
}
