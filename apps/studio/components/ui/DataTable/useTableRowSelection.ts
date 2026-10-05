import { useState } from 'react'

import { RowSelectionModifiers, selectTableRow, TableRowSelection } from './rowSelection.utils'

export function useTableRowSelection({ scope, initialId }: { scope: string; initialId?: string }) {
  const [selectionScope, setSelectionScope] = useState(scope)
  const [selection, setSelection] = useState<TableRowSelection>(() => ({
    selected: initialId ? { [initialId]: true } : {},
    anchorId: initialId,
    activeId: initialId,
  }))

  // A new project/filter/sort starts a new selection; paging and live updates do not.
  if (selectionScope !== scope) {
    setSelectionScope(scope)
    setSelection({ selected: {} })
  }

  const selectRow = (orderedIds: string[], id: string, modifiers?: RowSelectionModifiers) =>
    setSelection((previous) => selectTableRow(previous, orderedIds, id, modifiers))

  const clearSelection = () => setSelection({ selected: {} })

  return { selection, selectRow, clearSelection }
}
