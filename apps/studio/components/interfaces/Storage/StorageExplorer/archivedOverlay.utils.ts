import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageItem } from '../Storage.types'
import type { ArchivedObject } from '@/data/storage/versioning/archived-objects-query'

const splitPath = (path: string): string[] => path.split('/').filter((segment) => segment !== '')

/**
 * The only place that interprets `ArchivedObject.path`, so a different API shape
 * is a one-function change.
 */
export const getArchivedSegments = (object: ArchivedObject): string[] => splitPath(object.path)

const isUnderFolder = (folderSegments: string[], objectSegments: string[]): boolean => {
  if (objectSegments.length <= folderSegments.length) return false
  return folderSegments.every((segment, index) => segment === objectSegments[index])
}

export interface ArchivedOverlayInput {
  /** Empty at the bucket root. */
  folderSegments: string[]
  archivedObjects: ArchivedObject[]
  /** Names from the live listing; a live item of the same name always wins. */
  existingItemNames: Set<string>
}

/**
 * Objects deeper down are coalesced into one folder row per next segment, so
 * drilling in runs this again a level lower.
 */
export const getArchivedOverlayItems = ({
  folderSegments,
  archivedObjects,
  existingItemNames,
}: ArchivedOverlayInput): StorageItem[] => {
  const files: StorageItem[] = []
  const folderNames = new Set<string>()

  for (const object of archivedObjects) {
    const segments = getArchivedSegments(object)
    if (!isUnderFolder(folderSegments, segments)) continue

    const nextSegment = segments[folderSegments.length]
    const isDirectChild = segments.length === folderSegments.length + 1

    if (!isDirectChild) {
      folderNames.add(nextSegment)
      continue
    }

    if (existingItemNames.has(nextSegment)) continue

    files.push({
      id: object.id,
      name: nextSegment,
      type: STORAGE_ROW_TYPES.FILE,
      status: STORAGE_ROW_STATUS.READY,
      metadata: {
        size: object.currentVersion.size,
        mimetype: '',
        cacheControl: '',
        contentLength: object.currentVersion.size,
        httpStatusCode: 0,
        eTag: '',
        lastModified: object.archivedAt,
      },
      created_at: null,
      updated_at: object.archivedAt,
      last_accessed_at: null,
      isCorrupted: false,
      path: [...folderSegments, nextSegment].join('/'),
      archived: { archivedObjectId: object.id },
    })
  }

  const folders: StorageItem[] = [...folderNames]
    .filter((folderName) => !existingItemNames.has(folderName))
    .map((folderName) => ({
      id: null,
      name: folderName,
      type: STORAGE_ROW_TYPES.FOLDER,
      status: STORAGE_ROW_STATUS.READY,
      metadata: null,
      created_at: null,
      updated_at: null,
      last_accessed_at: null,
      isCorrupted: false,
      archived: {},
    }))

  return [...folders, ...files]
}
