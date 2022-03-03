import { Badge } from '@supabase/ui'
import { FC } from 'react'
import { BILLING_PLANS } from './Plans.constants'

interface Props {}

const Plans: FC<Props> = ({}) => {
  return (
    <div className="flex justify-between space-x-4">
      {BILLING_PLANS.map((plan) => {
        return (
          <div className="w-1/3 bg-gray-300 border border-gray-500 rounded-md px-6 py-7">
            <div className="flex items-center space-x-4">
              <p className="text-lg">{plan.name}</p>
              {plan.isPopular && <Badge>Popular</Badge>}
            </div>
            <p className="text-scale-1100 text-sm mt-2">{plan.description}</p>
            <div className="py-4">
              {plan.price === null ? (
                <p className="text-2xl text-center">Contact us</p>
              ) : (
                <div className="flex items-end justify-center">
                  <p className="text-3xl">${plan.price}</p>
                  <p className="text-sm text-scale-1100 relative -top-[2px]"> /month</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Plans
