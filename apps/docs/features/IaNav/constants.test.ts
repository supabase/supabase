// @vitest-environment jsdom
import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'
import { afterEach, describe, expect, it } from 'vitest'

import { IA_NAV_CACHE_SCRIPT, IA_NAV_FLAG } from './constants'

// the layout inlines this string in <head>, so the test runs it the same way the browser does
const runCacheScript = () => new Function(IA_NAV_CACHE_SCRIPT)()

describe('IA_NAV_CACHE_SCRIPT', () => {
  afterEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.iaNav
    window.history.replaceState(null, '', '/')
  })

  it('marks the page for a visitor cached on option-1', () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.IA_NAV_FLAG, 'option-1')

    runCacheScript()

    expect(document.documentElement.dataset.iaNav).toBe('option-1')
  })

  it('leaves the page unmarked for a visitor cached on control', () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.IA_NAV_FLAG, 'control')

    runCacheScript()

    expect(document.documentElement.dataset.iaNav).toBeUndefined()
  })

  it('marks the page when the url forces option-1', () => {
    window.history.replaceState(null, '', `/?${IA_NAV_FLAG}=option-1`)

    runCacheScript()

    expect(document.documentElement.dataset.iaNav).toBe('option-1')
  })

  it('leaves the page unmarked when the url forces control over a cached option-1', () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.IA_NAV_FLAG, 'option-1')
    window.history.replaceState(null, '', `/?${IA_NAV_FLAG}=control`)

    runCacheScript()

    expect(document.documentElement.dataset.iaNav).toBeUndefined()
  })
})
