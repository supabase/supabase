import { RegistryDefinations } from '../types'

export const SQL_EDITOR_SHORTCUT_IDS = {
  SQL_EDITOR_BLUR_EDITOR: 'sql-editor.blur-editor',
  SQL_EDITOR_FOCUS_EDITOR: 'sql-editor.focus-editor',
  SQL_EDITOR_FORMAT: 'sql-editor.format',
  SQL_EDITOR_EXPLAIN: 'sql-editor.explain',
  SQL_EDITOR_NEW_SNIPPET: 'sql-editor.new-snippet',
}

export type SqlEditorShortcutId =
  (typeof SQL_EDITOR_SHORTCUT_IDS)[keyof typeof SQL_EDITOR_SHORTCUT_IDS]

export const sqlEditorRegistry: RegistryDefinations<SqlEditorShortcutId> = {
  [SQL_EDITOR_SHORTCUT_IDS.SQL_EDITOR_BLUR_EDITOR]: {
    id: SQL_EDITOR_SHORTCUT_IDS.SQL_EDITOR_BLUR_EDITOR,
    label: 'Blur SQL editor',
    sequence: ['Escape'],
    showInSettings: false,
  },
  [SQL_EDITOR_SHORTCUT_IDS.SQL_EDITOR_FOCUS_EDITOR]: {
    id: SQL_EDITOR_SHORTCUT_IDS.SQL_EDITOR_FOCUS_EDITOR,
    label: 'Focus SQL editor',
    sequence: ['Shift+E'],
    showInSettings: false,
  },
  [SQL_EDITOR_SHORTCUT_IDS.SQL_EDITOR_FORMAT]: {
    id: SQL_EDITOR_SHORTCUT_IDS.SQL_EDITOR_FORMAT,
    label: 'Prettify SQL',
    sequence: ['Alt+Shift+F'],
    showInSettings: false,
  },
  [SQL_EDITOR_SHORTCUT_IDS.SQL_EDITOR_EXPLAIN]: {
    id: SQL_EDITOR_SHORTCUT_IDS.SQL_EDITOR_EXPLAIN,
    label: 'Run EXPLAIN ANALYZE',
    sequence: ['Mod+Shift+Enter'],
    showInSettings: false,
  },
  [SQL_EDITOR_SHORTCUT_IDS.SQL_EDITOR_NEW_SNIPPET]: {
    id: SQL_EDITOR_SHORTCUT_IDS.SQL_EDITOR_NEW_SNIPPET,
    label: 'New SQL snippet',
    sequence: ['Shift+N'],
    showInSettings: false,
  },
}
