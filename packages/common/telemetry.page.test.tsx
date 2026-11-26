// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FrameworkProvider, type FrameworkContextValue } from './framework'
import { handlePageTelemetry } from './page-telemetry'
import { PageTelemetry } from './telemetry'

vi.mock('./page-telemetry', () => ({
  handlePageTelemetry: vi.fn(() => Promise.resolve()),
  handlePageLeaveTelemetry: vi.fn(() => Promise.resolve()),
}))

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

const sendPage = vi.mocked(handlePageTelemetry)

let container: HTMLDivElement
let root: Root

function renderTelemetry(value: FrameworkContextValue) {
  act(() => {
    root.render(
      <FrameworkProvider value={value}>
        <PageTelemetry API_URL="https://api.example.com" platform="studio" hasAcceptedConsent />
      </FrameworkProvider>
    )
  })
}

function navigate(url: string, value: Omit<FrameworkContextValue, 'asPath'> = {}) {
  window.history.pushState({}, '', url)
  renderTelemetry({ pathname: '/project/[ref]', ...value, asPath: url })
}

describe('PageTelemetry route changes', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    window.history.replaceState({}, '', '/project/abc')
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    sendPage.mockClear()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('sends the initial page view once on mount', () => {
    renderTelemetry({ pathname: '/project/[ref]', asPath: '/project/abc' })

    expect(sendPage).toHaveBeenCalledTimes(1)
    expect(sendPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ pathname: '/project/[ref]', firstReferrerData: null })
    )
  })

  it('sends exactly once when asPath changes', () => {
    renderTelemetry({ pathname: '/project/[ref]', asPath: '/project/abc' })
    sendPage.mockClear()

    navigate('/project/abc?schema=auth')
    renderTelemetry({ pathname: '/project/[ref]', asPath: '/project/abc?schema=auth' })

    expect(sendPage).toHaveBeenCalledTimes(1)
    expect(sendPage).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ firstReferrerData: expect.anything() })
    )
  })

  it('does not send when only the hash changes', () => {
    renderTelemetry({ pathname: '/project/[ref]', asPath: '/project/abc' })
    sendPage.mockClear()

    navigate('/project/abc#section')

    expect(sendPage).not.toHaveBeenCalled()
  })

  it('sends only the initial page view when isReady turns true after navigating', () => {
    renderTelemetry({ pathname: '/project/[ref]', asPath: '/project/abc', isReady: false })
    navigate('/project/def', { isReady: false })

    expect(sendPage).not.toHaveBeenCalled()

    renderTelemetry({ pathname: '/project/[ref]', asPath: '/project/def', isReady: true })

    expect(sendPage).toHaveBeenCalledTimes(1)
    expect(sendPage).toHaveBeenLastCalledWith(expect.objectContaining({ firstReferrerData: null }))

    renderTelemetry({ pathname: '/project/[ref]', asPath: '/project/def', isReady: false })
    renderTelemetry({ pathname: '/project/[ref]', asPath: '/project/def', isReady: true })

    expect(sendPage).toHaveBeenCalledTimes(1)
  })
})
