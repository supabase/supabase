// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TelemetryTagManager } from './telemetry'

const consent = vi.hoisted(() => ({ hasAccepted: false }))

vi.mock('./constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./constants')>()),
  IS_PLATFORM: true,
}))

vi.mock('./consent-state', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./consent-state')>()),
  useConsentState: () => ({ hasAccepted: consent.hasAccepted }),
}))

vi.mock('./consented-url-cookie', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./consented-url-cookie')>()),
  createConsentedUrlCookieSync: () => () => {},
}))

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let container: HTMLDivElement
let root: Root

const tagScripts = () => document.querySelectorAll('script#consent')

function render() {
  act(() => root.render(<TelemetryTagManager />))
}

describe('TelemetryTagManager', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID', 'GTM-TEST')
    consent.hasAccepted = false
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    tagScripts().forEach((script) => script.remove())
    vi.unstubAllEnvs()
  })

  it('loads the tag only after consent, and only once across remounts', () => {
    render()
    expect(tagScripts()).toHaveLength(0)

    consent.hasAccepted = true
    render()
    expect(tagScripts()).toHaveLength(1)

    act(() => root.unmount())
    root = createRoot(container)
    render()
    expect(tagScripts()).toHaveLength(1)
  })
})
