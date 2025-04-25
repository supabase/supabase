import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { getIndexAdvisorExtensions } from 'components/interfaces/QueryPerformance/index-advisor.utils'

/**
 * Hook to check if index advisor functionality is available
 * @returns boolean indicating if index advisor is available
 */
export function useIsIndexAdvisorAvailable(): boolean {
  const { project } = useProjectContext()
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { hypopg, indexAdvisor } = getIndexAdvisorExtensions(extensions ?? [])
  return hypopg?.installed_version !== null && indexAdvisor?.installed_version !== null
}
