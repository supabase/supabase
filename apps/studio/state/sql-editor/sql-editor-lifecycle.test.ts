import { describe, expect, it } from 'vitest'

import {
  folderStatusOnSaveStart,
  hasUnsavedChanges,
  isFolderEditing,
  isFolderSaving,
  isNewFolder,
  isSaveFailed,
  isSaving,
  statusOnEdit,
  statusOnSaveError,
  statusOnSaveStart,
  statusOnSaveSuccess,
  wasNeverPersisted,
  type FolderStatus,
} from './sql-editor-lifecycle'
import type { SnippetStatus } from '@/data/content/snippet-status'

const NEVER_PERSISTED: Array<SnippetStatus> = ['new', 'new_saving', 'new_save_failed']
const PERSISTED: Array<SnippetStatus> = ['saved', 'unsaved', 'saving', 'save_failed']

describe('wasNeverPersisted', () => {
  it.each(NEVER_PERSISTED)('is true for never-persisted status %s', (status) => {
    expect(wasNeverPersisted(status)).toBe(true)
  })

  it.each(PERSISTED)('is false for persisted status %s', (status) => {
    expect(wasNeverPersisted(status)).toBe(false)
  })

  it('treats an absent status as persisted', () => {
    expect(wasNeverPersisted(undefined)).toBe(false)
  })
})

describe('isSaving', () => {
  it('is true only while a save is in flight (new or re-save)', () => {
    expect(isSaving('new_saving')).toBe(true)
    expect(isSaving('saving')).toBe(true)
  })

  it.each(['new', 'new_save_failed', 'saved', 'unsaved', 'save_failed', undefined] as const)(
    'is false for %s',
    (status) => {
      expect(isSaving(status)).toBe(false)
    }
  )
})

describe('isSaveFailed', () => {
  it('is true only after a failed save (new or re-save)', () => {
    expect(isSaveFailed('new_save_failed')).toBe(true)
    expect(isSaveFailed('save_failed')).toBe(true)
  })

  it.each(['new', 'new_saving', 'saved', 'unsaved', 'saving', undefined] as const)(
    'is false for %s',
    (status) => {
      expect(isSaveFailed(status)).toBe(false)
    }
  )
})

describe('hasUnsavedChanges', () => {
  it('is false only for a clean, saved snippet', () => {
    expect(hasUnsavedChanges('saved')).toBe(false)
    expect(hasUnsavedChanges(undefined)).toBe(false)
  })

  it.each(['new', 'new_saving', 'new_save_failed', 'unsaved', 'saving', 'save_failed'] as const)(
    'is true for unsaved/in-flight/failed status %s',
    (status) => {
      expect(hasUnsavedChanges(status)).toBe(true)
    }
  )
})

describe('statusOnSaveStart', () => {
  it('keeps never-persisted snippets in the new family', () => {
    expect(statusOnSaveStart('new')).toBe('new_saving')
    expect(statusOnSaveStart('new_save_failed')).toBe('new_saving')
  })

  it('moves persisted snippets to saving', () => {
    expect(statusOnSaveStart('saved')).toBe('saving')
    expect(statusOnSaveStart('unsaved')).toBe('saving')
    expect(statusOnSaveStart('save_failed')).toBe('saving')
    expect(statusOnSaveStart(undefined)).toBe('saving')
  })
})

describe('statusOnSaveSuccess', () => {
  it('always resolves to saved', () => {
    expect(statusOnSaveSuccess()).toBe('saved')
  })
})

describe('statusOnSaveError', () => {
  it('keeps never-persisted snippets in the new family', () => {
    expect(statusOnSaveError('new_saving')).toBe('new_save_failed')
    expect(statusOnSaveError('new')).toBe('new_save_failed')
  })

  it('moves persisted snippets to save_failed', () => {
    expect(statusOnSaveError('saving')).toBe('save_failed')
    expect(statusOnSaveError('saved')).toBe('save_failed')
    expect(statusOnSaveError(undefined)).toBe('save_failed')
  })
})

describe('statusOnEdit', () => {
  it('marks a persisted, clean snippet as unsaved', () => {
    expect(statusOnEdit('saved')).toBe('unsaved')
  })

  it('leaves every already-dirty or in-flight status unchanged', () => {
    for (const status of [...NEVER_PERSISTED, 'unsaved', 'saving', 'save_failed'] as const) {
      expect(statusOnEdit(status)).toBe(status)
    }
  })

  it('keeps hasUnsavedChanges true after an edit', () => {
    for (const status of [...NEVER_PERSISTED, ...PERSISTED] as const) {
      expect(hasUnsavedChanges(statusOnEdit(status))).toBe(true)
    }
  })
})

describe('lifecycle round trips', () => {
  it('new snippet: first save succeeds then a re-save succeeds', () => {
    let status: SnippetStatus = 'new'
    status = statusOnSaveStart(status)
    expect(status).toBe('new_saving')
    status = statusOnSaveSuccess()
    expect(status).toBe('saved')
    // re-save
    status = statusOnSaveStart(status)
    expect(status).toBe('saving')
    status = statusOnSaveSuccess()
    expect(status).toBe('saved')
  })

  it('new snippet: first save fails, retry succeeds (stays never-persisted until success)', () => {
    let status: SnippetStatus = 'new'
    status = statusOnSaveStart(status)
    status = statusOnSaveError(status)
    expect(status).toBe('new_save_failed')
    expect(wasNeverPersisted(status)).toBe(true)
    // retry
    status = statusOnSaveStart(status)
    expect(status).toBe('new_saving')
    status = statusOnSaveSuccess()
    expect(status).toBe('saved')
    expect(wasNeverPersisted(status)).toBe(false)
  })
})

const NEW_FOLDER: Array<FolderStatus> = ['new_editing', 'new_saving']
const PERSISTED_FOLDER: Array<FolderStatus> = ['editing', 'saving', 'idle']

describe('isNewFolder', () => {
  it.each(NEW_FOLDER)('is true for not-yet-persisted folder status %s', (status) => {
    expect(isNewFolder(status)).toBe(true)
  })

  it.each(PERSISTED_FOLDER)('is false for persisted folder status %s', (status) => {
    expect(isNewFolder(status)).toBe(false)
  })

  it('treats an absent status as not-new', () => {
    expect(isNewFolder(undefined)).toBe(false)
  })
})

describe('isFolderEditing', () => {
  it('is true only while the name is being edited inline (new or persisted)', () => {
    expect(isFolderEditing('new_editing')).toBe(true)
    expect(isFolderEditing('editing')).toBe(true)
  })

  it.each(['new_saving', 'saving', 'idle', undefined] as const)('is false for %s', (status) => {
    expect(isFolderEditing(status)).toBe(false)
  })
})

describe('isFolderSaving', () => {
  it('is true only while a create/rename is in flight (new or persisted)', () => {
    expect(isFolderSaving('new_saving')).toBe(true)
    expect(isFolderSaving('saving')).toBe(true)
  })

  it.each(['new_editing', 'editing', 'idle', undefined] as const)('is false for %s', (status) => {
    expect(isFolderSaving(status)).toBe(false)
  })
})

describe('folderStatusOnSaveStart', () => {
  it('keeps a new folder in the new family', () => {
    expect(folderStatusOnSaveStart('new_editing')).toBe('new_saving')
  })

  it('moves a persisted folder to saving', () => {
    expect(folderStatusOnSaveStart('editing')).toBe('saving')
    expect(folderStatusOnSaveStart('idle')).toBe('saving')
  })
})
