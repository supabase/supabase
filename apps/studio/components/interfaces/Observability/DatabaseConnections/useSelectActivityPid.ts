import { parseAsInteger, useQueryState } from 'nuqs'

import { filterActivities } from './DatabaseConnections.utils'
import { EMPTY_ACTIVITY_FILTERS, useActivityFilters } from './useActivityFilters'
import { useDatabaseActivityQuery } from '@/data/database/activity-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

// Selecting a pid should always bring it into view. If the current filters would hide it (e.g.
// its role isn't in the default roles filter), clear all filters so it's guaranteed to render.
export const useSelectActivityPid = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data } = useDatabaseActivityQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { filters, setFilters } = useActivityFilters()
  const [selectedPid, setSelectedPid] = useQueryState('pid', parseAsInteger)

  const selectPid = (pid: number) => {
    const isVisible = filterActivities(data ?? [], filters).some((x) => x.pid === pid)
    if (!isVisible) setFilters(EMPTY_ACTIVITY_FILTERS)
    setSelectedPid(pid)
  }

  return { selectedPid, selectPid }
}
