export function shouldOpenLastTableOnEditorIndex({
  isHistoryTraverse,
}: {
  isHistoryTraverse: boolean
}): boolean {
  return !isHistoryTraverse
}
