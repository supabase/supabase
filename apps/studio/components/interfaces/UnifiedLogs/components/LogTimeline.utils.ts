export type TimelineItem<T> = { type: 'log'; log: T } | { type: 'more'; count: number }

/**
 * Folds a timeline to its first `collapsedCount` logs plus the active log, replacing each hidden
 * run with a "more" item. A run of one log is shown as is, since a fold would save no space.
 */
export function foldTimelineSteps<T extends { id: string }>(
  logs: T[],
  {
    activeLogId,
    isExpanded,
    collapsedCount,
  }: { activeLogId?: string; isExpanded: boolean; collapsedCount?: number }
): TimelineItem<T>[] {
  const visibleCount =
    isExpanded || collapsedCount === undefined ? logs.length : Math.floor(collapsedCount)
  const items: TimelineItem<T>[] = []
  let hidden: T[] = []
  const flushHidden = () => {
    if (hidden.length === 1) items.push({ type: 'log', log: hidden[0] })
    if (hidden.length > 1) items.push({ type: 'more', count: hidden.length })
    hidden = []
  }

  logs.forEach((log, index) => {
    if (index < visibleCount || log.id === activeLogId) {
      flushHidden()
      items.push({ type: 'log', log })
    } else {
      hidden.push(log)
    }
  })
  flushHidden()
  return items
}
