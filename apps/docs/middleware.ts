import { isbot } from 'isbot'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { clientSdkIds } from '~/content/navigation.references'
import { BASE_PATH } from '~/lib/constants'

const REFERENCE_PATH = `${(BASE_PATH ?? '') + '/'}reference`

export function middleware(request: NextRequest) {
  const url = new URL(request.url)

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
        rewriteUrl.pathname = (BASE_PATH ?? '/') + '/api/crawlers'

        return NextResponse.rewrite(rewriteUrl)
      }
    }
  } else {
    const [, lib, maybeVersion] = url.pathname.replace(REFERENCE_PATH, '').split('/')
    if (clientSdkIds.includes(lib)) {
      const version = /v\d+/.test(maybeVersion) ? maybeVersion : null
      const rewritePath = [REFERENCE_PATH, lib, version].filter(Boolean).join('/')
      return NextResponse.rewrite(new URL(rewritePath, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api|_next|static|public|favicon.ico).*)',
}
