import type { UploadConflicts } from './StorageExplorer.utils'

export interface UploadConflictCopy {
  title: string
  description: string
  replaceLabel: string
  replaceDescription: string
  keepBothLabel: string
  keepBothDescription: string
}

/**
 * What the two choices mean depends on what is sitting at the name. A live file is replaced
 * and kept as a noncurrent version; an archived one has no visible occupant at all, so the
 * upload restores it. There is no singular mixed case — a mix needs at least two names.
 */
export const getUploadConflictCopy = ({
  liveNames,
  archivedNames,
}: UploadConflicts): UploadConflictCopy => {
  const totalCount = liveNames.length + archivedNames.length

  if (archivedNames.length === 0 && liveNames.length === 1) {
    return {
      title: `${liveNames[0]} already exists here`,
      description: 'Choose what happens to the existing file.',
      replaceLabel: 'Replace existing file',
      replaceDescription:
        'The file you replace becomes a noncurrent version you can restore from its version history',
      keepBothLabel: 'Keep both files',
      keepBothDescription: 'Keeps the existing file and appends an incremental number to the name',
    }
  }

  if (archivedNames.length === 0) {
    return {
      title: `${totalCount} files already exist here`,
      description: 'Choose what happens to the existing files.',
      replaceLabel: 'Replace existing files',
      replaceDescription:
        'Each file you replace becomes a noncurrent version you can restore from its version history',
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
    replaceDescription:
      'Existing files become noncurrent versions, and archived files are restored with your upload as the current version',
    keepBothLabel: 'Keep all files',
    keepBothDescription:
      'Leaves the existing and archived files as they are, and appends an incremental number to the names you upload',
  }
}
