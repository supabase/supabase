import type {
  ArchivedObject,
  ArchivedObjectVersion,
} from '@/data/storage/versioning/archived-objects-query'

export interface ArchivedVersionRow extends ArchivedObjectVersion {
  /** Deleting this one promotes the next version behind it, so actions differ. */
  wasCurrentAtArchive: boolean
}

/** Newest first: the version live at archive time, then the rest. */
export const getMergedArchivedVersions = (object: ArchivedObject): ArchivedVersionRow[] => [
  { ...object.currentVersion, wasCurrentAtArchive: true },
  ...object.noncurrentVersions.map((version) => ({ ...version, wasCurrentAtArchive: false })),
]
