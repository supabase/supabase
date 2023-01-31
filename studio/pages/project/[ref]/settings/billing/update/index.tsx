import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Button, Modal } from 'ui'

import { useFlag, useFreeProjectLimitCheck, useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL, PRICING_TIER_PRODUCT_IDS, STRIPE_PRODUCT_IDS } from 'lib/constants'

import { BillingLayout } from 'components/layouts'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import { PlanSelection, StripeSubscription } from 'components/interfaces/Billing'
import Connecting from 'components/ui/Loading/Loading'
import { NextPageWithLayout } from 'types'

const BillingUpdate: NextPageWithLayout = () => {
  const { ui } = useStore()
  const router = useRouter()
  const orgSlug = ui.selectedOrganization?.slug
  const projectRef = ui.selectedProject?.ref

  const { membersExceededLimit } = useFreeProjectLimitCheck(orgSlug as string)
  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0

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
    } else if (plan.id === STRIPE_PRODUCT_IDS.TEAM) {
      router.push(`/project/${projectRef}/settings/billing/update/team`)
    } else if (plan.id === STRIPE_PRODUCT_IDS.FREE) {
      setSelectedPlan(plan)
      setShowConfirmDowngrade(true)
    }
  }

  const onConfirmDowngrade = () => {
    if (hasMembersExceedingFreeTierLimit) {
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

  // Team tier is enabled when the flag is turned on OR the user is already on the team tier (manually assigned by us)
  const userIsOnTeamTier = subscription?.tier?.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.TEAM
  const teamTierEnabled = userIsOnTeamTier || useFlag('teamTier')

  const productTiers = (products?.tiers ?? []).filter(
    (tier) => teamTierEnabled || tier.id !== STRIPE_PRODUCT_IDS.TEAM
  )

  return (
    <>
      <div className={`mx-auto my-10 ${teamTierEnabled ? 'max-w-[90vw]' : 'max-w-[80vw]'}`}>
        <PlanSelection
          visible={!selectedPlan || (selectedPlan && showConfirmDowngrade)}
          tiers={productTiers}
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
        size="medium"
        header="Your organization has members who have exceeded their free project limits"
        onCancel={() => setShowDowngradeError(false)}
      >
        <div className="space-y-4 py-4">
          <Modal.Content>
            <div className="space-y-2">
              <p className="text-sm text-scale-1100">
                The following members have reached their maximum limits for the number of active
                free tier projects within organizations where they are an administrator or owner:
              </p>
              <ul className="list-disc pl-5 text-sm text-scale-1100">
                {(membersExceededLimit || []).map((member, idx: number) => (
                  <li key={`member-${idx}`}>
                    {member.username || member.primary_email} (Limit: {member.free_project_limit}{' '}
                    free projects)
                  </li>
                ))}
              </ul>
              <p className="text-sm text-scale-1100">
                These members will need to either delete, pause, or upgrade one or more of these
                projects before you're able to downgrade this project.
              </p>
            </div>
          </Modal.Content>
          <Modal.Separator />
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
