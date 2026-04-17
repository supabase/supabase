import { createContext, PropsWithChildren, useContext, useMemo } from 'react'
import { proxy, useSnapshot } from 'valtio'

import { StorageItemWithColumn } from '@/components/interfaces/Storage/Storage.types'
import type { Bucket } from '@/data/storage/buckets-query'

function createBucketFilePickerState({ bucket, maxFiles }: { bucket: Bucket; maxFiles: number }) {
  const state = proxy({
    bucket: bucket,
    maxFiles: maxFiles,

    columns: [] as string[],
    popColumn: () => {
      const lastColumnIndex = state.columns.length - 1
      state.columns = state.columns.slice(0, lastColumnIndex)
    },
    popColumnAtIndex: (index: number) => {
      state.columns = state.columns.slice(0, index + 1)
    },
    pushColumnAtIndex: (column: string, index: number) => {
      state.columns = state.columns.slice(0, index + 1).concat([column])
    },

    selectedItems: [] as StorageItemWithColumn[],
    setSelectedItems: (items: StorageItemWithColumn[]) => (state.selectedItems = items),
    clearSelectedItems: (columnIndex?: number) => {
      if (columnIndex !== undefined) {
        state.selectedItems = state.selectedItems.filter((item) => item.columnIndex !== columnIndex)
      } else {
        state.selectedItems = []
      }
    },

    itemSearchString: '',
    setItemSearchString: (value: string) => (state.itemSearchString = value),

    selectedFilePreview: undefined as StorageItemWithColumn | undefined,
    setSelectedFilePreview: (file?: StorageItemWithColumn) => (state.selectedFilePreview = file),
  })

  return state
}

export type BucketFilePickerState = ReturnType<typeof createBucketFilePickerState>

const DEFAULT_STATE_CONFIG = {
  bucket: {} as Bucket,
  maxFiles: 1 as const,
}

const BucketFilePickerStateContext = createContext<BucketFilePickerState>(
  createBucketFilePickerState(DEFAULT_STATE_CONFIG)
)

export const BucketFilePickerStateContextProvider = ({
  bucket,
  maxFiles,
  children,
}: PropsWithChildren<{ bucket: Bucket; maxFiles: number }>) => {
  const state = useMemo(() => createBucketFilePickerState({ bucket, maxFiles }), [bucket, maxFiles])

  return (
    <BucketFilePickerStateContext.Provider value={state}>
      {children}
    </BucketFilePickerStateContext.Provider>
  )
}

export function useBucketFilePickerStateSnapshot(options?: Parameters<typeof useSnapshot>[1]) {
  const state = useContext(BucketFilePickerStateContext)
  return useSnapshot(state, options) as BucketFilePickerState
}
