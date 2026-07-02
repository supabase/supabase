// Shared redirect tables consumed by both `next.config.ts` (the Next.js
// build) and `vercel.ts` (the TanStack/Vercel deploy). Defined once here
// so the two configs don't drift.
//
// Shape mirrors Next's `redirects()` entry and Vercel's `Redirect` type
// (they're identical — `source`, `destination`, `permanent`, optional
// `has`). Basepath handling differs between the two: Next auto-prefixes,
// Vercel doesn't — each consumer is responsible for that.

export interface StudioRedirect {
  source: string
  destination: string
  permanent: boolean
  has?: Array<{ type: 'query'; key: string; value: string }>
}

export const PLATFORM_REDIRECTS: StudioRedirect[] = [
  {
    source: '/',
    has: [{ type: 'query', key: 'next', value: 'new-project' }],
    destination: '/new/new-project',
    permanent: false,
  },
  { source: '/', destination: '/org', permanent: false },
  { source: '/register', destination: '/sign-up', permanent: false },
  { source: '/signup', destination: '/sign-up', permanent: false },
  { source: '/signin', destination: '/sign-in', permanent: false },
  { source: '/login', destination: '/sign-in', permanent: false },
  { source: '/log-in', destination: '/sign-in', permanent: false },
  { source: '/project/:ref/building', destination: '/project/:ref', permanent: false },
]

export const SELF_HOSTED_REDIRECTS: StudioRedirect[] = [
  { source: '/', destination: '/project/default', permanent: false },
  { source: '/register', destination: '/project/default', permanent: false },
  { source: '/signup', destination: '/project/default', permanent: false },
  { source: '/signin', destination: '/project/default', permanent: false },
  { source: '/login', destination: '/project/default', permanent: false },
  { source: '/log-in', destination: '/project/default', permanent: false },
  { source: '/project/:ref/building', destination: '/project/:ref', permanent: false },
]

export const SHARED_REDIRECTS: StudioRedirect[] = [
  { source: '/project/:ref/auth', destination: '/project/:ref/auth/users', permanent: true },
  {
    source: '/project/:ref/auth/advanced',
    destination: '/project/:ref/auth/performance',
    permanent: true,
  },
  {
    source: '/project/:ref/auth/policies',
    destination: '/project/:ref/database/policies',
    permanent: true,
  },
  {
    source: '/project/:ref/database',
    destination: '/project/:ref/database/tables',
    permanent: true,
  },
  {
    source: '/project/:ref/database/graphiql',
    destination: '/project/:ref/api/graphiql',
    permanent: true,
  },
  { source: '/project/:ref/storage', destination: '/project/:ref/storage/files', permanent: true },
  {
    source: '/project/:ref/storage/buckets',
    destination: '/project/:ref/storage/files',
    permanent: true,
  },
  {
    source: '/project/:ref/storage/policies',
    destination: '/project/:ref/storage/files/policies',
    permanent: true,
  },
  {
    source: '/project/:ref/storage/buckets/:bucketId',
    destination: '/project/:ref/storage/files/buckets/:bucketId',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/api-keys/new',
    destination: '/project/:ref/settings/api-keys',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/storage',
    destination: '/project/:ref/storage/files/settings',
    permanent: true,
  },
  {
    source: '/project/:ref/storage/settings',
    destination: '/project/:ref/storage/files/settings',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/database',
    destination: '/project/:ref/database/settings',
    permanent: true,
  },
  {
    source: '/project/:ref/settings',
    destination: '/project/:ref/settings/general',
    permanent: true,
  },
  {
    source: '/project/:ref/auth/settings',
    destination: '/project/:ref/auth/users',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/billing/subscription',
    has: [{ type: 'query', key: 'panel', value: 'subscriptionPlan' }],
    destination: '/org/_/billing?panel=subscriptionPlan',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/billing/subscription',
    has: [{ type: 'query', key: 'panel', value: 'pitr' }],
    destination: '/project/:ref/settings/addons?panel=pitr',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/billing/subscription',
    has: [{ type: 'query', key: 'panel', value: 'computeInstance' }],
    destination: '/project/:ref/settings/compute-and-disk',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/billing/subscription',
    has: [{ type: 'query', key: 'panel', value: 'customDomain' }],
    destination: '/project/:ref/settings/addons?panel=customDomain',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/billing/subscription',
    destination: '/org/_/billing',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/jwt/signing-keys',
    destination: '/project/:ref/settings/jwt',
    permanent: true,
  },
  {
    source: '/project/:ref/database/api-logs',
    destination: '/project/:ref/logs/edge-logs',
    permanent: true,
  },
  {
    source: '/project/:ref/database/postgres-logs',
    destination: '/project/:ref/logs/postgres-logs',
    permanent: true,
  },
  {
    source: '/project/:ref/database/postgrest-logs',
    destination: '/project/:ref/logs/postgrest-logs',
    permanent: true,
  },
  {
    source: '/project/:ref/database/pgbouncer-logs',
    destination: '/project/:ref/logs/pooler-logs',
    permanent: true,
  },
  {
    source: '/project/:ref/logs/pgbouncer-logs',
    destination: '/project/:ref/logs/pooler-logs',
    permanent: true,
  },
  {
    source: '/project/:ref/database/realtime-logs',
    destination: '/project/:ref/logs/realtime-logs',
    permanent: true,
  },
  {
    source: '/project/:ref/storage/logs',
    destination: '/project/:ref/logs/storage-logs',
    permanent: true,
  },
  {
    source: '/project/:ref/auth/logs',
    destination: '/project/:ref/logs/auth-logs',
    permanent: true,
  },
  {
    source: '/project/:ref/logs-explorer',
    destination: '/project/:ref/logs/explorer',
    permanent: true,
  },
  {
    source: '/project/:ref/sql/quickstarts',
    destination: '/project/:ref/sql/examples',
    permanent: true,
  },
  { source: '/org/:slug/settings', destination: '/org/:slug/general', permanent: true },
  {
    source: '/project/:ref/settings/billing/update',
    destination: '/org/_/billing',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/billing/update/free',
    destination: '/org/_/billing',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/billing/update/pro',
    destination: '/org/_/billing',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/billing/update/team',
    destination: '/org/_/billing',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/billing/update/enterprise',
    destination: '/org/_/billing',
    permanent: true,
  },
  {
    source: '/project/:ref/reports/linter',
    destination: '/project/:ref/database/linter',
    permanent: true,
  },
  {
    source: '/project/:ref/reports',
    destination: '/project/:ref/observability',
    permanent: true,
  },
  {
    source: '/project/:ref/reports/:path*',
    destination: '/project/:ref/observability/:path*',
    permanent: true,
  },
  {
    source: '/project/:ref/query-performance',
    destination: '/project/:ref/observability/query-performance',
    permanent: true,
  },
  {
    source: '/project/:ref/advisors/query-performance',
    destination: '/project/:ref/observability/query-performance',
    permanent: true,
  },
  {
    source: '/project/:ref/database/query-performance',
    destination: '/project/:ref/observability/query-performance',
    permanent: true,
  },
  {
    source: '/project/:ref/auth/column-privileges',
    destination: '/project/:ref/database/column-privileges',
    permanent: true,
  },
  {
    source: '/project/:ref/database/linter',
    destination: '/project/:ref/database/security-advisor',
    permanent: true,
  },
  {
    source: '/project/:ref/database/security-advisor',
    destination: '/project/:ref/advisors/security',
    permanent: true,
  },
  {
    source: '/project/:ref/database/performance-advisor',
    destination: '/project/:ref/advisors/performance',
    permanent: true,
  },
  {
    source: '/project/:ref/database/webhooks',
    destination: '/project/:ref/integrations/webhooks/overview',
    permanent: true,
  },
  {
    source: '/project/:ref/database/wrappers',
    destination: '/project/:ref/integrations?category=wrapper',
    permanent: true,
  },
  {
    source: '/project/:ref/database/cron-jobs',
    destination: '/project/:ref/integrations/cron',
    permanent: true,
  },
  {
    source: '/project/:ref/api/graphiql',
    destination: '/project/:ref/integrations/graphiql',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/vault/secrets',
    destination: '/project/:ref/integrations/vault/secrets',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/vault/keys',
    destination: '/project/:ref/integrations/vault/keys',
    permanent: true,
  },
  {
    source: '/project/:ref/integrations/cron-jobs',
    destination: '/project/:ref/integrations/cron',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/warehouse',
    destination: '/project/:ref/settings/general',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/functions',
    destination: '/project/:ref/functions/secrets',
    permanent: true,
  },
  { source: '/org/:slug/invoices', destination: '/org/:slug/billing#invoices', permanent: true },
  { source: '/projects', destination: '/organizations', permanent: false },
  {
    source: '/project/:ref/settings/auth',
    destination: '/project/:ref/auth/providers',
    permanent: true,
  },
  {
    source: '/project/:ref/settings/api',
    destination: '/project/:ref/integrations/data_api/overview',
    permanent: false,
  },
  {
    source: '/project/:ref/api',
    destination: '/project/:ref/integrations/data_api/docs',
    permanent: false,
  },
]

// The two maintenance-mode rules are mutually exclusive; pick by env at
// build time. Same shape for Next and Vercel.
export function getMaintenanceRedirects(maintenanceMode: boolean): StudioRedirect[] {
  return maintenanceMode
    ? [{ source: '/((?!maintenance|img).*)', destination: '/maintenance', permanent: false }]
    : [{ source: '/maintenance', destination: '/', permanent: false }]
}

// ---------------------------------------------------------------------------
// Runtime matcher — used by TanStack's `__root` beforeLoad so self-hosted
// (and any request Vercel's edge didn't already intercept) still gets the
// same redirect behaviour as the Next.js / Vercel deploys.
//
// The patterns above are written in Next/Vercel-flavoured syntax: `:name`
// for a single segment, `:name*` for a trailing catch-all, literals
// otherwise. That's all the redirect rules use, so a hand-rolled matcher
// is simpler (and dependency-free) than pulling in path-to-regexp here.
// ---------------------------------------------------------------------------

type RedirectMatch = { destination: string; permanent: boolean }

function matchPattern(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split('/')
  const pathParts = pathname.split('/')
  const params: Record<string, string> = {}

  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i]
    if (p?.startsWith(':') && p.endsWith('*')) {
      params[p.slice(1, -1)] = pathParts.slice(i).join('/')
      return params
    }
    if (p?.startsWith(':')) {
      const v = pathParts[i]
      if (!v) return null
      params[p.slice(1)] = decodeURIComponent(v)
      continue
    }
    if (p !== pathParts[i]) return null
  }
  return patternParts.length === pathParts.length ? params : null
}

function substituteDestination(dest: string, params: Record<string, string>): string {
  return dest.replace(/:(\w+)\*?/g, (_, name) => params[name] ?? '')
}

function hasQueryMatches(
  has: StudioRedirect['has'],
  search: URLSearchParams | Record<string, string | string[] | undefined>
): boolean {
  if (!has?.length) return true
  const get = (k: string) =>
    search instanceof URLSearchParams
      ? search.get(k)
      : Array.isArray(search[k])
        ? (search[k] as string[])[0]
        : (search[k] as string | undefined)
  return has.every((h) => h.type === 'query' && get(h.key) === h.value)
}

export function matchRedirect(input: {
  pathname: string
  search: URLSearchParams | Record<string, string | string[] | undefined>
  isPlatform: boolean
  maintenanceMode?: boolean
}): RedirectMatch | null {
  const { pathname, search, isPlatform, maintenanceMode = false } = input

  // Maintenance mode handled inline — the maintenance-on rule uses a
  // negative-lookahead regex source that the segment matcher above can't
  // parse. Cheap to special-case here.
  if (maintenanceMode) {
    if (!pathname.startsWith('/maintenance') && !pathname.startsWith('/img')) {
      return { destination: '/maintenance', permanent: false }
    }
  } else if (pathname === '/maintenance') {
    return { destination: '/', permanent: false }
  }

  const ordered = [
    ...(isPlatform ? PLATFORM_REDIRECTS : SELF_HOSTED_REDIRECTS),
    ...SHARED_REDIRECTS,
  ]
  for (const rule of ordered) {
    const params = matchPattern(rule.source, pathname)
    if (!params) continue
    if (!hasQueryMatches(rule.has, search)) continue
    return {
      destination: substituteDestination(rule.destination, params),
      permanent: rule.permanent,
    }
  }
  return null
}
