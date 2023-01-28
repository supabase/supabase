import { PRICING_TIER_PRODUCT_IDS, STRIPE_PRODUCT_IDS } from 'lib/constants'
import { FC } from 'react'
import { IconCheck } from 'ui'

import { useFlag } from 'hooks'
import PlanCTAButton from './PlanCTAButton'
import { PRICING_META } from './Plans.Constants'

interface Props {
  plan: any
  currentPlan: any
  onSelectPlan: () => void
}

const PlanCard: FC<Props> = ({ plan, currentPlan, onSelectPlan }) => {
  // Team tier is enabled when the flag is turned on OR the user is already on the team tier (manually assigned by us)
  const teamTierEnabled = currentPlan?.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.TEAM || useFlag('teamTier')

  const planMeta = PRICING_META[plan.id]
  const isEnterprise = plan.id === 'Enterprise'
  const isCurrentPlan =
    plan.id === currentPlan?.prod_id ||
    (plan.id === STRIPE_PRODUCT_IDS.PRO && currentPlan?.prod_id === STRIPE_PRODUCT_IDS.PRO) ||
    (plan.id === STRIPE_PRODUCT_IDS.PRO && currentPlan?.prod_id === STRIPE_PRODUCT_IDS.PAYG)

  return (
    <div
      className={[
        'px-6 py-6 border rounded flex flex-col justify-between',
        `${isEnterprise ? 'bg-scale-200' : 'bg-scale-300'}`,
        `${isEnterprise && teamTierEnabled ? 'lg:col-span-3 xl:col-auto' : ''}`,
      ].join(' ')}
    >
      <div
        className={[
          'space-y-8',
          `${isEnterprise ? 'flex flex-col xl:space-x-0 xl:flex-col' : ''}`,
          `${isEnterprise && teamTierEnabled ? 'lg:flex-row lg:space-x-24' : ''}`,
        ].join(' ')}
      >
        <div
          className={[
            'space-y-4',
            `${isEnterprise ? 'xl:w-auto' : ''}`,
            `${isEnterprise && teamTierEnabled ? 'xl:w-auto' : ''}`,
          ].join(' ')}
        >
          <div className="flex items-center space-x-2">
            <p
              className={[
                'text-brand-900 text-sm',
                `${isEnterprise ? 'lg:text-base xl:text-sm font-bold font-mono uppercase' : ''}`,
              ].join(' ')}
            >
              {planMeta.name}
            </p>
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
          <div
            className={[
              'space-y-2',
              `${
                isEnterprise
                  ? 'pb-6 border-b lg:pt-6 lg:border-b-0 lg:border-t xl:pt-0 xl:pb-6 xl:border-t-0 xl:border-b'
                  : 'border-b border-t py-8'
              }`,
            ].join(' ')}
          >
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
        <div className={`${isEnterprise ? 'lg:space-y-0 lg:!mt-0 xl:space-y-4' : 'space-y-4'}`}>
          <p className="text-xs text-scale-1000">{planMeta.preface}</p>
          <ul
            role="list"
            className={[
              `${isEnterprise ? 'xl:gap-0 xl:columns-1' : ''}`,
              `${isEnterprise && teamTierEnabled ? 'lg:gap-16 lg:columns-2' : ''}`,
            ].join(' ')}
          >
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
      {!isEnterprise && (
        <div className="space-y-4 !mt-20">
          <div className="space-y-2">
            <p className="text-sm text-scale-1100">{planMeta.additional}</p>
            <p className="text-xs text-scale-1000">{planMeta.scale}</p>
          </div>

          <PlanCTAButton plan={plan} currentPlan={currentPlan} onSelectPlan={onSelectPlan} />
        </div>
      )}
    </div>
  )
}

export default PlanCard
