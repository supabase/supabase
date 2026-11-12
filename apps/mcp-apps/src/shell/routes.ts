/** Deep links accepted from hosts and mention search: `/projects/<ref>?schema=&table=`. */
export interface ProjectRoute {
  projectId: string
  schema: string | null
  table: string | null
}

export function parseRoute(path: string): ProjectRoute | null {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('#')) return null
  try {
    const url = new URL(path, 'https://supabase.invalid')
    const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
    if (parts.length !== 2 || parts[0] !== 'projects') return null
    return {
      projectId: parts[1],
      schema: url.searchParams.get('schema'),
      table: url.searchParams.get('table'),
    }
  } catch {
    return null
  }
}
