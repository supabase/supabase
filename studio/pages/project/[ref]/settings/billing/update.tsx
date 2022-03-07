import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Modal } from '@supabase/ui'

import { withAuth, useStore, useSubscriptionStats } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, DEFAULT_FREE_PROJECTS_LIMIT, STRIPE_PRODUCT_IDS } from 'lib/constants'

import { BillingLayout } from 'components/layouts'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import {
  PlanSelection,
  ProUpgrade,
  EnterpriseRequest,
  ExitSurvey,
  StripeSubscription,
} from 'components/interfaces/Billing'
import { BillingPlan } from 'components/interfaces/Billing/PlanSelection/Plans/Plans.types'
import { BILLING_PLANS } from 'components/interfaces/Billing/PlanSelection/Plans/Plans.constants'

/**
 * [Joshen] Right now everything is scaffolded without any API calls
 * So maybe some prop passing down, variable creation needs relooking
 * once I'm working with proper data
 */

const BillingUpdate: NextPage = () => {
  const { ui } = useStore()
  const projectRef = ui.selectedProject?.ref
  const stripeCustomerId = ui.selectedOrganization?.stripe_customer_id

  const subscriptionStats = useSubscriptionStats()
  const freeProjectsLimit = ui?.profile?.free_project_limit ?? DEFAULT_FREE_PROJECTS_LIMIT
  const freeProjectsOwned = subscriptionStats.total_free_projects ?? 0

  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)
  const [showConfirmDowngrade, setShowConfirmDowngrade] = useState(false)
  const [showDowngradeError, setShowDowngradeError] = useState(false)

  const [subscription, setSubscription] = useState<StripeSubscription>()
  const [paymentMethods, setPaymentMethods] = useState<any>()
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>()

  useEffect(() => {
    if (projectRef) getSubscription()
  }, [projectRef])

  useEffect(() => {
    if (stripeCustomerId) getStripeAccount()
  }, [stripeCustomerId])

  const getStripeAccount = async () => {
    try {
      setIsLoadingPaymentMethods(true)
      const { paymentMethods, error: customerError } = await post(`${API_URL}/stripe/customer`, {
        stripe_customer_id: stripeCustomerId,
      })
      if (customerError) throw customerError
      setIsLoadingPaymentMethods(false)
      setPaymentMethods(paymentMethods)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to get subscription: ${error.message}`,
      })
    }
  }

  const getSubscription = async () => {
    try {
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
    }
  }

  const onSelectPlan = (plan: BillingPlan) => {
    setSelectedPlan(plan)
    if (plan.id === STRIPE_PRODUCT_IDS.FREE) {
      setShowConfirmDowngrade(true)
    }
  }

  const onConfirmDowngrade = () => {
    if (freeProjectsOwned >= freeProjectsLimit) {
      setShowDowngradeError(true)
      setSelectedPlan(undefined)
    }
    setShowConfirmDowngrade(false)
  }

  const onConfirmPayment = () => {
    console.log('Confirm payment')
  }

  return (
    <BillingLayout>
      <div className="mx-auto max-w-5xl my-10">
        <PlanSelection
          visible={!selectedPlan || (selectedPlan && showConfirmDowngrade)}
          billingPlans={BILLING_PLANS}
          currentPlan={subscription?.tier}
          onSelectPlan={onSelectPlan}
        />
        <EnterpriseRequest
          visible={selectedPlan?.name === 'Enterprise'}
          onSelectBack={() => setSelectedPlan(undefined)}
        />
        <ExitSurvey
          visible={selectedPlan?.name === 'Free' && !showConfirmDowngrade}
          onSelectBack={() => setSelectedPlan(undefined)}
        />
      </div>

      {subscription !== undefined && (
        <ProUpgrade
          visible={
            selectedPlan?.id === STRIPE_PRODUCT_IDS.PRO ||
            selectedPlan?.id === STRIPE_PRODUCT_IDS.PAYG
          }
          currentSubscription={subscription}
          selectedPlan={selectedPlan}
          isLoadingPaymentMethods={isLoadingPaymentMethods}
          paymentMethods={paymentMethods?.data ?? []}
          onSelectBack={() => setSelectedPlan(undefined)}
          onConfirmPayment={onConfirmPayment}
        />
      )}

      {/* [Joshen] Possible refactor, shift this into PlanSelection */}
      <ConfirmModal
        danger
        visible={showConfirmDowngrade}
        title="Are you sure?"
        description="Downgrading to the free tier will lead to reductions in your project’s capacity.
        If you're already past the limits of the free tier, your project will be throttled greatly."
        buttonLabel="Confirm"
        buttonLoadingLabel="Confirm"
        onSelectCancel={() => {
          setShowConfirmDowngrade(false)
          setSelectedPlan(undefined)
        }}
        onSelectConfirm={onConfirmDowngrade}
      />

      <Modal
        hideFooter
        visible={showDowngradeError}
        size="small"
        header="Free tier limit exceeded"
        onCancel={() => setShowDowngradeError(false)}
      >
        <div className="py-4 space-y-4">
          <Modal.Content>
            <p className="text-sm text-scale-1100">
              Your account is entitled up to {freeProjectsLimit} free projects across all
              organizations you own. You will need to delete or upgrade an existing free project
              first, before being able to downgrade this project.
            </p>
          </Modal.Content>
          <Modal.Seperator />
          <Modal.Content>
            <div className="flex items-center gap-2">
              <Button
                htmlType="button"
                type="default"
                onClick={() => setShowDowngradeError(false)}
                block
              >
                Understood
              </Button>
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </BillingLayout>
  )
}

export default withAuth(observer(BillingUpdate))
