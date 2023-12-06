import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { IconAlertCircle } from 'ui'

import { NewProjectPanel } from 'components/interfaces/Home'
import { ProjectUsageLoadingState } from 'components/layouts/ProjectLayout/LoadingState'
import InformationBox from 'components/ui/InformationBox'
import { useProjectLogRequestsCountQuery } from 'data/analytics/project-log-requests-count-query'
import { useProjectLogStatsQuery } from 'data/analytics/project-log-stats-query'
import ProjectUsage from './ProjectUsage'
import { useSelectedProject } from 'hooks'
import dayjs from 'dayjs'

const ProjectUsageSection = observer(() => {
  const project = useSelectedProject()

  const {
    data: usage,
    error: usageError,
    isLoading,
  } = useProjectLogRequestsCountQuery({ projectRef: project?.ref })

  // wait for the stats to load before showing the usage section
  // to eliminate multiple spinners
  const { isLoading: isLogsStatsLoading } = useProjectLogStatsQuery({
    projectRef: project?.ref,
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

  // if the project has more than 25 requests, we assume the project has usage
  const hasProjectData =
    usage?.result && usage.result.length > 0 ? usage.result[0].count > 25 : false

  const isNewProject = dayjs(project?.inserted_at).isAfter(dayjs().subtract(2, 'day'))

  return (
    <>
      {isLoading || isLogsStatsLoading ? (
        <ProjectUsageLoadingState />
      ) : hasProjectData && !isNewProject ? (
        <ProjectUsage />
      ) : (
        <NewProjectPanel />
      )}
    </>
  )
})
export default ProjectUsageSection
