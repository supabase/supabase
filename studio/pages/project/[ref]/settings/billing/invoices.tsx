import { observer } from 'mobx-react-lite'
import { FC, useEffect } from 'react'

import { SettingsLayout } from 'components/layouts'
import LoadingUI from 'components/ui/Loading'
import OveragesBanner from 'components/ui/OveragesBanner/OveragesBanner'
import { useProjectSubscription, useStore } from 'hooks'
import { NextPageWithLayout, Project } from 'types'

import { Invoices } from 'components/interfaces/Billing'

const ProjectBilling: NextPageWithLayout = () => {
  const { ui } = useStore()
  const project = ui.selectedProject

  return (
    <div className="content h-full w-full overflow-y-auto">
      <div className="mx-auto w-full">
        <Settings project={project} />
      </div>
    </div>
  )
}

ProjectBilling.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default observer(ProjectBilling)

interface SettingsProps {
  project?: Project
}

const Settings: FC<SettingsProps> = ({ project }) => {
  const { ui } = useStore()
  const projectTier = ui.selectedProject?.subscription_tier

  const {
    subscription,
    isLoading: loading,
    error,
  } = useProjectSubscription(ui.selectedProject?.ref)

  useEffect(() => {
    if (error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to get project subscription: ${error?.message ?? 'unknown'}`,
      })
    }
  }, [error])

  if (!subscription) {
    return <LoadingUI />
  }

  return (
    <div className="container max-w-4xl space-y-8 p-4">
      {/* [Joshen TODO] Temporarily hidden until usage endpoint is sorted out */}
      {/* {projectTier !== undefined && <OveragesBanner tier={projectTier} />} */}

      <div className="space-y-2">
        <h4 className="text-lg">Invoices</h4>
        <Invoices projectRef={ui.selectedProject?.ref ?? ''} />
      </div>
    </div>
  )
}
