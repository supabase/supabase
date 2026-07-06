import { getCSP } from './csp'

// Security response headers for the app. On the Next build these are applied via
// `next.config.ts` `headers()`; the TanStack build has no such hook and (on
// Vercel) serves a static shell with no server to attach them, so they're
// applied through `vercel.ts` (deploy) and `scripts/serve.js` (self-hosted)
// instead. Keep this in sync with the `/(.*?)` header block in next.config.ts.
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
    // Mirrors next.config.ts (note: the effective value browsers honour is
    // `nosniff`; kept identical to the Next build to avoid a behaviour split).
    { key: 'X-Content-Type-Options', value: 'no-sniff' },
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
