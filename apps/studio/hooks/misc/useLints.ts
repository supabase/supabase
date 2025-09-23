import { useParams } from 'common'
import { useProjectLintsQuery } from 'data/lint/lint-query'

/**
 * Hook to fetch and filter project lints
 *
 * Retrieves all lints for the current project and filters them by:
 * - Security-related lints
 * - Error-level security lints
 *
 * @returns {Object} Object containing filtered lint arrays
 * @returns {Array} securityLints - All security-related lints
 * @returns {Array} errorLints - Security lints with ERROR level
 */
export const useLints = () => {
  const { ref } = useParams()
  const { data } = useProjectLintsQuery({
    projectRef: ref,
  })

  const securityLints = (data ?? []).filter((lint) => lint.categories.includes('SECURITY'))
  const errorLints = securityLints.filter((lint) => lint.level === 'ERROR')

  return { securityLints, errorLints }
}
