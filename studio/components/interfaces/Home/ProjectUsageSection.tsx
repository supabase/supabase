import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { IconLoader, IconAlertCircle } from 'ui'

import { useParams } from 'hooks'
import { ProjectUsage, NewProjectPanel } from 'components/interfaces/Home'
import InformationBox from 'components/ui/InformationBox'
import { ProjectUsageResponseUsageKeys, useProjectUsageQuery } from 'data/usage/project-usage-query'

const ProjectUsageSection: FC = observer(({}) => {
  const { ref: projectRef } = useParams()
  const { data: usage, error: usageError, isLoading } = useProjectUsageQuery({ projectRef })

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

  const hasProjectData = usage
    ? Object.keys(usage)
        .map((key) => usage[key as ProjectUsageResponseUsageKeys].usage)
        .some((usage) => (usage ?? 0) > 0)
    : false

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
