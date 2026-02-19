import { clientSdkIds } from '~/content/navigation.references'
import { BASE_PATH } from '~/lib/constants'
import { stampFirstReferrerCookie } from 'common/first-referrer-cookie'
import { isbot } from 'isbot'
import { NextResponse, type NextRequest } from 'next/server'

const REFERENCE_PATH = `${BASE_PATH ?? ''}/reference`

export function middleware(request: NextRequest) {
  const url = new URL(request.url)

  // Non-reference paths: just handle the first-referrer cookie and pass through
  if (!url.pathname.startsWith(REFERENCE_PATH)) {
    const response = NextResponse.next()
    stampFirstReferrerCookie(request, response)
    return response
  }

  // Reference paths: existing rewrite logic with cookie stamping on every response

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
        const response = NextResponse.rewrite(rewriteUrl)
        stampFirstReferrerCookie(request, response)
        return response
      }
    }
  }

  const [, lib, maybeVersion] = url.pathname.replace(REFERENCE_PATH, '').split('/')

  if (lib === 'cli') {
    const rewritePath = [REFERENCE_PATH, 'cli'].join('/')
    const response = NextResponse.rewrite(new URL(rewritePath, request.url))
    stampFirstReferrerCookie(request, response)
    return response
  }

  if (lib === 'api') {
    const rewritePath = [REFERENCE_PATH, 'api'].join('/')
    const response = NextResponse.rewrite(new URL(rewritePath, request.url))
    stampFirstReferrerCookie(request, response)
    return response
  }

  if (lib?.startsWith('self-hosting-')) {
    const rewritePath = [REFERENCE_PATH, lib].join('/')
    const response = NextResponse.rewrite(new URL(rewritePath, request.url))
    stampFirstReferrerCookie(request, response)
    return response
  }

  if (clientSdkIds.includes(lib)) {
    const version = /v\d+/.test(maybeVersion) ? maybeVersion : null
    const rewritePath = [REFERENCE_PATH, lib, version].filter(Boolean).join('/')
    const response = NextResponse.rewrite(new URL(rewritePath, request.url))
    stampFirstReferrerCookie(request, response)
    return response
  }

  const response = NextResponse.next()
  stampFirstReferrerCookie(request, response)
  return response
}

export const config = {
  matcher: [
    // Broadened from `/reference/:path*` to stamp first-referrer cookies on all
    // docs pages, not just reference paths. Excludes Next.js internals and static files.
    '/((?!api|_next/static|_next/image|favicon.ico|__nextjs).*)',
  ],
}
