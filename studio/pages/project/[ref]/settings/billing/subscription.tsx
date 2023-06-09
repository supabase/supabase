import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Loading, Toggle } from 'ui'

import { SettingsLayout } from 'components/layouts'
import LoadingUI from 'components/ui/Loading'
import { useStore, useFlag } from 'hooks'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { NextPageWithLayout } from 'types'

import { Subscription } from 'components/interfaces/Billing'
import SubscriptionV2 from 'components/interfaces/BillingV2/Subscription/Subscription'

const ProjectBilling: NextPageWithLayout = () => {
  const enableSubscriptionV2 = useFlag('subscriptionV2')
  const [showNewSubscriptionUI, setShowNewSubscriptionUI] = useState(enableSubscriptionV2)

  return (
    <div className="relative">
      {enableSubscriptionV2 && (
        <div className="absolute top-[1.9rem] right-16 xl:right-32 flex items-center space-x-3">
          <Toggle
            size="tiny"
            checked={showNewSubscriptionUI}
            onChange={() => setShowNewSubscriptionUI(!showNewSubscriptionUI)}
          />
          <p className="text-xs text-scale-1100 -translate-y-[1px]">Preview new interface</p>
        </div>
      )}
      {showNewSubscriptionUI ? (
        <SubscriptionV2 />
      ) : (
        <div className="w-full h-full overflow-y-auto content">
          <div className="w-full mx-auto">
            <Settings />
          </div>
        </div>
      )}
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
