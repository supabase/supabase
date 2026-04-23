import { RegistryDefinations } from '../types'

export const TABLE_EDITOR_SHORTCUT_IDS = {
  TABLE_EDITOR_JUMP_FIRST_ROW: 'table-editor.jump-first-row',
  TABLE_EDITOR_JUMP_LAST_ROW: 'table-editor.jump-last-row',
  TABLE_EDITOR_JUMP_FIRST_COL: 'table-editor.jump-first-col',
  TABLE_EDITOR_JUMP_LAST_COL: 'table-editor.jump-last-col',
  TABLE_EDITOR_TOGGLE_ROW_SELECTION: 'table-editor.toggle-row-selection',
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
    sequence: ['Shift+X'],
    showInSettings: false,
    options: { ignoreInputs: true },
  },
}
