import { useRouter } from 'next/router'
import AddOns from './AddOns/AddOns'
import BillingBreakdown from './BillingBreakdown'
import CostControl from './CostControl/CostControl'
import SubscriptionTier from './Tier/SubscriptionTier'
import { SUBSCRIPTION_PANEL_KEYS, useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import { useSelectedOrganization } from 'hooks'
import { useEffect } from 'react'
import InformationBox from 'components/ui/InformationBox'
import { Button, IconExternalLink, IconInfo } from 'ui'
import Link from 'next/link'

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
    if (panel && typeof panel === 'string' && allowedValues.includes(panel)) {
      snap.setPanelKey(panel as SUBSCRIPTION_PANEL_KEYS)
    }
  }, [panel])

  // No need to bother rendering, we'll redirect anyway
  if (isOrgBilling) return null

  return (
    <>
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-6">
          <h3 className="text-foreground text-xl">Subscription</h3>
        </div>
      </div>

      <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 pt-8">
        <InformationBox
          icon={<IconInfo size="large" strokeWidth={1.5} />}
          defaultVisibility={true}
          hideCollapse
          title="We're upgrading our billing system"
          description={
            <div className="space-y-3">
              <p className="text-sm leading-normal">
                This organization uses the legacy project-based billing. We’ve recently made some
                big improvements to our billing system. To migrate to the new organization-based
                billing, head over to your{' '}
                <Link href={`/org/${organization?.slug}/billing`} passHref>
                  <a className="text-sm text-green-900 transition hover:text-green-1000">
                    organization billing settings
                  </a>
                </Link>
                .
              </p>

              <div className="space-x-3">
                <Link href="https://supabase.com/blog/organization-based-billing" passHref>
                  <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                    <a target="_blank" rel="noreferrer">
                      Announcement
                    </a>
                  </Button>
                </Link>
                <Link href="https://supabase.com/docs/guides/platform/org-based-billing" passHref>
                  <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                    <a target="_blank" rel="noreferrer">
                      Documentation
                    </a>
                  </Button>
                </Link>
              </div>
            </div>
          }
        />
      </div>

      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <SubscriptionTier />
        </div>
      </div>

      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <CostControl />
        </div>
      </div>

      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <AddOns />
        </div>
      </div>

      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <BillingBreakdown />
        </div>
      </div>
    </>
  )
}

export default Subscription
