import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { IconAlertCircle, IconLoader } from 'ui'

import { NewProjectPanel } from 'components/interfaces/Home'
import InformationBox from 'components/ui/InformationBox'
import ProjectUsage from './ProjectUsage'
import { useProjectLogRequestsCountQuery } from 'data/analytics/project-log-requests-count-query'

const ProjectUsageSection = observer(() => {
  const { ref: projectRef } = useParams()
  const {
    data: usage,
    error: usageError,
    isLoading,
  } = useProjectLogRequestsCountQuery({ projectRef })

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
      {isLoading ? (
        <div className="flex w-full items-center justify-center space-x-2">
          <IconLoader className="animate-spin" size={14} />
          <p className="text-sm">Retrieving project usage statistics</p>
        </div>
      ) : hasProjectData ? (
        <ProjectUsage />
      ) : (
        <NewProjectPanel />
      )}
    </>
  )
})
export default ProjectUsageSection
