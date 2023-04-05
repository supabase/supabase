import { observer } from 'mobx-react-lite'
import { FC, useEffect } from 'react'
import { Loading } from 'ui'

import { SettingsLayout } from 'components/layouts'
import LoadingUI from 'components/ui/Loading'
import OveragesBanner from 'components/ui/OveragesBanner/OveragesBanner'
import { useStore } from 'hooks'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { NextPageWithLayout, Project } from 'types'

import { Subscription } from 'components/interfaces/Billing'

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

  const {
    data: subscription,
    isLoading: loading,
    error,
  } = useProjectSubscriptionQuery({ projectRef: ui.selectedProject?.ref })

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
      <Subscription
        loading={loading}
        project={project}
        subscription={subscription}
        currentPeriodStart={subscription?.billing.current_period_start}
        currentPeriodEnd={subscription?.billing.current_period_end}
      />
      {loading ? (
        <Loading active={loading}>
          <div className="w-full mb-8 overflow-hidden border rounded border-panel-border-light dark:border-panel-border-dark">
            <div className="flex items-center justify-center px-6 py-6 bg-panel-body-light dark:bg-panel-body-dark">
              <p>Loading usage breakdown</p>
            </div>
          </div>
        </Loading>
      ) : (
        <></>
      )}
    </div>
  )
}
