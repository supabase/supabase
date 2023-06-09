import { proxy, snapshot, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'

export const tableEditorState = proxy({
  projectRef: undefined as undefined | string,
  loadedIds: proxySet<number>([]),
  addLoadedId: (ref: string, id: number) => {
    if (ref !== tableEditorState.projectRef) {
      tableEditorState.loadedIds.clear()
      tableEditorState.projectRef = ref
    }

    tableEditorState.loadedIds.add(id)
  },
})

export const getTableEditorStateSnapshot = () => snapshot(tableEditorState)

export const useTableEditorStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(tableEditorState, options)

export const useIsTableLoaded = (ref?: string, id?: number) => {
  const snap = useTableEditorStateSnapshot()

  if (!ref || !id) return false
  if (ref !== snap.projectRef) return false
  return snap.loadedIds.has(id)
}
