import { proxy, snapshot, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'

export const tableEditorState = proxy({
  loadedIds: {} as {
    [key: string]: Set<number>
  },
  addLoadedId: (ref: string, id: number) => {
    if (!tableEditorState.loadedIds[ref]) {
      tableEditorState.loadedIds[ref] = proxySet<number>([])
    }
    tableEditorState.loadedIds[ref].add(id)
  },
  clearLoadedIdsForProject: (ref: string) => {
    tableEditorState.loadedIds[ref] = proxySet<number>([])
  },
})

export const getTableEditorStateSnapshot = () => snapshot(tableEditorState)

export const useTableEditorStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(tableEditorState, options)

export const useIsTableLoaded = (ref?: string, id?: number) => {
  const snap = useTableEditorStateSnapshot()

  if (!ref || !id) return false
  return snap.loadedIds[ref]?.has(id) ?? false
}
