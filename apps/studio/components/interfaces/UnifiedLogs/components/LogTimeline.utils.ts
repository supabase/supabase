/** Keep the open log in sequence, with separate counts for each hidden range. */
export function foldTimelineSteps<T extends { id: string }>(
  logs: T[],
  {
    activeLogId,
    isExpanded,
    collapsedCount,
  }: { activeLogId?: string; isExpanded: boolean; collapsedCount?: number }
): { leadingLogs: T[]; activeLog?: T; hiddenBefore: number; hiddenAfter: number } {
  if (isExpanded || collapsedCount === undefined || logs.length <= collapsedCount) {
    return { leadingLogs: logs, hiddenBefore: 0, hiddenAfter: 0 }
  }
  const visibleCount = Math.max(0, Math.floor(collapsedCount))
  const leadingLogs = logs.slice(0, visibleCount)
  const activeIndex = logs.findIndex((log) => log.id === activeLogId)
  if (activeIndex < visibleCount || activeIndex === -1) {
    return { leadingLogs, hiddenBefore: 0, hiddenAfter: logs.length - leadingLogs.length }
  }
  return {
    leadingLogs,
    activeLog: logs[activeIndex],
    hiddenBefore: activeIndex - leadingLogs.length,
    hiddenAfter: logs.length - activeIndex - 1,
  }
}
