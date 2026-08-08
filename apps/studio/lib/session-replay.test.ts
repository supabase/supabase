import { buildSessionRecordingConfig, type CapturedNetworkRequest } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  maskReplayAttribute,
  maskReplayCssUrls,
  maskReplayNetworkRequest,
  maskReplayText,
  SESSION_REPLAY_CONFIG,
} from './session-replay'

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

describe('maskReplayAttribute', () => {
  it.each([
    ['placeholder', 'Search in customer-invoices...'],
    ['title', 'acme-production'],
    ['aria-label', 'Delete project acme'],
    ['aria-describedby-text', 'acme'],
    ['alt', 'Avatar for jane@acme.com'],
    ['value', 'postgresql://postgres:hunter2@db.abc.supabase.co:5432'],
    ['label', 'acme-production'],
    ['name', 'acme'],
    ['data-project-ref', 'abcdefghijklmnop'],
    ['data-testid', 'project-acme'],
  ])('masks %o, which can carry interpolated customer data', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe('*'.repeat(value.length))
  })

  it.each(['href', 'src', 'srcset', 'action', 'poster', 'formaction', 'data-href'])(
    'masks %o, since project and storage paths ride in URLs',
    (name) => {
      const url = 'https://abc.supabase.co/storage/v1/object/invoices/q4.pdf'
      expect(maskReplayAttribute(name, url, elementWith({}))).toBe('*'.repeat(url.length))
    }
  )

  it.each([
    ['class', 'flex items-center gap-2 text-foreground-light'],
    ['type', 'checkbox'],
    ['colspan', '3'],
    ['dir', 'ltr'],
    ['role', 'menuitem'],
    ['tabindex', '-1'],
    ['aria-hidden', 'true'],
    ['aria-expanded', 'false'],
    ['data-state', 'open'],
    ['data-orientation', 'vertical'],
  ])('leaves %o alone, since replay needs it to render', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it.each([
    ['d', 'M4 6h16M4 12h16M4 18h16'],
    ['viewBox', '0 0 24 24'],
    ['stroke-width', '2'],
    ['fill', 'none'],
    ['xmlns', 'http://www.w3.org/2000/svg'],
  ])('leaves SVG geometry attribute %o alone, so icons still render', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it.each([
    ['fill', 'url(#colorUv)'],
    ['clip-path', 'url(#clipPath-recharts-1)'],
    ['mask', 'url(#mask-1)'],
    ['filter', 'url(#shadow-1)'],
    ['marker-end', 'url(#arrow)'],
  ])('leaves SVG reference %o intact, since masking it drops the effect', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it.each([
    ['rr_width', '1280'],
    ['rr_scrollTop', '240'],
    ['rr_open_mode', 'closed'],
    ['_cssText', '.a{color:red}'],
  ])(
    'leaves rrweb-generated attribute %o alone, which posthog-js does not exempt for callbacks',
    (name, value) => {
      expect(maskReplayAttribute(name, value)).toBe(value)
    }
  )

  it('masks attributes it has never seen, so a new leak is masked rather than recorded', () => {
    expect(maskReplayAttribute('data-some-future-attribute', 'acme')).toBe('****')
    expect(maskReplayAttribute('tooltip', 'acme')).toBe('****')
  })

  it('matches attribute names case-insensitively', () => {
    expect(maskReplayAttribute('CLASS', 'flex')).toBe('flex')
    expect(maskReplayAttribute('ARIA-LABEL', 'acme')).toBe('****')
  })

  it('keeps stylesheet URLs, which replay needs for sheets rrweb could not inline', () => {
    const href = 'https://supabase.com/dashboard/_next/static/css/main.css'
    const link = document.createElement('link')
    expect(maskReplayAttribute('href', href, link)).toBe(href)
  })

  it('masks anchor URLs even though stylesheet URLs are kept', () => {
    const href = 'https://supabase.com/dashboard/project/abcdefghijklmnop/editor'
    const anchor = document.createElement('a')
    expect(maskReplayAttribute('href', href, anchor)).toBe('*'.repeat(href.length))
  })

  it('masks when no element is given', () => {
    const href = 'https://supabase.com/dashboard/project/abc'
    expect(maskReplayAttribute('href', href, undefined)).toBe('*'.repeat(href.length))
  })

  it('masks HTML ids, which Studio binds to storage bucket names', () => {
    expect(maskReplayAttribute('id', 'customer-invoices', elementWith({}))).toBe(
      '*'.repeat('customer-invoices'.length)
    )
    expect(maskReplayAttribute('for', 'customer-invoices')).toBe(
      '*'.repeat('customer-invoices'.length)
    )
  })

  it('keeps SVG ids, which fill="url(#id)" references for gradients and clip paths', () => {
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
    expect(maskReplayAttribute('id', 'recharts-gradient-1', gradient)).toBe('recharts-gradient-1')
  })

  it('masks the interpolated placeholders found in Studio', () => {
    const storageSearch = 'Search in customer-invoices...'
    expect(maskReplayAttribute('placeholder', storageSearch)).toBe('*'.repeat(storageSearch.length))

    const authCallback = 'https://abcdefghijklmnop.supabase.co/auth/v1/callback'
    expect(maskReplayAttribute('placeholder', authCallback)).toBe('*'.repeat(authCallback.length))
  })

  it('keeps CSS that carries no url()', () => {
    expect(maskReplayAttribute('style', 'transform: translateX(4px)')).toBe(
      'transform: translateX(4px)'
    )
  })

  it.each([
    'background-image: url("data:image/png;base64,iVBORw0KGgoAAAA")',
    "background-image: url('https://abc.supabase.co/storage/v1/object/sign/invoices/q4.pdf')",
    'background-image: url(https://abc.supabase.co/avatars/jane.png)',
  ])('masks the url() target in %o', (css) => {
    const masked = maskReplayAttribute('style', css)
    expect(masked).toBe('background-image: url(*)')
  })

  it('masks url() inside inlined stylesheets, which are a separate attribute', () => {
    expect(maskReplayAttribute('_cssText', '.a{background:url("https://x.com/a.png")}')).toBe(
      '.a{background:url(*)}'
    )
  })

  it('keeps the surrounding declaration when masking a url()', () => {
    expect(
      maskReplayAttribute('style', 'background: url("https://x.com/a.png") no-repeat center')
    ).toBe('background: url(*) no-repeat center')
  })

  it('masks every url() in a value, not just the first', () => {
    expect(maskReplayCssUrls('a{background:url(x.png)}b{background:url(y.png)}')).toBe(
      'a{background:url(*)}b{background:url(*)}'
    )
  })

  it('masks a url() target containing a bracket, legal in a storage object name', () => {
    expect(maskReplayCssUrls('background: url("invoices/q4 (final).pdf")')).toBe(
      'background: url(*)'
    )
  })

  it('leaves gradients alone, since they carry no URL', () => {
    const gradient = 'background: linear-gradient(to right, #fff 0%, #000 100%)'
    expect(maskReplayCssUrls(gradient)).toBe(gradient)
  })

  it('masks to the same length so value shape is not leaked', () => {
    expect(maskReplayAttribute('title', 'ab')).toBe('**')
    expect(maskReplayAttribute('title', 'abcdefgh')).toBe('********')
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

  it('masks attributes, which maskTextFn cannot reach', () => {
    expect(SESSION_REPLAY_CONFIG.maskAttributeFn).toBe(maskReplayAttribute)
  })

  it('pins maskAllElementAttributes off, since true would discard maskAttributeFn', () => {
    expect(SESSION_REPLAY_CONFIG.maskAllElementAttributes).toBe(false)
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
