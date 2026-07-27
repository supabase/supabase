/**
 * Selection helpers for the Deleted files list.
 *
 * Mirrors the file explorer's behaviour: plain click toggles one row, shift-click
 * selects the contiguous range from the last-touched row.
 */

export interface ToggleSelectionParams {
  selectedIds: string[]
  /** Row ids in the order they're rendered — range selection depends on order. */
  orderedIds: string[]
  /** The row that was just clicked. */
  id: string
  /** Row toggled immediately before this one, if any. */
  lastToggledId: string | null
  isShiftHeld: boolean
}

export const toggleSelection = ({
  selectedIds,
  orderedIds,
  id,
  lastToggledId,
  isShiftHeld,
}: ToggleSelectionParams): string[] => {
  const anchorIndex = lastToggledId === null ? -1 : orderedIds.indexOf(lastToggledId)
  const targetIndex = orderedIds.indexOf(id)

  // Range select: add everything between the anchor and the clicked row.
  if (isShiftHeld && anchorIndex !== -1 && targetIndex !== -1) {
    const [start, end] =
      anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex]
    const range = orderedIds.slice(start, end + 1)
    return [...new Set([...selectedIds, ...range])]
  }

  return selectedIds.includes(id)
    ? selectedIds.filter((selectedId) => selectedId !== id)
    : [...selectedIds, id]
}

/** Select-all toggles to empty only when everything visible is already selected. */
export const toggleSelectAll = (selectedIds: string[], orderedIds: string[]): string[] =>
  orderedIds.length > 0 && orderedIds.every((id) => selectedIds.includes(id)) ? [] : orderedIds
