import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Script from './script'

// The shim's load caches are module-level (like Next's), so each test uses
// its own id/src.
//
// jsdom runs scripts against its own window, which vitest's test-side
// `window` doesn't share, so inline scripts record runs on the shared
// document instead of a window global.
const inlineCounter = (key: string) =>
  `var el = document.documentElement; el.dataset['run_${key}'] = String(Number(el.dataset['run_${key}'] || 0) + 1);`

const runs = (key: string) => Number(document.documentElement.dataset[`run_${key}`] ?? 0)

afterEach(() => {
  document.body.querySelectorAll('script[data-nscript]').forEach((el) => el.remove())
})

describe('next/script compat shim', () => {
  it('executes an inline dangerouslySetInnerHTML script and renders nothing in place', () => {
    const onReady = vi.fn()
    const { container } = render(
      <Script
        id="inlineHtml"
        dangerouslySetInnerHTML={{ __html: inlineCounter('inlineHtml') }}
        onReady={onReady}
      />
    )

    expect(runs('inlineHtml')).toBe(1)
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(container.innerHTML).toBe('')

    const el = document.getElementById('inlineHtml')
    expect(el?.parentElement).toBe(document.body)
    expect(el?.getAttribute('data-nscript')).toBe('afterInteractive')
  })

  it('executes an inline script passed as children', () => {
    render(<Script id="inlineChildren">{inlineCounter('inlineChildren')}</Script>)
    expect(runs('inlineChildren')).toBe(1)
  })

  it('executes a script with the same id only once across instances and remounts', () => {
    const body = { __html: inlineCounter('dedupe') }
    const first = render(
      <>
        <Script id="dedupe" dangerouslySetInnerHTML={body} />
        <Script id="dedupe" dangerouslySetInnerHTML={body} />
      </>
    )
    first.unmount()
    render(<Script id="dedupe" dangerouslySetInnerHTML={body} />)

    expect(runs('dedupe')).toBe(1)
    expect(document.querySelectorAll('script#dedupe')).toHaveLength(1)
  })

  it('appends a src script as a real element and wires onLoad/onReady to its load event', () => {
    const onLoad = vi.fn()
    const onReady = vi.fn()
    render(
      <Script
        src="https://example.com/a.js"
        crossOrigin="anonymous"
        data-foo="bar"
        onLoad={onLoad}
        onReady={onReady}
      />
    )

    const el = document.querySelector<HTMLScriptElement>('script[src="https://example.com/a.js"]')
    expect(el).not.toBeNull()
    expect(el?.parentElement).toBe(document.body)
    expect(el?.getAttribute('crossorigin')).toBe('anonymous')
    expect(el?.getAttribute('data-foo')).toBe('bar')
    expect(onLoad).not.toHaveBeenCalled()
    expect(onReady).not.toHaveBeenCalled()

    act(() => {
      el?.dispatchEvent(new Event('load'))
    })

    expect(onLoad).toHaveBeenCalledTimes(1)
    expect(onReady).toHaveBeenCalledTimes(1)
  })

  it('calls onError when a src script fails to load', async () => {
    const onError = vi.fn()
    render(<Script src="https://example.com/broken.js" onError={onError} />)

    const el = document.querySelector('script[src="https://example.com/broken.js"]')
    await act(async () => {
      el?.dispatchEvent(new Event('error'))
    })

    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('retries a src script on a later mount after it failed to load', async () => {
    const src = 'https://example.com/flaky.js'
    const first = render(<Script src={src} />)
    await act(async () => {
      document.querySelector(`script[src="${src}"]`)?.dispatchEvent(new Event('error'))
    })
    first.unmount()

    const onLoad = vi.fn()
    const onReady = vi.fn()
    render(<Script src={src} onLoad={onLoad} onReady={onReady} />)

    // Not treated as loaded: no onReady until the retried script loads.
    expect(onReady).not.toHaveBeenCalled()
    const retried = document.querySelectorAll(`script[src="${src}"]`)
    expect(retried).toHaveLength(1)
    act(() => {
      retried[0].dispatchEvent(new Event('load'))
    })
    expect(onLoad).toHaveBeenCalledTimes(1)
    expect(onReady).toHaveBeenCalledTimes(1)
  })

  it('runs onLoad, onReady and onError for every instance sharing an in-flight src', async () => {
    const loaded = 'https://example.com/shared.js'
    const firstReady = vi.fn()
    const secondLoad = vi.fn()
    const secondReady = vi.fn()
    render(<Script src={loaded} onReady={firstReady} />)
    render(<Script src={loaded} onLoad={secondLoad} onReady={secondReady} />)
    expect(document.querySelectorAll(`script[src="${loaded}"]`)).toHaveLength(1)
    await act(async () => {
      document.querySelector(`script[src="${loaded}"]`)?.dispatchEvent(new Event('load'))
    })
    expect(firstReady).toHaveBeenCalledTimes(1)
    expect(secondLoad).toHaveBeenCalledTimes(1)
    expect(secondReady).toHaveBeenCalledTimes(1)

    const failed = 'https://example.com/shared-broken.js'
    const firstError = vi.fn()
    const secondError = vi.fn()
    render(<Script src={failed} onError={firstError} />)
    render(<Script src={failed} onError={secondError} />)
    await act(async () => {
      document.querySelector(`script[src="${failed}"]`)?.dispatchEvent(new Event('error'))
    })
    expect(firstError).toHaveBeenCalledTimes(1)
    expect(secondError).toHaveBeenCalledTimes(1)
  })

  it('fires onReady on remount without re-injecting an already loaded script', () => {
    const src = 'https://example.com/b.js'
    const first = render(<Script src={src} />)
    act(() => {
      document.querySelector(`script[src="${src}"]`)?.dispatchEvent(new Event('load'))
    })
    first.unmount()

    const onLoad = vi.fn()
    const onReady = vi.fn()
    render(<Script src={src} onLoad={onLoad} onReady={onReady} />)

    expect(onReady).toHaveBeenCalledTimes(1)
    expect(onLoad).not.toHaveBeenCalled()
    expect(document.querySelectorAll(`script[src="${src}"]`)).toHaveLength(1)
  })

  it('defers lazyOnload scripts until the browser is idle', async () => {
    vi.useFakeTimers()
    try {
      render(
        <Script
          id="lazy"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{ __html: inlineCounter('lazy') }}
        />
      )
      expect(runs('lazy')).toBe(0)

      await act(async () => {
        await vi.runAllTimersAsync()
      })

      expect(runs('lazy')).toBe(1)
      expect(document.getElementById('lazy')?.getAttribute('data-nscript')).toBe('lazyOnload')
    } finally {
      vi.useRealTimers()
    }
  })
})
