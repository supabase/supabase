import { proxy, snapshot, useSnapshot } from 'valtio'

export const storageExplorerState = proxy({
  isSearching: false,
  setIsSearching: (bool: boolean) => {
    storageExplorerState.isSearching = bool
  },
})

export const getStorageExplorerStateSnapshot = () => snapshot(storageExplorerState)

export const useStorageExplorerStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(storageExplorerState, options)
