import { ShortcutDefinition } from './types'

export const SHORTCUT_IDS = {
  RESULTS_COPY_MARKDOWN: 'results.copy-markdown',
} as const

export type ShortcutId = (typeof SHORTCUT_IDS)[keyof typeof SHORTCUT_IDS]

export const SHORTCUT_DEFINITIONS: Record<ShortcutId, ShortcutDefinition> = {
  [SHORTCUT_IDS.RESULTS_COPY_MARKDOWN]: {
    id: SHORTCUT_IDS.RESULTS_COPY_MARKDOWN,
    label: 'Copy results as Markdown',
    sequence: ['Mod+Shift+M'],
  },
}
