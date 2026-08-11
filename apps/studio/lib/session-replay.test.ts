import { buildSessionRecordingConfig, type CapturedNetworkRequest } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { maskReplayNetworkRequest, maskReplayText, SESSION_REPLAY_CONFIG } from './session-replay'

const elementWith = (attributes: Record<string, string>) => {
  const element = document.createElement('span')
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
  return element
}

const networkRequest = (name: string): CapturedNetworkRequest => ({
  name,
  entryType: 'resource',
  startTime: 0,
  duration: 0,
})

describe('maskReplayText', () => {
  it('masks text by default', () => {
    expect(maskReplayText('postgresql://postgres:hunter2@db.abc.supabase.co:5432')).toBe(
      '*'.repeat('postgresql://postgres:hunter2@db.abc.supabase.co:5432'.length)
    )
  })

  it('masks text when no element is given', () => {
    expect(maskReplayText('secret', undefined)).toBe('******')
  })

  it('masks based on trimmed length so whitespace is not leaked', () => {
    expect(maskReplayText('  abc  ')).toBe('***')
  })

  it('captures text opted in with data-ph-capture', () => {
    const element = elementWith({ 'data-ph-capture': 'true' })
    expect(maskReplayText('Table editor', element)).toBe('Table editor')
  })

  it('masks text when data-ph-capture is not exactly "true"', () => {
    expect(maskReplayText('secret', elementWith({ 'data-ph-capture': 'false' }))).toBe('******')
    expect(maskReplayText('secret', elementWith({ 'data-ph-capture': '' }))).toBe('******')
    expect(maskReplayText('secret', elementWith({ 'data-ph-capture': 'TRUE' }))).toBe('******')
  })

  it('masks text on elements carrying unrelated data attributes', () => {
    expect(maskReplayText('secret', elementWith({ 'data-capture': 'true' }))).toBe('******')
  })
})

describe('maskReplayNetworkRequest', () => {
  it('strips query strings', () => {
    expect(
      maskReplayNetworkRequest(networkRequest('https://api.supabase.com/v1/x?token=abc')).name
    ).toBe('https://api.supabase.com/v1/x')
  })

  it('strips fragments, which carry GoTrue access tokens on auth callbacks', () => {
    expect(
      maskReplayNetworkRequest(networkRequest('https://supabase.com/dashboard#access_token=abc'))
        .name
    ).toBe('https://supabase.com/dashboard')
  })

  it('strips from the first separator when both are present', () => {
    expect(maskReplayNetworkRequest(networkRequest('https://x.com/a?b=1#c=2')).name).toBe(
      'https://x.com/a'
    )
    expect(maskReplayNetworkRequest(networkRequest('https://x.com/a#c=2?b=1')).name).toBe(
      'https://x.com/a'
    )
  })

  it('leaves URLs without a query string or fragment alone', () => {
    expect(maskReplayNetworkRequest(networkRequest('https://x.com/project/abc/editor')).name).toBe(
      'https://x.com/project/abc/editor'
    )
  })

  it('returns the request rather than dropping it, so timings are still captured', () => {
    const request = networkRequest('https://x.com/a?b=1')
    expect(maskReplayNetworkRequest(request)).toBe(request)
  })
})

describe('SESSION_REPLAY_CONFIG', () => {
  it('masks all text and inputs', () => {
    expect(SESSION_REPLAY_CONFIG.maskTextSelector).toBe('*')
    expect(SESSION_REPLAY_CONFIG.maskAllInputs).toBe(true)
    expect(SESSION_REPLAY_CONFIG.maskTextFn).toBe(maskReplayText)
  })

  it('never records request or response payloads', () => {
    expect(SESSION_REPLAY_CONFIG.recordHeaders).toBe(false)
    expect(SESSION_REPLAY_CONFIG.recordBody).toBe(false)
  })

  it('never records canvas, which text masking cannot reach', () => {
    expect(SESSION_REPLAY_CONFIG.captureCanvas).toEqual({ recordCanvas: false })
  })

  it('strips sensitive URL parts via maskReplayNetworkRequest', () => {
    expect(SESSION_REPLAY_CONFIG.maskCapturedNetworkRequestFn).toBe(maskReplayNetworkRequest)
  })
})

describe('buildSessionRecordingConfig', () => {
  it('disables recording when given no policy', () => {
    const config = buildSessionRecordingConfig()

    expect(config.disable_session_recording).toBe(true)
    expect(config).not.toHaveProperty('session_recording')
  })

  it('disables recording when the policy is undefined', () => {
    const config = buildSessionRecordingConfig(undefined)

    expect(config.disable_session_recording).toBe(true)
    expect(config).not.toHaveProperty('session_recording')
  })

  it('enables recording and forwards the policy when given one', () => {
    const config = buildSessionRecordingConfig(SESSION_REPLAY_CONFIG)

    expect(config.disable_session_recording).toBe(false)
    expect(config.session_recording).toBe(SESSION_REPLAY_CONFIG)
  })

  it.each([undefined, SESSION_REPLAY_CONFIG])(
    'never records console logs, which masking cannot reach (%#)',
    (sessionReplay) => {
      expect(buildSessionRecordingConfig(sessionReplay).enable_recording_console_log).toBe(false)
    }
  )
})

describe('IS_SESSION_REPLAY_ENABLED', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is true only for the exact string "true"', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_SESSION_REPLAY', 'true')
    const { IS_SESSION_REPLAY_ENABLED } = await import('./session-replay')
    expect(IS_SESSION_REPLAY_ENABLED).toBe(true)
  })

  it.each(['false', '', 'TRUE', '1'])('is false for %o', async (value) => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_SESSION_REPLAY', value)
    const { IS_SESSION_REPLAY_ENABLED } = await import('./session-replay')
    expect(IS_SESSION_REPLAY_ENABLED).toBe(false)
  })

  it('is false when unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_SESSION_REPLAY', undefined)
    const { IS_SESSION_REPLAY_ENABLED } = await import('./session-replay')
    expect(IS_SESSION_REPLAY_ENABLED).toBe(false)
  })
})
