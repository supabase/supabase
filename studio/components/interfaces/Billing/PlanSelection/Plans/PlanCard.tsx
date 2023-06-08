import { STRIPE_PRODUCT_IDS } from 'lib/constants'
import { FC } from 'react'
import { IconCheck } from 'ui'

import PlanCTAButton from './PlanCTAButton'
import { PRICING_META } from './Plans.Constants'

interface Props {
  plan: any
  currentPlan: any
  onSelectPlan: () => void
}

const PlanCard: FC<Props> = ({ plan, currentPlan, onSelectPlan }) => {
  const planMeta = PRICING_META[plan.id]
  const isCurrentPlan =
    plan.id === currentPlan?.prod_id ||
    (plan.id === STRIPE_PRODUCT_IDS.PRO && currentPlan?.prod_id === STRIPE_PRODUCT_IDS.PRO) ||
    (plan.id === STRIPE_PRODUCT_IDS.PRO && currentPlan?.prod_id === STRIPE_PRODUCT_IDS.PAYG)

  return (
    <div
      className={['px-6 py-6 border rounded flex flex-col justify-between bg-scale-300'].join(' ')}
    >
      <div className={['space-y-8'].join(' ')}>
        <div className={['space-y-4'].join(' ')}>
          <div className="flex items-center space-x-2">
            <p className={['text-brand-900 text-sm'].join(' ')}>{planMeta.name}</p>
            {isCurrentPlan ? (
              <div className="text-xs bg-scale-500 text-scale-1000 rounded px-2 py-0.5">
                Current plan
              </div>
            ) : planMeta.new ? (
              <div className="text-xs bg-brand-400 text-brand-900 rounded px-2 py-0.5">New</div>
            ) : (
              <></>
            )}
          </div>
          <p className="text-sm text-scale-1100">{planMeta.description}</p>
          <div className={['space-y-2', 'border-b border-t py-8'].join(' ')}>
            {planMeta.priceMonthly !== undefined ? (
              <>
                <p className="text-sm text-scale-1000">Starting from</p>
                <div className="space-y-1">
                  <p className="text-[3.4rem] leading-none">${planMeta.priceMonthly}</p>
                  <p className="text-sm text-scale-1000">{planMeta.priceUnit}</p>
                </div>
                <div className="text-xs bg-brand-400 text-brand-900 rounded px-2 py-0.5 w-fit">
                  {planMeta.warning}
                </div>
              </>
            ) : (
              <PlanCTAButton plan={plan} currentPlan={currentPlan} onSelectPlan={onSelectPlan} />
            )}
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-xs text-scale-1000">{planMeta.preface}</p>
          <ul role="list">
            {planMeta.features.map((feature) => (
              <li key={feature} className="flex py-2">
                <div className="w-[12px]">
                  <IconCheck
                    className="h-3 w-3 text-brand-900 translate-y-[2.5px]"
                    aria-hidden="true"
                    strokeWidth={3}
                  />
                </div>
                <p className="ml-3 text-xs text-scale-1100">{feature}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-4 !mt-20">
        <div className="space-y-2">
          <p className="text-xs text-scale-1000">{planMeta.scale}</p>

          {planMeta.name === 'Pro' && currentPlan?.prod_id === STRIPE_PRODUCT_IDS.PRO && (
            <div>
              <p className="text-sm text-scale-1100">
                Need more? Turn off your spend cap to Pay As You Grow
              </p>
              <p className="text-xs text-scale-1000">
                Additional fees apply for spend beyond the limits above
              </p>{' '}
            </div>
          )}

          {planMeta.name === 'Pro' && currentPlan?.prod_id === STRIPE_PRODUCT_IDS.PAYG && (
            <div>
              <p className="text-sm text-scale-1100">Spend cap is currently disabled</p>
              <p className="text-xs text-scale-1000">
                You will be charged for usage beyond the plan limits
              </p>{' '}
            </div>
          )}
        </div>

        <PlanCTAButton plan={plan} currentPlan={currentPlan} onSelectPlan={onSelectPlan} />
      </div>
    </div>
  )
}

export default PlanCard
