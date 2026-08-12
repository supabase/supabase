import type { DeletedObjectVersion, TrashObject } from '@/data/storage/protection/protection-mocks'

/** Composite key for a version row — unambiguous vs. top-level object ids. */
export const versionKey = (objectId: string, versionId: string) => `${objectId}::${versionId}`

export const parseVersionKey = (key: string): { objectId: string; versionId: string } | null => {
  const separatorIndex = key.indexOf('::')
  if (separatorIndex === -1) return null
  return { objectId: key.slice(0, separatorIndex), versionId: key.slice(separatorIndex + 2) }
}

export interface ArchivedVersionRow extends DeletedObjectVersion {
  /**
   * True for the single row standing in for the version that was live the
   * moment this object was archived. S3 represents "archived" as a
   * content-less delete marker sitting on top of the version stack — that's
   * an implementation detail this UI abstracts away, so instead this row is
   * folded into the same list as every other retained version, tagged so
   * actions on it can route to the right mutation (see
   * `deleteCurrentTrashVersionPermanently`).
   */
  wasCurrentAtArchive: boolean
}

/**
 * Every archived object's full version history as one flat, newest-first
 * list — the version that was current at the moment of archiving first,
 * then every noncurrent version retained from before that. Restoring or
 * permanently deleting from either part of this list works the same way from
 * the caller's perspective; only the mutation each row's actions dispatch to
 * differs.
 */
export const getMergedArchivedVersions = (object: TrashObject): ArchivedVersionRow[] => [
  {
    versionId: object.id,
    size: object.size,
    createdAt: object.deletedAt,
    action: 'overwrite',
    wasCurrentAtArchive: true,
  },
  ...(object.noncurrentVersions ?? []).map((version) => ({
    ...version,
    wasCurrentAtArchive: false,
  })),
]

export interface SplitDeletedSelection {
  objectIds: string[]
  versions: Array<{ objectId: string; versionId: string }>
}

/**
 * Splits a flat selection — top-level object ids mixed with version
 * composite keys from expanded rows — into the two groups a bulk action
 * needs to dispatch to the right endpoints. A version entry is dropped when
 * its parent object id is also selected: restoring or permanently deleting
 * the whole group already covers every version under it, so acting on both
 * would either double up the mutation or fail outright once the parent
 * mutation has already removed the group the version key points into.
 */
export const splitDeletedSelection = (selectedIds: string[]): SplitDeletedSelection => {
  const objectIds = selectedIds.filter((id) => !id.includes('::'))
  const objectIdSet = new Set(objectIds)
  const versions = selectedIds
    .map(parseVersionKey)
    .filter((version): version is { objectId: string; versionId: string } => version !== null)
    .filter((version) => !objectIdSet.has(version.objectId))
  return { objectIds, versions }
}
