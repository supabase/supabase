import { parseAsBoolean, useQueryState } from 'nuqs'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

import { type TrashObject } from '@/data/storage/protection/protection-mocks'

interface DeletedFilesContextValue {
  isEnabled: boolean
  isShowingDeleted: boolean
  setIsShowingDeleted: (value: boolean) => void
  selectedDeletedFile: TrashObject | undefined
  setSelectedDeletedFile: (file: TrashObject | undefined) => void
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
