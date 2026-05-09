import { NextRequest, NextResponse } from 'next/server'

import { IS_PLATFORM } from '@/lib/constants'

// Paths that should redirect to the default project in self-hosted mode.
const SELF_HOSTED_REDIRECT_SOURCES = ['/', '/register', '/signup', '/signin', '/login', '/log-in']

export const config = {
  matcher: ['/api/:function*', '/', '/register', '/signup', '/signin', '/login', '/log-in'],
}

// [Joshen] Return 404 for all next.js API endpoints EXCEPT the ones we use in hosted:
const HOSTED_SUPPORTED_API_URLS = [
  '/ai/sql/generate-v4',
  '/ai/sql/policy',
  '/ai/feedback/rate',
  '/ai/code/complete',
  '/ai/sql/cron-v2',
  '/ai/sql/title-v2',
  '/ai/sql/filter-v1',
  '/ai/onboarding/design',
  '/ai/feedback/classify',
  '/ai/docs',
  '/ai/sql/parse-client-code',
  '/get-ip-address',
  '/get-utc-time',
  '/get-deployment-commit',
  '/check-cname',
  '/edge-functions/test',
  '/edge-functions/body',
  '/generate-attachment-url',
  '/incident-status',
  '/incident-banner',
  '/status-override',
  '/api/integrations/stripe-sync',
  '/content/graphql',
  '/parse-query',
]

export function proxy(request: NextRequest) {
  // Self-hosted redirects: determine the default project ref at request time.
  // This runs before any next.config.ts static redirects, so the runtime
  // SUPABASE_PROJECTS env var (set at container start) takes precedence over
  // the static /project/default fallback baked into next.config.ts.
  //
  // Note: SUPABASE_PROJECTS_FILE cannot be read in Edge-runtime middleware
  // (no file-system access). Operators using file-based config should either
  // also set SUPABASE_PROJECTS, or accept that the initial redirect falls back
  // to /project/default (all other routes resolve the correct project via the
  // API layer, which does read the file).
  if (!IS_PLATFORM && SELF_HOSTED_REDIRECT_SOURCES.includes(request.nextUrl.pathname)) {
    let defaultProjectRef = 'default'
    try {
      const raw = process.env.SUPABASE_PROJECTS
      if (raw) {
        const entries: { ref?: string }[] = JSON.parse(raw)
        if (Array.isArray(entries) && entries.length > 0 && entries[0].ref) {
          defaultProjectRef = entries[0].ref
        }
      }
    } catch {
      // Malformed JSON — keep the fallback.
    }
    const url = request.nextUrl.clone()
    url.pathname = `/project/${defaultProjectRef}`
    return NextResponse.redirect(url)
  }

  if (
    IS_PLATFORM &&
    !HOSTED_SUPPORTED_API_URLS.some((url) => request.nextUrl.pathname.endsWith(url))
  ) {
    return Response.json(
      { success: false, message: 'Endpoint not supported on hosted' },
      { status: 404 }
    )
  }
}
