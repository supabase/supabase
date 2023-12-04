import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { IconAlertCircle } from 'ui'

import { NewProjectPanel } from 'components/interfaces/Home'
import { ProjectUsageLoadingState } from 'components/layouts/ProjectLayout/LoadingState'
import InformationBox from 'components/ui/InformationBox'
import { useProjectLogRequestsCountQuery } from 'data/analytics/project-log-requests-count-query'
import { useProjectLogStatsQuery } from 'data/analytics/project-log-stats-query'
import ProjectUsage from './ProjectUsage'

const ProjectUsageSection = observer(() => {
  const { ref: projectRef } = useParams()
  const {
    data: usage,
    error: usageError,
    isLoading,
  } = useProjectLogRequestsCountQuery({ projectRef })

  // wait for the stats to load before showing the usage section
  // to eliminate multiple spinners
  const { isLoading: isLogsStatsLoading } = useProjectLogStatsQuery({
    projectRef,
    interval: 'hourly',
  })

  if (usageError) {
    return (
      <InformationBox
        hideCollapse
        defaultVisibility
        icon={<IconAlertCircle strokeWidth={2} />}
        title="There was an issue loading the usage details of your project"
      />
    )
  }

  const hasProjectData =
    usage?.result && usage.result.length > 0 ? usage.result[0].count > 0 : false

  return (
    <>
      {isLoading || isLogsStatsLoading ? (
        <ProjectUsageLoadingState />
      ) : hasProjectData ? (
        <ProjectUsage />
      ) : (
        <NewProjectPanel />
      )}
    </>
  )
})
export default ProjectUsageSection
