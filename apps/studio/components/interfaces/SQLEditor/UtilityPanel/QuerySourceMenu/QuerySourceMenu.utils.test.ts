import { describe, expect, it } from 'vitest'

import { resolveSourceSwitch } from './QuerySourceMenu.utils'

describe('resolveSourceSwitch', () => {
  it('opens a new tab (push) when switching source on an existing snippet', () => {
    expect(
      resolveSourceSwitch({
        ref: 'abc',
        target: 'logs',
        currentSource: 'database',
        isBlankNewTab: false,
      })
    ).toEqual({ method: 'push', url: '/project/abc/sql/new?skip=true&source=logs' })
  })

  it('re-flavors in place (replace) on a brand-new blank tab', () => {
    expect(
      resolveSourceSwitch({
        ref: 'abc',
        target: 'logs',
        currentSource: 'database',
        isBlankNewTab: true,
      })
    ).toEqual({ method: 'replace', url: '/project/abc/sql/new?skip=true&source=logs' })
  })

  it('omits the source param when switching to database (the default source)', () => {
    expect(
      resolveSourceSwitch({
        ref: 'abc',
        target: 'database',
        currentSource: 'logs',
        isBlankNewTab: false,
      })
    ).toEqual({ method: 'push', url: '/project/abc/sql/new?skip=true' })
  })

  it('is a no-op when the snippet is already on the target source', () => {
    expect(
      resolveSourceSwitch({
        ref: 'abc',
        target: 'database',
        currentSource: 'database',
        isBlankNewTab: false,
      })
    ).toBeNull()
  })

  it('is a no-op without a project ref', () => {
    expect(
      resolveSourceSwitch({
        ref: undefined,
        target: 'logs',
        currentSource: 'database',
        isBlankNewTab: true,
      })
    ).toBeNull()
  })
})
