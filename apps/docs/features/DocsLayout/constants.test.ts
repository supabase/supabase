// @vitest-environment jsdom
import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'
import { afterEach, describe, expect, it } from 'vitest'

import { DOCS_LAYOUT_CACHE_SCRIPT, DOCS_LAYOUT_FLAG } from './constants'

// the layout inlines this string in <head>, so the test runs it the same way the browser does
const runCacheScript = () => new Function(DOCS_LAYOUT_CACHE_SCRIPT)()

describe('DOCS_LAYOUT_CACHE_SCRIPT', () => {
  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    delete document.documentElement.dataset.docsLayout
    window.history.replaceState(null, '', '/')
  })

  it('marks the page for a reader with the flag on at the last visit', () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.DOCS_LAYOUT_FLAG, 'true')

    runCacheScript()

    expect(document.documentElement.dataset.docsLayout).toBe('v2')
  })

  it('marks the page when the url turns the layout on', () => {
    window.history.replaceState(null, '', `/?${DOCS_LAYOUT_FLAG}=true`)

    runCacheScript()

    expect(document.documentElement.dataset.docsLayout).toBe('v2')
  })

  it('lets the session override win over the last visit', () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.DOCS_LAYOUT_FLAG, 'true')
    sessionStorage.setItem(DOCS_LAYOUT_FLAG, 'false')

    runCacheScript()

    expect(document.documentElement.dataset.docsLayout).toBeUndefined()
  })

  it('lets the url win over the session override', () => {
    sessionStorage.setItem(DOCS_LAYOUT_FLAG, 'true')
    window.history.replaceState(null, '', `/?${DOCS_LAYOUT_FLAG}=false`)

    runCacheScript()

    expect(document.documentElement.dataset.docsLayout).toBeUndefined()
  })
})
