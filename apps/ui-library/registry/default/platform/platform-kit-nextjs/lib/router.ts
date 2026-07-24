/**
 * Routing helpers for the manager dialog. Navigation is driven by wouter over
 * an in-memory location (see `components/supabase-manager/index.tsx`), so the
 * widget is fully self-contained and never touches the browser URL.
 */

export const TOP_LEVEL_TITLES: Record<string, string> = {
  database: 'Database',
  storage: 'Storage',
  auth: 'Authentication',
  users: 'Users',
  secrets: 'Secrets',
  logs: 'Logs',
  suggestions: 'Suggestions',
}

export interface Crumb {
  title: string
  path: string
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Build breadcrumb entries from the current in-memory location. */
export function buildBreadcrumbs(location: string): Crumb[] {
  const segments = location.split('/').filter(Boolean)
  if (segments.length === 0) return []

  const [root, ...rest] = segments
  const crumbs: Crumb[] = [{ title: TOP_LEVEL_TITLES[root] ?? capitalize(root), path: `/${root}` }]

  if (root === 'database') {
    if (rest[0] === 'query') {
      crumbs.push({ title: 'Talk to your database', path: '/database/query' })
    } else if (rest[0]) {
      const table = decodeURIComponent(rest[0])
      crumbs.push({ title: table, path: `/database/${rest[0]}` })
      if (rest[1] === 'edit') {
        crumbs.push({ title: 'Editing row', path: `/database/${rest[0]}/edit` })
      }
    }
  } else if (root === 'auth' && rest[0]) {
    const provider = decodeURIComponent(rest[0])
    crumbs.push({ title: `${capitalize(provider)} Provider Settings`, path: `/auth/${rest[0]}` })
  }

  return crumbs
}
