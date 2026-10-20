import { describe, expect, it } from 'vitest'

import {
  extractDynamicUrlParams,
  queryFromAsPath,
  sameSearch,
  searchReflects,
  selectPagesAdapterSearch,
  shouldApplyNuqsUrlUpdate,
} from './nuqs-pages-adapter'

describe('selectPagesAdapterSearch', () => {
  const liveSearch = new URLSearchParams('schema=auth')
  const routerSearch = new URLSearchParams('schema=extensions')
  const hold = new URLSearchParams('schema=extensions')

  it('follows the address bar after Back', () => {
    expect(
      selectPagesAdapterSearch({
        mode: 'live',
        hold,
        liveSearch,
        routerSearch,
      }).get('schema')
    ).toBe('auth')
  })

  it('keeps a write on screen until the router shows it', () => {
    expect(
      selectPagesAdapterSearch({
        mode: 'hold',
        hold,
        liveSearch,
        routerSearch: new URLSearchParams('schema=auth'),
      }).get('schema')
    ).toBe('extensions')
  })

  it('uses the router once nothing is held', () => {
    expect(
      selectPagesAdapterSearch({
        mode: 'router',
        hold: null,
        liveSearch,
        routerSearch,
      }).get('schema')
    ).toBe('extensions')
  })
})

describe('shouldApplyNuqsUrlUpdate', () => {
  it('drops a queued write when Back already moved the url', () => {
    expect(shouldApplyNuqsUrlUpdate(true)).toBe(false)
  })

  it('still applies a queued write across a programmatic redirect', () => {
    expect(shouldApplyNuqsUrlUpdate(false)).toBe(true)
  })
})

describe('searchReflects', () => {
  it('ignores dynamic params the address bar does not carry', () => {
    const routerSearch = new URLSearchParams('ref=default&schema=auth')
    const liveSearch = new URLSearchParams('schema=auth')

    expect(searchReflects(routerSearch, liveSearch)).toBe(true)
  })

  it('stays false while the router is behind the address bar', () => {
    const routerSearch = new URLSearchParams('schema=extensions')
    const liveSearch = new URLSearchParams('schema=auth')

    expect(searchReflects(routerSearch, liveSearch)).toBe(false)
  })
})

describe('queryFromAsPath', () => {
  it('reads the query and ignores the hash', () => {
    expect(queryFromAsPath('/editor/1?schema=auth#top').get('schema')).toBe('auth')
  })

  it('treats two queries as the same regardless of key order', () => {
    expect(
      sameSearch(new URLSearchParams('schema=auth&id=1'), new URLSearchParams('id=1&schema=auth'))
    ).toBe(true)
  })
})

describe('extractDynamicUrlParams', () => {
  it('keeps dynamic segments and leaves search params out', () => {
    expect(
      extractDynamicUrlParams('/project/[ref]/editor/[id]', {
        ref: 'default',
        id: '12',
        schema: 'public',
      })
    ).toEqual({ ref: 'default', id: '12' })
  })

  it('defaults a missing optional catch-all to an empty list', () => {
    expect(extractDynamicUrlParams('/project/[ref]/[[...slug]]', { ref: 'default' })).toEqual({
      ref: 'default',
      slug: [],
    })
  })
})
