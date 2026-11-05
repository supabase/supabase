import type { RowEditorMode } from './RowEditor.types'

export function getRowEditorHeader(mode: RowEditorMode): string {
  switch (mode) {
    case 'duplicate':
      return 'Duplicate row in '
    case 'new':
      return 'Add new row to '
    case 'edit':
      return 'Update row from '
  }
}
