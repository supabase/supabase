import { describe, expect, it } from 'vitest'

import { getUploadConflictCopy } from './UploadConflictModal.utils'

describe('getUploadConflictCopy', () => {
  it('names the single live file and offers a replace', () => {
    const copy = getUploadConflictCopy({ liveNames: ['photo.png'], archivedNames: [] })

    expect(copy.title).toBe('photo.png already exists here')
    expect(copy.replaceLabel).toBe('Replace existing file')
    expect(copy.keepBothLabel).toBe('Keep both files')
  })

  it('counts several live files instead of naming them', () => {
    const copy = getUploadConflictCopy({
      liveNames: ['photo.png', 'notes.txt'],
      archivedNames: [],
    })

    expect(copy.title).toBe('2 files already exist here')
    expect(copy.replaceLabel).toBe('Replace existing files')
    expect(copy.keepBothLabel).toBe('Keep all files')
  })

  it('calls a single archived clash a restore, not a replace', () => {
    const copy = getUploadConflictCopy({ liveNames: [], archivedNames: ['icon-1.svg'] })

    expect(copy.title).toBe('icon-1.svg already exists and is archived')
    expect(copy.replaceLabel).toBe('Restore and add a new version')
    expect(copy.keepBothDescription).toContain('Leaves the file archived')
  })

  it('counts several archived clashes', () => {
    const copy = getUploadConflictCopy({
      liveNames: [],
      archivedNames: ['icon-1.svg', 'icon-2.svg'],
    })

    expect(copy.title).toBe('2 files already exist and are archived')
    expect(copy.replaceLabel).toBe('Restore and add new versions')
  })

  it('covers both effects when the clash is mixed', () => {
    const copy = getUploadConflictCopy({
      liveNames: ['photo.png'],
      archivedNames: ['icon-1.svg'],
    })

    expect(copy.title).toBe('2 files already exist here')
    expect(copy.description).toContain('Some of them are archived')
    expect(copy.replaceLabel).toBe('Replace and restore')
    expect(copy.replaceDescription).toContain('noncurrent versions')
    expect(copy.replaceDescription).toContain('restored')
  })
})
