import { FC } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { IconLoader, IconAlertCircle } from '@supabase/ui'

import { useProjectUsage } from 'hooks'
import { ProjectUsage, NewProjectPanel } from 'components/interfaces/Home'
import InformationBox from 'components/ui/InformationBox'

const ProjectUsageSection: FC = observer(({}) => {
  const router = useRouter()
  const { ref } = router.query
  const { usage, error: usageError, isLoading } = useProjectUsage(ref as string)

  // [Joshen TODO] After API is ready need to update to include dbEgress, storageEgress
  // And also to highlight in this chart which components are "approaching" and "over"
  const mockUsage: any = {
    dbSize: { usage: 20773283, limit: 524288000 },
    dbEgress: { usage: 400000000, limit: 524288000 },
    storageSize: { usage: 624288000, limit: 524288000 },
    storageEgress: { usage: 2048, limit: 524288000 },
  }

  const hasProjectData =
    usage && (usage?.bucketSize || (usage?.authUsers ?? '0') !== '0' || usage?.dbTables)
      ? true
      : false

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

  return (
    <>
      {isLoading ? (
        <div className="w-full flex justify-center items-center space-x-2">
          <IconLoader className="animate-spin" size={14} />
          <p className="text-sm">Retrieving project usage statistics</p>
        </div>
      ) : !usage.error && hasProjectData ? (
        <ProjectUsage />
      ) : (
        <NewProjectPanel />
      )}
    </>
  )
})
export default ProjectUsageSection
