import { clientSdkIds } from '~/content/navigation.references'
import { BASE_PATH } from '~/lib/constants'
import { isbot } from 'isbot'
import { NextResponse, type NextRequest } from 'next/server'

const REFERENCE_PATH = `${BASE_PATH ?? ''}/reference`

const GUIDES_PATH = `${BASE_PATH ?? ''}/guides`

export function middleware(request: NextRequest) {
  const url = new URL(request.url)

  // nomd=1 is set by the /api/md route when a markdown file is not found,
  // so the middleware skips interception and the normal HTML page is served.
  const requestsMarkdown =
    !url.searchParams.has('nomd') &&
    (request.headers.get('Accept')?.includes('text/markdown') || url.pathname.endsWith('.md'))

  // Serve pre-generated .md files for guides and reference routes.
  // The slug is the full path relative to BASE_PATH (e.g. guides/foo or reference/javascript).
  if (
    (url.pathname.startsWith(GUIDES_PATH + '/') ||
      url.pathname.startsWith(REFERENCE_PATH + '/') ||
      url.pathname === REFERENCE_PATH) &&
    requestsMarkdown
  ) {
    const slug = url.pathname.replace(`${BASE_PATH ?? ''}/`, '').replace(/\.md$/, '')
    const rewriteUrl = new URL(url)
    rewriteUrl.pathname = `${BASE_PATH ?? ''}/api/md/${slug}`
    return NextResponse.rewrite(rewriteUrl)
  }

  if (!url.pathname.startsWith(REFERENCE_PATH)) {
    return NextResponse.next()
  }

  if (isbot(request.headers.get('user-agent'))) {
    let [, lib, maybeVersion, ...slug] = url.pathname.replace(REFERENCE_PATH, '').split('/')

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

  const [, lib, maybeVersion] = url.pathname.replace(REFERENCE_PATH, '').split('/')

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
