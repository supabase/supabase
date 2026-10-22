import { describe, expect, it } from 'vitest'

import {
  isHashOnlyChange,
  isPanelValueClear,
  isStaleDeletedPanelId,
  panelHistoryAction,
  resolvePanelUpdater,
  sameHistoryUrl,
  searchWithoutPanelParam,
  shouldGoBackOnDismiss,
  traverseRestoreDelta,
  type PanelEntryOwnership,
} from './panel-history.utils'

const ownership: PanelEntryOwnership = {
  entryKey: 'entry-a',
  pathname: '/project/default/auth/users',
  searchWithoutPanel: '',
  hash: '',
}

describe('panel value helpers', () => {
  it('treats null, false, and empty string as closed', () => {
    expect(isPanelValueClear(null)).toBe(true)
    expect(isPanelValueClear(undefined)).toBe(true)
    expect(isPanelValueClear(false)).toBe(true)
    expect(isPanelValueClear('')).toBe(true)
    expect(isPanelValueClear(0)).toBe(false)
    expect(isPanelValueClear('0')).toBe(false)
    expect(isPanelValueClear(true)).toBe(false)
    expect(isPanelValueClear('user')).toBe(false)
  })

  it('resolves a function updater against the current value', () => {
    expect(resolvePanelUpdater('a', 'b')).toBe('b')
    expect(resolvePanelUpdater('a', (current) => (current === 'a' ? 'b' : current))).toBe('b')
    expect(resolvePanelUpdater<string | null>(null, (current) => current ?? 'opened')).toBe(
      'opened'
    )
    expect(resolvePanelUpdater<string | null>('open', () => null)).toBe(null)
  })
})

describe('panelHistoryAction', () => {
  it('pushes only when a cleared value opens and history is push', () => {
    expect(
      panelHistoryAction({
        currentValue: null,
        nextValue: 'user-1',
        parserHistory: 'push',
      })
    ).toBe('push')
    expect(
      panelHistoryAction({
        currentValue: '',
        nextValue: 'Email',
        parserHistory: 'push',
      })
    ).toBe('push')
    expect(
      panelHistoryAction({
        currentValue: false,
        nextValue: true,
        parserHistory: 'push',
      })
    ).toBe('push')
    expect(
      panelHistoryAction({
        currentValue: null,
        nextValue: 'user-1',
        requestedHistory: 'push',
        parserHistory: 'replace',
      })
    ).toBe('push')
  })

  it('replaces a row switch, including an explicit push and a function updater', () => {
    expect(
      panelHistoryAction({
        currentValue: 'user-1',
        nextValue: 'user-2',
        requestedHistory: 'push',
        parserHistory: 'push',
      })
    ).toBe('replace')

    const nextValue = resolvePanelUpdater('user-1', (current) =>
      current === 'user-1' ? 'user-2' : current
    )
    expect(
      panelHistoryAction({
        currentValue: 'user-1',
        nextValue,
        parserHistory: 'push',
      })
    ).toBe('replace')
  })

  it('dismisses a clear and replace-clears when the caller asked to replace', () => {
    expect(
      panelHistoryAction({
        currentValue: 'user-1',
        nextValue: null,
        parserHistory: 'push',
      })
    ).toBe('dismiss')
    expect(
      panelHistoryAction({
        currentValue: true,
        nextValue: false,
        parserHistory: 'push',
      })
    ).toBe('dismiss')
    expect(
      panelHistoryAction({
        currentValue: 'user-1',
        nextValue: null,
        requestedHistory: 'replace',
        parserHistory: 'push',
      })
    ).toBe('replace-clear')
  })

  it('does nothing when the key is already clear', () => {
    expect(
      panelHistoryAction({
        currentValue: null,
        nextValue: null,
        parserHistory: 'push',
      })
    ).toBe('noop')
    expect(
      panelHistoryAction({
        currentValue: '',
        nextValue: null,
        requestedHistory: 'replace',
      })
    ).toBe('noop')
    expect(
      panelHistoryAction({
        currentValue: false,
        nextValue: false,
      })
    ).toBe('noop')
  })

  it('does not push an open whose parser and caller both replace', () => {
    expect(
      panelHistoryAction({
        currentValue: null,
        nextValue: 'user-1',
        parserHistory: 'replace',
      })
    ).toBe('replace')
    expect(
      panelHistoryAction({
        currentValue: null,
        nextValue: 'user-1',
        requestedHistory: 'replace',
        parserHistory: 'push',
      })
    ).toBe('replace')
  })
})

describe('shouldGoBackOnDismiss', () => {
  const base = {
    navigationAvailable: true,
    ownership,
    currentEntryKey: 'entry-a',
    currentPathname: '/project/default/auth/users',
    currentSearch: '?show=1',
    currentHash: '',
    panelKey: 'show',
  }

  it('goes back when this entry is still current and only the panel param is set', () => {
    expect(shouldGoBackOnDismiss(base)).toBe(true)
    expect(shouldGoBackOnDismiss({ ...base, currentSearch: '?show=2' })).toBe(true)
  })

  it('replaces when the navigation api is missing or this session never owned the entry', () => {
    expect(shouldGoBackOnDismiss({ ...base, navigationAvailable: false })).toBe(false)
    expect(shouldGoBackOnDismiss({ ...base, ownership: null })).toBe(false)
  })

  it('replaces when another push or a same-length route change took the session', () => {
    expect(shouldGoBackOnDismiss({ ...base, currentEntryKey: 'entry-b' })).toBe(false)
    expect(
      shouldGoBackOnDismiss({
        ...base,
        currentPathname: '/project/default/auth/providers',
      })
    ).toBe(false)
  })

  it('replaces when search outside the panel param changed, and ignores key order', () => {
    expect(shouldGoBackOnDismiss({ ...base, currentSearch: '?show=1&q=ada' })).toBe(false)
    expect(
      searchWithoutPanelParam('?b=2&show=1&a=1', 'show') ===
        searchWithoutPanelParam('?a=1&b=2', 'show')
    ).toBe(true)
    expect(
      shouldGoBackOnDismiss({
        ...base,
        ownership: { ...ownership, searchWithoutPanel: 'a=1&b=2' },
        currentSearch: '?b=2&show=9&a=1',
      })
    ).toBe(true)
  })

  it('replaces when only the hash changed so dismiss keeps it', () => {
    expect(shouldGoBackOnDismiss({ ...base, currentHash: '#row' })).toBe(false)
  })
})

describe('traverseRestoreDelta', () => {
  it('returns the go delta for back, forward, and a multi-entry jump', () => {
    expect(traverseRestoreDelta(5, 4)).toBe(1)
    expect(traverseRestoreDelta(5, 6)).toBe(-1)
    expect(traverseRestoreDelta(5, 3)).toBe(2)
  })

  it('skips the guard when either index is missing or the entry did not move', () => {
    expect(traverseRestoreDelta(null, 4)).toBe(null)
    expect(traverseRestoreDelta(5, null)).toBe(null)
    expect(traverseRestoreDelta(5, 5)).toBe(null)
  })
})

describe('sameHistoryUrl', () => {
  it('matches a relative router url to an absolute history href', () => {
    const base = 'http://localhost/project/default/database/functions?new=true'
    expect(sameHistoryUrl('/project/default/database/functions', base, base)).toBe(false)
    expect(
      sameHistoryUrl(
        'http://localhost/project/default/database/functions',
        '/project/default/database/functions',
        base
      )
    ).toBe(true)
    expect(sameHistoryUrl(base, '/project/default/auth/users', base)).toBe(false)
  })
})

describe('isStaleDeletedPanelId', () => {
  it('is true only when this successful delete is the id forward restored', () => {
    expect(isStaleDeletedPanelId('secret-1', true, 'secret-1')).toBe(true)
    expect(isStaleDeletedPanelId(4, true, '4')).toBe(true)
    expect(isStaleDeletedPanelId('secret-1', true, 'secret-2')).toBe(false)
    expect(isStaleDeletedPanelId('secret-1', false, 'secret-1')).toBe(false)
    expect(isStaleDeletedPanelId(null, true, 'secret-1')).toBe(false)
    expect(isStaleDeletedPanelId('', true, '')).toBe(false)
  })
})

describe('isHashOnlyChange', () => {
  const href = 'http://localhost/project/default/database/functions?new=true'

  it('is true only when origin, path, and search match and the hash differs', () => {
    expect(isHashOnlyChange(href, `${href}#setup`)).toBe(true)
    expect(isHashOnlyChange(`${href}#setup`, `${href}#other`)).toBe(true)
    expect(isHashOnlyChange(href, href)).toBe(false)
    expect(isHashOnlyChange(href, `${href}&extra=1#setup`)).toBe(false)
    expect(isHashOnlyChange(href, 'http://localhost/project/default/auth/users#setup')).toBe(false)
    expect(isHashOnlyChange(href, 'not a url')).toBe(false)
  })
})
