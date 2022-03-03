import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { withAuth, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { BillingLayout } from 'components/layouts'
import { PlanSelection, EnterpriseRequest, StripeSubscription } from 'components/interfaces/Billing'

import { BillingPlan } from 'components/interfaces/Billing/PlanSelection/Plans/Plans.types'
import { BILLING_PLANS } from 'components/interfaces/Billing/PlanSelection/Plans/Plans.constants'

const BillingUpdate: NextPage = () => {
  const { ui } = useStore()
  const projectRef = ui.selectedProject?.ref

  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<StripeSubscription>()
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>()

  useEffect(() => {
    if (projectRef) getSubscription()
  }, [projectRef])

  const getSubscription = async () => {
    try {
      setLoading(true)

      if (!ui.selectedProject?.subscription_id) {
        throw new Error('Unable to get subscription ID of project')
      }

      const { data: subscription, error }: { data: StripeSubscription; error: any } = await post(
        `${API_URL}/stripe/subscription`,
        { subscription_id: ui.selectedProject.subscription_id }
      )

      if (error) throw error
      setSubscription(subscription)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to get subscription: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <BillingLayout>
      <PlanSelection
        visible={!selectedPlan}
        billingPlans={BILLING_PLANS}
        currentPlan={subscription}
        onSelectPlan={setSelectedPlan}
      />
      <EnterpriseRequest
        visible={selectedPlan?.name === 'Enterprise'}
        onSelectBack={() => setSelectedPlan(undefined)}
      />
    </BillingLayout>
  )
}

export default withAuth(observer(BillingUpdate))
