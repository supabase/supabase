export type LiveLogBatch = {
  ids: string[]
  refreshedAt: number
}

export function getNewLiveLogBatch<T extends { id: string }>(
  rows: T[],
  previousRows: T[],
  refreshedAt: number
): LiveLogBatch | undefined {
  const seen = new Set(previousRows.map((row) => row.id))
  const ids = rows.flatMap((row) => {
    if (seen.has(row.id)) return []
    seen.add(row.id)
    return [row.id]
  })
  return ids.length > 0 ? { ids, refreshedAt } : undefined
}

export function orderLiveLogRows<T extends { id: string }>(
  rows: T[],
  batches: LiveLogBatch[],
  baselineIds: string[]
) {
  const byId = new Map(rows.map((row) => [row.id, row]))
  const ordered: T[] = []
  for (const id of [...batches.flatMap((batch) => batch.ids), ...baselineIds]) {
    const row = byId.get(id)
    if (!row) continue
    ordered.push(row)
    byId.delete(id)
  }
  return [...ordered, ...byId.values()]
}
