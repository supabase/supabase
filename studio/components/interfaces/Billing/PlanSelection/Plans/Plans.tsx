import { FC } from 'react'
import { Badge } from '@supabase/ui'

import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { StripeProduct } from '../..'
import PlanCTAButton from './PlanCTAButton'

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
      'absolute top-0 right-0 flex items-center justify-center',
      'bg-green-900 px-4 py-1 rounded-bl-md',
    ].join(' ')}
  >
    <p className="text-xs">Current plan</p>
  </div>
)

const Plans: FC<Props> = ({ plans, currentPlan, onSelectPlan }) => {
  return (
    <div className="flex justify-between space-x-4">
      {plans.map((plan) => {
        const isCurrentPlan =
          plan.id === currentPlan?.prod_id ||
          (plan.id === STRIPE_PRODUCT_IDS.PRO && currentPlan?.prod_id === STRIPE_PRODUCT_IDS.PRO) ||
          (plan.id === STRIPE_PRODUCT_IDS.PRO && currentPlan?.prod_id === STRIPE_PRODUCT_IDS.PAYG)

        const pointers = plan.metadata.features.split('\\n').map((x: string) => x.trim())
        return (
          <div
            key={plan.name}
            className={[
              'flex flex-col justify-between w-1/3 px-6 py-8',
              'bg-gray-300 border border-gray-500 rounded-md relative',
              'overflow-hidden',
            ].join(' ')}
          >
            {/* [Joshen] Trying some animations here to make Pro pop, on the fence tbh */}
            {plan.id === STRIPE_PRODUCT_IDS.PRO && <AnimatedGradientBackground />}

            {/* Label to show current subscription (Pro and PAYG are treated as the same plan on the UI) */}
            {isCurrentPlan && <CurrentSubscriptionBanner />}

            <div className="mb-8">
              <div className="flex items-center space-x-4">
                <h3 className="text-xl">{plan.name}</h3>
                {plan.isPopular && <Badge>Popular</Badge>}
              </div>
              <p className="text-scale-1100 text-sm mt-2">{plan.description}</p>
              <div className="py-8">
                {plan.prices.length === 0 ? (
                  <p className="text-2xl text-center">Contact us</p>
                ) : (
                  <div className="flex items-end justify-center">
                    <p className="text-3xl">${plan.prices[0].unit_amount / 100}</p>
                    <p className="text-sm text-scale-1100 relative -top-[2px]"> /month</p>
                  </div>
                )}
              </div>
              <ul className="space-y-4">
                {pointers.map((pointer: string, idx: number) => (
                  <li key={`pointer-${idx}`} className="text-sm flex">
                    <div className="w-[15%]">
                      <svg
                        className={`h-5 w-5 text-green-900`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="w-[85%]">
                      <span>{pointer}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <PlanCTAButton plan={plan} currentPlan={currentPlan} onSelectPlan={onSelectPlan} />
          </div>
        )
      })}
    </div>
  )
}

export default Plans
