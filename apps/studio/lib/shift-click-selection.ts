import type { RowSelectionState } from '@tanstack/react-table'

/**
 * Computes the next multi-select set after a shift-click on `targetKey`, extending
 * the selection from `anchorKey` (the last row the user clicked). Every key between
 * anchor and target (inclusive, in `orderedKeys` order) is added. If the whole range is
 * already selected, the range is removed instead. Falls back to a plain toggle of
 * `targetKey` when there is no usable anchor (null, or no longer in `orderedKeys`).
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

  const anchorIndex = anchorKey === null ? -1 : orderedKeys.indexOf(anchorKey)
  const targetIndex = orderedKeys.indexOf(targetKey)
  const hasUsableAnchor = anchorIndex !== -1 && targetIndex !== -1

  if (!hasUsableAnchor) {
    if (next.has(targetKey)) {
      next.delete(targetKey)
    } else {
      next.add(targetKey)
    }
    return next
  }

  const startIndex = Math.min(anchorIndex, targetIndex)
  const endIndex = Math.max(anchorIndex, targetIndex)
  const rangeKeys = orderedKeys.slice(startIndex, endIndex + 1)
  const isRangeFullySelected = rangeKeys.every((key) => selectedKeys.has(key))

  rangeKeys.forEach((key) => {
    if (isRangeFullySelected) {
      next.delete(key)
    } else {
      next.add(key)
    }
  })

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
