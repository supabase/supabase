import { useRouter } from 'next/router'
import AddOns from './AddOns/AddOns'
import BillingBreakdown from './BillingBreakdown'
import CostControl from './CostControl/CostControl'
import SubscriptionTier from './Tier/SubscriptionTier'
import { SUBSCRIPTION_PANEL_KEYS, useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import { useSelectedOrganization } from 'hooks'
import { useEffect } from 'react'
import ProjectBackupsStore from 'stores/project/ProjectBackupsStore'

export interface SubscriptionProps {}

const Subscription = ({}: SubscriptionProps) => {
  const router = useRouter()
  const organization = useSelectedOrganization()
  const snap = useSubscriptionPageStateSnapshot()
  const allowedValues = [
    'subscriptionPlan',
    'costControl',
    'computeInstance',
    'pitr',
    'customDomain',
  ]

  const panel = router.query.panel
  const isOrgBilling = !!organization?.subscription_id

  useEffect(() => {
    if (isOrgBilling) {
      const { ref, panel } = router.query
      let redirectUri = `/org/${organization.slug}/billing`
      switch (panel) {
        case 'subscriptionPlan':
          redirectUri = `/org/${organization.slug}/billing?panel=subscriptionPlan`
          break
        case 'costControl':
          redirectUri = `/org/${organization.slug}/billing?panel=costControl`
          break
        case 'computeInstance':
          redirectUri = `/project/${ref}/settings/addons?panel=computeInstance`
          break
        case 'pitr':
          redirectUri = `/project/${ref}/settings/addons?panel=pitr`
          break
        case 'customDomain':
          redirectUri = `/project/${ref}/settings/addons?panel=customDomain`
          break
      }

      router.push(redirectUri)
    }
  }, [router, organization?.slug, isOrgBilling])

  // No need to bother rendering, we'll redirect anyway
  if (isOrgBilling) return null

  if (panel && typeof panel === 'string' && allowedValues.includes(panel)) {
    snap.setPanelKey(panel as SUBSCRIPTION_PANEL_KEYS)
  }

  return (
    <>
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-6">
          <h3 className="text-scale-1200 text-xl">
            {isOrgBilling ? 'Project Add Ons' : 'Subscription'}
          </h3>
        </div>
      </div>
      {!isOrgBilling && (
        <div className="border-b">
          <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
            <SubscriptionTier />
          </div>
        </div>
      )}
      {!isOrgBilling && (
        <div className="border-b">
          <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
            <CostControl />
          </div>
        </div>
      )}
      <div className={`${isOrgBilling ? '' : 'border-b'}`}>
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <AddOns />
        </div>
      </div>
      {!isOrgBilling && (
        <div className="border-b">
          <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
            <BillingBreakdown />
          </div>
        </div>
      )}
    </>
  )
}

export default Subscription
