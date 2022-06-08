import { FC } from 'react'
import { IconCheck } from '@supabase/ui'

import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { StripeProduct } from 'components/interfaces/Billing'
import PlanCTAButton from './PlanCTAButton'
import { PRICING_META } from './Plans.Constants'

interface Props {
  plans: any[]
  currentPlan?: StripeProduct
  onSelectPlan: (plan: any) => void
}

const AnimatedGradientBackground = () => (
  <div
    className={[
      'animate-sway absolute top-0 left-0 h-full w-full',
      'bg-gradient-to-b from-transparent via-transparent to-green-800',
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

/**
 * JSX below for the mapped plans is also very similar to www/pages/pricing
 * TO DO: move to use shared components for these
 *
 * https://github.com/supabase/supabase/blob/master/www/pages/pricing/index.tsx
 */

const Plans: FC<Props> = ({ plans, currentPlan, onSelectPlan }) => {
  return (
    <>
      {plans.map((plan) => {
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
              <div className="dark:bg-scale-300 bg-white px-8 py-6">
                <span
                  className="text-cd text-scale-1200 inline-flex rounded-full text-base font-normal tracking-wide"
                  id="tier-standard"
                >
                  {PRICING_META[plan.id].name}
                </span>
                <div className="mt-2 flex items-baseline">
                  <div className="flex space-x-2">
                    {PRICING_META[plan.id].priceMonthly !== undefined ? (
                      <>
                        <div className="flex items-end gap-1">
                          {PRICING_META[plan.id].from && (
                            <span className="text-scale-1200 text-base font-medium">From</span>
                          )}
                          <div>
                            <span className="text-2xl">${PRICING_META[plan.id].priceMonthly}</span>
                            <span className="text-scale-900 ml-1 text-xl font-medium">/mo</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-2xl">Contact Us</span>
                    )}
                    <div className="flex h-8">
                      {PRICING_META[plan.id].warning && (
                        <div className="bg-brand-300 text-brand-1000 mt-2 rounded-md bg-opacity-30 px-2 py-1 text-xs">
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
                <p className="text-scale-1100 text-sm">{PRICING_META[plan.id].description}</p>
              </div>
              <div
                className={[
                  'flex-1 flex-col justify-between',
                  'dark:border-scale-400 space-y-6 border-t',
                  'bg-scale-100 dark:bg-scale-300',
                  'hidden h-full px-8 py-6 lg:flex',
                ].join(' ')}
              >
                {PRICING_META[plan.id].preface && (
                  <p className="text-scale-1200 text-sm">{PRICING_META[plan.id].preface}</p>
                )}
                <ul role="list" className="dark:divide-scale-400 divide-y">
                  {PRICING_META[plan.id].features.map((feature) => (
                    <li key={feature} className="flex items-center py-2">
                      <IconCheck
                        className="text-brand-900 h-3 w-3 "
                        aria-hidden="true"
                        strokeWidth={3}
                      />
                      <p className="text-scale-1100 dark:text-scale-1200 mb-0 ml-3 text-xs">
                        {feature}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-6">
                  <div className="space-y-2">
                    {PRICING_META[plan.id].additional && (
                      <p className="text-scale-1200 text-sm">{PRICING_META[plan.id].additional}</p>
                    )}
                    {PRICING_META[plan.id].scale && (
                      <p className="text-scale-900 text-xs">{PRICING_META[plan.id].scale}</p>
                    )}
                    {PRICING_META[plan.id].shutdown && (
                      <p className="text-scale-900 text-xs">{PRICING_META[plan.id].shutdown}</p>
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
