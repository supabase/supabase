import { parseAsBoolean, useQueryState } from 'nuqs'
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'

import { type TrashObject } from '@/data/storage/protection/protection-mocks'

import { type ArchivedVersionRow } from './DeletedFilesList.utils'

export interface SelectedDeletedVersion {
  parentObject: TrashObject
  version: ArchivedVersionRow
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
  expandedVersionIds: Set<string>
  setExpandedVersionIds: Dispatch<SetStateAction<Set<string>>>
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
  expandedVersionIds: new Set(),
  setExpandedVersionIds: () => {},
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
  const [expandedVersionIds, setExpandedVersionIds] = useState<Set<string>>(new Set())

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
        expandedVersionIds,
        setExpandedVersionIds,
      }}
    >
      {children}
    </DeletedFilesContext.Provider>
  )
}
