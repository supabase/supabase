import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Button, Modal } from '@supabase/ui'

import { useStore, useSubscriptionStats } from 'hooks'
import { get } from 'lib/common/fetch'
import {
  API_URL,
  DEFAULT_FREE_PROJECTS_LIMIT,
  PRICING_TIER_PRODUCT_IDS,
  STRIPE_PRODUCT_IDS,
} from 'lib/constants'

import { BillingLayout } from 'components/layouts'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import { PlanSelection, StripeSubscription } from 'components/interfaces/Billing'
import Connecting from 'components/ui/Loading/Loading'
import { NextPageWithLayout } from 'types'

const BillingUpdate: NextPageWithLayout = () => {
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
  const [selectedPlan, setSelectedPlan] = useState<any>()

  const isEnterprise =
    subscription && subscription.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.ENTERPRISE

  useEffect(() => {
    if (projectRef) {
      getStripeProducts()
      getSubscription()
    }
  }, [projectRef])

  useEffect(() => {
    if (isEnterprise) {
      router.push(`/project/${projectRef}/settings/billing/update/enterprise`)
    }
  }, [subscription])

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

      const subscription = await get(`${API_URL}/projects/${projectRef}/subscription`)
      if (subscription.error) throw subscription.error

      setSubscription(subscription)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to get subscription: ${error.message}`,
      })
    }
  }

  const onSelectPlan = (plan: any) => {
    if (plan.id === STRIPE_PRODUCT_IDS.PRO) {
      router.push(`/project/${projectRef}/settings/billing/update/pro`)
    } else if (plan.id === STRIPE_PRODUCT_IDS.FREE) {
      setSelectedPlan(plan)
      setShowConfirmDowngrade(true)
    }
  }

  const onConfirmDowngrade = () => {
    if (freeProjectsOwned >= freeProjectsLimit) {
      setShowDowngradeError(true)
      setShowConfirmDowngrade(false)
      setSelectedPlan(undefined)
    } else {
      router.push(`/project/${projectRef}/settings/billing/update/free`)
    }
  }

  if (isLoadingProducts || isEnterprise) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Connecting />
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto my-10 max-w-6xl px-6">
        <PlanSelection
          visible={!selectedPlan || (selectedPlan && showConfirmDowngrade)}
          tiers={products?.tiers ?? []}
          currentPlan={subscription?.tier}
          onSelectPlan={onSelectPlan}
        />
      </div>

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
        <div className="space-y-4 py-4">
          <Modal.Content>
            <p className="text-scale-1100 text-sm">
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
    </>
  )
}

BillingUpdate.getLayout = (page) => <BillingLayout>{page}</BillingLayout>

export default observer(BillingUpdate)
