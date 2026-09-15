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
    expect(maskReplayAttribute(name, value)).toBe('*')
  })

  it.each(['href', 'src', 'srcset', 'action', 'poster', 'formaction', 'data-href'])(
    'masks %o, since project and storage paths ride in URLs',
    (name) => {
      const url = 'https://abc.supabase.co/storage/v1/object/invoices/q4.pdf'
      expect(maskReplayAttribute(name, url, elementWith({}))).toBe('*')
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
    expect(maskReplayAttribute('data-some-future-attribute', 'acme')).toBe('*')
    expect(maskReplayAttribute('tooltip', 'acme')).toBe('*')
  })

  it('matches attribute names case-insensitively', () => {
    expect(maskReplayAttribute('CLASS', 'flex')).toBe('flex')
    expect(maskReplayAttribute('ARIA-LABEL', 'acme')).toBe('*')
  })

  it('keeps stylesheet URLs, which replay needs for sheets rrweb could not inline', () => {
    const href = 'https://supabase.com/dashboard/_next/static/css/main.css'
    const link = document.createElement('link')
    link.setAttribute('rel', 'stylesheet')
    expect(maskReplayAttribute('href', href, link)).toBe(href)
  })

  it.each(['preload', 'icon', 'preconnect', ''])(
    'masks a <link rel=%o> href, which is not a stylesheet',
    (rel) => {
      const link = document.createElement('link')
      link.setAttribute('rel', rel)
      expect(
        maskReplayAttribute('href', 'https://x.test/customer-avatar.png?token=secret', link)
      ).toBe('*')
    }
  )

  it('masks a <link> href with no rel at all', () => {
    const link = document.createElement('link')
    expect(maskReplayAttribute('href', 'https://x.test/a.png?token=secret', link)).toBe('*')
  })

  it('keeps a stylesheet href in an XHTML document, where tagName is lowercased', () => {
    const xhtml = document.implementation.createDocument(
      'http://www.w3.org/1999/xhtml',
      'html',
      null
    )
    const link = xhtml.createElementNS('http://www.w3.org/1999/xhtml', 'link')
    link.setAttribute('rel', 'stylesheet')
    expect(link.tagName).toBe('link')
    expect(maskReplayAttribute('href', '/app.css', link)).toBe('/app.css')
  })

  it('masks anchor URLs even though stylesheet URLs are kept', () => {
    const href = 'https://supabase.com/dashboard/project/abcdefghijklmnop/editor'
    const anchor = document.createElement('a')
    expect(maskReplayAttribute('href', href, anchor)).toBe('*')
  })

  it('masks when no element is given', () => {
    const href = 'https://supabase.com/dashboard/project/abc'
    expect(maskReplayAttribute('href', href, undefined)).toBe('*')
  })

  it('masks HTML ids, which Studio binds to storage bucket names', () => {
    expect(maskReplayAttribute('id', 'customer-invoices', elementWith({}))).toBe('*')
    expect(maskReplayAttribute('for', 'customer-invoices')).toBe('*')
  })

  it('keeps SVG ids, which fill="url(#id)" references for gradients and clip paths', () => {
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
    expect(maskReplayAttribute('id', 'recharts-gradient-1', gradient)).toBe('recharts-gradient-1')
  })

  it('masks the interpolated placeholders found in Studio', () => {
    const storageSearch = 'Search in customer-invoices...'
    expect(maskReplayAttribute('placeholder', storageSearch)).toBe('*')

    const authCallback = 'https://abcdefghijklmnop.supabase.co/auth/v1/callback'
    expect(maskReplayAttribute('placeholder', authCallback)).toBe('*')
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

  it('leaves url() inside inlined stylesheets alone, which are our own CSS', () => {
    const sheet = '.a{background:url("https://x.com/a.png")}'
    expect(maskReplayAttribute('_cssText', sheet)).toBe(sheet)
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

  it('masks to a constant, so value length is not leaked', () => {
    expect(maskReplayAttribute('title', 'ab')).toBe('*')
    expect(maskReplayAttribute('title', 'abcdefgh')).toBe('*')
    expect(maskReplayAttribute('title', 'a'.repeat(500))).toBe('*')
  })

  it('masks a url() target whose name contains an escaped quote', () => {
    expect(maskReplayCssUrls('background: url("invoices/(acme) \\"q4\\".pdf")')).toBe(
      'background: url(*)'
    )
  })

  it('masks an unquoted url() target containing an escaped bracket', () => {
    expect(maskReplayCssUrls('background: url(invoices/q4\\)secret.pdf)')).toBe(
      'background: url(*)'
    )
  })

  it('masks an unterminated url() token rather than letting it through', () => {
    expect(maskReplayCssUrls('background: url(trailing\\')).not.toContain('trailing')
    expect(maskReplayCssUrls('background: url(secret\\)')).not.toContain('secret')
  })

  it.each([
    'background: URL("https://x.test/secret.png")',
    'background: Url(https://x.test/secret.png)',
  ])('masks url() regardless of case in %o', (css) => {
    expect(maskReplayCssUrls(css)).toContain('url(*)')
    expect(maskReplayCssUrls(css)).not.toContain('secret')
  })

  it.each([
    ['fill', 'URL(https://x.test/secret.svg#paint)'],
    ['clip-path', 'Url(https://x.test/secret.svg#c)'],
  ])('masks an uppercase URL() in SVG reference %o', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe('*')
  })

  it.each([
    ['fill', 'URL(#colorUv)'],
    ['clip-path', 'Url(#clipPath-1)'],
  ])('keeps an uppercase fragment-only URL() in %o', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it('keeps a fragment-only url(), which names a node in the recording', () => {
    expect(maskReplayAttribute('style', 'clip-path: url(#clip-1)')).toBe('clip-path: url(#clip-1)')
    expect(maskReplayCssUrls('mask: url("#m")')).toBe('mask: url("#m")')
  })

  it('masks an external url() even when a fragment is appended', () => {
    expect(maskReplayCssUrls('fill: url(https://x.test/customer.svg#paint)')).toBe('fill: url(*)')
  })

  it.each([
    ['fill', 'url(https://x.test/customer-secret.svg#paint)'],
    ['stroke', 'url("https://x.test/secret.svg#s")'],
    ['clip-path', 'url(https://x.test/secret.svg#c)'],
    ['mask', 'url(https://x.test/secret.svg#m)'],
    ['filter', 'url(https://x.test/secret.svg#f)'],
    ['marker-end', 'url(https://x.test/secret.svg#a)'],
  ])('masks SVG reference %o pointing at an external URL', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe('*')
  })

  it.each([
    ['fill', '#24b47e'],
    ['fill', 'none'],
    ['stroke', 'currentColor'],
  ])('keeps plain SVG presentation value %o %o', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it.each(['dark', 'light', 'classic-dark', 'system'])(
    'keeps data-theme=%o, which monaco.css and grid.css select on',
    (theme) => {
      expect(maskReplayAttribute('data-theme', theme)).toBe(theme)
    }
  )

  it('masks a data-theme value outside the known themes', () => {
    expect(maskReplayAttribute('data-theme', 'acme-production')).toBe('*')
  })

  it.each([
    ['data-collapsible', 'icon'],
    ['data-variant', 'destructive'],
    ['data-sidebar', 'menu-button'],
    ['data-active', 'true'],
    ['data-size', 'sm'],
    ['data-selected', 'true'],
    ['data-expanded', 'false'],
    ['data-motion', 'from-start'],
    ['data-invalid', 'true'],
    ['data-front', 'true'],
    ['data-invisible', 'true'],
    ['data-separator', 'active'],
    ['data-vaul-drawer-direction', 'right'],
    ['aria-invalid', 'true'],
    ['aria-pressed', 'false'],
  ])('keeps %o, which a Tailwind variant in packages/ui selects on', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it.each([
    ['rows', '8'],
    ['cols', '40'],
  ])('keeps textarea %o, since masking it collapses the box in replay', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it('masks data-value, which cmdk fills with the item value', () => {
    expect(maskReplayAttribute('data-value', 'customer_email')).toBe('*')
  })

  it('keeps data-chart, which the chart stylesheet selector has to match', () => {
    expect(maskReplayAttribute('data-chart', 'chart-r1a')).toBe('chart-r1a')
  })

  it.each([
    ['data-index', '0'],
    ['data-band', '3'],
  ])('keeps %o, which a shipped stylesheet selects on by value', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it.each([
    ['data-sonner-toast', ''],
    ['data-mounted', 'true'],
    ['data-visible', 'false'],
    ['data-x-position', 'right'],
    ['data-y-position', 'bottom'],
    ['data-type', 'error'],
    ['data-styled', 'true'],
    ['data-removed', 'false'],
  ])('keeps sonner marker %o, without which every toast is invisible in replay', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it.each([
    ['data-vaul-overlay', ''],
    ['data-vaul-snap-points', 'false'],
    ['data-vaul-drawer', ''],
  ])('keeps vaul marker %o', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it.each([
    ['data-radix-portal', ''],
    ['data-radix-popper-content-wrapper', ''],
    ['data-footnote-ref', ''],
  ])('keeps %o, which Studio stylesheets and Radix positioning select on', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it.each([
    ['text-anchor', 'middle'],
    ['dominant-baseline', 'central'],
    ['dy', '0.71em'],
    ['dx', '-4'],
    ['gradientUnits', 'userSpaceOnUse'],
    ['gradientTransform', 'translate(263 73.5) rotate(-143.669)'],
    // Names as they appear in the DOM, which is what rrweb reads. `maskUnits` and
    // `gradientUnits` are camelCase in the SVG spec; `shape-rendering` is hyphenated,
    // and React's `shapeRendering` prop sets that name.
    ['maskUnits', 'userSpaceOnUse'],
    ['shape-rendering', 'geometricPrecision'],
  ])('keeps SVG placement attribute %o, so geometry stays put', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it('masks the React prop spelling, since rrweb never sees it', () => {
    // A guard against allowlisting a camelCase prop name that no DOM attribute matches.
    expect(maskReplayAttribute('shapeRendering', 'geometricPrecision')).toBe('*')
  })

  it.each([
    ['patternUnits', 'userSpaceOnUse'],
    ['patternTransform', 'translate(-8,-8)'],
    ['markerUnits', 'strokeWidth'],
    ['orient', 'auto-start-reverse'],
    ['refX', '5'],
    ['font-size', '10'],
  ])('keeps %o, which a rendering library emits and depends on', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it.each([
    ['draggable', 'true'],
    ['align', 'right'],
    ['data-field', 'instance-details'],
  ])('keeps %o, selected on by value in Studio stylesheets', (name, value) => {
    expect(maskReplayAttribute(name, value)).toBe(value)
  })

  it('keeps stroke-dashoffset, which draws the fill level of a usage ring', () => {
    // Masked it is invalid, so the browser falls back to 0 and the ring replays full.
    expect(maskReplayAttribute('stroke-dashoffset', 'calc(75.39822 - 18.8)')).toBe(
      'calc(75.39822 - 18.8)'
    )
    expect(maskReplayAttribute('stroke-dasharray', '75.39822')).toBe('75.39822')
  })

  it('passes _cssText through, since it carries our own inlined stylesheets', () => {
    const fontFace = "@font-face{src:url('../fonts/inter/InterVariable.woff2') format('woff2')}"
    expect(maskReplayAttribute('_cssText', fontFace)).toBe(fontFace)

    const checkbox =
      '.rdg-cell [type=checkbox]:checked{background-image:url("data:image/svg+xml,%3Csvg%3E")}'
    expect(maskReplayAttribute('_cssText', checkbox)).toBe(checkbox)
  })

  it('still masks url() in an inline style attribute', () => {
    expect(maskReplayAttribute('style', 'background-image: url("https://x.test/secret.png")')).toBe(
      'background-image: url(*)'
    )
  })

  it('keeps the SVG namespace exemption to id only', () => {
    const svgAnchor = document.createElementNS('http://www.w3.org/2000/svg', 'a')
    expect(maskReplayAttribute('href', 'https://x.test/secret', svgAnchor)).toBe('*')
    const svgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image')
    expect(maskReplayAttribute('href', 'https://x.test/secret.png', svgImage)).toBe('*')
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
