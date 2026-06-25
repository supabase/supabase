import { describe, expect, it } from 'vitest'

import {
  isSaveFailed,
  isSaving,
  statusOnSaveError,
  statusOnSaveStart,
  statusOnSaveSuccess,
  wasNeverPersisted,
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
