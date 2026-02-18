import { isbot } from 'isbot'
import { NextResponse, type NextRequest } from 'next/server'

import {
  buildFirstReferrerData,
  FIRST_REFERRER_COOKIE_MAX_AGE,
  FIRST_REFERRER_COOKIE_NAME,
  serializeFirstReferrerCookie,
  shouldRefreshCookie,
} from 'common/first-referrer-cookie'

import { clientSdkIds } from '~/content/navigation.references'
import { BASE_PATH } from '~/lib/constants'

const REFERENCE_PATH = `${BASE_PATH ?? ''}/reference`

function maybeStampFirstReferrerCookie(request: NextRequest, response: NextResponse): void {
  const referrer = request.headers.get('referer') ?? ''

  const { stamp } = shouldRefreshCookie(request.cookies.has(FIRST_REFERRER_COOKIE_NAME), {
    referrer,
    url: request.url,
  })

  if (!stamp) return

  const data = buildFirstReferrerData({
    referrer,
    landingUrl: request.url,
  })

  response.cookies.set(FIRST_REFERRER_COOKIE_NAME, serializeFirstReferrerCookie(data), {
    path: '/',
    sameSite: 'lax',
    // Use a shared domain on *.supabase.com so www/docs -> studio can read it.
    // On non-supabase hosts (localhost, previews), leave domain unset so the
    // browser stores a host-only cookie instead of rejecting an invalid domain.
    ...(request.nextUrl.hostname === 'supabase.com' ||
    request.nextUrl.hostname.endsWith('.supabase.com')
      ? { domain: 'supabase.com', secure: true }
      : {}),
    maxAge: FIRST_REFERRER_COOKIE_MAX_AGE,
  })
}

export function middleware(request: NextRequest) {
  const url = new URL(request.url)

  // Non-reference paths: just handle the first-referrer cookie and pass through
  if (!url.pathname.startsWith(REFERENCE_PATH)) {
    const response = NextResponse.next()
    maybeStampFirstReferrerCookie(request, response)
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
        maybeStampFirstReferrerCookie(request, response)
        return response
      }
    }
  }

  const [, lib, maybeVersion] = url.pathname.replace(REFERENCE_PATH, '').split('/')

  if (lib === 'cli') {
    const rewritePath = [REFERENCE_PATH, 'cli'].join('/')
    const response = NextResponse.rewrite(new URL(rewritePath, request.url))
    maybeStampFirstReferrerCookie(request, response)
    return response
  }

  if (lib === 'api') {
    const rewritePath = [REFERENCE_PATH, 'api'].join('/')
    const response = NextResponse.rewrite(new URL(rewritePath, request.url))
    maybeStampFirstReferrerCookie(request, response)
    return response
  }

  if (lib?.startsWith('self-hosting-')) {
    const rewritePath = [REFERENCE_PATH, lib].join('/')
    const response = NextResponse.rewrite(new URL(rewritePath, request.url))
    maybeStampFirstReferrerCookie(request, response)
    return response
  }

  if (clientSdkIds.includes(lib)) {
    const version = /v\d+/.test(maybeVersion) ? maybeVersion : null
    const rewritePath = [REFERENCE_PATH, lib, version].filter(Boolean).join('/')
    const response = NextResponse.rewrite(new URL(rewritePath, request.url))
    maybeStampFirstReferrerCookie(request, response)
    return response
  }

  const response = NextResponse.next()
  maybeStampFirstReferrerCookie(request, response)
  return response
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!api|_next/static|_next/image|favicon.ico|__nextjs).*)',
  ],
}
