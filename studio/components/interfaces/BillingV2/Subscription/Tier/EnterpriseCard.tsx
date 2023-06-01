import clsx from 'clsx'
import { Button, IconCheck } from 'ui'
import { PricingInformation } from './Tier.constants'
import Link from 'next/link'

export interface EnterpriseCardProps {
  plan: PricingInformation
  isCurrentPlan: boolean
  isTeamTierEnabled: boolean
}

const EnterpriseCard = ({ plan, isCurrentPlan, isTeamTierEnabled }: EnterpriseCardProps) => {
  return (
    <div
      key={plan.id}
      className={clsx(
        'flex border rounded-md bg-scale-200',
        isTeamTierEnabled
          ? 'px-12 py-8 col-span-12 justify-between'
          : 'px-6 py-6 col-span-4 flex-col'
      )}
    >
      <div>
        <div className="flex items-center space-x-2">
          <p className={clsx('text-brand-900 text-sm uppercase')}>{plan.name}</p>
          {isCurrentPlan ? (
            <div className="text-xs bg-scale-500 text-scale-1000 rounded px-2 py-0.5">
              Current plan
            </div>
          ) : plan.new ? (
            <div className="text-xs bg-brand-400 text-brand-900 rounded px-2 py-0.5">New</div>
          ) : (
            <></>
          )}
        </div>

        <p className="text-sm mt-2 mb-4">{plan.preface}</p>

        <Link href="https://supabase.com/contact/enterprise">
          <a target="blank" rel="noreferrer">
            <Button block={!isTeamTierEnabled} type="default">
              Contact Sales Team
            </Button>
          </a>
        </Link>
      </div>

      {!isTeamTierEnabled && <div className="border-t my-6" />}

      <ul role="list" className={clsx(isTeamTierEnabled && 'pr-12')}>
        {plan.features.map((feature) => (
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
  )
}

export default EnterpriseCard
