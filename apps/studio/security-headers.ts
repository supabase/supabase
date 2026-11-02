import { getCSP } from './csp'

// Security response headers. The Next build applies them via next.config.ts
// `headers()`; the TanStack build has no such hook, so they're applied through
// `vercel.ts` (Vercel) and Nitro `routeRules` in `vite.config.ts`
// (self-hosted). Keep in sync with the `/(.*?)` header block in next.config.ts.
//
// Env-gated exactly like next.config:
//   - CSP: full `getCSP()` on platform, else just `frame-ancestors 'none'`.
//   - HSTS: only on platform + Vercel (never for self-hosted / previews on a
//     bare IP), so it's omitted rather than sent empty.
export function getSecurityHeaders(): Array<{ key: string; value: string }> {
  const isPlatform = process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'
  const isVercel = process.env.VERCEL === '1'

  const headers = [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    {
      key: 'Content-Security-Policy',
      value: isPlatform ? getCSP() : "frame-ancestors 'none';",
    },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ]

  if (isPlatform && isVercel) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains; preload',
    })
  }

  return headers
}
