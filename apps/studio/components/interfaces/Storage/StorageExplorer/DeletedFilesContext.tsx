import { parseAsBoolean, useQueryState } from 'nuqs'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

import {
  type DeletedObjectVersion,
  type TrashObject,
} from '@/data/storage/protection/protection-mocks'

export interface SelectedDeletedVersion {
  parentObject: TrashObject
  version: DeletedObjectVersion
}

interface DeletedFilesContextValue {
  isEnabled: boolean
  isShowingDeleted: boolean
  setIsShowingDeleted: (value: boolean) => void
  selectedDeletedFile: TrashObject | undefined
  setSelectedDeletedFile: (file: TrashObject | undefined) => void
  selectedDeletedVersion: SelectedDeletedVersion | undefined
  setSelectedDeletedVersion: (version: SelectedDeletedVersion | undefined) => void
  selectedDeletedIds: string[]
  setSelectedDeletedIds: (ids: string[]) => void
  lastToggledId: string | null
  setLastToggledId: (id: string | null) => void
  clearDeletedSelection: () => void
}

const DeletedFilesContext = createContext<DeletedFilesContextValue>({
  isEnabled: false,
  isShowingDeleted: false,
  setIsShowingDeleted: () => {},
  selectedDeletedFile: undefined,
  setSelectedDeletedFile: () => {},
  selectedDeletedVersion: undefined,
  setSelectedDeletedVersion: () => {},
  selectedDeletedIds: [],
  setSelectedDeletedIds: () => {},
  lastToggledId: null,
  setLastToggledId: () => {},
  clearDeletedSelection: () => {},
})

export const useDeletedFilesContext = () => useContext(DeletedFilesContext)

interface DeletedFilesProviderProps {
  enabled: boolean
  children: ReactNode
}

export const DeletedFilesProvider = ({ enabled, children }: DeletedFilesProviderProps) => {
  const [isShowingDeleted, setIsShowingDeleted] = useQueryState(
    'deletedFiles',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )
  const [selectedDeletedFile, setSelectedDeletedFile] = useState<TrashObject>()
  const [selectedDeletedVersion, setSelectedDeletedVersion] = useState<
    SelectedDeletedVersion | undefined
  >()
  const [selectedDeletedIds, setSelectedDeletedIds] = useState<string[]>([])
  const [lastToggledId, setLastToggledId] = useState<string | null>(null)

  const clearDeletedSelection = useCallback(() => {
    setSelectedDeletedIds([])
    setLastToggledId(null)
  }, [])

  return (
    <DeletedFilesContext.Provider
      value={{
        isEnabled: enabled,
        isShowingDeleted: enabled && isShowingDeleted,
        setIsShowingDeleted,
        selectedDeletedFile,
        setSelectedDeletedFile,
        selectedDeletedVersion,
        setSelectedDeletedVersion,
        selectedDeletedIds,
        setSelectedDeletedIds,
        lastToggledId,
        setLastToggledId,
        clearDeletedSelection,
      }}
    >
      {children}
    </DeletedFilesContext.Provider>
  )
}
