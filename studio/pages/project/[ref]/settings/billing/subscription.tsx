import { observer } from 'mobx-react-lite'
import { Loading } from 'ui'

import { SettingsLayout } from 'components/layouts'
import LoadingUI from 'components/ui/Loading'
import OveragesBanner from 'components/ui/OveragesBanner/OveragesBanner'
import { useStore } from 'hooks'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { NextPageWithLayout } from 'types'

import { Subscription } from 'components/interfaces/Billing'

const ProjectBilling: NextPageWithLayout = () => {
  const { ui } = useStore()

  return (
    <div className="w-full h-full overflow-y-auto content">
      <div className="w-full mx-auto">
        <Settings />
      </div>
    </div>
  )
}

ProjectBilling.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default observer(ProjectBilling)

const Settings = () => {
  const { ui } = useStore()

  const { data: subscription, isLoading: loading } = useProjectSubscriptionQuery({
    projectRef: ui.selectedProject?.ref,
  })

  if (!subscription) {
    return <LoadingUI />
  }

  return (
    <div className="container max-w-4xl p-4 space-y-8">
      {/* [Joshen TODO] Temporarily hidden until usage endpoint is sorted out */}
      {/* {projectTier !== undefined && <OveragesBanner tier={projectTier} />} */}
      <Subscription />
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
