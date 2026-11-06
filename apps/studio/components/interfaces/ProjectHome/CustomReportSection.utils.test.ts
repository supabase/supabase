import { describe, expect, it } from 'vitest'

import { resolveSnippetSelection } from './CustomReportSection.utils'

describe('resolveSnippetSelection', () => {
  it('returns "already-added" when the snippet is already in the report', () => {
    expect(resolveSnippetSelection({ visibility: 'user' }, true)).toBe('already-added')
    expect(resolveSnippetSelection({ visibility: 'project' }, true)).toBe('already-added')
  })

  it('returns "confirm-share" for a private snippet not yet in the report', () => {
    expect(resolveSnippetSelection({ visibility: 'user' }, false)).toBe('confirm-share')
  })

  it('returns "add" for an already-shared snippet not yet in the report', () => {
    expect(resolveSnippetSelection({ visibility: 'project' }, false)).toBe('add')
    expect(resolveSnippetSelection({ visibility: 'org' }, false)).toBe('add')
    expect(resolveSnippetSelection({ visibility: 'public' }, false)).toBe('add')
  })
})
