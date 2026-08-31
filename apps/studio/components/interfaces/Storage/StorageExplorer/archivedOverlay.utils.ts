import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageItem } from '../Storage.types'
import type { TrashObject } from '@/data/storage/protection/protection-mocks'

/**
 * Splits a path like "matches/round-3/final.png" into ["matches", "round-3",
 * "final.png"], dropping the leading/trailing/duplicate slashes the mock trash
 * data has in `originalPath` (`"matches/round-3/"`) and `name`
 * (which sometimes redundantly re-includes the last folder, e.g.
 * `"round-3/final.png"` for an object under `"matches/round-3/"`).
 */
const splitPath = (path: string): string[] =>
  path.split('/').filter((segment) => segment.length > 0)

/**
 * Canonical `["matches", "round-3", "final.png"]` segments for a trash
 * object, tolerant of the mock's inconsistent `originalPath` / `name`
 * duplication: `originalPath` is treated as the source of truth for the
 * folder path, and only the basename (final segment) of `name` is appended.
 */
export const getArchivedSegments = (object: TrashObject): string[] => {
  const folderSegments = splitPath(object.originalPath)
  const nameSegments = splitPath(object.name)
  const basename = nameSegments[nameSegments.length - 1] ?? object.name
  return [...folderSegments, basename]
}

/**
 * True when `folderSegments` is a prefix of `objectSegments` — i.e. the
 * trash object lives somewhere at or below this folder.
 */
const isUnderFolder = (folderSegments: string[], objectSegments: string[]): boolean => {
  if (objectSegments.length <= folderSegments.length) return false
  for (let i = 0; i < folderSegments.length; i++) {
    if (folderSegments[i] !== objectSegments[i]) return false
  }
  return true
}

export interface ArchivedOverlayInput {
  /**
   * The current folder as a segment list, empty at the bucket root.
   */
  folderSegments: string[]
  /**
   * Every archived object retained in this bucket. Unfiltered — the util
   * decides which surface at this folder level.
   */
  trashObjects: TrashObject[]
  /**
   * Names of items already rendered in this folder from the live bucket
   * listing. Used to skip synthesizing an archived folder when a live folder
   * of the same name is already there (the live one wins; expanding it will
   * still surface archived descendants via a recursive overlay call).
   */
  existingItemNames: Set<string>
}

/**
 * Returns the archived rows to overlay onto a given folder in the file
 * explorer.
 *
 * - A trash object that lives directly in this folder produces one file row.
 * - A trash object that lives deeper produces at most one folder row per
 *   distinct next-segment — multiple objects under the same subfolder are
 *   coalesced into one row, which the user can drill into to see them.
 * - When a folder of the same name is already live, no archived stand-in is
 *   emitted (the live folder is the entry point; drilling in and running
 *   this util at that level again will still overlay the archived
 *   descendants under it).
 */
export const getArchivedOverlayItems = ({
  folderSegments,
  trashObjects,
  existingItemNames,
}: ArchivedOverlayInput): StorageItem[] => {
  const files: StorageItem[] = []
  const folderNames = new Set<string>()

  for (const object of trashObjects) {
    const segments = getArchivedSegments(object)
    if (!isUnderFolder(folderSegments, segments)) continue

    const nextSegment = segments[folderSegments.length]
    const isDirectChild = segments.length === folderSegments.length + 1

    if (isDirectChild) {
      // Same-name collision with a live file — the live one wins, and the
      // archived version stays reachable via its file preview panel's
      // version history rather than showing as a second row here.
      if (existingItemNames.has(nextSegment)) continue

      files.push({
        id: object.id,
        name: nextSegment,
        type: STORAGE_ROW_TYPES.FILE,
        status: STORAGE_ROW_STATUS.READY,
        metadata: {
          size: object.size,
          mimetype: '',
          cacheControl: '',
          contentLength: object.size,
          httpStatusCode: 0,
          eTag: '',
          lastModified: object.deletedAt,
        },
        created_at: null,
        updated_at: object.deletedAt,
        last_accessed_at: null,
        isCorrupted: false,
        path: [...folderSegments, nextSegment].join('/'),
        archived: { trashObjectId: object.id },
      })
    } else {
      folderNames.add(nextSegment)
    }
  }

  const folders: StorageItem[] = []
  for (const folderName of folderNames) {
    if (existingItemNames.has(folderName)) continue
    folders.push({
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
    })
  }

  return [...folders, ...files]
}
