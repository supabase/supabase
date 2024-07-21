import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isbot } from 'isbot'

export function middleware(request: NextRequest) {
  const specs = ['javascript', 'dart', 'csharp']

  let version = ''
  if (request.url.includes('/v1/')) {
    version = 'v1'
  }
  if (request.url.includes('/v0/')) {
    version = 'v0'
  }

  if (isbot(request.headers.get('user-agent'))) {
    for (const lib of specs) {
      if (request.url.includes(`reference/${lib}`)) {
        const requestSlug = request.url.split(`reference/${lib}`)[1]

        if (requestSlug) {
          return NextResponse.rewrite(
            new URL(
              `/docs/reference/${lib}/${version ? version + '/' : ''}crawlers/${requestSlug.substring(1)}`,
              request.url
            ).toString()
          )
        }
      }
    }
  } else {
    return NextResponse.next()
  }
}

export const config = {
  matcher: '/((?!api|_next|static|public|favicon.ico).*)',
}
