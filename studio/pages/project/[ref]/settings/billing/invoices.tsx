import { observer } from 'mobx-react-lite'
import { FC, useEffect } from 'react'

import { SettingsLayout } from 'components/layouts'
import LoadingUI from 'components/ui/Loading'
import OveragesBanner from 'components/ui/OveragesBanner/OveragesBanner'
import { useStore } from 'hooks'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { NextPageWithLayout, Project } from 'types'

import { Invoices } from 'components/interfaces/Billing'

const ProjectBilling: NextPageWithLayout = () => {
  const { ui } = useStore()
  const project = ui.selectedProject

  return (
    <div className="w-full h-full overflow-y-auto content">
      <div className="w-full mx-auto">
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

  const { data: subscription, error } = useProjectSubscriptionQuery({
    projectRef: ui.selectedProject?.ref,
  })

  useEffect(() => {
    if (error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to get project subscription: ${(error as any)?.message ?? 'unknown'}`,
      })
    }
  }, [error])

  if (!subscription) {
    return <LoadingUI />
  }

  return (
    <div className="container max-w-4xl p-4 space-y-8">
      {/* [Joshen TODO] Temporarily hidden until usage endpoint is sorted out */}
      {/* {projectTier !== undefined && <OveragesBanner tier={projectTier} />} */}

      <div className="space-y-2">
        <h4 className="text-lg">Invoices</h4>
        <Invoices projectRef={ui.selectedProject?.ref ?? ''} />
      </div>
    </div>
  )
}
