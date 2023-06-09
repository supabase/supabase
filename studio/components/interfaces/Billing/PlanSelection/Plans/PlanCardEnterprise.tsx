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

const PlanCardEnterprise: FC<Props> = ({ plan, currentPlan, onSelectPlan }) => {
  const planMeta = PRICING_META[plan.id]
  const isCurrentPlan =
    plan.id === currentPlan?.prod_id ||
    (plan.id === STRIPE_PRODUCT_IDS.PRO && currentPlan?.prod_id === STRIPE_PRODUCT_IDS.PRO) ||
    (plan.id === STRIPE_PRODUCT_IDS.PRO && currentPlan?.prod_id === STRIPE_PRODUCT_IDS.PAYG)

  return (
    <div className="px-6 py-6 border rounded flex-col bg-scale-200 flex">
      <div className="space-y-8">
        <div className=" grid grid-cols-3 space-x-8">
          <div className="space-y-4 pr-14">
            <div className="flex items-center ">
              <p className="text-brand-900 text-sm">{planMeta.name}</p>
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
            <div className="space-y-2 border-t pb-6 lg:pt-6 xl:pt-0 xl:pb-6">
              <PlanCTAButton plan={plan} currentPlan={currentPlan} onSelectPlan={onSelectPlan} />
            </div>
          </div>
          <div className="space-y-4 lg:col-span-2">
            <p className="text-xs text-scale-1000">{planMeta.preface}</p>
            <ul role="list" className="text-xs text-scale-1000 md:grid md:grid-cols-2 md:gap-x-10">
              {planMeta.features.map((feature) => (
                <li key={feature} className="flex items-center py-2 first:mt-0">
                  <IconCheck
                    className="text-brand-900 h-4 w-4"
                    aria-hidden="true"
                    strokeWidth={3}
                  />
                  <span className="dark:text-scale-1200 mb-0 ml-3 ">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlanCardEnterprise
