import { pick } from 'lodash-es'

/**
 * Gets the Notion team to send feedback to based on the pathname.
 */
const getLinearTeam = (pathname: string) => {
  const DEFAULT_TEAM = 'Docs'

  // Pathname has format `/guides/(team)/**`
  const pathParts = pathname.split('/')

  if (pathParts[1] !== 'guides' || !pathParts[2]) return DEFAULT_TEAM

  switch (pathParts[2]) {
    case 'database':
      return 'Postgres'
    case 'auth':
      return 'Auth'
    case 'storage':
      return 'Storage'
    case 'functions':
      return 'Functions'
    case 'realtime':
      return 'Realtime'
    case 'ai':
      return 'AI'
    case 'local-development':
    case 'self-hosting':
    case 'deployment':
      return 'Dev Workflows'
    case 'integrations':
      return 'API'
    case 'security':
      return 'Security'
    case 'platform':
    case 'monitoring-troubleshooting':
      return 'Infra'
    default:
      return DEFAULT_TEAM
  }
}

/**
 * Gets the tab selection state from the URL search params.
 *
 * Sanitizes by including only those search params that are explicitly marked
 * as query groups.
 */
const getSanitizedTabParams = () => {
  const searchParams = new URLSearchParams(window.location.search)
  const queryGroups = searchParams.getAll('queryGroups')

  return pick(Object.fromEntries(searchParams.entries()), queryGroups)
}

export { getLinearTeam, getSanitizedTabParams }
