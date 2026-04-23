import { RegistryDefinations } from '../types'

export const TABLE_EDITOR_SHORTCUT_IDS = {
  TABLE_EDITOR_JUMP_FIRST_ROW: 'table-editor.jump-first-row',
  TABLE_EDITOR_JUMP_LAST_ROW: 'table-editor.jump-last-row',
  TABLE_EDITOR_JUMP_FIRST_COL: 'table-editor.jump-first-col',
  TABLE_EDITOR_JUMP_LAST_COL: 'table-editor.jump-last-col',
  TABLE_EDITOR_TOGGLE_ROW_SELECTION: 'table-editor.toggle-row-selection',
  TABLE_EDITOR_TOGGLE_ALL_ROW_SELECTION: 'table-editor.toggle-all-row-selection',
  TABLE_EDITOR_SELECT_ALL_IN_TABLE: 'table-editor.select-all-in-table',
  TABLE_EDITOR_DELETE_SELECTED_ROWS: 'table-editor.delete-selected-rows',
  TABLE_EDITOR_START_NAVIGATION_DOWN: 'table-editor.start-navigation-down',
  TABLE_EDITOR_START_NAVIGATION_UP: 'table-editor.start-navigation-up',
  TABLE_EDITOR_EXIT_SELECTION: 'table-editor.exit-selection',
}

export type TableEditorShortcutId =
  (typeof TABLE_EDITOR_SHORTCUT_IDS)[keyof typeof TABLE_EDITOR_SHORTCUT_IDS]

export const tableEditorRegistry: RegistryDefinations<TableEditorShortcutId> = {
  [TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_JUMP_FIRST_ROW]: {
    id: TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_JUMP_FIRST_ROW,
    label: 'Jump to first row',
    sequence: ['Mod+ArrowUp'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_JUMP_LAST_ROW]: {
    id: TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_JUMP_LAST_ROW,
    label: 'Jump to last row',
    sequence: ['Mod+ArrowDown'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_JUMP_FIRST_COL]: {
    id: TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_JUMP_FIRST_COL,
    label: 'Jump to first column',
    sequence: ['Mod+ArrowLeft'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_JUMP_LAST_COL]: {
    id: TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_JUMP_LAST_COL,
    label: 'Jump to last column',
    sequence: ['Mod+ArrowRight'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_TOGGLE_ROW_SELECTION]: {
    id: TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_TOGGLE_ROW_SELECTION,
    label: 'Toggle selection on current row',
    sequence: ['Shift+Space'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_TOGGLE_ALL_ROW_SELECTION]: {
    id: TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_TOGGLE_ALL_ROW_SELECTION,
    label: 'Toggle selection on all displayed rows',
    sequence: ['Mod+A'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_SELECT_ALL_IN_TABLE]: {
    id: TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_SELECT_ALL_IN_TABLE,
    label: 'Toggle selection on all rows in table',
    sequence: ['Mod+Shift+A'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_DELETE_SELECTED_ROWS]: {
    id: TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_DELETE_SELECTED_ROWS,
    label: 'Delete selected rows',
    sequence: ['Mod+Backspace'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_START_NAVIGATION_DOWN]: {
    id: TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_START_NAVIGATION_DOWN,
    label: 'Start grid navigation (down)',
    sequence: ['ArrowDown'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_START_NAVIGATION_UP]: {
    id: TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_START_NAVIGATION_UP,
    label: 'Start grid navigation (up)',
    sequence: ['ArrowUp'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
  [TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_EXIT_SELECTION]: {
    id: TABLE_EDITOR_SHORTCUT_IDS.TABLE_EDITOR_EXIT_SELECTION,
    label: 'Exit grid selection',
    sequence: ['Escape'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
}
