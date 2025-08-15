import { AlertCircle } from 'lucide-react'

import { ProjectUsageLoadingState } from 'components/layouts/ProjectLayout/LoadingState'
import InformationBox from 'components/ui/InformationBox'
import { useProjectLogRequestsCountQuery } from 'data/analytics/project-log-requests-count-query'
import { useProjectLogStatsQuery } from 'data/analytics/project-log-stats-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import ProjectUsage from './ProjectUsage'

export const ProjectUsageSection = () => {
  const { data: project } = useSelectedProjectQuery()
  const { error, isLoading } = useProjectLogRequestsCountQuery({ projectRef: project?.ref })

  // wait for the stats to load before showing the usage section to eliminate multiple spinners
  const { isLoading: isLogsStatsLoading } = useProjectLogStatsQuery({
    projectRef: project?.ref,
    interval: '1hr',
  })

  if (isLoading || isLogsStatsLoading) {
    return <ProjectUsageLoadingState />
  }

  if (error) {
    return (
      <InformationBox
        hideCollapse
        defaultVisibility
        icon={<AlertCircle size={18} strokeWidth={2} />}
        title="There was an issue loading the usage details of your project"
      />
    )
  }

  return <ProjectUsage />
}
