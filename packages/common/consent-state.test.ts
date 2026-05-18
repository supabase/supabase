// @vitest-environment jsdom
import type { UserDecision } from '@usercentrics/cmp-browser-sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { applyPriorDecisionToSDK, consentState, detectPriorConsent } from './consent-state'

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
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  storage.clear()
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
