import rewrites from './rewrites'

const SUPABASE_ORIGIN = 'https://supabase.com'
const PATH_WILDCARD = '/:path*'

const crossZoneSources: string[] = rewrites
  .filter(({ destination }) => !destination.startsWith('/'))
  .map(({ source }) => source)

function matchesSource(pathname: string, source: string) {
  if (!source.endsWith(PATH_WILDCARD)) return pathname === source

  const prefix = source.slice(0, -PATH_WILDCARD.length)
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function parseHref(href: string) {
  try {
    return new URL(href, SUPABASE_ORIGIN)
  } catch {
    return null
  }
}

export function isCrossZoneHref(href: string): boolean {
  const url = parseHref(href)
  if (url?.origin !== SUPABASE_ORIGIN) return false

  return crossZoneSources.some((source) => matchesSource(url.pathname, source))
}
