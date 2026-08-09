import { untrustedSql } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import {
  buildUpsertPayload,
  canEditSnippet,
  isLoadedSnippet,
  isSnippetOwner,
  validateMoveToFolder,
  type LoadedSnippet,
} from './sql-editor-rules'
import type { SnippetWithContent } from '@/data/content/sql-folders-query'

function makeSnippet(overrides: Omit<Partial<SnippetWithContent>, 'content'> = {}): LoadedSnippet {
  return {
    id: 'snippet-1',
    type: 'sql',
    name: 'My Query',
    description: 'A description',
    visibility: 'user',
    project_id: 42,
    owner_id: 7,
    folder_id: null,
    favorite: false,
    status: 'saved',
    inserted_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
    content: {
      content_id: 'snippet-1',
      schema_version: '1',
      unchecked_sql: untrustedSql('SELECT * FROM users;'),
    },
  }
}

describe('canEditSnippet', () => {
  it('returns true for owner of a project-visibility snippet', () => {
    const snippet = makeSnippet({ visibility: 'project', owner_id: 7 })
    expect(canEditSnippet(snippet, 7)).toBe(true)
  })

  it('returns false for non-owner of a project-visibility snippet', () => {
    const snippet = makeSnippet({ visibility: 'project', owner_id: 7 })
    expect(canEditSnippet(snippet, 99)).toBe(false)
  })

  it('returns true for non-owner of a user-visibility snippet', () => {
    const snippet = makeSnippet({ visibility: 'user', owner_id: 7 })
    expect(canEditSnippet(snippet, 99)).toBe(true)
  })

  it('returns false when profileId is undefined and snippet is project-visibility', () => {
    const snippet = makeSnippet({ visibility: 'project', owner_id: 7 })
    expect(canEditSnippet(snippet, undefined)).toBe(false)
  })
})

describe('isSnippetOwner', () => {
  it('returns true when profileId matches owner_id', () => {
    const snippet = makeSnippet({ owner_id: 7 })
    expect(isSnippetOwner(snippet, 7)).toBe(true)
  })

  it('returns false when profileId does not match owner_id', () => {
    const snippet = makeSnippet({ owner_id: 7 })
    expect(isSnippetOwner(snippet, 99)).toBe(false)
  })

  it('returns false when profileId is undefined', () => {
    const snippet = makeSnippet({ owner_id: 7 })
    expect(isSnippetOwner(snippet, undefined)).toBe(false)
  })
})

describe('validateMoveToFolder', () => {
  it('returns { ok: false } when visibility is project and folderId is set', () => {
    const result = validateMoveToFolder({ visibility: 'project', folderId: 'folder-abc' })
    expect(result).toEqual({ ok: false, error: 'Shared snippet cannot be within a folder' })
  })

  it('returns { ok: true } when visibility is project and folderId is null', () => {
    const result = validateMoveToFolder({ visibility: 'project', folderId: null })
    expect(result).toEqual({ ok: true })
  })

  it('returns { ok: true } when visibility is project and folderId is undefined', () => {
    const result = validateMoveToFolder({ visibility: 'project', folderId: undefined })
    expect(result).toEqual({ ok: true })
  })

  it('returns { ok: true } when visibility is user and folderId is set', () => {
    const result = validateMoveToFolder({ visibility: 'user', folderId: 'folder-abc' })
    expect(result).toEqual({ ok: true })
  })
})

describe('buildUpsertPayload', () => {
  it('passes through provided values', () => {
    const snippet = makeSnippet()
    const payload = buildUpsertPayload(snippet, 'snippet-1')

    expect(payload.id).toBe('snippet-1')
    expect(payload.type).toBe('sql')
    expect(payload.name).toBe('My Query')
    expect(payload.description).toBe('A description')
    expect(payload.visibility).toBe('user')
    expect(payload.project_id).toBe(42)
    expect(payload.owner_id).toBe(7)
    expect(payload.favorite).toBe(false)
  })

  it('applies Untitled default when name is undefined', () => {
    const snippet = makeSnippet({ name: undefined })
    const payload = buildUpsertPayload(snippet, 'snippet-1')
    expect(payload.name).toBe('Untitled')
  })

  it('applies empty-string default when description is undefined', () => {
    const snippet = makeSnippet({ description: undefined })
    const payload = buildUpsertPayload(snippet, 'snippet-1')
    expect(payload.description).toBe('')
  })

  it('applies user default when visibility is undefined', () => {
    const snippet = makeSnippet({ visibility: undefined })
    const payload = buildUpsertPayload(snippet, 'snippet-1')
    expect(payload.visibility).toBe('user')
  })

  it('applies 0 default when project_id is undefined', () => {
    const snippet = makeSnippet({ project_id: undefined })
    const payload = buildUpsertPayload(snippet, 'snippet-1')
    expect(payload.project_id).toBe(0)
  })

  it('applies false default when favorite is undefined', () => {
    const snippet = makeSnippet({ favorite: undefined })
    const payload = buildUpsertPayload(snippet, 'snippet-1')
    expect(payload.favorite).toBe(false)
  })

  it('sets content.content_id to the supplied id', () => {
    const snippet = makeSnippet()
    const payload = buildUpsertPayload(snippet, 'my-id')
    expect((payload.content as any).content_id).toBe('my-id')
  })

  it('converts folder_id null to undefined in the payload', () => {
    const snippet = makeSnippet({ folder_id: null })
    const payload = buildUpsertPayload(snippet, 'snippet-1')
    expect(payload.folder_id).toBeUndefined()
  })

  it('passes through a non-null folder_id', () => {
    const snippet = makeSnippet({ folder_id: 'folder-xyz' })
    const payload = buildUpsertPayload(snippet, 'snippet-1')
    expect(payload.folder_id).toBe('folder-xyz')
  })
})

describe('isLoadedSnippet', () => {
  it('returns true when content is present', () => {
    const snippet = makeSnippet()
    expect(isLoadedSnippet(snippet)).toBe(true)
  })

  it('returns false when content is undefined', () => {
    const snippet = { ...makeSnippet(), content: undefined }
    expect(isLoadedSnippet(snippet)).toBe(false)
  })

  it('narrows the snippet so buildUpsertPayload accepts it', () => {
    const snippet: SnippetWithContent = makeSnippet()
    if (isLoadedSnippet(snippet)) {
      const payload = buildUpsertPayload(snippet, 'snippet-1')
      expect(payload.id).toBe('snippet-1')
    } else {
      throw new Error('expected snippet to be loaded')
    }
  })
})
