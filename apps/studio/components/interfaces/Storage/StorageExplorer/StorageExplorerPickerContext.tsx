import { createContext, useContext, type PropsWithChildren } from 'react'

import { STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageItem } from '../Storage.types'

export type StoragePickerReturnValue = 'objectPath' | 'publicUrl'

type StorageExplorerPickerContextValue = {
  isPicker: true
  returnValue: StoragePickerReturnValue
  onPick: (value: string) => void
  /** When true, hide column view and related chrome (e.g. mobile sheet). */
  forceListView: boolean
  acceptedFileExtensions?: string[]
  hideUnsupportedFiles?: boolean
}

const StorageExplorerPickerContext = createContext<StorageExplorerPickerContextValue | null>(null)

export function StorageExplorerPickerProvider({
  children,
  returnValue,
  onPick,
  forceListView,
  acceptedFileExtensions,
  hideUnsupportedFiles = false,
}: PropsWithChildren<
  Pick<
    StorageExplorerPickerContextValue,
    'returnValue' | 'onPick' | 'forceListView' | 'acceptedFileExtensions' | 'hideUnsupportedFiles'
  >
>) {
  const value: StorageExplorerPickerContextValue = {
    isPicker: true,
    returnValue,
    onPick,
    forceListView,
    acceptedFileExtensions,
    hideUnsupportedFiles,
  }
  return (
    <StorageExplorerPickerContext.Provider value={value}>
      {children}
    </StorageExplorerPickerContext.Provider>
  )
}

export function useStorageExplorerPicker() {
  return useContext(StorageExplorerPickerContext)
}

export function isPickerItemSelectable(
  item: StorageItem,
  picker: ReturnType<typeof useStorageExplorerPicker>
) {
  if (!picker) return true
  if (item.type === STORAGE_ROW_TYPES.FOLDER) return true
  if (!picker.acceptedFileExtensions || picker.acceptedFileExtensions.length === 0) return true

  const fileName = item.name.toLowerCase()
  return picker.acceptedFileExtensions.some((ext) => fileName.endsWith(`.${ext.toLowerCase()}`))
}
