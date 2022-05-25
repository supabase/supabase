import { IconCheck } from '@supabase/ui'
import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { FC } from 'react'
import { StripeProduct } from '../..'
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
      'absolute top-0 left-0 w-full h-full animate-sway',
      'bg-gradient-to-b from-transparent to-green-800 via-transparent',
    ].join(' ')}
  />
)

const CurrentSubscriptionBanner = () => (
  <div
    className={[
      'absolute h-8 -top-7 left-0 w-full',
      'flex items-center justify-center',
      'bg-brand-400 text-brand-900',
      'rounded-t-md border-t border-l border-r border border-b-0',
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
              <div className="absolute overflow-hidden w-full h-full left-0 bottom-0 opacity-50">
                <AnimatedGradientBackground />
              </div>
            )}
            <div className="flex flex-col rounded border overflow-hidden h-full">
              {isCurrentPlan && <CurrentSubscriptionBanner />}
              <div className="px-8 py-6 bg-white dark:bg-scale-300">
                <span
                  className="inline-flex text-cd font-normal tracking-wide rounded-full text-base text-scale-1200"
                  id="tier-standard"
                >
                  {PRICING_META[plan.id].name}
                </span>
                <div className="flex items-baseline mt-2">
                  <div className="flex space-x-2">
                    {PRICING_META[plan.id].priceMonthly !== undefined ? (
                      <>
                        <div className="flex items-end gap-1">
                          {PRICING_META[plan.id].from && (
                            <span className="text-base font-medium text-scale-1200">From</span>
                          )}
                          <div>
                            <span className="text-2xl">${PRICING_META[plan.id].priceMonthly}</span>
                            <span className="ml-1 text-xl font-medium text-scale-900">/mo</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-2xl">Contact Us</span>
                    )}
                    <div className="flex h-8">
                      {PRICING_META[plan.id].warning && (
                        <div className="px-2 py-1 mt-2 text-xs rounded-md bg-brand-300 bg-opacity-30 text-brand-1000">
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
                  'flex-col justify-between flex-1',
                  'space-y-6 border-t dark:border-scale-400',
                  'bg-scale-100 dark:bg-scale-300',
                  'px-8 py-6 h-full hidden lg:flex',
                ].join(' ')}
              >
                {PRICING_META[plan.id].preface && (
                  <p className="text-sm text-scale-1200">{PRICING_META[plan.id].preface}</p>
                )}
                <ul role="list" className="divide-y dark:divide-scale-400">
                  {PRICING_META[plan.id].features.map((feature) => (
                    <li key={feature} className="flex items-center py-2">
                      <IconCheck
                        className="w-3 h-3 text-brand-900 "
                        aria-hidden="true"
                        strokeWidth={3}
                      />
                      <p className="mb-0 ml-3 text-xs text-scale-1100 dark:text-scale-1200">
                        {feature}
                      </p>
                    </li>
                  ))}
                </ul>
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
