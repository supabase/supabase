import type { RowSelectionState } from '@tanstack/react-table'

export interface RowSelectionModifiers {
  shiftKey?: boolean
  metaKey?: boolean
  ctrlKey?: boolean
  toggle?: boolean
}

export interface TableRowSelection {
  selected: RowSelectionState
  anchorId?: string
  activeId?: string
}

export function selectTableRow(
  state: TableRowSelection,
  orderedIds: string[],
  targetId: string,
  modifiers: RowSelectionModifiers = {}
): TableRowSelection {
  const targetIndex = orderedIds.indexOf(targetId)
  if (targetIndex === -1) return state

  const anchorIndex = state.anchorId ? orderedIds.indexOf(state.anchorId) : -1
  const isAdditive = modifiers.metaKey || modifiers.ctrlKey
  let selected: RowSelectionState = {}

  if (modifiers.shiftKey && anchorIndex !== -1) {
    selected = isAdditive ? { ...state.selected } : {}
    for (const id of orderedIds.slice(
      Math.min(anchorIndex, targetIndex),
      Math.max(anchorIndex, targetIndex) + 1
    )) {
      selected[id] = true
    }
  } else if (isAdditive || modifiers.toggle) {
    selected = { ...state.selected }
    if (selected[targetId]) delete selected[targetId]
    else selected[targetId] = true
  } else {
    // Plain click on the only selected row clears the selection.
    const selectedIds = Object.keys(state.selected).filter((id) => state.selected[id])
    if (selectedIds.length === 1 && selectedIds[0] === targetId) return { selected: {} }
    selected[targetId] = true
  }

  return {
    selected,
    anchorId: modifiers.shiftKey && anchorIndex !== -1 ? state.anchorId : targetId,
    activeId: targetId,
  }
}
