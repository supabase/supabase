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
  expect(initialize).toHaveBeenCalledOnce()
  initialize.mockRestore()
  expect(Sentry.getClient()?.getIntegrationByName('BrowserSession')).toBeDefined()
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
  const document = window.document.implementation.createHTMLDocument()
  const root = createRoot(document)
  await act(async () => root.render(<GlobalError error={error} />))
  await act(async () => root.unmount())
}

const capturePagesError = async (err: Error) => {
  await CustomError.getInitialProps({ err, pathname: '/crash', query: {}, AppTree: () => null })
}

describe.each([
  ['app router', captureGlobalError],
  ['pages router', capturePagesError],
])('%s crash capture', (_, capture) => {
  it('sends the crash through the initialized browser sdk with the boundary tag', async () => {
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

  it('does not send the crash when consent is declined', async () => {
    consentState.hasConsented = false
    await capture(new Error('private render failed'))
    await Sentry.flush()
    expect(events()).toEqual([])
  })
})

describe('browser initialization', () => {
  it.each([true, false])(
    'captures application errors only with consent: %s',
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
