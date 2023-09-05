import clsx from 'clsx'
import { Button, IconCheck } from 'ui'
import { PricingInformation } from 'shared-data'

export interface EnterpriseCardProps {
  plan: PricingInformation
  isCurrentPlan: boolean
}

const EnterpriseCard = ({ plan, isCurrentPlan }: EnterpriseCardProps) => {
  return (
    <div
      key={plan.id}
      className={clsx(
        'grid grid-cols-1 md:grid-cols-3 border rounded-md bg-scale-200',
        'py-4 col-span-12 justify-between gap-x-8'
      )}
    >
      <div className="flex flex-col justify-center px-4">
        <div className="flex items-center space-x-2">
          <p className={clsx('text-brand text-sm uppercase')}>{plan.name}</p>
          {isCurrentPlan ? (
            <div className="text-xs bg-scale-500 text-scale-1000 rounded px-2 py-0.5">
              Current plan
            </div>
          ) : plan.nameBadge ? (
            <div className="text-xs bg-brand-400 text-brand rounded px-2 py-0.5">
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
        <ul role="list" className="text-xs text-scale-1000 md:grid md:grid-cols-2 md:gap-x-10">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center py-2 first:mt-0">
              <IconCheck className="text-brand h-4 w-4" aria-hidden="true" strokeWidth={3} />
              <span className="dark:text-scale-1200 mb-0 ml-3 ">{feature}</span>
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
