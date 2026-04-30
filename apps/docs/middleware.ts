import { clientSdkIds } from '~/content/navigation.references'
import { BASE_PATH } from '~/lib/constants'
import { isbot } from 'isbot'
import { NextResponse, type NextRequest } from 'next/server'

const REFERENCE_PATH = `${BASE_PATH ?? ''}/reference`
const GUIDES_PATH = `${BASE_PATH ?? ''}/guides`

// Live-fetch agents only. Training crawlers are governed by robots.txt;
// serving them different content from human HTML risks SEO/cloaking penalties.
// Duplicated from apps/www/middleware.ts; keep in sync.
const LLM_USER_AGENT = /\bClaude-User\b|\bClaude-Web\b|\bChatGPT-User\b|\bPerplexityBot\b/i

// RFC 9110 §5.3.2 media ranges, most to least specific.
const RANGES = ['text/markdown', 'text/html', 'text/*', '*/*'] as const
type Range = (typeof RANGES)[number]

const Q_PARAM = /^\s*q\s*=\s*([\d.]+)\s*$/i

function isRange(s: string): s is Range {
  return (RANGES as readonly string[]).includes(s)
}

function parseQ(params: string[]): number {
  for (const p of params) {
    const q = parseFloat(p.match(Q_PARAM)?.[1] ?? '')
    if (Number.isFinite(q) && q >= 0 && q <= 1) return q
  }
  return 1
}

// markdownExplicit: bare `*/*` clients aren't expressing a markdown preference.
function parseAccept(header: string) {
  const seen = new Map<Range, number>()

  for (const entry of header.toLowerCase().split(',')) {
    const [rawType, ...params] = entry.trim().split(';')
    const range = rawType.trim()
    if (!isRange(range)) continue
    seen.set(range, Math.max(seen.get(range) ?? -1, parseQ(params)))
  }

  return {
    html: seen.get('text/html') ?? seen.get('text/*') ?? seen.get('*/*') ?? 0,
    markdown: seen.get('text/markdown') ?? seen.get('text/*') ?? seen.get('*/*') ?? 0,
    markdownExplicit: seen.has('text/markdown') || seen.has('text/*'),
  }
}

function shouldServeMarkdown(accept: ReturnType<typeof parseAccept>): boolean {
  if (accept.markdown === 0) return false
  if (accept.markdown > accept.html) return true
  return accept.markdown === accept.html && accept.markdownExplicit
}

export function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const { pathname } = url

  if (pathname.startsWith(GUIDES_PATH + '/')) {
    const isMdSuffix = pathname.endsWith('.md')
    const slug = pathname.replace(`${GUIDES_PATH}/`, '').replace(/\.md$/, '')
    const acceptHeader = request.headers.get('accept') ?? ''
    // Cap UA length to bound regex CPU on the edge hot path.
    const userAgent = (request.headers.get('user-agent') ?? '').slice(0, 512)
    const isLlmAgent = LLM_USER_AGENT.test(userAgent)
    const accept = acceptHeader ? parseAccept(acceptHeader) : null

    if (
      !isLlmAgent &&
      !isMdSuffix &&
      accept !== null &&
      accept.markdown === 0 &&
      accept.html === 0
    ) {
      return new NextResponse('Not Acceptable', {
        status: 406,
        headers: { 'Cache-Control': 'no-store', Vary: 'Accept' },
      })
    }

    const wantsMarkdown =
      isMdSuffix || isLlmAgent || (accept !== null && shouldServeMarkdown(accept))

    if (wantsMarkdown) {
      const rewriteUrl = new URL(url)
      rewriteUrl.pathname = `${BASE_PATH ?? ''}/api/guides-md/${slug}`
      return NextResponse.rewrite(rewriteUrl)
    }
  }

  if (!pathname.startsWith(REFERENCE_PATH)) {
    return NextResponse.next()
  }

  if (isbot(request.headers.get('user-agent'))) {
    let [, lib, maybeVersion, ...slug] = pathname.replace(REFERENCE_PATH, '').split('/')

    if (clientSdkIds.includes(lib)) {
      const version = /v\d+/.test(maybeVersion) ? maybeVersion : undefined
      if (!version) {
        slug = [maybeVersion, ...slug]
      }

      if (slug.length > 0) {
        const rewriteUrl = new URL(url)
        rewriteUrl.pathname = (BASE_PATH ?? '') + '/api/crawlers'
        return NextResponse.rewrite(rewriteUrl)
      }
    }
  }

  const [, lib, maybeVersion] = pathname.replace(REFERENCE_PATH, '').split('/')

  if (lib === 'cli') {
    const rewritePath = [REFERENCE_PATH, 'cli'].join('/')
    return NextResponse.rewrite(new URL(rewritePath, request.url))
  }

  if (lib === 'api') {
    const rewritePath = [REFERENCE_PATH, 'api'].join('/')
    return NextResponse.rewrite(new URL(rewritePath, request.url))
  }

  if (lib?.startsWith('self-hosting-')) {
    const rewritePath = [REFERENCE_PATH, lib].join('/')
    return NextResponse.rewrite(new URL(rewritePath, request.url))
  }

  if (clientSdkIds.includes(lib)) {
    const version = /v\d+/.test(maybeVersion) ? maybeVersion : null
    const rewritePath = [REFERENCE_PATH, lib, version].filter(Boolean).join('/')
    return NextResponse.rewrite(new URL(rewritePath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/reference/:path*', '/guides/:path*'],
}
