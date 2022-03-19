import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Button, Modal } from '@supabase/ui'

import { withAuth, useStore, useSubscriptionStats } from 'hooks'
import { get, post } from 'lib/common/fetch'
import { API_URL, DEFAULT_FREE_PROJECTS_LIMIT, STRIPE_PRODUCT_IDS } from 'lib/constants'

import { BillingLayout } from 'components/layouts'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import { PlanSelection, StripeSubscription } from 'components/interfaces/Billing'
import { BillingPlan } from 'components/interfaces/Billing/PlanSelection/Plans/Plans.types'
import Connecting from 'components/ui/Loading/Loading'

/**
 * [Joshen] Right now everything is scaffolded without any API calls
 * So maybe some prop passing down, variable creation needs relooking
 * once I'm working with proper data
 */

// [CURRENTLY: Hooking up products from API, and removing all the constants crap]

const BillingUpdate: NextPage = () => {
  const { ui } = useStore()
  const router = useRouter()
  const projectRef = ui.selectedProject?.ref

  const subscriptionStats = useSubscriptionStats()
  const freeProjectsLimit = ui?.profile?.free_project_limit ?? DEFAULT_FREE_PROJECTS_LIMIT
  const freeProjectsOwned = subscriptionStats.total_free_projects ?? 0

  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [showConfirmDowngrade, setShowConfirmDowngrade] = useState(false)
  const [showDowngradeError, setShowDowngradeError] = useState(false)

  const [products, setProducts] = useState<{ tiers: any[]; addons: any[] }>()
  const [subscription, setSubscription] = useState<StripeSubscription>()
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>()

  useEffect(() => {
    if (projectRef) {
      getStripeProducts()
      getSubscription()
    }
  }, [projectRef])

  // [Joshen] Perhaps we shift this fetch into the global mobx tree
  // Since all the pages require this data, makes more sense to load it once at the layout
  const getStripeProducts = async () => {
    try {
      setIsLoadingProducts(true)
      const products = await get(`${API_URL}/stripe/products`)
      setProducts(products)
      setIsLoadingProducts(false)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to get products: ${error.message}`,
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
    if (plan.name === 'Enterprise') {
      return router.push(`/project/${projectRef}/settings/billing/update/enterprise`)
    } else if (plan.id === STRIPE_PRODUCT_IDS.PRO) {
      return router.push(`/project/${projectRef}/settings/billing/update/pro`)
    }

    if (plan.id === STRIPE_PRODUCT_IDS.FREE) {
      setSelectedPlan(plan)
      setShowConfirmDowngrade(true)
    }
  }

  const onConfirmDowngrade = () => {
    if (freeProjectsOwned >= freeProjectsLimit) {
      setShowDowngradeError(true)
      setSelectedPlan(undefined)
    } else {
      router.push(`/project/${projectRef}/settings/billing/update/free`)
    }
  }

  if (isLoadingProducts) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Connecting />
      </div>
    )
  }

  return (
    <BillingLayout>
      <div className="mx-auto max-w-5xl my-10">
        <PlanSelection
          visible={!selectedPlan || (selectedPlan && showConfirmDowngrade)}
          tiers={products?.tiers ?? []}
          currentPlan={subscription?.tier}
          onSelectPlan={onSelectPlan}
        />
      </div>

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
