import { FC } from 'react'
import { Badge, Button, IconCheck, IconExternalLink } from 'ui'

import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { StripeProduct } from 'components/interfaces/Billing'
import PlanCTAButton from './PlanCTAButton'
import { PRICING_META } from './Plans.Constants'
import { partition } from 'lodash'
import Link from 'next/link'

const AnimatedGradientBackground = () => (
  <div
    className={[
      'absolute top-0 left-0 h-full w-full animate-sway',
      'bg-gradient-to-b from-transparent via-transparent to-green-900',
    ].join(' ')}
  />
)

const CurrentSubscriptionBanner = () => (
  <div
    className={[
      'absolute -top-7 left-0 h-8 w-full',
      'flex items-center justify-center',
      'bg-brand-400 text-brand-900',
      'rounded-t-md border border-t border-l border-r border-b-0',
    ].join(' ')}
  >
    <p className="text-xs">Current plan</p>
  </div>
)

interface Props {
  plans: any[]
  currentPlan?: StripeProduct
  onSelectPlan: (plan: any) => void
}

/**
 * JSX below for the mapped plans is also very similar to www/pages/pricing
 * TO DO: move to use shared components for these
 *
 * https://github.com/supabase/supabase/blob/master/www/pages/pricing/index.tsx
 */

const Plans: FC<Props> = ({ plans, currentPlan, onSelectPlan }) => {
  const [[teamPlan], otherPlans] = partition(plans, (plan) => plan.id === STRIPE_PRODUCT_IDS.TEAM)

  return (
    <>
      {/* Team plan highlight */}
      <div className="relative col-span-3">
        <div className="absolute left-0 bottom-0 h-full w-full overflow-hidden opacity-50">
          <div
            className={[
              'absolute -top-[350px] left-[80px] h-[300%] w-full -rotate-45',
              'bg-gradient-to-b from-transparent via-transparent to-green-800',
            ].join(' ')}
          />
        </div>
        <div className="flex items-center justify-between h-full rounded border px-10 py-6 bg-white dark:bg-scale-300">
          <div className="w-1/2">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-xl">Team</h3>
              <Badge dot color="green">
                New
              </Badge>
            </div>
            <p className="text-scale-1100">{PRICING_META[STRIPE_PRODUCT_IDS.TEAM].description}</p>
            <div className="mt-8 space-y-2">
              <p className="text-sm">
                The following features will apply to <span className="text-brand-900">all</span>{' '}
                projects within the organization
              </p>
              <ul role="list" className="grid grid-cols-2 divide-y dark:divide-scale-400">
                {PRICING_META[STRIPE_PRODUCT_IDS.TEAM].features.map((feature, idx) => (
                  <li key={feature} className={`flex py-2 ${idx === 1 ? '!border-t-0' : ''}`}>
                    <div className="w-[12px]">
                      <IconCheck
                        className="h-3 w-3 text-brand-900 translate-y-[2.5px]"
                        aria-hidden="true"
                        strokeWidth={3}
                      />
                    </div>
                    <p className="mb-0 ml-3 text-xs text-scale-1100 dark:text-scale-1200">
                      {feature}
                    </p>
                  </li>
                ))}
              </ul>
              <Link href="https://supabase.com/pricing">
                <a target="_blank">
                  <Button
                    type="default"
                    className="!mt-4"
                    icon={<IconExternalLink strokeWidth={1.5} />}
                  >
                    View detailed features of Team plan
                  </Button>
                </a>
              </Link>
            </div>
          </div>
          <div className="w-1/4 mr-8 flex flex-col items-end space-y-4">
            <div className="flex space-x-2">
              <div>
                <span className="text-base font-medium text-scale-1200 mr-1">From</span>
                <span className="text-3xl">
                  ${PRICING_META[STRIPE_PRODUCT_IDS.TEAM].priceMonthly}
                </span>
                <span className="text-2xl font-medium text-scale-900">/mo</span>
              </div>
              <div className="flex h-8 -mt-[2px]">
                <div className="mt-2 rounded-md bg-brand-300 bg-opacity-30 px-2 py-1 text-sm text-brand-1000">
                  {PRICING_META[STRIPE_PRODUCT_IDS.TEAM].warning}
                </div>
              </div>
            </div>
            <Button type="primary" size="medium" onClick={() => onSelectPlan(teamPlan)}>
              Upgrade to Team
            </Button>
          </div>
        </div>
      </div>

      <div className="col-span-3 border-t border-scale-400 mt-3 mb-8"></div>

      {/* Existing available plans */}
      {otherPlans.map((plan) => {
        const isCurrentPlan =
          plan.id === currentPlan?.prod_id ||
          (plan.id === STRIPE_PRODUCT_IDS.PRO && currentPlan?.prod_id === STRIPE_PRODUCT_IDS.PRO) ||
          (plan.id === STRIPE_PRODUCT_IDS.PRO && currentPlan?.prod_id === STRIPE_PRODUCT_IDS.PAYG)

        return (
          <div key={PRICING_META[plan.id].name} className="relative h-full">
            {plan.id === STRIPE_PRODUCT_IDS.PRO && (
              <div className="absolute left-0 bottom-0 h-full w-full overflow-hidden opacity-50">
                <AnimatedGradientBackground />
              </div>
            )}
            <div className="flex h-full flex-col overflow-hidden rounded border">
              {isCurrentPlan && <CurrentSubscriptionBanner />}
              <div className="bg-white px-6 py-6 dark:bg-scale-300">
                <span
                  className="text-cd inline-flex rounded-full text-base font-normal tracking-wide text-scale-1200"
                  id="tier-standard"
                >
                  {PRICING_META[plan.id].name}
                </span>
                <div className="mt-2 flex items-baseline">
                  <div className="flex space-x-2">
                    {PRICING_META[plan.id].priceMonthly !== undefined ? (
                      <>
                        <div>
                          {PRICING_META[plan.id].from && (
                            <span className="text-sm font-medium text-scale-1200 mr-1">From</span>
                          )}
                          <span className="text-2xl">${PRICING_META[plan.id].priceMonthly}</span>
                          <span className="text-xl font-medium text-scale-900">/mo</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-2xl">Contact Us</span>
                    )}
                    <div className="flex h-8 -mt-[2px]">
                      {PRICING_META[plan.id].warning && (
                        <div className="mt-2 rounded-md bg-brand-300 bg-opacity-30 px-2 py-1 text-xs text-brand-1000">
                          {PRICING_META[plan.id].warning}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="py-4">
                  <PlanCTAButton
                    plan={plan}
                    currentPlan={currentPlan}
                    onSelectPlan={onSelectPlan}
                  />
                </div>
                <p className="text-sm text-scale-1100">{PRICING_META[plan.id].description}</p>
              </div>
              <div
                className={[
                  'flex-1 flex-col justify-between',
                  'space-y-6 border-t dark:border-scale-400',
                  'bg-scale-100 dark:bg-scale-300',
                  'hidden h-full px-6 py-6 lg:flex',
                ].join(' ')}
              >
                <div className="space-y-6">
                  {PRICING_META[plan.id].preface && (
                    <p className="text-sm text-scale-1200">{PRICING_META[plan.id].preface}</p>
                  )}
                  <ul role="list" className="divide-y dark:divide-scale-400">
                    {PRICING_META[plan.id].features.map((feature) => (
                      <li key={feature} className="flex py-2">
                        <div className="w-[12px]">
                          <IconCheck
                            className="h-3 w-3 text-brand-900 translate-y-[2.5px]"
                            aria-hidden="true"
                            strokeWidth={3}
                          />
                        </div>
                        <p className="mb-0 ml-3 text-xs text-scale-1100 dark:text-scale-1200">
                          {feature}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="space-y-2">
                    {PRICING_META[plan.id].additional && (
                      <p className="text-sm text-scale-1200">{PRICING_META[plan.id].additional}</p>
                    )}
                    {PRICING_META[plan.id].scale && (
                      <p className="text-xs text-scale-900">{PRICING_META[plan.id].scale}</p>
                    )}
                    {PRICING_META[plan.id].shutdown && (
                      <p className="text-xs text-scale-900">{PRICING_META[plan.id].shutdown}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

export default Plans
