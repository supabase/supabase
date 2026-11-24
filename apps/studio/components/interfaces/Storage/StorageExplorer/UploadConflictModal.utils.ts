import type { UploadConflicts } from './StorageExplorer.utils'

export interface UploadConflictCopy {
  title: string
  description: string
  replaceLabel: string
  replaceDescription: string
  keepBothLabel: string
  keepBothDescription: string
}

const getLiveReplaceDescription = (isVersioningSuspended: boolean, isPlural: boolean) => {
  if (isVersioningSuspended && isPlural) {
    return 'Each file you replace is kept as a noncurrent version one last time, and anything uploaded after that overwrites it in place'
  }
  if (isVersioningSuspended) {
    return 'The file you replace is kept as a noncurrent version one last time, and anything uploaded after that overwrites it in place'
  }
  if (isPlural) {
    return 'Each file you replace becomes a noncurrent version you can restore from its version history'
  }
  return 'The file you replace becomes a noncurrent version you can restore from its version history'
}

/**
 * What the two choices mean depends on what is sitting at the name. A live file is replaced
 * and kept as a noncurrent version; an archived one has no visible occupant at all, so the
 * upload restores it. There is no singular mixed case — a mix needs at least two names.
 */
export const getUploadConflictCopy = ({
  liveNames,
  archivedNames,
  isVersioningSuspended,
}: UploadConflicts): UploadConflictCopy => {
  const totalCount = liveNames.length + archivedNames.length

  if (archivedNames.length === 0 && liveNames.length === 1) {
    return {
      title: `${liveNames[0]} already exists here`,
      description: 'Choose what happens to the existing file.',
      replaceLabel: 'Replace existing file',
      replaceDescription: getLiveReplaceDescription(isVersioningSuspended, false),
      keepBothLabel: 'Keep both files',
      keepBothDescription: 'Keeps the existing file and appends an incremental number to the name',
    }
  }

  if (archivedNames.length === 0) {
    return {
      title: `${totalCount} files already exist here`,
      description: 'Choose what happens to the existing files.',
      replaceLabel: 'Replace existing files',
      replaceDescription: getLiveReplaceDescription(isVersioningSuspended, true),
      keepBothLabel: 'Keep all files',
      keepBothDescription:
        'Keeps the existing files and appends an incremental number to the names',
    }
  }

  if (liveNames.length === 0 && archivedNames.length === 1) {
    return {
      title: `${archivedNames[0]} already exists and is archived`,
      description: 'Choose what happens to the archived file.',
      replaceLabel: 'Restore and add a new version',
      replaceDescription:
        'Your upload becomes the current version, and the archived versions stay in its version history',
      keepBothLabel: 'Keep both files',
      keepBothDescription:
        'Leaves the file archived and appends an incremental number to the name you upload',
    }
  }

  if (liveNames.length === 0) {
    return {
      title: `${totalCount} files already exist and are archived`,
      description: 'Choose what happens to the archived files.',
      replaceLabel: 'Restore and add new versions',
      replaceDescription:
        'Each upload becomes the current version, and the archived versions stay in its version history',
      keepBothLabel: 'Keep all files',
      keepBothDescription:
        'Leaves the files archived and appends an incremental number to the names you upload',
    }
  }

  return {
    title: `${totalCount} files already exist here`,
    description: 'Some of them are archived. Choose what happens to all of them.',
    replaceLabel: 'Replace and restore',
    replaceDescription: isVersioningSuspended
      ? 'Existing files are kept as noncurrent versions one last time, and archived files are restored with your upload as the current version'
      : 'Existing files become noncurrent versions, and archived files are restored with your upload as the current version',
    keepBothLabel: 'Keep all files',
    keepBothDescription:
      'Leaves the existing and archived files as they are, and appends an incremental number to the names you upload',
  }
}
