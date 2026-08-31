import { useQuery } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import type { ArchivedVersionRow } from './archivedVersions.utils'
import { useStoragePreference } from './useStoragePreference'
import { useIsStorageVersioningEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import {
  archivedObjectsQueryOptions,
  type ArchivedObject,
} from '@/data/storage/versioning/archived-objects-query'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

interface ArchivedFilesContextValue {
  isOverlayEnabled: boolean
  archivedObjects: ArchivedObject[]
  selectedArchivedObject: ArchivedObject | undefined
  selectedArchivedVersion: ArchivedVersionRow | undefined
  setSelectedArchivedVersion: (version?: ArchivedVersionRow) => void
  selectArchivedObject: (archivedObjectId: string) => void
  clearArchivedSelection: () => void
}

const ArchivedFilesContext = createContext<ArchivedFilesContextValue>({
  isOverlayEnabled: false,
  archivedObjects: [],
  selectedArchivedObject: undefined,
  selectedArchivedVersion: undefined,
  setSelectedArchivedVersion: () => {},
  selectArchivedObject: () => {},
  clearArchivedSelection: () => {},
})

export const useArchivedFilesContext = () => useContext(ArchivedFilesContext)

/**
 * Fetched once here rather than per row. Not gated on the bucket's versioning
 * state — a suspended bucket can still be retaining files.
 */
export const ArchivedFilesProvider = ({ children }: PropsWithChildren) => {
  const { projectRef, selectedBucket } = useStorageExplorerStateSnapshot()
  const { showArchivedInline } = useStoragePreference(projectRef)
  const isStorageVersioningEnabled = useIsStorageVersioningEnabled()

  const [selectedArchivedObject, setSelectedArchivedObject] = useState<ArchivedObject>()
  const [selectedArchivedVersion, setSelectedArchivedVersion] = useState<ArchivedVersionRow>()

  const bucketId = selectedBucket?.id
  const isOverlayEnabled = isStorageVersioningEnabled && showArchivedInline

  const { data: archivedObjects = [] } = useQuery({
    ...archivedObjectsQueryOptions({ projectRef, bucketId }),
    enabled: isOverlayEnabled && !!projectRef && !!bucketId,
  })

  const selectArchivedObject = useCallback(
    (archivedObjectId: string) => {
      const object = archivedObjects.find((candidate) => candidate.id === archivedObjectId)
      if (object === undefined) return
      setSelectedArchivedVersion(undefined)
      setSelectedArchivedObject(object)
    },
    [archivedObjects]
  )

  const clearArchivedSelection = useCallback(() => {
    setSelectedArchivedObject(undefined)
    setSelectedArchivedVersion(undefined)
  }, [])

  const value = useMemo(
    () => ({
      isOverlayEnabled,
      archivedObjects,
      selectedArchivedObject,
      selectedArchivedVersion,
      setSelectedArchivedVersion,
      selectArchivedObject,
      clearArchivedSelection,
    }),
    [
      isOverlayEnabled,
      archivedObjects,
      selectedArchivedObject,
      selectedArchivedVersion,
      selectArchivedObject,
      clearArchivedSelection,
    ]
  )

  return <ArchivedFilesContext.Provider value={value}>{children}</ArchivedFilesContext.Provider>
}
