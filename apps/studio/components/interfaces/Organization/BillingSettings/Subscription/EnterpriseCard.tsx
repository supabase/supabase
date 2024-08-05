import clsx from 'clsx'
import { PricingInformation } from 'shared-data'
import { Button, IconCheck } from 'ui'
import { pickFeatures } from 'shared-data/plans'

export interface EnterpriseCardProps {
  plan: PricingInformation
  isCurrentPlan: boolean
  billingPartner: 'fly' | 'aws' | undefined
}

const EnterpriseCard = ({ plan, isCurrentPlan, billingPartner }: EnterpriseCardProps) => {
  const features = pickFeatures(plan, billingPartner)

  return (
    <div
      key={plan.id}
      className={clsx(
        'grid grid-cols-1 md:grid-cols-3 border rounded-md bg-studio',
        'py-4 col-span-12 justify-between gap-x-8'
      )}
    >
      <div className="flex flex-col justify-center px-4">
        <div className="flex items-center space-x-2">
          <p className={clsx('text-brand text-sm uppercase')}>{plan.name}</p>
          {isCurrentPlan ? (
            <div className="text-xs bg-surface-300 text-foreground-light rounded px-2 py-0.5">
              Current plan
            </div>
          ) : plan.nameBadge ? (
            <div className="text-xs bg-surface-200 text-brand rounded px-2 py-0.5">
              {plan.nameBadge}
            </div>
          ) : null}
        </div>

        <p className="text-sm mt-2 mb-4">{plan.description}</p>

        <a href={plan.href} className="hidden md:block" target="_blank">
          <Button block type="default" size="tiny">
            {plan.cta}
          </Button>
        </a>
      </div>

      <div className="flex flex-col justify-center col-span-2 px-4 md:px-0">
        <ul
          role="list"
          className="text-xs text-foreground-light md:grid md:grid-cols-2 md:gap-x-10"
        >
          {features.map((feature) => (
            <li
              key={typeof feature === 'string' ? feature : feature[0]}
              className="flex items-center py-2 first:mt-0"
            >
              <IconCheck className="text-brand h-4 w-4" aria-hidden="true" strokeWidth={3} />
              <span className="text-foreground mb-0 ml-3 ">
                {typeof feature === 'string' ? feature : feature[0]}
              </span>
            </li>
          ))}
        </ul>

        <a href={plan.href} className="visible md:hidden mt-8" target="_blank">
          <Button block type="default" size="tiny">
            {plan.cta}
          </Button>
        </a>
      </div>
    </div>
  )
}

export default EnterpriseCard
