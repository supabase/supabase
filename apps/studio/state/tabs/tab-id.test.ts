import { describe, expect, it } from 'vitest'

import { kindsOnSurface, TAB_KINDS, type TabKind } from './kinds'
import { createTabId, parseTabId, parseUrlSegment, toUrlSegment } from './tab-id'

const ALL_KINDS = Object.keys(TAB_KINDS) as Array<TabKind>

/** Test-only narrowing: every call site below passes a known-non-empty literal. */
function mustCreateTabId(kind: TabKind, contentId: string): string {
  const tabId = createTabId(kind, contentId)
  if (tabId === null) throw new Error(`createTabId unexpectedly returned null for ${kind}`)
  return tabId
}

describe('createTabId / parseTabId round-trip', () => {
  it.each(ALL_KINDS)('round-trips a uuid-like content id for kind %s', (kind) => {
    const contentId = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
    const tabId = mustCreateTabId(kind, contentId)

    expect(tabId).toBe(`${kind}-${contentId}`)
    expect(parseTabId(tabId)).toEqual({ kind, contentId })
  })

  it('returns null for an empty content id, so createTabId/parseTabId never disagree', () => {
    expect(createTabId('sql', '')).toBeNull()
  })

  it('rejects an id with an unknown kind', () => {
    expect(parseTabId('bogus-123')).toBeNull()
  })

  it('rejects an id whose kind is an inherited Object property name', () => {
    expect(parseTabId('constructor-123')).toBeNull()
    expect(parseTabId('toString-123')).toBeNull()
  })

  it('rejects an id with no dash separator', () => {
    expect(parseTabId('sql')).toBeNull()
  })

  it('rejects an id with an empty content id', () => {
    expect(parseTabId('sql-')).toBeNull()
  })

  it('splits on the first dash only, so a dashed content id survives', () => {
    expect(parseTabId('notebook-3fa85f64-5717-4562-b3fc-2c963f66afa6')).toEqual({
      kind: 'notebook',
      contentId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
  })
})

describe('toUrlSegment: bare vs. prefixed', () => {
  it.each(['sql', 'r', 'v', 'm', 'f', 'p'] as const)(
    'drops the prefix for the bare kind %s',
    (kind) => {
      expect(toUrlSegment(mustCreateTabId(kind, 'abc'))).toBe('abc')
    }
  )

  it.each(['notebook', 'chat'] as const)('keeps the prefix for kind %s', (kind) => {
    expect(toUrlSegment(mustCreateTabId(kind, 'abc'))).toBe(`${kind}-abc`)
  })

  it('returns null for a malformed tab id', () => {
    expect(toUrlSegment('not-a-real-kind-abc')).toBeNull()
  })

  it('passes through a null tab id, so it composes directly with createTabId', () => {
    expect(toUrlSegment(createTabId('sql', ''))).toBeNull()
  })
})

describe('parseUrlSegment: surface scoping', () => {
  it('resolves a bare segment to the sql kind on the sql surface', () => {
    expect(parseUrlSegment('abc', 'sql')).toEqual({ kind: 'sql', contentId: 'abc' })
  })

  it('resolves a prefixed segment to its kind on the sql surface', () => {
    expect(parseUrlSegment('notebook-abc', 'sql')).toEqual({ kind: 'notebook', contentId: 'abc' })
    expect(parseUrlSegment('chat-abc', 'sql')).toEqual({ kind: 'chat', contentId: 'abc' })
  })

  it('falls back to the bare sql kind for a segment that looks table-prefixed, since sql has no other claim on it', () => {
    // "r-123" isn't a `notebook-`/`chat-` segment, so on the sql surface it's just
    // a raw (if odd-looking) content id — the table kind `r` is out of scope here.
    expect(parseUrlSegment('r-123', 'sql')).toEqual({ kind: 'sql', contentId: 'r-123' })
  })

  it('does not resolve a sql-surface-only prefix on the table surface', () => {
    expect(parseUrlSegment('notebook-abc', 'table')).toBeNull()
  })

  it.each(kindsOnSurface('table'))(
    'does not resolve a bare segment on the table surface, which has %s among several ambiguous bare kinds',
    (kind) => {
      expect(TAB_KINDS[kind].urlPrefix).toBeNull()
      expect(parseUrlSegment('123', 'table')).toBeNull()
    }
  )

  it('returns null for an empty segment', () => {
    expect(parseUrlSegment('', 'sql')).toBeNull()
  })

  it.each(['templates', 'examples', 'new'])(
    'resolves the "%s" sentinel to the bare sql kind, not a UUID',
    (sentinel) => {
      expect(parseUrlSegment(sentinel, 'sql')).toEqual({ kind: 'sql', contentId: sentinel })
    }
  )
})
