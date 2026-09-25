import type { RowSelectionState } from '@tanstack/react-table'

/**
 * Computes the next multi-select set after a shift-click on `targetKey`, matching
 * react-data-grid's native behavior: the target's new checked state (the opposite of
 * its current one) is applied to every key strictly between `anchorKey` (the last row
 * the user clicked) and the target, plus the target itself. The anchor row is left
 * untouched. Falls back to a plain toggle of `targetKey` when there is no usable anchor
 * (null, no longer in `orderedKeys`, or the target itself).
 */
export function getShiftClickSelection({
  orderedKeys,
  selectedKeys,
  anchorKey,
  targetKey,
}: {
  orderedKeys: string[]
  selectedKeys: Set<string>
  anchorKey: string | null
  targetKey: string
}): Set<string> {
  const next = new Set(selectedKeys)
  const isChecked = !selectedKeys.has(targetKey)

  const applyCheckedState = (key: string) => {
    if (isChecked) {
      next.add(key)
    } else {
      next.delete(key)
    }
  }

  applyCheckedState(targetKey)

  const anchorIndex = anchorKey === null ? -1 : orderedKeys.indexOf(anchorKey)
  const targetIndex = orderedKeys.indexOf(targetKey)
  const hasUsableAnchor = anchorIndex !== -1 && targetIndex !== -1 && anchorIndex !== targetIndex

  if (!hasUsableAnchor) return next

  const step = anchorIndex < targetIndex ? 1 : -1
  for (let index = anchorIndex + step; index !== targetIndex; index += step) {
    applyCheckedState(orderedKeys[index])
  }

  return next
}

/**
 * `getShiftClickSelection` for TanStack Table's `RowSelectionState` (a map of row id → true).
 */
export function getShiftClickRowSelection({
  orderedRowIds,
  rowSelection,
  anchorRowId,
  targetRowId,
}: {
  orderedRowIds: string[]
  rowSelection: RowSelectionState
  anchorRowId: string | null
  targetRowId: string
}): RowSelectionState {
  const selectedRowIds = new Set(Object.keys(rowSelection).filter((id) => rowSelection[id]))

  const next = getShiftClickSelection({
    orderedKeys: orderedRowIds,
    selectedKeys: selectedRowIds,
    anchorKey: anchorRowId,
    targetKey: targetRowId,
  })

  return Object.fromEntries([...next].map((id) => [id, true]))
}
