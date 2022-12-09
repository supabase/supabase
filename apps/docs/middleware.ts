import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import isbot from 'isbot'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const specs = ['javascript', 'dart']

  if (isbot(request.headers.get('user-agent'))) {
    console.log('is a bot')
    for (const lib of specs) {
      if (request.url.includes(`reference/${lib}`)) {
        const requestSlug = request.url.split('/').pop()

        return NextResponse.rewrite(
          new URL(`/docs/reference/${lib}/crawlers/${requestSlug}`, request.url).toString()
        )
      }
    }
  } else {
    return NextResponse.next()
  }
}
