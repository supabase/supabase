import { getIndexAdvisorExtensions } from 'components/interfaces/QueryPerformance/index-advisor.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'

/**
 * Hook to get both index advisor availability and enabled status
 *
 * available if the index_advisor and hypopg extensions are available
 * enabled if the index_advisor and hypopg extensions are installed (their versions are not null)
 */
export function useIndexAdvisorStatus() {
  const { project } = useProjectContext()
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { hypopg, indexAdvisor } = getIndexAdvisorExtensions(extensions ?? [])

  const isIndexAdvisorAvailable = !!hypopg && !!indexAdvisor

  const isIndexAdvisorEnabled =
    isIndexAdvisorAvailable &&
    hypopg.installed_version !== null &&
    indexAdvisor.installed_version !== null

  return { isIndexAdvisorAvailable, isIndexAdvisorEnabled }
}
