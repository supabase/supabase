import { clientSdkIds } from '~/content/navigation.references'
import { BASE_PATH } from '~/lib/constants'
import { MARKDOWN_SLUGS } from '~/lib/markdown-manifest'
import { negotiateMarkdown } from 'common/markdown-negotiation'
import { isbot } from 'isbot'
import { NextResponse, type NextRequest } from 'next/server'

const REFERENCE_PATH = `${BASE_PATH ?? ''}/reference`
const GUIDES_PATH = `${BASE_PATH ?? ''}/guides`
const GUIDES_MARKDOWN_SLUGS = new Set(MARKDOWN_SLUGS)

export function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const { pathname } = url

  if (pathname.startsWith(GUIDES_PATH + '/')) {
    const isMdSuffix = pathname.endsWith('.md')
    const slug = pathname.replace(`${GUIDES_PATH}/`, '').replace(/\.md$/, '')
    const decision = negotiateMarkdown(
      {
        acceptHeader: request.headers.get('accept') ?? '',
        userAgent: request.headers.get('user-agent') ?? '',
      },
      { hasMarkdownVariant: GUIDES_MARKDOWN_SLUGS.has(slug), isMarkdownSuffix: isMdSuffix }
    )

    if (decision === 'not-acceptable') {
      return new NextResponse('Not Acceptable', {
        status: 406,
        headers: { 'Cache-Control': 'no-store', Vary: 'Accept' },
      })
    }

    if (decision === 'markdown') {
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
