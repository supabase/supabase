import { pick } from 'lodash'

/**
 * Gets the Notion team to send feedback to based on the pathname.
 */
const getNotionTeam = (pathname: string) => {
  const DEFAULT_TEAM = 'team-docs'

  // Pathname has format `/guides/(team)/**`
  const pathParts = pathname.split('/')

  if (pathParts[1] !== 'guides' || !pathParts[2]) return DEFAULT_TEAM

  switch (pathParts[2]) {
    case 'database':
      return 'team-postgres'
    case 'auth':
      return 'team-auth'
    case 'storage':
      return 'team-storage'
    case 'functions':
      return 'team-functions'
    case 'realtime':
      return 'team-realtime'
    case 'ai':
      return 'team-ai'
    case 'local-development':
    case 'self-hosting':
    case 'deployment':
      return 'team-dev-workflows'
    case 'integrations':
      return 'team-api'
    case 'platform':
    case 'monitoring-troubleshooting':
      return 'team-infra'
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

export { getNotionTeam, getSanitizedTabParams }
