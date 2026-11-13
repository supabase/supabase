// @vitest-environment jsdom
// @vitest-environment-options {"url": "https://www.supabase.com/"}
import type { UserDecision } from '@usercentrics/cmp-browser-sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  applyPriorDecisionToSDK,
  consentState,
  detectPriorConsent,
  revokeTrackingConsent,
} from './consent-state'
import { posthogClient } from './posthog-client'

vi.mock('./posthog-client', () => ({
  posthogClient: { optOut: vi.fn(), optIn: vi.fn() },
}))

vi.mock('./constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./constants')>()),
  IS_PLATFORM: true,
}))

const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) => Promise.resolve(new Response()))

// jsdom's localStorage can be flaky in vitest, so ensure it's available
const storage = new Map<string, string>()
const mockLocalStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
  get length() {
    return storage.size
  },
  key: (index: number) => Array.from(storage.keys())[index] ?? null,
}

beforeEach(() => {
  storage.clear()
  fetchMock.mockReset().mockImplementation(() => Promise.resolve(new Response()))
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.supabase.com')
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  storage.clear()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('detectPriorConsent', () => {
  describe('scenario 1: GTM compressed format (ucData)', () => {
    it('returns uniform-accept when every service has consent: true', () => {
      storage.set(
        'ucData',
        JSON.stringify({
          gcm: { adStorage: 'granted', analyticsStorage: 'granted' },
          consent: {
            services: {
              svc1: { name: 'Google Analytics', consent: true },
              svc2: { name: 'Stripe', consent: true },
              svc3: { name: 'Sentry', consent: true },
            },
          },
        })
      )

      expect(detectPriorConsent()).toEqual({ kind: 'uniform-accept' })
    })

    // Real customer data shape from GROWTH-790: essentials and functional
    // services accepted, marketing/tracking services denied. This is what
    // Opt out or a Privacy Settings toggle of the Marketing category produces
    // in production — essentials are locked on and cannot actually be denied.
    it('returns per-service decisions when ucData has a mixed consent state (GROWTH-790)', () => {
      storage.set(
        'ucData',
        JSON.stringify({
          gcm: {
            adsDataRedaction: true,
            adStorage: 'denied',
            adPersonalization: 'denied',
            adUserData: 'denied',
            analyticsStorage: 'denied',
          },
          consent: {
            services: {
              J39GyuWQq: { name: 'Amazon Web Services', consent: true },
              HkIVcNiuoZX: { name: 'Cloudflare', consent: true },
              H1PKqNodoWQ: { name: 'Google AJAX', consent: true },
              HkPBYFofN: { name: 'Google Fonts', consent: true },
              QjO6LaiOd: { name: 'hCaptcha', consent: true },
              'F-REmjGq7': { name: 'JSDelivr', consent: true },
              Hko_qNsui_Q: { name: 'reCAPTCHA', consent: true },
              rH1vNPCFR: { name: 'Sentry', consent: true },
              ry3w9Vo_oZ7: { name: 'Stripe', consent: true },
              BJTzqNi_i_m: { name: 'Twitter Plugin', consent: true },
              HLap0udLC: { name: 'Twitter Syndication', consent: true },
              H1Vl5NidjWX: { name: 'Usercentrics Consent Management Platform', consent: true },
              BJz7qNsdj_7: { name: 'YouTube Video', consent: true },
              S1_9Vsuj_Q: { name: 'Google Ads', consent: false },
              HkocEodjb7: { name: 'Google Analytics', consent: false },
              BJ59EidsWQ: { name: 'Google Tag Manager', consent: false },
              nV4hGUA8RQK5Ez: { name: 'Supabase Event Tracking', consent: false },
            },
          },
        })
      )

      const result = detectPriorConsent()
      if (result === null || result.kind !== 'decisions') {
        throw new Error(`expected decisions result, got ${JSON.stringify(result)}`)
      }
      expect(result.decisions).toHaveLength(17)
      // Essentials / functional services preserved as accepted
      expect(result.decisions).toContainEqual({ serviceId: 'J39GyuWQq', status: true })
      expect(result.decisions).toContainEqual({ serviceId: 'rH1vNPCFR', status: true })
      // Tracking services preserved as denied
      expect(result.decisions).toContainEqual({ serviceId: 'S1_9Vsuj_Q', status: false })
      expect(result.decisions).toContainEqual({ serviceId: 'HkocEodjb7', status: false })
      expect(result.decisions).toContainEqual({ serviceId: 'BJ59EidsWQ', status: false })
      expect(result.decisions).toContainEqual({ serviceId: 'nV4hGUA8RQK5Ez', status: false })
    })

    it('returns per-service decisions (all false) when every service was denied', () => {
      storage.set(
        'ucData',
        JSON.stringify({
          consent: {
            services: {
              svc1: { name: 'Google Analytics', consent: false },
              svc2: { name: 'Stripe', consent: false },
            },
          },
        })
      )

      expect(detectPriorConsent()).toEqual({
        kind: 'decisions',
        decisions: [
          { serviceId: 'svc1', status: false },
          { serviceId: 'svc2', status: false },
        ],
      })
    })

    it('returns null when services object is empty', () => {
      storage.set('ucData', JSON.stringify({ consent: { services: {} } }))
      expect(detectPriorConsent()).toBeNull()
    })

    it('returns null when ucData is malformed JSON', () => {
      storage.set('ucData', 'not-json')
      expect(detectPriorConsent()).toBeNull()
    })

    it('returns null when ucData has no consent.services', () => {
      storage.set('ucData', JSON.stringify({ gcm: {} }))
      expect(detectPriorConsent()).toBeNull()
    })

    it('returns null when every service value is non-object', () => {
      storage.set('ucData', JSON.stringify({ consent: { services: { svc1: 'not-an-object' } } }))
      expect(detectPriorConsent()).toBeNull()
    })

    // Partial parse failures must fail closed. Cherry-picking the valid
    // subset and calling it uniform-accept would let corrupted third-party
    // storage silently upgrade a user's consent — the worst-direction bias
    // in this domain.
    it('returns null when any entry fails schema (fails closed on partial corruption)', () => {
      storage.set(
        'ucData',
        JSON.stringify({
          consent: {
            services: {
              svc1: 'not-an-object',
              svc2: { name: 'Valid', consent: true },
            },
          },
        })
      )
      expect(detectPriorConsent()).toBeNull()
    })
  })

  describe('scenario 2: fast cross-app navigation (uc_settings gated by uc_user_interaction)', () => {
    const buildUcSettings = (services: Array<{ id: string; status: boolean }>) =>
      JSON.stringify({
        controllerId: 'test-controller',
        id: 'test-settings',
        language: 'en',
        services: services.map((s) => ({
          id: s.id,
          status: s.status,
          processorId: 'test-processor',
          history: [],
          version: '1.0.0',
        })),
        version: '1.0.0',
      })

    it('returns uniform-accept when uc_settings has every service accepted', () => {
      storage.set('uc_user_interaction', 'true')
      storage.set(
        'uc_settings',
        buildUcSettings([
          { id: 'svc1', status: true },
          { id: 'svc2', status: true },
        ])
      )
      expect(detectPriorConsent()).toEqual({ kind: 'uniform-accept' })
    })

    it('returns per-service decisions when uc_settings has a mixed state', () => {
      storage.set('uc_user_interaction', 'true')
      storage.set(
        'uc_settings',
        buildUcSettings([
          { id: 'essential1', status: true },
          { id: 'tracking1', status: false },
          { id: 'tracking2', status: false },
        ])
      )
      const result = detectPriorConsent()
      if (result === null || result.kind !== 'decisions') {
        throw new Error(`expected decisions result, got ${JSON.stringify(result)}`)
      }
      expect(result.decisions).toHaveLength(3)
      expect(result.decisions).toContainEqual({ serviceId: 'essential1', status: true })
      expect(result.decisions).toContainEqual({ serviceId: 'tracking1', status: false })
      expect(result.decisions).toContainEqual({ serviceId: 'tracking2', status: false })
    })

    it('returns null when uc_user_interaction is "true" but uc_settings is absent', () => {
      storage.set('uc_user_interaction', 'true')
      expect(detectPriorConsent()).toBeNull()
    })

    it('returns null when uc_settings is malformed JSON', () => {
      storage.set('uc_user_interaction', 'true')
      storage.set('uc_settings', 'not-json')
      expect(detectPriorConsent()).toBeNull()
    })

    it('returns null when uc_settings services array is empty', () => {
      storage.set('uc_user_interaction', 'true')
      storage.set('uc_settings', buildUcSettings([]))
      expect(detectPriorConsent()).toBeNull()
    })

    it('returns null when any uc_settings service entry fails schema', () => {
      storage.set('uc_user_interaction', 'true')
      storage.set(
        'uc_settings',
        JSON.stringify({
          services: [
            { id: 'svc1', status: true, processorId: 'p', history: [], version: '1' },
            { id: 'svc2', status: 'not-a-boolean', processorId: 'p', history: [], version: '1' },
          ],
        })
      )
      expect(detectPriorConsent()).toBeNull()
    })

    it('returns null when uc_user_interaction is "false" (even if uc_settings is valid)', () => {
      storage.set('uc_user_interaction', 'false')
      storage.set('uc_settings', buildUcSettings([{ id: 'svc1', status: true }]))
      expect(detectPriorConsent()).toBeNull()
    })

    it('returns null when uc_user_interaction is absent', () => {
      storage.set('uc_settings', buildUcSettings([{ id: 'svc1', status: true }]))
      expect(detectPriorConsent()).toBeNull()
    })
  })

  describe('combined scenarios', () => {
    it('returns uniform-accept when ucData is fully accepted (ignoring uc_user_interaction/uc_settings)', () => {
      storage.set(
        'ucData',
        JSON.stringify({
          consent: { services: { svc1: { name: 'GA', consent: true } } },
        })
      )
      storage.set('uc_user_interaction', 'true')
      expect(detectPriorConsent()).toEqual({ kind: 'uniform-accept' })
    })

    it('prefers ucData decisions over uc_settings when both exist', () => {
      storage.set(
        'ucData',
        JSON.stringify({
          consent: { services: { svc1: { name: 'GA', consent: false } } },
        })
      )
      storage.set('uc_user_interaction', 'true')
      storage.set(
        'uc_settings',
        JSON.stringify({
          services: [{ id: 'svc1', status: true, processorId: 'p', history: [], version: '1' }],
        })
      )
      expect(detectPriorConsent()).toEqual({
        kind: 'decisions',
        decisions: [{ serviceId: 'svc1', status: false }],
      })
    })

    it('falls back to uc_settings when ucData is corrupt (scenario 1 fails closed, scenario 2 recovers)', () => {
      storage.set('ucData', JSON.stringify({ consent: { services: { svc1: 'corrupt' } } }))
      storage.set('uc_user_interaction', 'true')
      storage.set(
        'uc_settings',
        JSON.stringify({
          services: [{ id: 'svc1', status: false, processorId: 'p', history: [], version: '1' }],
        })
      )
      expect(detectPriorConsent()).toEqual({
        kind: 'decisions',
        decisions: [{ serviceId: 'svc1', status: false }],
      })
    })

    it('returns null when localStorage is completely empty', () => {
      expect(detectPriorConsent()).toBeNull()
    })
  })
})

describe('applyPriorDecisionToSDK', () => {
  type MockService = { id: string; isEssential: boolean }

  const makeMockUC = (
    opts: {
      services?: MockService[]
      areAllAccepted?: boolean
      onAcceptAll?: () => Promise<void>
      onUpdateServices?: (decisions: UserDecision[]) => Promise<void>
    } = {}
  ) => {
    const services = opts.services ?? []
    return {
      acceptAllServices: vi.fn(opts.onAcceptAll ?? (() => Promise.resolve())),
      denyAllServices: vi.fn(() => Promise.resolve()),
      updateServices: vi.fn(opts.onUpdateServices ?? (() => Promise.resolve())),
      getCategoriesBaseInfo: vi.fn(() => []),
      getServicesBaseInfo: vi.fn(() => services),
      areAllConsentsAccepted: vi.fn(() => opts.areAllAccepted ?? false),
    }
  }

  beforeEach(() => {
    consentState.UC = null
    consentState.categories = null
    consentState.showConsentToast = false
    consentState.hasConsented = false
  })

  it('uniform-accept: calls acceptAllServices, sets hasConsented, suppresses banner', () => {
    const UC = makeMockUC()
    applyPriorDecisionToSDK(UC as never, { initialLayer: 0 }, { kind: 'uniform-accept' })

    expect(UC.acceptAllServices).toHaveBeenCalledOnce()
    expect(UC.updateServices).not.toHaveBeenCalled()
    expect(consentState.hasConsented).toBe(true)
    expect(consentState.showConsentToast).toBe(false)
  })

  it('decisions with full coverage: calls updateServices with stored decisions, suppresses banner', () => {
    const UC = makeMockUC({
      services: [
        { id: 'essential1', isEssential: true },
        { id: 'tracking1', isEssential: false },
        { id: 'tracking2', isEssential: false },
      ],
    })
    const decisions: UserDecision[] = [
      { serviceId: 'tracking1', status: true },
      { serviceId: 'tracking2', status: false },
    ]

    applyPriorDecisionToSDK(UC as never, { initialLayer: 0 }, { kind: 'decisions', decisions })

    expect(UC.updateServices).toHaveBeenCalledWith(decisions)
    expect(UC.acceptAllServices).not.toHaveBeenCalled()
    expect(consentState.showConsentToast).toBe(false)
  })

  // GROWTH-790 compliance guard: when the ruleset adds a new non-essential
  // service after the user's stored decisions were written, we must NOT
  // silently restore — the user has never seen this service and can't have
  // consented to it. Show the banner instead.
  it('decisions with uncovered non-essential service: shows banner, does not mutate SDK', () => {
    const UC = makeMockUC({
      services: [
        { id: 'tracking1', isEssential: false },
        { id: 'tracking_new', isEssential: false }, // in ruleset, not in decisions
      ],
    })

    applyPriorDecisionToSDK(
      UC as never,
      { initialLayer: 0 },
      { kind: 'decisions', decisions: [{ serviceId: 'tracking1', status: false }] }
    )

    expect(UC.updateServices).not.toHaveBeenCalled()
    expect(UC.acceptAllServices).not.toHaveBeenCalled()
    expect(consentState.showConsentToast).toBe(true)
  })

  // Essentials are SDK-forced-on regardless of user decision, so a new
  // essential service appearing since the stored decisions were written
  // should not trigger a re-prompt — the user has nothing meaningful to
  // decide about it.
  it('decisions covering only non-essentials: still restores (essentials ignored in coverage check)', () => {
    const UC = makeMockUC({
      services: [
        { id: 'essential_new', isEssential: true }, // not in decisions, but essential
        { id: 'tracking1', isEssential: false },
      ],
    })

    applyPriorDecisionToSDK(
      UC as never,
      { initialLayer: 0 },
      { kind: 'decisions', decisions: [{ serviceId: 'tracking1', status: false }] }
    )

    expect(UC.updateServices).toHaveBeenCalledOnce()
    expect(consentState.showConsentToast).toBe(false)
  })

  it('null prior decision: shows banner at default', () => {
    const UC = makeMockUC()
    applyPriorDecisionToSDK(UC as never, { initialLayer: 0 }, null)

    expect(UC.updateServices).not.toHaveBeenCalled()
    expect(UC.acceptAllServices).not.toHaveBeenCalled()
    expect(consentState.showConsentToast).toBe(true)
  })

  it('SDK not requesting first-layer banner: no restore attempted even if priorDecision exists', () => {
    const UC = makeMockUC({ areAllAccepted: true })
    applyPriorDecisionToSDK(UC as never, { initialLayer: 1 }, { kind: 'uniform-accept' })

    expect(UC.acceptAllServices).not.toHaveBeenCalled()
    expect(UC.updateServices).not.toHaveBeenCalled()
    expect(consentState.hasConsented).toBe(true)
    expect(consentState.showConsentToast).toBe(false)
  })

  it('SDK already considers user consented: passes through, no restore', () => {
    const UC = makeMockUC({ areAllAccepted: true })
    applyPriorDecisionToSDK(
      UC as never,
      { initialLayer: 0 },
      {
        kind: 'decisions',
        decisions: [{ serviceId: 'svc1', status: false }],
      }
    )

    expect(UC.updateServices).not.toHaveBeenCalled()
    expect(consentState.hasConsented).toBe(true)
  })
})

const cookieNames = () =>
  document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter(Boolean)
    .sort()

const clearCookies = () =>
  cookieNames().forEach((name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.supabase.com`
  })

describe('revokeTrackingConsent', () => {
  beforeEach(() => {
    clearCookies()
    vi.clearAllMocks()
  })

  it('clears GA, sGTM, Google Ads, and PostHog cookies and keeps the rest', () => {
    ;[
      '_ga',
      '_ga_XW18KGKGNR',
      '_ga_OTHER123',
      'FPID',
      'FPAU',
      'FPLC',
      '_dcid',
      '_gcl_au',
      '_gcl_aw',
      '_gac_UA-1',
      'FPGCLAW',
      'ph_phc_abc123_posthog',
      'session_id',
      '_sb_first_referrer',
      'unrelated',
    ].forEach((name) => {
      document.cookie = `${name}=1; path=/`
    })

    revokeTrackingConsent()

    expect(cookieNames()).toEqual(['_sb_first_referrer', 'unrelated'])
  })

  it('clears cookies set on the shared .supabase.com domain', () => {
    document.cookie = '_ga=1; path=/; domain=.supabase.com'
    document.cookie = 'ph_phc_abc123_posthog=1; path=/; domain=.supabase.com'

    revokeTrackingConsent()

    expect(cookieNames()).toEqual([])
  })

  it('removes PostHog persistence and stale consent copies from localStorage', () => {
    storage.set('ph_phc_abc123_posthog', '{}')
    storage.set('ucData', '{}')
    storage.set('ucString', 'x')
    storage.set('supabase-consent-ph', 'true')
    storage.set('uc_settings', '{}')
    storage.set('__ph_opt_in_out_phc_abc123', '0')

    revokeTrackingConsent()

    expect(Array.from(storage.keys()).sort()).toEqual(['__ph_opt_in_out_phc_abc123', 'uc_settings'])
  })

  it('opts PostHog out', () => {
    revokeTrackingConsent()
    expect(posthogClient.optOut).toHaveBeenCalledOnce()
  })

  it('asks the API to clear its HttpOnly telemetry cookies, surviving a reload', async () => {
    await revokeTrackingConsent()

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'https://api.supabase.com/platform/telemetry/reset',
      { method: 'POST', credentials: 'include', keepalive: true }
    )
  })

  it('logs a failed reset response and still resolves', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockImplementation(() => Promise.resolve(new Response(null, { status: 500 })))

    await expect(revokeTrackingConsent()).resolves.toBeUndefined()

    expect(consoleError).toHaveBeenCalledExactlyOnceWith('Telemetry reset failed with status 500')
    consoleError.mockRestore()
  })

  it('does not double the /platform suffix when the API URL already has it', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.supabase.com/platform/')

    await revokeTrackingConsent()

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.supabase.com/platform/telemetry/reset')
  })

  it('does not wait more than a second for a hanging reset', async () => {
    vi.useFakeTimers()
    try {
      fetchMock.mockImplementation(() => new Promise<Response>(() => {}))
      const settled = vi.fn()

      revokeTrackingConsent().then(settled)
      await vi.advanceTimersByTimeAsync(999)
      expect(settled).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
      expect(settled).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  it('resolves when the reset request fails', async () => {
    fetchMock.mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')))

    await expect(revokeTrackingConsent()).resolves.toBeUndefined()
  })

  it('skips the reset when no API URL is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '')

    await revokeTrackingConsent()

    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('consent withdrawal call sites', () => {
  const reload = vi.fn()
  const originalLocation = window.location

  const makeUC = (areAllAccepted: boolean) => ({
    acceptAllServices: vi.fn(() => Promise.resolve()),
    denyAllServices: vi.fn(() => Promise.resolve()),
    updateServices: vi.fn(() => Promise.resolve()),
    getCategoriesBaseInfo: vi.fn(() => []),
    areAllConsentsAccepted: vi.fn(() => areAllAccepted),
  })

  beforeEach(() => {
    clearCookies()
    vi.clearAllMocks()
    consentState.showConsentToast = false
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, reload },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })

  it('denyAll clears tracking cookies, opts PostHog out, and leaves the reload to the caller', async () => {
    const UC = makeUC(false)
    consentState.UC = UC as never
    consentState.hasConsented = true
    document.cookie = '_ga=1; path=/'
    document.cookie = 'session_id=abc; path=/'

    await expect(consentState.denyAll()).resolves.toBe(true)

    expect(cookieNames()).toEqual([])
    expect(posthogClient.optOut).toHaveBeenCalledOnce()
    expect(UC.denyAllServices).toHaveBeenCalledOnce()
    expect(reload).not.toHaveBeenCalled()
  })

  it('denyAll with reload revokes and reloads after saving an opt-out (consent toast)', async () => {
    const UC = makeUC(false)
    consentState.UC = UC as never
    consentState.hasConsented = true
    document.cookie = '_ga=1; path=/'

    await expect(consentState.denyAll({ reload: true })).resolves.toBe(true)

    expect(cookieNames()).toEqual([])
    expect(posthogClient.optOut).toHaveBeenCalledOnce()
    expect(reload).toHaveBeenCalledOnce()
  })

  it('denyAll with reload waits for the server reset before reloading', async () => {
    const UC = makeUC(false)
    consentState.UC = UC as never
    consentState.hasConsented = true
    let resolveReset!: (response: Response) => void
    fetchMock.mockImplementation(() => new Promise<Response>((resolve) => (resolveReset = resolve)))

    const result = consentState.denyAll({ reload: true })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(reload).not.toHaveBeenCalled()

    resolveReset(new Response())
    await expect(result).resolves.toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('updateServices resets the server cookies on opt-out', async () => {
    const UC = makeUC(false)
    consentState.UC = UC as never
    consentState.hasConsented = true

    consentState.updateServices([{ serviceId: 'ga', status: false }])
    await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce())

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'https://api.supabase.com/platform/telemetry/reset',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    )
  })

  it('denyAll with reload does not reload when tracking was already off', async () => {
    const UC = makeUC(false)
    consentState.UC = UC as never
    consentState.hasConsented = false

    await expect(consentState.denyAll({ reload: true })).resolves.toBe(true)

    expect(posthogClient.optOut).toHaveBeenCalledOnce()
    expect(reload).not.toHaveBeenCalled()
  })

  it('denyAll keeps tracking state and reports failure when saving fails', async () => {
    const UC = makeUC(false)
    UC.denyAllServices.mockImplementation(() => Promise.reject(new Error('network')))
    consentState.UC = UC as never
    consentState.hasConsented = true
    document.cookie = '_ga=1; path=/'

    await expect(consentState.denyAll()).resolves.toBe(false)

    expect(cookieNames()).toEqual(['_ga'])
    expect(posthogClient.optOut).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('updateServices revokes and reloads after saving an opt-out', async () => {
    const UC = makeUC(false)
    consentState.UC = UC as never
    consentState.hasConsented = true
    document.cookie = '_ga_XW18KGKGNR=1; path=/'

    consentState.updateServices([{ serviceId: 'ga', status: false }])
    expect(reload).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce())

    expect(consentState.hasConsented).toBe(false)
    expect(cookieNames()).toEqual([])
    expect(posthogClient.optOut).toHaveBeenCalledOnce()
  })

  it('updateServices revokes without reloading when tracking was already off', async () => {
    const UC = makeUC(false)
    consentState.UC = UC as never
    consentState.hasConsented = false

    consentState.updateServices([{ serviceId: 'ga', status: false }])
    await vi.waitFor(() => expect(posthogClient.optOut).toHaveBeenCalledOnce())

    expect(reload).not.toHaveBeenCalled()
  })

  it('updateServices opts PostHog back in when every service is accepted', async () => {
    const UC = makeUC(true)
    consentState.UC = UC as never
    consentState.hasConsented = false

    consentState.updateServices([{ serviceId: 'ga', status: true }])
    await vi.waitFor(() => expect(posthogClient.optIn).toHaveBeenCalledOnce())

    expect(posthogClient.optOut).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  it('acceptAll opts PostHog back in once the decision is saved', async () => {
    const UC = makeUC(true)
    consentState.UC = UC as never
    consentState.hasConsented = false

    consentState.acceptAll()
    await vi.waitFor(() => expect(posthogClient.optIn).toHaveBeenCalledOnce())

    expect(posthogClient.optOut).not.toHaveBeenCalled()
  })

  it('acceptAll does not opt PostHog back in when saving fails', async () => {
    const UC = makeUC(true)
    UC.acceptAllServices.mockImplementation(() => Promise.reject(new Error('network')))
    consentState.UC = UC as never
    consentState.hasConsented = false

    consentState.acceptAll()
    await vi.waitFor(() => expect(consentState.showConsentToast).toBe(true))

    expect(consentState.hasConsented).toBe(false)
    expect(posthogClient.optIn).not.toHaveBeenCalled()
  })

  it('acceptAll keeps consent off until the decision is saved', async () => {
    const UC = makeUC(true)
    const saved = Promise.withResolvers<void>()
    UC.acceptAllServices.mockReturnValueOnce(saved.promise)
    consentState.UC = UC as never
    consentState.hasConsented = false

    consentState.acceptAll()

    expect(consentState.showConsentToast).toBe(false)
    expect(consentState.hasConsented).toBe(false)

    saved.resolve()
    await vi.waitFor(() => expect(consentState.hasConsented).toBe(true))
  })

  it('updateServices leaves consent untouched when saving fails', async () => {
    const UC = makeUC(false)
    UC.updateServices.mockImplementation(() => Promise.reject(new Error('network')))
    consentState.UC = UC as never
    consentState.hasConsented = true

    consentState.updateServices([{ serviceId: 'ga', status: false }])
    await vi.waitFor(() => expect(consentState.showConsentToast).toBe(true))

    expect(posthogClient.optOut).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })
})
