import { useQuery } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import { getMergedArchivedVersions, type ArchivedVersionRow } from './archivedVersions.utils'
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
  /** The bucket holds more rows than one listing run can carry, so `archivedObjects` is a subset. */
  isListingTruncated: boolean
  selectedArchivedObject: ArchivedObject | undefined
  selectedArchivedVersion: ArchivedVersionRow | undefined
  setSelectedArchivedVersion: (version?: ArchivedVersionRow) => void
  selectArchivedObject: (archivedObjectId: string) => void
  clearArchivedSelection: () => void
}

const ArchivedFilesContext = createContext<ArchivedFilesContextValue>({
  isOverlayEnabled: false,
  archivedObjects: [],
  isListingTruncated: false,
  selectedArchivedObject: undefined,
  selectedArchivedVersion: undefined,
  setSelectedArchivedVersion: () => {},
  selectArchivedObject: () => {},
  clearArchivedSelection: () => {},
})

export const useArchivedFilesContext = () => useContext(ArchivedFilesContext)

/** Stable identity so an unanswered query doesn't re-render every overlay consumer. */
const NO_ARCHIVED_OBJECTS: ArchivedObject[] = []

/** Not gated on the bucket's versioning state: a suspended bucket can still be retaining files. */
export const ArchivedFilesProvider = ({ children }: PropsWithChildren) => {
  const { projectRef, selectedBucket } = useStorageExplorerStateSnapshot()
  const { showArchivedInline } = useStoragePreference(projectRef)
  const isStorageVersioningEnabled = useIsStorageVersioningEnabled()

  const [selectedArchivedObjectId, setSelectedArchivedObjectId] = useState<string>()
  const [selectedVersionId, setSelectedVersionId] = useState<string>()

  const bucketId = selectedBucket?.id
  const isOverlayEnabled = isStorageVersioningEnabled && showArchivedInline

  const { data: listing } = useQuery({
    ...archivedObjectsQueryOptions({ projectRef, bucketId }),
    enabled: isOverlayEnabled && !!projectRef && !!bucketId,
  })

  const archivedObjects = listing?.objects ?? NO_ARCHIVED_OBJECTS
  const isListingTruncated = listing?.isTruncated ?? false

  // Held by id and resolved against the listing rather than snapshotted: a snapshot outlives
  // the listing it came from, so a purged version stays on show and a restored file — or one
  // belonging to the bucket the user just left — keeps its pane open over nothing.
  const selectedArchivedObject = archivedObjects.find(
    (object) => object.id === selectedArchivedObjectId
  )

  const selectedArchivedVersion = useMemo(() => {
    if (selectedArchivedObject === undefined || selectedVersionId === undefined) return undefined
    return getMergedArchivedVersions(selectedArchivedObject).find(
      (version) => version.versionId === selectedVersionId
    )
  }, [selectedArchivedObject, selectedVersionId])

  const selectArchivedObject = useCallback((archivedObjectId: string) => {
    setSelectedVersionId(undefined)
    setSelectedArchivedObjectId(archivedObjectId)
  }, [])

  const setSelectedArchivedVersion = useCallback((version?: ArchivedVersionRow) => {
    setSelectedVersionId(version?.versionId)
  }, [])

  const clearArchivedSelection = useCallback(() => {
    setSelectedArchivedObjectId(undefined)
    setSelectedVersionId(undefined)
  }, [])

  const value = useMemo(
    () => ({
      isOverlayEnabled,
      archivedObjects,
      isListingTruncated,
      selectedArchivedObject,
      selectedArchivedVersion,
      setSelectedArchivedVersion,
      selectArchivedObject,
      clearArchivedSelection,
    }),
    [
      isOverlayEnabled,
      archivedObjects,
      isListingTruncated,
      selectedArchivedObject,
      selectedArchivedVersion,
      setSelectedArchivedVersion,
      selectArchivedObject,
      clearArchivedSelection,
    ]
  )

  return <ArchivedFilesContext.Provider value={value}>{children}</ArchivedFilesContext.Provider>
}
