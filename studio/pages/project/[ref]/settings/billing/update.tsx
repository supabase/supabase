import Link from 'next/link'
import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Loading } from '@supabase/ui'

import { withAuth, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { BillingLayout } from 'components/layouts'
import { Plans, StripeSubscription } from 'components/interfaces/Billing'

import { BillingPlan } from 'components/interfaces/Billing/Plans/Plans.types'
import { BILLING_PLANS } from 'components/interfaces/Billing/Plans/Plans.constants'

const BillingUpdate: NextPage = () => {
  const { ui } = useStore()
  const projectRef = ui.selectedProject?.ref

  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<StripeSubscription>()

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

  const onSelectPlan = (plan: BillingPlan) => {
    console.log('Selected plan', plan)
  }

  return (
    <BillingLayout>
      <div className="space-y-8">
        <h4 className="text-xl">Change your project's subscription</h4>
        {/* FE will make a call to fetch all plans first at the page level */}
        <Loading active={loading}>
          <Plans plans={BILLING_PLANS} currentPlan={subscription} onSelectPlan={onSelectPlan} />
        </Loading>
        <div className="flex justify-center items-center">
          <Link href="https://supabase.com/pricing">
            <a target="_blank" className="text-sm text-scale-1100 hover:text-scale-1200 transition">
              See detailed comparisons across plans
            </a>
          </Link>
        </div>
      </div>
    </BillingLayout>
  )
}

export default withAuth(observer(BillingUpdate))
