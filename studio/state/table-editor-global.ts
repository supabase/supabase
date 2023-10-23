import { proxy, snapshot, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'

export const tableEditorGlobalState = proxy({
  projectRef: undefined as undefined | string,
  loadedIds: proxySet<number>([]),
  addLoadedId: (ref: string, id: number) => {
    if (ref !== tableEditorGlobalState.projectRef) {
      tableEditorGlobalState.loadedIds.clear()
      tableEditorGlobalState.projectRef = ref
    }

    tableEditorGlobalState.loadedIds.add(id)
  },
})

export const getTableEditorGlobalStateSnapshot = () => snapshot(tableEditorGlobalState)

export const useTableEditorGlobalStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(tableEditorGlobalState, options)

export const useIsTableLoaded = (ref?: string, id?: number) => {
  const snap = useTableEditorGlobalStateSnapshot()

  if (!ref || !id) return false
  if (ref !== snap.projectRef) return false
  return snap.loadedIds.has(id)
}
