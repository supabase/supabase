import { createContext, useContext, useState, type ReactNode } from 'react'

import { type TrashObject } from '@/data/storage/protection/protection-mocks'

interface DeletedFilesContextValue {
  isEnabled: boolean
  isShowingDeleted: boolean
  setIsShowingDeleted: (value: boolean) => void
  selectedDeletedFile: TrashObject | undefined
  setSelectedDeletedFile: (file: TrashObject | undefined) => void
}

const DeletedFilesContext = createContext<DeletedFilesContextValue>({
  isEnabled: false,
  isShowingDeleted: false,
  setIsShowingDeleted: () => {},
  selectedDeletedFile: undefined,
  setSelectedDeletedFile: () => {},
})

export const useDeletedFilesContext = () => useContext(DeletedFilesContext)

interface DeletedFilesProviderProps {
  enabled: boolean
  children: ReactNode
}

export const DeletedFilesProvider = ({ enabled, children }: DeletedFilesProviderProps) => {
  const [isShowingDeleted, setIsShowingDeleted] = useState(false)
  const [selectedDeletedFile, setSelectedDeletedFile] = useState<TrashObject>()

  return (
    <DeletedFilesContext.Provider
      value={{
        isEnabled: enabled,
        isShowingDeleted: enabled && isShowingDeleted,
        setIsShowingDeleted,
        selectedDeletedFile,
        setSelectedDeletedFile,
      }}
    >
      {children}
    </DeletedFilesContext.Provider>
  )
}
