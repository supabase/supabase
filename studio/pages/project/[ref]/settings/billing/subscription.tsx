import { observer } from 'mobx-react-lite'
import { FC, useEffect } from 'react'
import { Loading } from 'ui'

import { SettingsLayout } from 'components/layouts'
import LoadingUI from 'components/ui/Loading'
import OveragesBanner from 'components/ui/OveragesBanner/OveragesBanner'
import { useProjectSubscription, useStore } from 'hooks'
import { NextPageWithLayout, Project } from 'types'

import { Subscription } from 'components/interfaces/Billing'

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
      <Subscription
        loading={loading}
        project={project}
        subscription={subscription}
        currentPeriodStart={subscription?.billing.current_period_start}
        currentPeriodEnd={subscription?.billing.current_period_end}
      />
      {loading ? (
        <Loading active={loading}>
          <div className="mb-8 w-full overflow-hidden rounded border border-panel-border-light dark:border-panel-border-dark">
            <div className="flex items-center justify-center bg-panel-body-light px-6 py-6 dark:bg-panel-body-dark">
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
