export interface LogRowSelection {
  selected: string[]
  anchor: string | null
}

function toggle(selected: string[], id: string) {
  if (selected.includes(id)) return selected.filter((selectedId) => selectedId !== id)
  return [...selected, id]
}

/** File-explorer selection, shared by pointer and keyboard navigation. */
export function selectLogRows(
  ids: string[],
  selected: string[],
  anchor: string | null,
  id: string,
  modifiers: { shift?: boolean; toggle?: boolean } = {}
): LogRowSelection {
  const index = ids.indexOf(id)
  if (index === -1) return { selected, anchor }
  const anchorIndex = anchor === null ? -1 : ids.indexOf(anchor)
  if (modifiers.shift && anchorIndex !== -1) {
    return {
      selected: ids.slice(Math.min(anchorIndex, index), Math.max(anchorIndex, index) + 1),
      anchor,
    }
  }
  const next = modifiers.toggle ? toggle(selected, id) : [id]
  return { selected: next, anchor: next.length ? id : null }
}
