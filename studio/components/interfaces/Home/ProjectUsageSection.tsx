import useSWR from 'swr'
import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { Typography, IconLoader } from '@supabase/ui'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useStore } from 'hooks'
import { ProjectUsage, NewProjectPanel } from 'components/interfaces/Home'

const ProjectUsageSection: FC = observer(({}) => {
  const { ui } = useStore()
  const project = ui.selectedProject
  const { data: usage, error: usageError }: any = useSWR(
    `${API_URL}/projects/${project?.ref}/usage`,
    get
  )
  const hasProjectData =
    usage && (usage?.bucketSize || (usage?.authUsers ?? '0') !== '0' || usage?.dbTables)
      ? true
      : false

  if (usageError) {
    return <Typography.Text type="danger">Error loading data {usageError.message}</Typography.Text>
  }

  return (
    <>
      {usage === undefined ? (
        <div className="w-full flex justify-center items-center space-x-2">
          <IconLoader className="animate-spin" size={14} />
          <p className="text-sm">Retrieving project usage statistics</p>
        </div>
      ) : !usage.error && hasProjectData ? (
        <ProjectUsage project={project} />
      ) : (
        <NewProjectPanel />
      )}
    </>
  )
})
export default ProjectUsageSection
