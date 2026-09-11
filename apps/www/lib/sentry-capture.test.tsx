import * as Sentry from '@sentry/nextjs'
import { consentState } from 'common/consent-state'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import GlobalError from '../app/global-error'
import CustomError from '../pages/_error'

type Transport = ReturnType<NonNullable<Parameters<typeof Sentry.init>[0]['transport']>>

const envelopes: Parameters<Transport['send']>[0][] = []
const events = () =>
  envelopes.flatMap(([, items]) =>
    items.flatMap(([header, payload]) => (header.type === 'event' ? [payload] : []))
  )

beforeAll(async () => {
  const init = Sentry.init
  const initialize = vi.spyOn(Sentry, 'init').mockImplementation((options) =>
    init({
      ...options,
      transport: (): Transport => ({
        send: async (envelope) => {
          envelopes.push(envelope)
          return { statusCode: 200 }
        },
        flush: async () => true,
      }),
    })
  )
  await import('../instrumentation-client')
  initialize.mockRestore()
})

beforeEach(() => {
  envelopes.length = 0
  consentState.hasConsented = true
})

afterAll(async () => {
  consentState.hasConsented = false
  await Sentry.close()
})

const captureGlobalError = async (error: Error) => {
  const frame = document.createElement('iframe')
  document.body.appendChild(frame)
  const frameDocument = frame.contentDocument
  if (!frameDocument) throw new Error('Missing frame document')
  const root = createRoot(frameDocument)
  try {
    await act(async () => root.render(<GlobalError error={error} />))
  } finally {
    await act(async () => root.unmount())
    frame.remove()
  }
}

const capturePagesError = async (err: Error) => {
  const props = await CustomError.getInitialProps({
    err,
    pathname: '/crash',
    query: {},
    AppTree: () => null,
  })
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  try {
    await act(async () => root.render(<CustomError {...props} />))
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
}

describe.each([
  ['app router', captureGlobalError],
  ['pages router', capturePagesError],
])('%s page crashes', (_, capture) => {
  it('sends the error to Sentry marked as a page crash', async () => {
    await capture(new Error('render failed'))
    await Sentry.flush()
    expect(events()).toEqual([
      expect.objectContaining({
        exception: {
          values: expect.arrayContaining([expect.objectContaining({ value: 'render failed' })]),
        },
        tags: expect.objectContaining({ globalErrorBoundary: true, third_party_code: true }),
      }),
    ])
  })

  it("does not send the page crash without the user's permission", async () => {
    consentState.hasConsented = false
    await capture(new Error('private render failed'))
    await Sentry.flush()
    expect(events()).toEqual([])
  })
})

describe('browser error reporting', () => {
  it.each([true, false])(
    "sends app errors only with the user's permission: %s",
    async (hasConsent) => {
      consentState.hasConsented = hasConsent
      const error = new Error(`application failed with consent ${hasConsent}`)
      error.stack = undefined
      Sentry.captureException(error)
      await Sentry.flush()
      expect(events()).toEqual(
        hasConsent
          ? [
              expect.objectContaining({
                exception: {
                  values: expect.arrayContaining([
                    expect.objectContaining({ value: error.message }),
                  ]),
                },
              }),
            ]
          : []
      )
    }
  )
})
