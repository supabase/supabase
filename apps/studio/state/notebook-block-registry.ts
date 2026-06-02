export type NotebookBlockPersistPatch = {
  sql?: string
  chartConfig?: Record<string, unknown>
  label?: string
  querySource?: 'database' | 'logs'
  logsDatePickerValue?: {
    from: string
    to: string
    isHelper?: boolean
    text?: string
  }
}

type NotebookBlockRegistration = {
  persistBlock: (patch: NotebookBlockPersistPatch) => void
  runQuery?: (options?: { force?: boolean }) => Promise<void>
}

const registrations = new Map<string, NotebookBlockRegistration>()

export function registerNotebookBlock(
  blockId: string,
  registration: Partial<NotebookBlockRegistration>
) {
  registrations.set(blockId, {
    persistBlock: () => {},
    ...registrations.get(blockId),
    ...registration,
  })
}

export function unregisterNotebookBlockRun(blockId: string) {
  const registration = registrations.get(blockId)
  if (!registration) return
  delete registration.runQuery
}

export async function runAllNotebookBlocks(blockIds: string[], options?: { force?: boolean }) {
  await Promise.all(
    blockIds.map((blockId) => registrations.get(blockId)?.runQuery?.(options) ?? Promise.resolve())
  )
}

export function unregisterNotebookBlock(blockId: string) {
  registrations.delete(blockId)
}

export function isNotebookBlockId(blockId: string) {
  return registrations.has(blockId)
}

export function persistNotebookBlock(blockId: string, patch: NotebookBlockPersistPatch) {
  registrations.get(blockId)?.persistBlock(patch)
}
