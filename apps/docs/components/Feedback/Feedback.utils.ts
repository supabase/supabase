import { pick } from 'lodash'

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

export { getSanitizedTabParams }
