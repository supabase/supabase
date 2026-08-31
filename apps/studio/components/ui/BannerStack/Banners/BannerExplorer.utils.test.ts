import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  claimExplorerBannerSessionExposure,
  EXPLORER_BANNER_EXPOSURE_SESSION_KEY,
} from './BannerExplorer.utils'

const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage')

const blockSessionStorage = () => {
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    get() {
      throw new DOMException('storage blocked', 'SecurityError')
    },
  })
}

const restoreSessionStorage = () => {
  if (sessionStorageDescriptor === undefined) return
  Object.defineProperty(window, 'sessionStorage', sessionStorageDescriptor)
}

beforeEach(() => {
  window.sessionStorage.clear()
})

afterEach(() => {
  restoreSessionStorage()
})

describe('claimExplorerBannerSessionExposure', () => {
  it('claims the exposure on the first call of a session', () => {
    expect(claimExplorerBannerSessionExposure()).toBe(true)
    expect(window.sessionStorage.getItem(EXPLORER_BANNER_EXPOSURE_SESSION_KEY)).toBe('true')
  })

  it('refuses every later call in the same session', () => {
    claimExplorerBannerSessionExposure()

    expect(claimExplorerBannerSessionExposure()).toBe(false)
    expect(claimExplorerBannerSessionExposure()).toBe(false)
  })

  it('claims again once a new session starts', () => {
    claimExplorerBannerSessionExposure()
    window.sessionStorage.clear()

    expect(claimExplorerBannerSessionExposure()).toBe(true)
  })

  it('falls back to claiming on every call when session storage is unavailable', () => {
    blockSessionStorage()

    expect(claimExplorerBannerSessionExposure()).toBe(true)
    expect(claimExplorerBannerSessionExposure()).toBe(true)
  })
})
